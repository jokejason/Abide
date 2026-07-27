import { Injectable, UnauthorizedException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { trainingRecords, trainingTemplates, dishes, users } from '@/storage/database/shared/schema'
import { eq, desc } from 'drizzle-orm'

// 新的多组训练格式
interface ExerciseSet {
  set_number: number
  weight: number
  reps: number
  completed: boolean
  completed_at?: string
}

interface Exercise {
  exercise_id?: string | null
  name: string
  met: number
  sets: ExerciseSet[]
}

// 模板动作格式
interface TemplateExercise {
  exercise_id?: string | null
  name: string
  target_sets: number
  target_weight: number
  target_reps: number
  rest_seconds: number
  met: number
  sort_order: number
}

interface Cardio {
  type: string
  duration: number
  heart_rate?: number
}

@Injectable()
export class TrainingService {
  /**
   * 创建训练记录（支持多动作多组模式）
   */
  async createRecord(
    userId: string,
    data: {
      type: 'strength' | 'cardio'
      exercises?: Exercise[]
      cardio?: Cardio
      session_duration?: number
      template_id?: string
    }
  ) {
    const supabase = getSupabaseClient()
    const today = new Date().toISOString().split('T')[0]

    // 计算消耗卡路里和总容量
    let caloriesBurned = 0
    let totalVolume = 0

    if (data.type === 'strength' && data.exercises) {
      // 力量训练：基于 MET 值和实际训练时长计算
      const result = this.calculateStrengthCaloriesV2(data.exercises, data.session_duration)
      caloriesBurned = result.calories
      totalVolume = result.totalVolume
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
        session_duration: data.session_duration || null,
        total_volume: totalVolume.toString(),
        template_id: data.template_id || null,
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
   * 计算力量训练卡路里（V2 - 基于每组实际训练时长）
   */
  private calculateStrengthCaloriesV2(
    exercises: Exercise[],
    sessionDuration?: number
  ): { calories: number; totalVolume: number } {
    // 获取用户体重
    let weight = 70 // 默认体重

    let totalCalories = 0
    let totalVolume = 0

    for (const exercise of exercises) {
      const completedSets = exercise.sets.filter(s => s.completed)
      if (completedSets.length === 0) continue

      // 计算该动作的实际训练时长
      let exerciseDurationMinutes = 5 // 默认 5 分钟
      if (completedSets.length >= 2) {
        const firstSetTime = new Date(completedSets[0].completed_at!).getTime()
        const lastSetTime = new Date(completedSets[completedSets.length - 1].completed_at!).getTime()
        exerciseDurationMinutes = (lastSetTime - firstSetTime) / 60000
        if (exerciseDurationMinutes < 1) exerciseDurationMinutes = 1
      }

      // MET × 体重(kg) × 时长(小时) = 卡路里
      const met = exercise.met || 6.0
      const caloriesForExercise = met * weight * (exerciseDurationMinutes / 60)
      totalCalories += caloriesForExercise

      // 计算总容量（只算完成的组）
      for (const set of completedSets) {
        totalVolume += (set.weight || 0) * (set.reps || 0)
      }
    }

    return {
      calories: Math.round(totalCalories),
      totalVolume: Math.round(totalVolume),
    }
  }

  /**
   * 计算有氧训练卡路里
   */
  private calculateCardioCalories(cardio: Cardio): number {
    const metMap: Record<string, number> = {
      running: 8,
      cycling: 6,
      walking: 3.5,
      swimming: 7,
    }
    const met = metMap[cardio.type] || 5
    const weight = 70 // 默认体重
    const durationHours = cardio.duration / 60
    return Math.round(met * weight * durationHours)
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
      .select('calories_burned, session_duration')
      .eq('user_id', userId)
      .eq('date', today)

    if (error) {
      console.error('获取今日统计失败:', error)
      throw new Error('获取今日统计失败')
    }

    const totalCalories = records.reduce((sum, r) => sum + parseFloat(r.calories_burned || '0'), 0)
    const totalDuration = records.reduce((sum, r) => sum + (r.session_duration || 0), 0)

    return {
      count: records.length,
      calories: Math.round(totalCalories),
      duration: totalDuration,
    }
  }

  /**
   * 根据训练消耗推荐餐食
   */
  async recommendDishes(userId: string, caloriesBurned: number) {
    const supabase = getSupabaseClient()

    // 1. 查询用户完整信息
    const { data: user } = await supabase
      .from('users')
      .select('gender, age, height, weight, fitness_goal')
      .eq('id', userId)
      .single()

    let targetCalories: number
    let recommendReason: string
    let minProtein = 0

    // 2. 检查用户是否有完整的身体数据
    if (user && user.gender && user.age && user.height && user.weight) {
      const gender = parseInt(user.gender)
      const age = parseInt(user.age)
      const height = parseFloat(user.height)
      const weight = parseFloat(user.weight)
      const fitnessGoal = user.fitness_goal || 'body_shape'

      // 3. 计算 BMR（Harris-Benedict 公式）
      let bmr: number
      if (gender === 1) {
        // 男性
        bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
      } else {
        // 女性
        bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age
      }

      // 4. 计算 TDEE（中等活动系数 1.55）
      const tdee = bmr * 1.55

      // 5. 根据训练目的计算目标摄入
      switch (fitnessGoal) {
        case 'fat_loss':
          if (gender === 1) {
            targetCalories = tdee + caloriesBurned - 500
            recommendReason = '减脂模式，适度热量缺口'
          } else {
            targetCalories = tdee + caloriesBurned - 300
            recommendReason = '减脂模式，适度热量缺口'
          }
          break
        case 'muscle_gain':
          targetCalories = tdee + caloriesBurned + 200
          recommendReason = '增肌模式，高蛋白补充'
          minProtein = 25
          break
        case 'body_shape':
        default:
          targetCalories = tdee + caloriesBurned
          recommendReason = '塑形模式，均衡营养'
          break
      }

      // 6. 中餐/晚餐占每日摄入 70%
      targetCalories = targetCalories * 0.7
    } else {
      // Fallback: 缺少身体数据，使用旧逻辑
      targetCalories = caloriesBurned * 0.7
      recommendReason = '训练后补充'
    }

    // 7. 从上架的菜品中筛选
    const { data: allDishes } = await supabase
      .from('dishes')
      .select('*')
      .eq('status', 1)

    if (!allDishes || allDishes.length === 0) {
      return []
    }

    // 8. 如果有蛋白质要求，先筛选高蛋白菜品
    let candidateDishes = allDishes
    if (minProtein > 0) {
      const highProteinDishes = allDishes.filter(d => {
        const nutrition = d.nutrition as any
        return nutrition && nutrition.protein && nutrition.protein >= minProtein
      })
      if (highProteinDishes.length >= 2) {
        candidateDishes = highProteinDishes
      }
    }

    // 9. 按热量匹配度排序，选择最接近的 2 个
    const sortedDishes = candidateDishes
      .map(dish => {
        const nutrition = dish.nutrition as any
        const dishCalories = nutrition?.calories || 0
        const diff = Math.abs(dishCalories - targetCalories)
        return { ...dish, diff, dishCalories }
      })
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 2)

    return sortedDishes.map(dish => ({
      ...dish,
      recommend_reason: recommendReason,
    }))
  }

  // ==================== 训练模板相关方法 ====================

  /**
   * 获取用户训练模板列表
   */
  async getUserTemplates(userId: string) {
    const supabase = getSupabaseClient()

    const { data: templates, error } = await supabase
      .from('training_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取训练模板失败:', error)
      throw new Error('获取训练模板失败')
    }

    return templates || []
  }

  /**
   * 创建训练模板
   */
  async createTemplate(
    userId: string,
    data: {
      name: string
      exercises: TemplateExercise[]
    }
  ) {
    const supabase = getSupabaseClient()

    const { data: template, error } = await supabase
      .from('training_templates')
      .insert({
        user_id: userId,
        name: data.name,
        exercises: data.exercises,
      })
      .select()
      .single()

    if (error) {
      console.error('创建训练模板失败:', error)
      throw new Error('创建训练模板失败')
    }

    return template
  }

  /**
   * 获取训练模板详情
   */
  async getTemplateById(templateId: string, userId: string) {
    const supabase = getSupabaseClient()

    const { data: template, error } = await supabase
      .from('training_templates')
      .select('*')
      .eq('id', templateId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('获取训练模板失败:', error)
      throw new Error('获取训练模板失败')
    }

    return template
  }
}
