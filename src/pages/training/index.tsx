import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dumbbell, Flame, Plus } from 'lucide-react-taro'

const TrainingPage = () => {
  const [records] = useState([])

  const handleAddRecord = () => {
    Taro.showToast({
      title: '训练记录功能开发中',
      icon: 'none',
    })
  }

  return (
    <View className="min-h-screen bg-background">
      {/* 顶部统计 */}
      <View className="bg-primary px-4 pb-6 pt-6 rounded-b-3xl">
        <Text className="block text-white text-xl font-bold">训练记录</Text>
        <View className="flex gap-3 mt-4">
          <View className="flex-1 rounded-2xl p-3 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text className="block text-white text-xs">本周训练</Text>
            <Text className="block text-white text-2xl font-bold mt-1">0</Text>
            <Text className="block text-white text-xs">次</Text>
          </View>
          <View className="flex-1 rounded-2xl p-3 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text className="block text-white text-xs">消耗卡路里</Text>
            <Text className="block text-white text-2xl font-bold mt-1">0</Text>
            <Text className="block text-white text-xs">kcal</Text>
          </View>
          <View className="flex-1 rounded-2xl p-3 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text className="block text-white text-xs">训练时长</Text>
            <Text className="block text-white text-2xl font-bold mt-1">0</Text>
            <Text className="block text-white text-xs">分钟</Text>
          </View>
        </View>
      </View>

      {/* 添加训练按钮 */}
      <View className="px-4 mt-4">
        <Button
          className="w-full bg-primary text-primary-foreground"
          onClick={handleAddRecord}
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
          records.map((_, idx) => (
            <Card key={idx} className="mb-3">
              <CardContent className="p-4">
                <View className="flex items-center justify-between">
                  <View className="flex items-center gap-2">
                    <Dumbbell size={20} color="#00B894" />
                    <Text className="block text-foreground font-semibold">
                      力量训练
                    </Text>
                  </View>
                  <View className="flex items-center gap-1">
                    <Flame size={14} color="#E17055" />
                    <Text className="text-sm text-muted-foreground">
                      320 kcal
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))
        )}
      </View>
    </View>
  )
}

export default TrainingPage
