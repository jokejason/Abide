export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '零健身',
    })
  : { navigationBarTitleText: '零健身' }
