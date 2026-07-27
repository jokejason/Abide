export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '完善信息',
    })
  : { navigationBarTitleText: '完善信息' }
