export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '训练记录',
    })
  : { navigationBarTitleText: '训练记录' }
