import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Salad } from 'lucide-react-taro'
import { Network } from '@/network'

const LoginPage = () => {
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!agreed) {
      Taro.showToast({ title: '请先同意用户协议', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      // 调用微信登录获取 code
      const loginRes = await Taro.login()
      console.log('微信登录 code:', loginRes.code)

      // 调用后端登录接口
      const res = await Network.request({
        url: '/api/user/login',
        method: 'POST',
        data: {
          code: loginRes.code,
        },
      })

      console.log('登录响应:', res.data)

      if (res.data?.data) {
        const { token, is_new_user, user_info } = res.data.data

        // 保存 token
        Taro.setStorageSync('token', token)

        if (is_new_user) {
          // 新用户跳转注册页
          Taro.navigateTo({ url: '/pages/register/index' })
        } else {
          // 老用户保存信息并跳转首页
          Taro.setStorageSync('userInfo', user_info)
          Taro.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/index/index' })
          }, 1000)
        }
      } else {
        Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
      }
    } catch (err) {
      console.error('登录失败:', err)
      Taro.showToast({ title: '网络错误，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-background flex flex-col">
      {/* Logo 区域 */}
      <View className="flex-1 flex flex-col items-center justify-center px-8">
        <View className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mb-6">
          <Salad size={48} color="#ffffff" />
        </View>
        <Text className="block text-foreground text-2xl font-bold">
          禾页健康
        </Text>
        <Text className="block text-muted-foreground text-sm mt-2 text-center">
          健身 + 健康餐，一站式健康管理平台
        </Text>
      </View>

      {/* 登录按钮区域 */}
      <View className="px-6 pb-8">
        <Button
          className="w-full bg-primary text-primary-foreground h-12"
          onClick={handleLogin}
          disabled={loading}
        >
          <Text>{loading ? '登录中...' : '微信一键登录'}</Text>
        </Button>

        {/* 用户协议 */}
        <View className="flex items-center justify-center gap-2 mt-6">
          <Checkbox
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
          />
          <Text className="text-muted-foreground text-xs">
            我已阅读并同意
            <Text className="text-primary"> 《用户协议》</Text>
            和
            <Text className="text-primary">《隐私政策》</Text>
          </Text>
        </View>
      </View>
    </View>
  )
}

export default LoginPage
