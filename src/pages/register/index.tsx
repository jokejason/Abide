import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Network } from '@/network'

const RegisterPage = () => {
  const router = useRouter()
  const isEdit = router.params.mode === 'edit'

  const [gender, setGender] = useState('0')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(false)

  const validateForm = (): boolean => {
    const ageNum = Number(age)
    if (!age || Number.isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
      Taro.showToast({ title: '请输入有效年龄（10-100）', icon: 'none' })
      return false
    }
    const heightNum = Number(height)
    if (!height || Number.isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      Taro.showToast({ title: '请输入有效身高（100-250cm）', icon: 'none' })
      return false
    }
    const weightNum = Number(weight)
    if (!weight || Number.isNaN(weightNum) || weightNum < 30 || weightNum > 200) {
      Taro.showToast({ title: '请输入有效体重（30-200kg）', icon: 'none' })
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const url = isEdit ? '/api/user/update' : '/api/user/register'

      const res = await Network.request({
        url,
        method: 'POST',
        header: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          gender: Number(gender),
          age: Number(age),
          height: height,
          weight: weight,
        },
      })

      console.log('注册/更新响应:', res.data)

      if (res.data?.data) {
        Taro.setStorageSync('userInfo', res.data.data)
        Taro.showToast({
          title: isEdit ? '更新成功' : '注册成功',
          icon: 'success',
        })
        setTimeout(() => {
          if (isEdit) {
            Taro.navigateBack()
          } else {
            Taro.switchTab({ url: '/pages/index/index' })
          }
        }, 1000)
      } else {
        Taro.showToast({ title: res.data?.msg || '操作失败', icon: 'none' })
      }
    } catch (err) {
      console.error('提交失败:', err)
      Taro.showToast({ title: '网络错误，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-background px-4 py-6">
      <Text className="block text-foreground text-xl font-bold mb-2">
        {isEdit ? '编辑个人信息' : '完善个人信息'}
      </Text>
      <Text className="block text-muted-foreground text-sm mb-6">
        {isEdit ? '修改你的身体数据' : '填写基础信息，获得更精准的健身和饮食建议'}
      </Text>

      <Card>
        <CardContent className="p-4 space-y-6">
          {/* 性别选择 */}
          <View>
            <Label className="text-foreground text-sm font-medium mb-3 block">
              性别
            </Label>
            <RadioGroup value={gender} onValueChange={setGender}>
              <View className="flex gap-4">
                <View className="flex items-center gap-2">
                  <RadioGroupItem value="1" />
                  <Label className="text-foreground">男</Label>
                </View>
                <View className="flex items-center gap-2">
                  <RadioGroupItem value="2" />
                  <Label className="text-foreground">女</Label>
                </View>
              </View>
            </RadioGroup>
          </View>

          {/* 年龄 */}
          <View>
            <Label className="text-foreground text-sm font-medium mb-2 block">
              年龄
            </Label>
            <View className="bg-muted rounded-xl px-4 py-3">
              <Input
                id="age"
                className="w-full bg-transparent"
                type="number"
                placeholder="请输入年龄"
                value={age}
                onInput={(e) => setAge(e.detail.value)}
              />
            </View>
          </View>

          {/* 身高 */}
          <View>
            <Label className="text-foreground text-sm font-medium mb-2 block">
              身高 (cm)
            </Label>
            <View className="bg-muted rounded-xl px-4 py-3">
              <Input
                id="height"
                className="w-full bg-transparent"
                type="digit"
                placeholder="请输入身高"
                value={height}
                onInput={(e) => setHeight(e.detail.value)}
              />
            </View>
          </View>

          {/* 体重 */}
          <View>
            <Label className="text-foreground text-sm font-medium mb-2 block">
              体重 (kg)
            </Label>
            <View className="bg-muted rounded-xl px-4 py-3">
              <Input
                id="weight"
                className="w-full bg-transparent"
                type="digit"
                placeholder="请输入体重"
                value={weight}
                onInput={(e) => setWeight(e.detail.value)}
              />
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 提交按钮 */}
      <View className="mt-6">
        <Button
          className="w-full bg-primary text-primary-foreground h-12"
          onClick={handleSubmit}
          disabled={loading}
        >
          <Text>{loading ? '提交中...' : isEdit ? '保存修改' : '完成注册'}</Text>
        </Button>
      </View>
    </View>
  )
}

export default RegisterPage
