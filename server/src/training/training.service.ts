import { Injectable, UnauthorizedException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { trainingRecords, dishes } from '@/storage/database/shared/schema'
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
   * 根据训练消耗推荐餐食
   */
  async recommendDishes(userId: string, caloriesBurned: number) {
    const supabase = getSupabaseClient()

    // 获取所有上架的菜品
    const { data: allDishes, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('status', 1)

    if (error || !allDishes) {
      return []
    }

    // 根据消耗卡路里推荐：推荐热量约为消耗热量的 60%-80% 的餐食
    const targetCaloriesMin = caloriesBurned * 0.6
    const targetCaloriesMax = caloriesBurned * 0.8

    // 筛选符合条件的菜品
    const recommended = allDishes.filter((dish) => {
      const nutrition = dish.nutrition as { calories?: number } | null
      const dishCalories = nutrition?.calories || 0
      return dishCalories >= targetCaloriesMin && dishCalories <= targetCaloriesMax
    })

    // 如果没有完全匹配的，返回热量最接近的 3 个菜品
    if (recommended.length === 0) {
      const sorted = allDishes
        .map((dish) => ({
          ...dish,
          dishCalories: (dish.nutrition as { calories?: number } | null)?.calories || 0,
        }))
        .sort((a, b) => Math.abs(a.dishCalories - caloriesBurned * 0.7) - Math.abs(b.dishCalories - caloriesBurned * 0.7))
        .slice(0, 3)
      return sorted
    }

    return recommended.slice(0, 6)
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
