import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { User, Ruler, Weight, CalendarDays, LogOut, ChevronRight, Target } from 'lucide-react-taro'
import { Network } from '@/network'

interface UserProfile {
  id: string
  nickname: string
  avatar: string
  gender: number
  age: number
  height: string
  weight: string
  fitness_goal: string
}

const FITNESS_GOALS = [
  { value: 'fat_loss', label: '减脂', desc: '降低体脂率' },
  { value: 'muscle_gain', label: '增肌', desc: '增加肌肉量' },
  { value: 'body_shape', label: '塑形', desc: '塑造身材线条' },
]

const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState<UserProfile | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showGoalDialog, setShowGoalDialog] = useState(false)

  useEffect(() => {
    const token = Taro.getStorageSync('token')
    if (token) {
      setIsLoggedIn(true)
      fetchUserInfo()
    }
  }, [])

  const fetchUserInfo = async () => {
    try {
      const res = await Network.request({
        url: '/api/user/info',
        method: 'GET',
        header: {
          Authorization: `Bearer ${Taro.getStorageSync('token')}`,
        },
      })
      console.log('个人中心 - 用户信息:', res.data)
      if (res.data?.data) {
        setUserInfo(res.data.data)
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
    }
  }

  const handleLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const handleEditInfo = () => {
    Taro.navigateTo({ url: '/pages/register/index?mode=edit' })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('token')
          Taro.removeStorageSync('userInfo')
          setIsLoggedIn(false)
          setUserInfo(null)
          Taro.showToast({ title: '已退出登录', icon: 'success' })
        }
      },
    })
  }

  const getGenderText = (gender: number) => {
    switch (gender) {
      case 1:
        return '男'
      case 2:
        return '女'
      default:
        return '未设置'
    }
  }

  const getFitnessGoalText = (goal: string) => {
    const found = FITNESS_GOALS.find((g) => g.value === goal)
    return found ? found.label : '塑形'
  }

  const handleSelectGoal = async (goal: string) => {
    try {
      const res = await Network.request({
        url: '/api/user/update',
        method: 'POST',
        data: { fitness_goal: goal },
        header: {
          Authorization: `Bearer ${Taro.getStorageSync('token')}`,
        },
      })
      if (res.data?.code === 200) {
        setUserInfo((prev) => (prev ? { ...prev, fitness_goal: goal } : prev))
        Taro.showToast({ title: '已更新训练目标', icon: 'success' })
        setShowGoalDialog(false)
      }
    } catch (err) {
      console.error('更新训练目标失败:', err)
      Taro.showToast({ title: '更新失败', icon: 'none' })
    }
  }

  // 未登录状态
  if (!isLoggedIn) {
    return (
      <View className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Avatar className="w-20 h-20 mb-4">
          <AvatarImage src="" />
          <AvatarFallback>
            <User size={32} color="#B2BEC3" />
          </AvatarFallback>
        </Avatar>
        <Text className="block text-muted-foreground text-base mb-6">
          登录后享受完整功能
        </Text>
        <Button
          className="bg-primary text-primary-foreground w-48"
          onClick={handleLogin}
        >
          <Text>去登录</Text>
        </Button>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-background">
      {/* 用户信息头部 */}
      <View className="bg-primary px-4 pb-8 pt-6 rounded-b-3xl">
        <View className="flex items-center gap-4">
          <Avatar className="w-16 h-16" style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }}>
            <AvatarImage src={userInfo?.avatar || ''} />
            <AvatarFallback>
              <Text className="text-primary text-xl font-bold">
                {userInfo?.nickname?.charAt(0) || 'U'}
              </Text>
            </AvatarFallback>
          </Avatar>
          <View className="flex-1">
            <Text className="block text-white text-xl font-bold">
              {userInfo?.nickname || '健身达人'}
            </Text>
            <Text className="block text-white text-sm mt-1">
              {getGenderText(userInfo?.gender || 0)} · {userInfo?.age || '--'}岁
            </Text>
          </View>
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent text-white"
            style={{ borderColor: 'rgba(255,255,255,0.3)' }}
            onClick={handleEditInfo}
          >
            <Text className="text-white text-xs">编辑</Text>
          </Button>
        </View>
      </View>

      {/* 身体数据 */}
      <View className="px-4" style={{ marginTop: '-16px' }}>
        <Card>
          <CardContent className="p-4">
            <View className="flex justify-around">
              <View className="flex items-center gap-2">
                <Ruler size={18} color="#00B894" />
                <View>
                  <Text className="block text-xs text-muted-foreground">身高</Text>
                  <Text className="block text-foreground font-bold text-sm">
                    {userInfo?.height || '--'} cm
                  </Text>
                </View>
              </View>
              <View className="flex items-center gap-2">
                <Weight size={18} color="#FDCB6E" />
                <View>
                  <Text className="block text-xs text-muted-foreground">体重</Text>
                  <Text className="block text-foreground font-bold text-sm">
                    {userInfo?.weight || '--'} kg
                  </Text>
                </View>
              </View>
              <View className="flex items-center gap-2">
                <CalendarDays size={18} color="#E17055" />
                <View>
                  <Text className="block text-xs text-muted-foreground">年龄</Text>
                  <Text className="block text-foreground font-bold text-sm">
                    {userInfo?.age || '--'} 岁
                  </Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 功能菜单 */}
      <View className="px-4 mt-4">
        <Card>
          <CardContent className="p-0">
            <View
              className="flex items-center justify-between p-4"
              onClick={handleEditInfo}
            >
              <View className="flex items-center gap-3">
                <User size={20} color="#00B894" />
                <Text className="text-foreground text-base">个人信息</Text>
              </View>
              <ChevronRight size={18} color="#B2BEC3" />
            </View>
            <Separator />
            <View
              className="flex items-center justify-between p-4"
              onClick={() => setShowGoalDialog(true)}
            >
              <View className="flex items-center gap-3">
                <Target size={20} color="#E17055" />
                <Text className="text-foreground text-base">训练目标</Text>
              </View>
              <View className="flex items-center gap-2">
                <Text className="text-sm text-primary font-medium">
                  {getFitnessGoalText(userInfo?.fitness_goal || 'body_shape')}
                </Text>
                <ChevronRight size={18} color="#B2BEC3" />
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 退出登录 */}
      <View className="px-4 mt-6 pb-8">
        <Button
          variant="outline"
          className="w-full border-destructive text-destructive"
          onClick={handleLogout}
        >
          <LogOut size={16} color="#E17055" className="mr-2" />
          <Text>退出登录</Text>
        </Button>
      </View>

      {/* 训练目标选择弹窗 */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>选择训练目标</DialogTitle>
          </DialogHeader>
          <View className="flex flex-col gap-3 py-4">
            {FITNESS_GOALS.map((goal) => (
              <View
                key={goal.value}
                className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  userInfo?.fitness_goal === goal.value
                    ? 'border-primary bg-primary bg-opacity-5'
                    : 'border-border bg-card'
                }`}
                onClick={() => handleSelectGoal(goal.value)}
              >
                <Text className="block text-base font-semibold text-foreground">
                  {goal.label}
                </Text>
                <Text className="block text-sm text-muted-foreground mt-1">
                  {goal.desc}
                </Text>
              </View>
            ))}
          </View>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default ProfilePage
