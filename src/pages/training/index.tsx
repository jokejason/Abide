/**
 * 训练记录页面 - 多动作多组训练模式
 * 类似"训记APP"的训练记录功能
 */
import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Network } from '@/network'
import { Plus, Play, Check, X, Clock, Flame, Dumbbell, Trophy, List } from 'lucide-react-taro'

// 类型定义
interface SetData {
  set_number: number
  weight: number
  reps: number
  completed: boolean
  completed_at?: string
}

interface ExerciseData {
  exercise_id?: string | null
  name: string
  met: number
  sets: SetData[]
}

interface TrainingRecord {
  id: string
  type: string
  session_duration: number
  total_volume: string
  calories_burned: number
  exercises: ExerciseData[]
  created_at: string
}

interface TemplateExercise {
  name: string
  target_sets: number
  target_weight: number
  target_reps: number
  rest_seconds: number
  met: number
  sort_order: number
}

interface TrainingTemplate {
  id: string
  name: string
  exercises: TemplateExercise[]
  created_at: string
}

export default function TrainingPage() {
  const [activeTab, setActiveTab] = useState('history')
  const [isTraining, setIsTraining] = useState(false)
  const [trainingStartTime, setTrainingStartTime] = useState<number>(0)
  const [currentExercises, setCurrentExercises] = useState<ExerciseData[]>([])
  const [trainingHistory, setTrainingHistory] = useState<TrainingRecord[]>([])
  const [templates, setTemplates] = useState<TrainingTemplate[]>([])
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState('')

  // 加载训练历史和模板
  useEffect(() => {
    loadTrainingHistory()
    loadTemplates()
  }, [])

  const loadTrainingHistory = async () => {
    try {
      const res = await Network.request({
        url: '/api/training/list',
        method: 'GET'
      })
      setTrainingHistory(res.data?.data || [])
    } catch (err) {
      console.error('加载训练历史失败:', err)
    }
  }

  const loadTemplates = async () => {
    try {
      const res = await Network.request({
        url: '/api/training/templates',
        method: 'GET'
      })
      setTemplates(res.data?.data || [])
    } catch (err) {
      console.error('加载模板失败:', err)
    }
  }

  // 开始新训练
  const startNewTraining = () => {
    setIsTraining(true)
    setTrainingStartTime(Date.now())
    setCurrentExercises([])
  }

  // 从模板开始训练
  const startFromTemplate = async (template: TrainingTemplate) => {
    const exercises: ExerciseData[] = template.exercises.map((ex) => ({
      exercise_id: null,
      name: ex.name,
      met: ex.met,
      sets: Array.from({ length: ex.target_sets }, (_, i) => ({
        set_number: i + 1,
        weight: ex.target_weight,
        reps: ex.target_reps,
        completed: false
      }))
    }))
    setCurrentExercises(exercises)
    setIsTraining(true)
    setTrainingStartTime(Date.now())
    setActiveTab('active')
  }

  // 添加动作
  const addExercise = () => {
    if (!newExerciseName.trim()) return
    const newExercise: ExerciseData = {
      exercise_id: null,
      name: newExerciseName,
      met: 5.0,
      sets: [{ set_number: 1, weight: 0, reps: 0, completed: false }]
    }
    setCurrentExercises([...currentExercises, newExercise])
    setNewExerciseName('')
    setShowAddExercise(false)
  }

  // 添加一组
  const addSet = (exerciseIndex: number) => {
    const updated = [...currentExercises]
    const lastSet = updated[exerciseIndex].sets[updated[exerciseIndex].sets.length - 1]
    updated[exerciseIndex].sets.push({
      set_number: lastSet.set_number + 1,
      weight: lastSet.weight,
      reps: lastSet.reps,
      completed: false
    })
    setCurrentExercises(updated)
  }

  // 更新组数据
  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof SetData, value: any) => {
    const updated = [...currentExercises]
    updated[exerciseIndex].sets[setIndex] = {
      ...updated[exerciseIndex].sets[setIndex],
      [field]: value
    }
    setCurrentExercises(updated)
  }

  // 完成一组
  const completeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...currentExercises]
    updated[exerciseIndex].sets[setIndex].completed = true
    updated[exerciseIndex].sets[setIndex].completed_at = new Date().toISOString()
    setCurrentExercises(updated)
  }

  // 删除动作
  const removeExercise = (exerciseIndex: number) => {
    setCurrentExercises(currentExercises.filter((_, i) => i !== exerciseIndex))
  }

  // 完成训练
  const finishTraining = async () => {
    const sessionDuration = Math.floor((Date.now() - trainingStartTime) / 1000)
    
    try {
      await Network.request({
        url: '/api/training',
        method: 'POST',
        data: {
          type: 'strength',
          session_duration: sessionDuration,
          exercises: currentExercises
        }
      })
      
      Taro.showToast({ title: '训练完成！', icon: 'success' })
      setIsTraining(false)
      setCurrentExercises([])
      setActiveTab('history')
      loadTrainingHistory()
    } catch (err) {
      console.error('保存训练失败:', err)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  // 取消训练
  const cancelTraining = () => {
    Taro.showModal({
      title: '确认取消',
      content: '取消后训练数据将丢失',
      success: (res) => {
        if (res.confirm) {
          setIsTraining(false)
          setCurrentExercises([])
        }
      }
    })
  }

  // 格式化时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 计算训练时长（实时）
  const [elapsedTime, setElapsedTime] = useState(0)
  useEffect(() => {
    if (!isTraining) return
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - trainingStartTime) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [isTraining, trainingStartTime])

  // 训练进行中界面
  if (isTraining) {
    return (
      <View className="min-h-screen bg-gray-50">
        {/* 顶部状态栏 */}
        <View className="bg-primary px-4 py-3 text-white">
          <View className="flex items-center justify-between">
            <View className="flex items-center gap-2">
              <Clock size={18} color="#fff" />
              <Text className="text-lg font-bold">{formatDuration(elapsedTime)}</Text>
            </View>
            <Button size="sm" variant="destructive" onClick={cancelTraining}>
              <Text className="text-white">取消</Text>
            </Button>
          </View>
        </View>

        {/* 动作列表 */}
        <ScrollView scrollY className="h-[calc(100vh-200px)] p-4">
          {currentExercises.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-20">
              <Dumbbell size={48} color="#ccc" />
              <Text className="mt-4 text-gray-400">添加动作开始训练</Text>
            </View>
          ) : (
            currentExercises.map((exercise, exIdx) => (
              <Card key={exIdx} className="mb-4">
                <CardContent className="p-4">
                  <View className="flex items-center justify-between mb-3">
                    <Text className="text-lg font-bold">{exercise.name}</Text>
                    <Button size="sm" variant="ghost" onClick={() => removeExercise(exIdx)}>
                      <X size={18} color="#999" />
                    </Button>
                  </View>
                  
                  {/* 组数列表 */}
                  {exercise.sets.map((set, setIdx) => (
                    <View key={setIdx} className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
                      <Text className="w-8 text-center text-sm font-bold text-gray-500">
                        {set.set_number}
                      </Text>
                      <View className="flex-1 flex items-center gap-2">
                        <View className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={set.weight.toString()}
                            onInput={(e) => updateSet(exIdx, setIdx, 'weight', Number(e.detail.value))}
                            className="w-16 h-8 text-center text-sm"
                            disabled={set.completed}
                          />
                          <Text className="text-xs text-gray-500">kg</Text>
                        </View>
                        <View className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={set.reps.toString()}
                            onInput={(e) => updateSet(exIdx, setIdx, 'reps', Number(e.detail.value))}
                            className="w-14 h-8 text-center text-sm"
                            disabled={set.completed}
                          />
                          <Text className="text-xs text-gray-500">次</Text>
                        </View>
                      </View>
                      {set.completed ? (
                        <Badge variant="default" className="bg-green-500">
                          <Check size={12} color="#fff" />
                        </Badge>
                      ) : (
                        <Button size="sm" onClick={() => completeSet(exIdx, setIdx)}>
                          <Check size={14} color="#fff" />
                        </Button>
                      )}
                    </View>
                  ))}
                  
                  {/* 添加组按钮 */}
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => addSet(exIdx)}>
                    <Plus size={14} color="#00B894" className="mr-1" />
                    <Text>添加一组</Text>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
          
          {/* 添加动作按钮 */}
          {!showAddExercise ? (
            <Button variant="outline" className="w-full" onClick={() => setShowAddExercise(true)}>
              <Plus size={18} color="#00B894" className="mr-2" />
              <Text>添加动作</Text>
            </Button>
          ) : (
            <Card className="mb-4">
              <CardContent className="p-4">
                <Input
                  placeholder="输入动作名称"
                  value={newExerciseName}
                  onInput={(e) => setNewExerciseName(e.detail.value)}
                  className="mb-3"
                />
                <View className="flex gap-2">
                  <Button className="flex-1" onClick={addExercise}>
                    <Text>确认</Text>
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowAddExercise(false)}>
                    <Text>取消</Text>
                  </Button>
                </View>
              </CardContent>
            </Card>
          )}
        </ScrollView>

        {/* 底部完成按钮 */}
        <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <Button className="w-full h-12" onClick={finishTraining} disabled={currentExercises.length === 0}>
            <Text className="text-lg">完成训练</Text>
          </Button>
        </View>
      </View>
    )
  }

  // 主界面
  return (
    <View className="min-h-screen bg-gray-50">
      {/* 顶部标题 */}
      <View className="bg-primary px-4 py-4 text-white">
        <Text className="text-xl font-bold">训练记录</Text>
      </View>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="history">
            <List size={16} color="#666" className="mr-1" />
            <Text>历史</Text>
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Trophy size={16} color="#666" className="mr-1" />
            <Text>模板</Text>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="p-4">
          {/* 开始训练按钮 */}
          <Button className="w-full h-12 mb-4" onClick={startNewTraining}>
            <Play size={20} color="#00B894" className="mr-2" />
            <Text className="text-lg">开始新训练</Text>
          </Button>

          {/* 训练历史 */}
          {trainingHistory.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-20">
              <Dumbbell size={48} color="#ccc" />
              <Text className="mt-4 text-gray-400">暂无训练记录</Text>
            </View>
          ) : (
            trainingHistory.map((record) => (
              <Card key={record.id} className="mb-3">
                <CardContent className="p-4">
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-sm text-gray-500">
                      {new Date(record.created_at).toLocaleDateString()}
                    </Text>
                    <Badge variant="secondary">
                      <Text>{record.type === 'strength' ? '力量' : '有氧'}</Text>
                    </Badge>
                  </View>
                  <View className="flex items-center gap-4">
                    <View className="flex items-center gap-1">
                      <Clock size={16} color="#666" />
                      <Text className="text-sm">{formatDuration(record.session_duration)}</Text>
                    </View>
                    <View className="flex items-center gap-1">
                      <Flame size={16} color="#E17055" />
                      <Text className="text-sm">{record.calories_burned} kcal</Text>
                    </View>
                    <View className="flex items-center gap-1">
                      <Dumbbell size={16} color="#00B894" />
                      <Text className="text-sm">{record.total_volume} kg</Text>
                    </View>
                  </View>
                  <View className="mt-2 text-sm text-gray-500">
                    <Text>{record.exercises?.length || 0} 个动作</Text>
                  </View>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="templates" className="p-4">
          {/* 模板列表 */}
          {templates.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-20">
              <Trophy size={48} color="#ccc" />
              <Text className="mt-4 text-gray-400">暂无训练模板</Text>
              <Text className="mt-2 text-sm text-gray-400">创建模板快速开始训练</Text>
            </View>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="mb-3">
                <CardContent className="p-4">
                  <Text className="text-lg font-bold">{template.name}</Text>
                  <View className="mt-2 text-sm text-gray-500">
                    <Text>{template.exercises.length} 个动作</Text>
                  </View>
                  <View className="mt-2 flex flex-wrap gap-1">
                    {template.exercises.slice(0, 3).map((ex, idx) => (
                      <Badge key={idx} variant="outline">
                        <Text className="text-xs">{ex.name}</Text>
                      </Badge>
                    ))}
                    {template.exercises.length > 3 && (
                      <Badge variant="outline">
                        <Text className="text-xs">+{template.exercises.length - 3}</Text>
                      </Badge>
                    )}
                  </View>
                  <Button className="w-full mt-3" onClick={() => startFromTemplate(template)}>
                    <Play size={16} color="#00B894" className="mr-1" />
                    <Text>使用模板</Text>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </View>
  )
}
