import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dumbbell, Flame, Heart, Clock } from 'lucide-react-taro'
import { Network } from '@/network'

interface UserInfo {
  id: string
  nickname: string
  avatar: string
  gender: number
  age: number
  height: string
  weight: string
}

const IndexPage = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const todayCalories = 0

  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = async () => {
    const token = Taro.getStorageSync('token')
    if (!token) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    await fetchUserInfo()
  }

  const fetchUserInfo = async () => {
    try {
      const res = await Network.request({
        url: '/api/user/info',
        method: 'GET',
        header: {
          Authorization: `Bearer ${Taro.getStorageSync('token')}`,
        },
      })
      console.log('用户信息:', res.data)
      if (res.data?.data) {
        setUserInfo(res.data.data)
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
    }
  }

  const handleStartTraining = () => {
    Taro.switchTab({ url: '/pages/training/index' })
  }

  const handleViewCourses = () => {
    Taro.switchTab({ url: '/pages/course/index' })
  }

  return (
    <View className="min-h-screen bg-background">
      {/* 顶部欢迎区域 */}
      <View className="bg-primary px-4 pb-8 pt-6 rounded-b-3xl">
        <Text className="block text-white text-2xl font-bold">
          {userInfo?.nickname ? `Hi, ${userInfo.nickname}` : 'Hi, 健身达人'}
        </Text>
        <Text className="block text-white text-sm mt-1">
          今天也要元气满满哦
        </Text>

        {/* 今日数据卡片 */}
        <View className="flex gap-3 mt-4">
          <View className="flex-1 rounded-2xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <View className="flex items-center gap-2">
              <Flame size={20} color="#FDCB6E" />
              <Text className="block text-white text-xs">消耗卡路里</Text>
            </View>
            <Text className="block text-white text-xl font-bold mt-1">
              {todayCalories}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <View className="flex items-center gap-2">
              <Clock size={20} color="#FDCB6E" />
              <Text className="block text-white text-xs">训练时长</Text>
            </View>
            <Text className="block text-white text-xl font-bold mt-1">
              0 分钟
            </Text>
          </View>
        </View>
      </View>

      {/* 快捷操作 */}
      <View className="px-4 mt-4">
        <Text className="block text-foreground text-lg font-semibold mb-3">
          快捷操作
        </Text>
        <View className="flex gap-3">
          <Card className="flex-1" onClick={handleStartTraining}>
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <Dumbbell size={32} color="#00B894" />
              <Text className="block text-sm text-foreground">开始训练</Text>
            </CardContent>
          </Card>
          <Card className="flex-1" onClick={handleViewCourses}>
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <Heart size={32} color="#E17055" />
              <Text className="block text-sm text-foreground">预约课程</Text>
            </CardContent>
          </Card>
        </View>
      </View>

      {/* 身体数据 */}
      {userInfo && (
        <View className="px-4 mt-4">
          <Text className="block text-foreground text-lg font-semibold mb-3">
            身体数据
          </Text>
          <Card>
            <CardContent className="p-4">
              <View className="flex justify-between">
                <View className="flex-1 text-center">
                  <Text className="block text-muted-foreground text-xs">身高</Text>
                  <Text className="block text-foreground text-lg font-bold mt-1">
                    {userInfo.height || '--'}
                  </Text>
                  <Text className="block text-muted-foreground text-xs">cm</Text>
                </View>
                <View className="w-px bg-border" />
                <View className="flex-1 text-center">
                  <Text className="block text-muted-foreground text-xs">体重</Text>
                  <Text className="block text-foreground text-lg font-bold mt-1">
                    {userInfo.weight || '--'}
                  </Text>
                  <Text className="block text-muted-foreground text-xs">kg</Text>
                </View>
                <View className="w-px bg-border" />
                <View className="flex-1 text-center">
                  <Text className="block text-muted-foreground text-xs">年龄</Text>
                  <Text className="block text-foreground text-lg font-bold mt-1">
                    {userInfo.age || '--'}
                  </Text>
                  <Text className="block text-muted-foreground text-xs">岁</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 健康餐推荐 */}
      <View className="px-4 mt-4 pb-4">
        <Text className="block text-foreground text-lg font-semibold mb-3">
          训练后推荐餐食
        </Text>
        <Card>
          <CardContent className="p-4">
            <View className="flex items-center justify-center py-6">
              <Text className="block text-muted-foreground text-sm">
                完成训练后，为你智能推荐健康餐
              </Text>
            </View>
            <Button
              className="w-full bg-primary text-primary-foreground"
              onClick={handleStartTraining}
            >
              <Text>去训练</Text>
            </Button>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

export default IndexPage
