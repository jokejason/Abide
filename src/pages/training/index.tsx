import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Dumbbell, Flame, Plus, TrendingUp, Salad } from 'lucide-react-taro'
import { Network } from '@/network'

interface TrainingRecord {
  id: string
  type: 'strength' | 'cardio'
  exercises?: Array<{ name: string; sets: number; reps: number; weight?: number }>
  cardio?: { type: string; duration: number; heart_rate?: number }
  calories_burned: string
  created_at: string
}

interface TodayStats {
  count: number
  calories: number
  duration: number
}

interface RecommendedDish {
  id: string
  name: string
  image: string
  nutrition: { calories: number; protein: number; carbs: number; fat: number }
  price: number
}

const TrainingPage = () => {
  const [records, setRecords] = useState<TrainingRecord[]>([])
  const [todayStats, setTodayStats] = useState<TodayStats>({ count: 0, calories: 0, duration: 0 })
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showRecommendDialog, setShowRecommendDialog] = useState(false)
  const [recommendedDishes, setRecommendedDishes] = useState<RecommendedDish[]>([])
  const [lastCalories, setLastCalories] = useState(0)

  // 添加训练表单
  const [trainingType, setTrainingType] = useState<'strength' | 'cardio'>('strength')
  const [exerciseName, setExerciseName] = useState('')
  const [exerciseSets, setExerciseSets] = useState('3')
  const [exerciseReps, setExerciseReps] = useState('12')
  const [exerciseWeight, setExerciseWeight] = useState('')
  const [cardioType, setCardioType] = useState('running')
  const [cardioDuration, setCardioDuration] = useState('30')

  useEffect(() => {
    fetchRecords()
    fetchTodayStats()
  }, [])

  const fetchRecords = async () => {
    try {
      const token = Taro.getStorageSync('token')
      const res = await Network.request({
        url: '/api/training/list',
        method: 'GET',
        header: { Authorization: `Bearer ${token}` },
      })
      console.log('训练记录:', res.data)
      if (res.data?.data) {
        setRecords(res.data.data)
      }
    } catch (err) {
      console.error('获取训练记录失败:', err)
    }
  }

  const fetchTodayStats = async () => {
    try {
      const token = Taro.getStorageSync('token')
      const res = await Network.request({
        url: '/api/training/today',
        method: 'GET',
        header: { Authorization: `Bearer ${token}` },
      })
      console.log('今日统计:', res.data)
      if (res.data?.data) {
        setTodayStats(res.data.data)
      }
    } catch (err) {
      console.error('获取今日统计失败:', err)
    }
  }

  const handleAddTraining = async () => {
    try {
      const token = Taro.getStorageSync('token')
      const data: any = { type: trainingType }

      if (trainingType === 'strength') {
        if (!exerciseName) {
          Taro.showToast({ title: '请输入动作名称', icon: 'none' })
          return
        }
        data.exercises = [{
          name: exerciseName,
          sets: parseInt(exerciseSets) || 3,
          reps: parseInt(exerciseReps) || 12,
          weight: exerciseWeight ? parseFloat(exerciseWeight) : undefined,
        }]
        data.duration = 30
      } else {
        data.cardio = {
          type: cardioType,
          duration: parseInt(cardioDuration) || 30,
        }
      }

      const res = await Network.request({
        url: '/api/training',
        method: 'POST',
        header: { Authorization: `Bearer ${token}` },
        data,
      })
      console.log('创建训练记录:', res.data)

      if (res.data?.code === 200) {
        Taro.showToast({ title: '训练记录已保存', icon: 'success' })
        setShowAddDialog(false)
        resetForm()
        fetchRecords()
        fetchTodayStats()

        // 获取推荐餐食
        const calories = parseFloat(res.data.data.calories_burned)
        setLastCalories(calories)
        await fetchRecommendedDishes(calories)
        setShowRecommendDialog(true)
      }
    } catch (err) {
      console.error('创建训练记录失败:', err)
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  }

  const fetchRecommendedDishes = async (calories: number) => {
    try {
      const token = Taro.getStorageSync('token')
      const res = await Network.request({
        url: `/api/training/recommend?calories=${calories}`,
        method: 'GET',
        header: { Authorization: `Bearer ${token}` },
      })
      console.log('推荐餐食:', res.data)
      if (res.data?.data) {
        setRecommendedDishes(res.data.data)
      }
    } catch (err) {
      console.error('获取推荐餐食失败:', err)
    }
  }

  const resetForm = () => {
    setExerciseName('')
    setExerciseSets('3')
    setExerciseReps('12')
    setExerciseWeight('')
    setCardioDuration('30')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const getTypeLabel = (type: string) => {
    return type === 'strength' ? '力量训练' : '有氧训练'
  }

  return (
    <View className="min-h-screen bg-background">
      {/* 顶部统计 */}
      <View className="bg-primary px-4 pb-6 pt-6 rounded-b-3xl">
        <Text className="block text-white text-xl font-bold">训练记录</Text>
        <View className="flex gap-3 mt-4">
          <View className="flex-1 rounded-2xl p-3 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text className="block text-white text-xs">今日训练</Text>
            <Text className="block text-white text-2xl font-bold mt-1">{todayStats.count}</Text>
            <Text className="block text-white text-xs">次</Text>
          </View>
          <View className="flex-1 rounded-2xl p-3 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text className="block text-white text-xs">消耗卡路里</Text>
            <Text className="block text-white text-2xl font-bold mt-1">{todayStats.calories}</Text>
            <Text className="block text-white text-xs">kcal</Text>
          </View>
          <View className="flex-1 rounded-2xl p-3 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text className="block text-white text-xs">训练时长</Text>
            <Text className="block text-white text-2xl font-bold mt-1">{todayStats.duration}</Text>
            <Text className="block text-white text-xs">分钟</Text>
          </View>
        </View>
      </View>

      {/* 添加训练按钮 */}
      <View className="px-4 mt-4">
        <Button
          className="w-full bg-primary text-primary-foreground"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus size={18} color="#ffffff" className="mr-2" />
          <Text>记录训练</Text>
        </Button>
      </View>

      {/* 训练记录列表 */}
      <View className="px-4 mt-4 pb-4">
        {records.length === 0 ? (
          <Card>
            <CardContent className="p-8 flex flex-col items-center justify-center">
              <Dumbbell size={48} color="#B2BEC3" />
              <Text className="block text-muted-foreground text-sm mt-4 text-center">
                还没有训练记录{'\n'}点击上方按钮开始记录你的第一次训练
              </Text>
            </CardContent>
          </Card>
        ) : (
          records.map((record) => (
            <Card key={record.id} className="mb-3">
              <CardContent className="p-4">
                <View className="flex items-center justify-between">
                  <View className="flex items-center gap-2">
                    {record.type === 'strength' ? (
                      <Dumbbell size={20} color="#00B894" />
                    ) : (
                      <TrendingUp size={20} color="#00B894" />
                    )}
                    <View>
                      <Text className="block text-foreground font-semibold text-sm">
                        {getTypeLabel(record.type)}
                      </Text>
                      <Text className="block text-muted-foreground text-xs">
                        {formatDate(record.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View className="flex items-center gap-1">
                    <Flame size={14} color="#E17055" />
                    <Text className="text-sm text-muted-foreground">
                      {Math.round(parseFloat(record.calories_burned))} kcal
                    </Text>
                  </View>
                </View>
                {record.type === 'strength' && record.exercises && record.exercises.length > 0 && (
                  <View className="mt-2 pt-2" style={{ borderTopWidth: '1px', borderTopColor: '#f0f0f0', borderTopStyle: 'solid' }}>
                    <Text className="block text-xs text-muted-foreground">
                      {record.exercises[0].name} {record.exercises[0].sets}组x{record.exercises[0].reps}次
                      {record.exercises[0].weight ? ` ${record.exercises[0].weight}kg` : ''}
                    </Text>
                  </View>
                )}
                {record.type === 'cardio' && record.cardio && (
                  <View className="mt-2 pt-2" style={{ borderTopWidth: '1px', borderTopColor: '#f0f0f0', borderTopStyle: 'solid' }}>
                    <Text className="block text-xs text-muted-foreground">
                      {record.cardio.type === 'running' ? '跑步' : record.cardio.type === 'cycling' ? '骑行' : '游泳'} {record.cardio.duration}分钟
                    </Text>
                  </View>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </View>

      {/* 添加训练弹窗 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Text>记录训练</Text>
            </DialogTitle>
          </DialogHeader>

          <View className="py-4">
            {/* 训练类型选择 */}
            <Text className="block text-sm text-muted-foreground mb-2">训练类型</Text>
            <View className="flex gap-2 mb-4">
              <Button
                className={`flex-1 ${trainingType === 'strength' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setTrainingType('strength')}
              >
                <Dumbbell size={16} color={trainingType === 'strength' ? '#fff' : '#666'} className="mr-1" />
                <Text>力量训练</Text>
              </Button>
              <Button
                className={`flex-1 ${trainingType === 'cardio' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setTrainingType('cardio')}
              >
                <TrendingUp size={16} color={trainingType === 'cardio' ? '#fff' : '#666'} className="mr-1" />
                <Text>有氧训练</Text>
              </Button>
            </View>

            {trainingType === 'strength' ? (
              <View>
                {/* 力量训练表单 */}
                <Text className="block text-sm text-muted-foreground mb-2">动作名称</Text>
                <View className="mb-3">
                  <Input
                    className="w-full"
                    placeholder="如：卧推、深蹲、硬拉"
                    value={exerciseName}
                    onInput={(e) => setExerciseName(e.detail.value)}
                  />
                </View>

                <View className="flex gap-2 mb-3">
                  <View className="flex-1">
                    <Text className="block text-sm text-muted-foreground mb-2">组数</Text>
                    <Input
                      className="w-full"
                      type="number"
                      placeholder="3"
                      value={exerciseSets}
                      onInput={(e) => setExerciseSets(e.detail.value)}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="block text-sm text-muted-foreground mb-2">次数</Text>
                    <Input
                      className="w-full"
                      type="number"
                      placeholder="12"
                      value={exerciseReps}
                      onInput={(e) => setExerciseReps(e.detail.value)}
                    />
                  </View>
                </View>

                <Text className="block text-sm text-muted-foreground mb-2">重量 (kg，可选)</Text>
                <Input
                  className="w-full"
                  type="digit"
                  placeholder="如：60"
                  value={exerciseWeight}
                  onInput={(e) => setExerciseWeight(e.detail.value)}
                />
              </View>
            ) : (
              <View>
                {/* 有氧训练表单 */}
                <Text className="block text-sm text-muted-foreground mb-2">有氧类型</Text>
                <View className="flex gap-2 mb-3">
                  <Button
                    className={`flex-1 ${cardioType === 'running' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    onClick={() => setCardioType('running')}
                  >
                    <Text>跑步</Text>
                  </Button>
                  <Button
                    className={`flex-1 ${cardioType === 'cycling' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    onClick={() => setCardioType('cycling')}
                  >
                    <Text>骑行</Text>
                  </Button>
                  <Button
                    className={`flex-1 ${cardioType === 'swimming' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    onClick={() => setCardioType('swimming')}
                  >
                    <Text>游泳</Text>
                  </Button>
                </View>

                <Text className="block text-sm text-muted-foreground mb-2">时长 (分钟)</Text>
                <Input
                  className="w-full"
                  type="number"
                  placeholder="30"
                  value={cardioDuration}
                  onInput={(e) => setCardioDuration(e.detail.value)}
                />
              </View>
            )}
          </View>

          <DialogFooter>
            <Button className="flex-1 bg-muted text-muted-foreground" onClick={() => setShowAddDialog(false)}>
              <Text>取消</Text>
            </Button>
            <Button className="flex-1 bg-primary text-primary-foreground" onClick={handleAddTraining}>
              <Text>保存</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 餐食推荐弹窗 */}
      <Dialog open={showRecommendDialog} onOpenChange={setShowRecommendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <View className="flex items-center gap-2">
                <Salad size={20} color="#00B894" />
                <Text>训练后推荐餐食</Text>
              </View>
            </DialogTitle>
          </DialogHeader>

          <View className="py-4">
            <Text className="block text-sm text-muted-foreground mb-3">
              你消耗了 {Math.round(lastCalories)} 卡路里，推荐以下餐食补充能量：
            </Text>

            {recommendedDishes.length === 0 ? (
              <View className="py-8 flex flex-col items-center">
                <Salad size={48} color="#B2BEC3" />
                <Text className="block text-muted-foreground text-sm mt-4">
                  暂无推荐餐食
                </Text>
              </View>
            ) : (
              recommendedDishes.map((dish) => (
                <Card key={dish.id} className="mb-3">
                  <CardContent className="p-3 flex gap-3">
                    {dish.image && (
                      <Image
                        src={dish.image}
                        className="w-16 h-16 rounded-lg"
                        mode="aspectFill"
                      />
                    )}
                    <View className="flex-1">
                      <Text className="block text-foreground font-semibold text-sm">{dish.name}</Text>
                      <View className="flex gap-2 mt-1">
                        <View className="flex items-center gap-1">
                          <Flame size={12} color="#E17055" />
                          <Text className="text-xs text-muted-foreground">
                            {dish.nutrition?.calories || 0} kcal
                          </Text>
                        </View>
                        <Text className="text-xs text-muted-foreground">
                          蛋白质 {dish.nutrition?.protein || 0}g
                        </Text>
                      </View>
                      <Text className="block text-primary font-semibold text-sm mt-1">
                        ¥{(dish.price / 100).toFixed(1)}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>

          <DialogFooter>
            <Button className="flex-1 bg-primary text-primary-foreground" onClick={() => setShowRecommendDialog(false)}>
              <Text>知道了</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default TrainingPage
