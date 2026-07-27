import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '../storage/database/supabase-client'
import { courses, courseBookings, users } from '../storage/database/shared/schema'
import { eq, and, gte, desc, sql } from 'drizzle-orm'

@Injectable()
export class CourseService {
  private readonly supabase = getSupabaseClient()

  /**
   * 获取课程列表（未来7天）
   */
  async getCourseList(userId: string) {
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // 获取课程列表
    const { data: courseList, error } = await this.supabase
      .from('courses')
      .select('*')
      .gte('start_time', now.toISOString())
      .lte('start_time', sevenDaysLater.toISOString())
      .eq('status', 1)
      .order('start_time', { ascending: true })

    if (error) {
      throw new Error(`获取课程列表失败: ${error.message}`)
    }

    // 获取用户预约的课程
    const { data: userBookings } = await this.supabase
      .from('course_bookings')
      .select('course_id')
      .eq('user_id', userId)
      .eq('status', 1)

    const bookedCourseIds = new Set(userBookings?.map((b) => b.course_id) || [])

    // 标记用户是否已预约
    const coursesWithBooking = courseList.map((course) => ({
      ...course,
      is_booked: bookedCourseIds.has(course.id),
      remaining_slots: course.max_capacity - course.current_count,
    }))

    return coursesWithBooking
  }

  /**
   * 预约课程
   */
  async bookCourse(userId: string, courseId: string) {
    // 检查课程是否存在且可用
    const { data: course, error: courseError } = await this.supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('status', 1)
      .single()

    if (courseError || !course) {
      throw new Error('课程不存在或已取消')
    }

    // 检查是否已满
    if (course.current_count >= course.max_capacity) {
      throw new Error('课程已满，无法预约')
    }

    // 检查是否已预约
    const { data: existingBooking } = await this.supabase
      .from('course_bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 1)
      .maybeSingle()

    if (existingBooking) {
      throw new Error('您已预约该课程')
    }

    // 创建预约记录
    const { error: bookingError } = await this.supabase.from('course_bookings').insert({
      user_id: userId,
      course_id: courseId,
      status: 1,
    })

    if (bookingError) {
      throw new Error(`预约失败: ${bookingError.message}`)
    }

    // 更新课程已预约人数
    await this.supabase.rpc('increment_course_count', { course_id: courseId })

    return { success: true, message: '预约成功' }
  }

  /**
   * 取消预约
   */
  async cancelBooking(userId: string, courseId: string) {
    // 更新预约状态为已取消
    const { error: updateError } = await this.supabase
      .from('course_bookings')
      .update({ status: 0, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 1)

    if (updateError) {
      throw new Error(`取消预约失败: ${updateError.message}`)
    }

    // 更新课程已预约人数
    await this.supabase.rpc('decrement_course_count', { course_id: courseId })

    return { success: true, message: '已取消预约' }
  }

  /**
   * 获取我的预约记录
   */
  async getMyBookings(userId: string) {
    // 获取用户的预约记录
    const { data: bookings, error } = await this.supabase
      .from('course_bookings')
      .select('id, course_id, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`获取预约记录失败: ${error.message}`)
    }

    // 获取课程详情
    const courseIds = bookings.map((b) => b.course_id)
    let coursesMap: Record<string, any> = {}
    
    if (courseIds.length > 0) {
      const { data: courses } = await this.supabase
        .from('courses')
        .select('id, name, coach_name, start_time, end_time, image')
        .in('id', courseIds)
      
      if (courses) {
        coursesMap = courses.reduce((acc: Record<string, any>, course) => {
          acc[course.id] = course
          return acc
        }, {})
      }
    }

    // 格式化数据
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      course_id: booking.course_id,
      status: booking.status,
      created_at: booking.created_at,
      course: coursesMap[booking.course_id] || null,
    }))

    return formattedBookings
  }
}
