import { useState, useEffect, useCallback } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, User, Users, CircleCheck, CircleX } from 'lucide-react-taro'
import { Network } from '@/network'

interface Course {
  id: string
  name: string
  description: string
  coach_name: string
  coach_avatar: string | null
  category: string
  start_time: string
  end_time: string
  max_capacity: number
  current_count: number
  price: number
  image: string
  status: number
  is_booked: boolean
  remaining_slots: number
}

interface Booking {
  id: string
  course_id: string
  status: number
  created_at: string
  course: {
    id: string
    name: string
    coach_name: string
    start_time: string
    end_time: string
    image: string
  } | null
}

const CoursePage = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list')

  // 获取课程列表
  const fetchCourses = useCallback(async () => {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      const res = await Network.request({
        url: '/api/course/list',
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('课程列表响应:', res.data)
      if (res.data.code === 200) {
        setCourses(res.data.data || [])
      }
    } catch (error) {
      console.error('获取课程列表失败:', error)
      Taro.showToast({ title: '获取课程失败', icon: 'none' })
    }
  }, [])

  // 获取我的预约
  const fetchBookings = useCallback(async () => {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) return

      const res = await Network.request({
        url: '/api/course/my-bookings',
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('我的预约响应:', res.data)
      if (res.data.code === 200) {
        setBookings(res.data.data || [])
      }
    } catch (error) {
      console.error('获取预约记录失败:', error)
    }
  }, [])

  // 预约课程
  const handleBook = async (courseId: string) => {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      const res = await Network.request({
        url: '/api/course/book',
        method: 'POST',
        header: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { courseId },
      })

      console.log('预约响应:', res.data)
      if (res.data.code === 200) {
        Taro.showToast({ title: '预约成功', icon: 'success' })
        fetchCourses()
        fetchBookings()
      } else {
        Taro.showToast({ title: res.data.msg || '预约失败', icon: 'none' })
      }
    } catch (error) {
      console.error('预约失败:', error)
      Taro.showToast({ title: '预约失败', icon: 'none' })
    }
  }

  // 取消预约
  const handleCancel = async (courseId: string) => {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) return

      const res = await Network.request({
        url: '/api/course/cancel',
        method: 'POST',
        header: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { courseId },
      })

      console.log('取消响应:', res.data)
      if (res.data.code === 200) {
        Taro.showToast({ title: '已取消预约', icon: 'success' })
        fetchCourses()
        fetchBookings()
      }
    } catch (error) {
      console.error('取消失败:', error)
      Taro.showToast({ title: '取消失败', icon: 'none' })
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchCourses(), fetchBookings()])
      setLoading(false)
    }
    loadData()
  }, [fetchCourses, fetchBookings])

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hours}:${minutes}`
  }

  // 格式化价格
  const formatPrice = (price: number) => {
    if (price === 0) return '免费'
    return `¥${(price / 100).toFixed(0)}`
  }

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      '力量训练': 'bg-red-100 text-red-600',
      '有氧操': 'bg-orange-100 text-orange-600',
      '瑜伽': 'bg-purple-100 text-purple-600',
      '拉伸': 'bg-blue-100 text-blue-600',
    }
    return colors[category] || 'bg-gray-100 text-gray-600'
  }

  return (
    <View className="min-h-screen bg-background">
      {/* 顶部 */}
      <View className="bg-primary px-4 pb-6 pt-6 rounded-b-3xl">
        <Text className="block text-white text-xl font-bold">课程预约</Text>
        <Text className="block text-white text-sm mt-1">
          预约精彩课程，和教练一起训练
        </Text>
      </View>

      {/* Tabs */}
      <View className="px-4 mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="list">课程列表</TabsTrigger>
            <TabsTrigger value="my">我的预约</TabsTrigger>
          </TabsList>

          {/* 课程列表 */}
          <TabsContent value="list">
            <View className="mt-4 pb-4 space-y-4">
              {loading ? (
                <>
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-40 w-full rounded-xl" />
                </>
              ) : courses.length === 0 ? (
                <Card>
                  <CardContent className="p-8 flex flex-col items-center justify-center">
                    <Calendar size={48} color="#B2BEC3" />
                    <Text className="block text-muted-foreground text-sm mt-4 text-center">
                      暂无课程安排
                    </Text>
                  </CardContent>
                </Card>
              ) : (
                courses.map((course) => (
                  <Card key={course.id} className="overflow-hidden">
                    <View className="flex">
                      {/* 课程图片 */}
                      <View className="w-28 h-28 flex-shrink-0">
                        <Image
                          src={course.image}
                          className="w-full h-full object-cover"
                          mode="aspectFill"
                        />
                      </View>
                      
                      {/* 课程信息 */}
                      <View className="flex-1 p-3">
                        <View className="flex items-center justify-between mb-1">
                          <Text className="block text-base font-bold text-foreground line-clamp-1">
                            {course.name}
                          </Text>
                          <Badge className={getCategoryColor(course.category)}>
                            {course.category}
                          </Badge>
                        </View>
                        
                        <View className="flex items-center gap-1 mb-1">
                          <User size={14} color="#666" />
                          <Text className="text-xs text-muted-foreground">
                            {course.coach_name}
                          </Text>
                        </View>
                        
                        <View className="flex items-center gap-1 mb-1">
                          <Clock size={14} color="#666" />
                          <Text className="text-xs text-muted-foreground">
                            {formatTime(course.start_time)}
                          </Text>
                        </View>
                        
                        <View className="flex items-center justify-between">
                          <View className="flex items-center gap-1">
                            <Users size={14} color="#666" />
                            <Text className="text-xs text-muted-foreground">
                              剩余 {course.remaining_slots} 名额
                            </Text>
                          </View>
                          <Text className="text-sm font-bold text-primary">
                            {formatPrice(course.price)}
                          </Text>
                        </View>
                        
                        {/* 预约按钮 */}
                        <View className="mt-2">
                          {course.is_booked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleCancel(course.id)}
                            >
                              <CircleX size={14} color="#666" className="mr-1" />
                              取消预约
                            </Button>
                          ) : course.remaining_slots === 0 ? (
                            <Button size="sm" variant="outline" className="w-full" disabled>
                              已满
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full bg-primary text-white"
                              onClick={() => handleBook(course.id)}
                            >
                              <CircleCheck size={14} color="#fff" className="mr-1" />
                              立即预约
                            </Button>
                          )}
                        </View>
                      </View>
                    </View>
                  </Card>
                ))
              )}
            </View>
          </TabsContent>

          {/* 我的预约 */}
          <TabsContent value="my">
            <View className="mt-4 pb-4 space-y-4">
              {loading ? (
                <>
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                </>
              ) : bookings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 flex flex-col items-center justify-center">
                    <Calendar size={48} color="#B2BEC3" />
                    <Text className="block text-muted-foreground text-sm mt-4 text-center">
                      暂无预约记录
                    </Text>
                  </CardContent>
                </Card>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-4">
                      {booking.course ? (
                        <View className="flex items-center gap-3">
                          <Image
                            src={booking.course.image}
                            className="w-16 h-16 rounded-lg object-cover"
                            mode="aspectFill"
                          />
                          <View className="flex-1">
                            <Text className="block text-base font-bold text-foreground">
                              {booking.course.name}
                            </Text>
                            <Text className="block text-xs text-muted-foreground mt-1">
                              教练：{booking.course.coach_name}
                            </Text>
                            <Text className="block text-xs text-muted-foreground mt-1">
                              {formatTime(booking.course.start_time)}
                            </Text>
                          </View>
                          <View className="flex flex-col items-end gap-2">
                            <Badge variant={booking.status === 1 ? 'default' : 'secondary'}>
                              {booking.status === 1 ? '已预约' : '已取消'}
                            </Badge>
                            {booking.status === 1 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancel(booking.course_id)}
                              >
                                取消
                              </Button>
                            )}
                          </View>
                        </View>
                      ) : (
                        <Text className="block text-sm text-muted-foreground">
                          课程信息已删除
                        </Text>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </View>
          </TabsContent>
        </Tabs>
      </View>
    </View>
  )
}

export default CoursePage
