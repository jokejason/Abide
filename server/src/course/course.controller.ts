import { Controller, Get, Post, Body, Query, Headers, HttpException, HttpStatus } from '@nestjs/common'
import { CourseService } from './course.service'

@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  private getUserIdFromToken(authHeader: string): string {
    if (!authHeader) {
      throw new HttpException('未提供认证信息', HttpStatus.UNAUTHORIZED)
    }
    const token = authHeader.replace('Bearer ', '')
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'))
      return decoded.userId
    } catch {
      throw new HttpException('无效的认证信息', HttpStatus.UNAUTHORIZED)
    }
  }

  /**
   * 获取课程列表
   */
  @Get('list')
  async getCourseList(@Headers('authorization') authHeader: string) {
    const userId = this.getUserIdFromToken(authHeader)
    const courseList = await this.courseService.getCourseList(userId)
    return {
      code: 200,
      msg: 'success',
      data: courseList,
    }
  }

  /**
   * 预约课程
   */
  @Post('book')
  async bookCourse(@Headers('authorization') authHeader: string, @Body() body: { courseId: string }) {
    const userId = this.getUserIdFromToken(authHeader)
    const { courseId } = body

    if (!courseId) {
      throw new HttpException('缺少课程ID', HttpStatus.BAD_REQUEST)
    }

    try {
      const result = await this.courseService.bookCourse(userId, courseId)
      return {
        code: 200,
        msg: 'success',
        data: result,
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST)
    }
  }

  /**
   * 取消预约
   */
  @Post('cancel')
  async cancelBooking(@Headers('authorization') authHeader: string, @Body() body: { courseId: string }) {
    const userId = this.getUserIdFromToken(authHeader)
    const { courseId } = body

    if (!courseId) {
      throw new HttpException('缺少课程ID', HttpStatus.BAD_REQUEST)
    }

    try {
      const result = await this.courseService.cancelBooking(userId, courseId)
      return {
        code: 200,
        msg: 'success',
        data: result,
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST)
    }
  }

  /**
   * 获取我的预约记录
   */
  @Get('my-bookings')
  async getMyBookings(@Headers('authorization') authHeader: string) {
    const userId = this.getUserIdFromToken(authHeader)
    const bookings = await this.courseService.getMyBookings(userId)
    return {
      code: 200,
      msg: 'success',
      data: bookings,
    }
  }
}
