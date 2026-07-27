export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '课程预约',
    })
  : { navigationBarTitleText: '课程预约' }
