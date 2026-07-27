import { Controller, Post, Get, Body, Headers, Query } from '@nestjs/common'
import { TrainingService } from './training.service'

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  /**
   * 创建训练记录
   */
  @Post()
  async createRecord(
    @Headers('authorization') auth: string,
    @Body() body: { type: 'strength' | 'cardio'; exercises?: any[]; cardio?: any; duration?: number }
  ) {
    const userId = this.getUserIdFromAuth(auth)
    const record = await this.trainingService.createRecord(userId, body)
    return { code: 200, msg: 'success', data: record }
  }

  /**
   * 获取用户训练记录列表
   */
  @Get('list')
  async getUserRecords(
    @Headers('authorization') auth: string,
    @Query('limit') limit?: string
  ) {
    const userId = this.getUserIdFromAuth(auth)
    const records = await this.trainingService.getUserRecords(userId, limit ? parseInt(limit) : 20)
    return { code: 200, msg: 'success', data: records }
  }

  /**
   * 获取今日训练统计
   */
  @Get('today')
  async getTodayStats(@Headers('authorization') auth: string) {
    const userId = this.getUserIdFromAuth(auth)
    const stats = await this.trainingService.getTodayStats(userId)
    return { code: 200, msg: 'success', data: stats }
  }

  /**
   * 根据训练消耗推荐餐食
   */
  @Get('recommend')
  async recommendDishes(
    @Headers('authorization') auth: string,
    @Query('calories') calories?: string
  ) {
    const userId = this.getUserIdFromAuth(auth)
    const caloriesBurned = calories ? parseFloat(calories) : 300
    const dishes = await this.trainingService.recommendDishes(userId, caloriesBurned)
    return { code: 200, msg: 'success', data: dishes }
  }

  /**
   * 从 Authorization header 解析用户 ID
   */
  private getUserIdFromAuth(auth: string): string {
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new Error('未授权')
    }
    const token = auth.slice(7)
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString())
      return payload.userId
    } catch {
      throw new Error('无效的 token')
    }
  }
}
