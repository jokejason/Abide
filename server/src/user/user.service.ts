import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  private readonly ENCRYPTION_KEY = process.env.PHONE_ENCRYPTION_KEY || 'default-key-change-in-production-32';
  private readonly IV_LENGTH = 16;

  /**
   * 加密手机号（AES-256）
   */
  private encryptPhone(phone: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(phone, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 解密手机号
   */
  private decryptPhone(encryptedPhone: string): string {
    const [ivHex, encrypted] = encryptedPhone.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * 生成简易 token
   */
  private generateToken(userId: string): string {
    const payload = { userId, timestamp: Date.now() };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * 解析 token
   */
  private parseToken(token: string): { userId: string; timestamp: number } | null {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * 用户登录
   * @param code 微信登录 code（当前环境模拟使用）
   * @param mockOpenid 模拟 openid（开发环境用）
   */
  async login(code: string, mockOpenid?: string) {
    const client = getSupabaseClient();

    // 开发环境：使用模拟 openid
    // 生产环境：需要通过微信接口换取 openid
    const openid = mockOpenid || `mock_openid_${code}`;

    console.log(`[UserLogin] openid: ${openid}`);

    // 查询用户是否存在
    const { data: existingUser, error: queryError } = await client
      .from('users')
      .select('id, openid, nickname, avatar, gender, age, height, weight, role, status')
      .eq('openid', openid)
      .maybeSingle();

    if (queryError) {
      console.error('[UserLogin] 查询用户失败:', queryError);
      throw new Error(`查询用户失败: ${queryError.message}`);
    }

    if (existingUser) {
      // 老用户
      if (existingUser.status === 0) {
        return { success: false, message: '账号已被禁用' };
      }

      const token = this.generateToken(existingUser.id);
      return {
        success: true,
        data: {
          token,
          is_new_user: false,
          user_info: existingUser,
        },
      };
    }

    // 新用户 - 先创建用户记录
    const { data: newUser, error: insertError } = await client
      .from('users')
      .insert({
        openid,
        nickname: `用户${openid.slice(-6)}`,
        role: 'user',
        status: 1,
        gender: 0,
      })
      .select('id, openid, nickname, avatar, gender, age, height, weight, role, status')
      .single();

    if (insertError) {
      console.error('[UserLogin] 创建用户失败:', insertError);
      throw new Error(`创建用户失败: ${insertError.message}`);
    }

    const token = this.generateToken(newUser.id);
    return {
      success: true,
      data: {
        token,
        is_new_user: true,
        user_info: newUser,
      },
    };
  }

  /**
   * 用户注册（完善信息）
   */
  async register(userId: string, info: {
    gender: number;
    age: number;
    height: string;
    weight: string;
    nickname?: string;
    phone?: string;
    fitness_goal?: string;
  }) {
    const client = getSupabaseClient();

    const updateData: Record<string, unknown> = {
      gender: info.gender,
      age: info.age,
      height: info.height,
      weight: info.weight,
      updated_at: new Date().toISOString(),
    };

    if (info.nickname) {
      updateData.nickname = info.nickname;
    }

    if (info.phone) {
      updateData.phone = this.encryptPhone(info.phone);
    }

    if (info.fitness_goal) {
      updateData.fitness_goal = info.fitness_goal;
    }

    const { data, error } = await client
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, openid, nickname, avatar, gender, age, height, weight, role, status')
      .single();

    if (error) {
      console.error('[UserRegister] 更新用户信息失败:', error);
      throw new Error(`更新用户信息失败: ${error.message}`);
    }

    return { success: true, data };
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId: string) {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('users')
      .select('id, openid, nickname, avatar, gender, age, height, weight, fitness_goal, role, status')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[UserInfo] 查询用户信息失败:', error);
      throw new Error(`查询用户信息失败: ${error.message}`);
    }

    if (!data) {
      return { success: false, message: '用户不存在' };
    }

    return { success: true, data };
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(userId: string, info: {
    gender?: number;
    age?: number;
    height?: string;
    weight?: string;
    nickname?: string;
    avatar?: string;
    fitness_goal?: string;
  }) {
    const client = getSupabaseClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (info.gender !== undefined) updateData.gender = info.gender;
    if (info.age !== undefined) updateData.age = info.age;
    if (info.height !== undefined) updateData.height = info.height;
    if (info.weight !== undefined) updateData.weight = info.weight;
    if (info.nickname !== undefined) updateData.nickname = info.nickname;
    if (info.avatar !== undefined) updateData.avatar = info.avatar;
    if (info.fitness_goal !== undefined) updateData.fitness_goal = info.fitness_goal;

    const { data, error } = await client
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, openid, nickname, avatar, gender, age, height, weight, fitness_goal, role, status')
      .single();

    if (error) {
      console.error('[UserUpdate] 更新用户信息失败:', error);
      throw new Error(`更新用户信息失败: ${error.message}`);
    }

    return { success: true, data };
  }

  /**
   * 验证 token 并返回 userId
   */
  validateToken(token: string): string | null {
    const payload = this.parseToken(token);
    if (!payload) return null;

    // 检查 token 是否过期（24小时）
    const now = Date.now();
    if (now - payload.timestamp > 24 * 60 * 60 * 1000) {
      return null;
    }

    return payload.userId;
  }
}
