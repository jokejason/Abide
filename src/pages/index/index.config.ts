export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '禾页健康',
    })
  : { navigationBarTitleText: '禾页健康' }
