import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from 'lucide-react-taro'

const CoursePage = () => {
  return (
    <View className="min-h-screen bg-background">
      {/* 顶部 */}
      <View className="bg-primary px-4 pb-6 pt-6 rounded-b-3xl">
        <Text className="block text-white text-xl font-bold">课程预约</Text>
        <Text className="block text-white text-sm mt-1">
          预约精彩课程，和教练一起训练
        </Text>
      </View>

      {/* 课程列表 */}
      <View className="px-4 mt-4 pb-4">
        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center">
            <Calendar size={48} color="#B2BEC3" />
            <Text className="block text-muted-foreground text-sm mt-4 text-center">
              课程预约功能即将上线{'\n'}敬请期待
            </Text>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

export default CoursePage
