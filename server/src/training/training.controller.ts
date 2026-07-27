import { Controller, Post, Get, Body, Headers, Query, Param } from '@nestjs/common'
import { TrainingService } from './training.service'

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  /**
   * 创建训练记录（支持多动作多组模式）
   */
  @Post()
  async createRecord(
    @Headers('authorization') auth: string,
    @Body() body: {
      type: 'strength' | 'cardio'
      exercises?: any[]
      cardio?: any
      session_duration?: number
      template_id?: string
    }
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

  // ==================== 训练模板接口 ====================

  /**
   * 获取用户训练模板列表
   */
  @Get('templates')
  async getUserTemplates(@Headers('authorization') auth: string) {
    const userId = this.getUserIdFromAuth(auth)
    const templates = await this.trainingService.getUserTemplates(userId)
    return { code: 200, msg: 'success', data: templates }
  }

  /**
   * 创建训练模板
   */
  @Post('templates')
  async createTemplate(
    @Headers('authorization') auth: string,
    @Body() body: { name: string; exercises: any[] }
  ) {
    const userId = this.getUserIdFromAuth(auth)
    const template = await this.trainingService.createTemplate(userId, body)
    return { code: 200, msg: 'success', data: template }
  }

  /**
   * 从模板开始训练（获取模板详情）
   */
  @Post('templates/:id/use')
  async useTemplate(
    @Headers('authorization') auth: string,
    @Param('id') id: string
  ) {
    const userId = this.getUserIdFromAuth(auth)
    const template = await this.trainingService.getTemplateById(id, userId)
    return { code: 200, msg: 'success', data: template }
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
