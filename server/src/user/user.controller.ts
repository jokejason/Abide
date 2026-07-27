import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 从 Authorization header 中提取 userId
   */
  private getUserIdFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.slice(7);
    return this.userService.validateToken(token);
  }

  /**
   * 用户登录
   * POST /api/user/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { code: string; mock_openid?: string }) {
    console.log('[Login] 请求参数:', { code: body.code ? '***' : 'empty' });

    const result = await this.userService.login(body.code, body.mock_openid);

    if (!result.success) {
      return { code: 400, msg: result.message, data: null };
    }

    return { code: 200, msg: 'success', data: result.data };
  }

  /**
   * 用户注册（完善信息）
   * POST /api/user/register
   */
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(
    @Headers('authorization') authHeader: string,
    @Body() body: {
      gender: number;
      age: number;
      height: string;
      weight: string;
      nickname?: string;
      phone?: string;
    },
  ) {
    const userId = this.getUserIdFromHeader(authHeader);
    if (!userId) {
      return { code: 401, msg: '未授权，请先登录', data: null };
    }

    console.log('[Register] userId:', userId, 'body:', body);

    const result = await this.userService.register(userId, body);

    return { code: 200, msg: 'success', data: result.data };
  }

  /**
   * 获取用户信息
   * GET /api/user/info
   */
  @Get('info')
  async getUserInfo(@Headers('authorization') authHeader: string) {
    const userId = this.getUserIdFromHeader(authHeader);
    if (!userId) {
      return { code: 401, msg: '未授权，请先登录', data: null };
    }

    const result = await this.userService.getUserInfo(userId);

    if (!result.success) {
      return { code: 404, msg: result.message, data: null };
    }

    return { code: 200, msg: 'success', data: result.data };
  }

  /**
   * 更新用户信息
   * POST /api/user/update
   */
  @Post('update')
  @HttpCode(HttpStatus.OK)
  async updateUserInfo(
    @Headers('authorization') authHeader: string,
    @Body() body: {
      gender?: number;
      age?: number;
      height?: string;
      weight?: string;
      nickname?: string;
      avatar?: string;
    },
  ) {
    const userId = this.getUserIdFromHeader(authHeader);
    if (!userId) {
      return { code: 401, msg: '未授权，请先登录', data: null };
    }

    console.log('[Update] userId:', userId, 'body:', body);

    const result = await this.userService.updateUserInfo(userId, body);

    return { code: 200, msg: 'success', data: result.data };
  }
}
