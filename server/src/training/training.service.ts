import { Injectable, UnauthorizedException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { trainingRecords, dishes, users } from '@/storage/database/shared/schema'
import { eq, desc } from 'drizzle-orm'

interface Exercise {
  name: string
  sets: number
  reps: number
  weight?: number
  met?: number
}

interface Cardio {
  type: string
  duration: number
  heart_rate?: number
}

@Injectable()
export class TrainingService {
  /**
   * 创建训练记录
   */
  async createRecord(
    userId: string,
    data: {
      type: 'strength' | 'cardio'
      exercises?: Exercise[]
      cardio?: Cardio
      duration?: number
    }
  ) {
    const supabase = getSupabaseClient()
    const today = new Date().toISOString().split('T')[0]

    // 计算消耗卡路里
    let caloriesBurned = 0
    if (data.type === 'strength' && data.exercises) {
      // 力量训练：基于 MET 值计算
      const durationMinutes = data.duration || 30
      caloriesBurned = this.calculateStrengthCalories(data.exercises, durationMinutes)
    } else if (data.type === 'cardio' && data.cardio) {
      // 有氧训练：基于时长和心率计算
      caloriesBurned = this.calculateCardioCalories(data.cardio)
    }

    // 插入训练记录
    const { data: record, error } = await supabase
      .from('training_records')
      .insert({
        user_id: userId,
        date: today,
        type: data.type,
        exercises: data.exercises || null,
        cardio: data.cardio || null,
        calories_burned: caloriesBurned.toString(),
      })
      .select()
      .single()

    if (error) {
      console.error('创建训练记录失败:', error)
      throw new Error('创建训练记录失败')
    }

    return record
  }

  /**
   * 获取用户训练记录列表
   */
  async getUserRecords(userId: string, limit = 20) {
    const supabase = getSupabaseClient()

    const { data: records, error } = await supabase
      .from('training_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('获取训练记录失败:', error)
      throw new Error('获取训练记录失败')
    }

    return records || []
  }

  /**
   * 获取今日训练统计
   */
  async getTodayStats(userId: string) {
    const supabase = getSupabaseClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: records, error } = await supabase
      .from('training_records')
      .select('calories_burned')
      .eq('user_id', userId)
      .eq('date', today)

    if (error) {
      console.error('获取今日统计失败:', error)
      return { count: 0, calories: 0, duration: 0 }
    }

    const count = records?.length || 0
    const calories = records?.reduce((sum, r) => sum + parseFloat(r.calories_burned || '0'), 0) || 0

    return { count, calories: Math.round(calories), duration: count * 30 }
  }

  /**
   * 根据训练消耗推荐餐食（基于 BMR/TDEE 算法）
   */
  async recommendDishes(userId: string, caloriesBurned: number) {
    const supabase = getSupabaseClient()

    // 1. 获取用户信息
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('gender, age, height, weight, fitness_goal')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('获取用户信息失败:', userError)
      return []
    }

    // 2. 计算 BMR（Harris-Benedict 公式）
    const weight = parseFloat(user.weight || '70')
    const height = parseFloat(user.height || '170')
    const age = user.age || 25
    const gender = user.gender || 1

    let bmr: number
    if (gender === 1) {
      // 男性：88.362 + 13.397 × 体重kg + 4.799 × 身高cm - 5.677 × 年龄
      bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
    } else {
      // 女性：447.593 + 9.247 × 体重kg + 3.098 × 身高cm - 4.330 × 年龄
      bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age
    }

    // 3. 计算 TDEE（活动系数 1.55，中等活动量）
    const tdee = bmr * 1.55

    // 4. 根据训练目的计算目标摄入
    const fitnessGoal = user.fitness_goal || 'body_shape'
    let dailyTarget: number
    let preferHighProtein = false
    let preferLowGI = false

    switch (fitnessGoal) {
      case 'fat_loss':
        if (gender === 1) {
          // 减脂男性：TDEE + 训练消耗 - 500
          dailyTarget = tdee + caloriesBurned - 500
        } else {
          // 减脂女性：TDEE + 训练消耗 - 300
          dailyTarget = tdee + caloriesBurned - 300
        }
        break
      case 'muscle_gain':
        // 增肌：TDEE + 训练消耗 + 200，推荐高蛋白菜品
        dailyTarget = tdee + caloriesBurned + 200
        preferHighProtein = true
        break
      case 'body_shape':
      default:
        // 塑形：TDEE + 训练消耗，推荐低GI菜品
        dailyTarget = tdee + caloriesBurned
        preferLowGI = true
        break
    }

    // 5. 中餐/晚餐占每日摄入的 70%
    const mealTarget = dailyTarget * 0.7

    // 6. 获取所有上架的菜品
    const { data: allDishes, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('status', 1)

    if (error || !allDishes) {
      console.error('获取菜品失败:', error)
      return []
    }

    // 7. 优先推荐套餐（category = '套餐'），推荐 2 个
    const mealPackages = allDishes.filter((d) => d.category === '套餐')
    const otherDishes = allDishes.filter((d) => d.category !== '套餐')

    // 筛选套餐：根据目标热量和训练目的
    let recommendedPackages = mealPackages.filter((dish) => {
      const nutrition = dish.nutrition as { calories?: number; protein?: number } | null
      const dishCalories = nutrition?.calories || 0
      // 套餐热量应在单餐目标的 80%-120% 范围内
      const inCalorieRange = dishCalories >= mealTarget * 0.8 && dishCalories <= mealTarget * 1.2

      if (preferHighProtein) {
        // 增肌：蛋白质 > 25g
        const protein = nutrition?.protein || 0
        return inCalorieRange && protein > 25
      }

      if (preferLowGI) {
        // 塑形：优先低脂低糖（碳水 < 40g）
        const carbs = (nutrition as { carbs?: number })?.carbs || 0
        return inCalorieRange && carbs < 40
      }

      return inCalorieRange
    })

    // 如果没有完全匹配的套餐，选择热量最接近的 2 个
    if (recommendedPackages.length < 2) {
      const sortedPackages = mealPackages
        .map((dish) => ({
          ...dish,
          dishCalories: (dish.nutrition as { calories?: number } | null)?.calories || 0,
          distance: Math.abs(((dish.nutrition as { calories?: number } | null)?.calories || 0) - mealTarget),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2)
      recommendedPackages = sortedPackages
    } else {
      recommendedPackages = recommendedPackages.slice(0, 2)
    }

    return recommendedPackages.map((dish) => ({
      ...dish,
      recommend_reason: this.getRecommendReason(fitnessGoal, dish),
    }))
  }

  /**
   * 获取推荐理由
   */
  private getRecommendReason(fitnessGoal: string, dish: any): string {
    const nutrition = dish.nutrition as { calories?: number; protein?: number; carbs?: number } | null
    const protein = nutrition?.protein || 0
    const carbs = nutrition?.carbs || 0

    switch (fitnessGoal) {
      case 'fat_loss':
        return '适合减脂期食用，热量控制合理'
      case 'muscle_gain':
        if (protein > 25) {
          return `高蛋白 ${protein}g，助力增肌恢复`
        }
        return '营养均衡，适合增肌期'
      case 'body_shape':
      default:
        if (carbs < 40) {
          return '低GI配方，塑形首选'
        }
        return '营养均衡，适合日常塑形'
    }
  }

  /**
   * 计算力量训练消耗卡路里
   */
  private calculateStrengthCalories(exercises: Exercise[], durationMinutes: number): number {
    // 使用 MET 值计算：卡路里 = MET × 体重(kg) × 时间(小时)
    // 假设体重 70kg，MET 值平均 6.0
    const avgMet = exercises.reduce((sum, e) => sum + (e.met || 6), 0) / exercises.length
    const weight = 70 // 默认体重
    const hours = durationMinutes / 60
    return Math.round(avgMet * weight * hours)
  }

  /**
   * 计算有氧训练消耗卡路里
   */
  private calculateCardioCalories(cardio: Cardio): number {
    // 基于时长计算：每分钟约消耗 8-12 卡路里
    const caloriesPerMinute = 10
    return cardio.duration * caloriesPerMinute
  }
}
