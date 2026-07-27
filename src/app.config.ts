export default typeof defineAppConfig === 'function'
  ? defineAppConfig({
      pages: [
        'pages/index/index',
        'pages/training/index',
        'pages/course/index',
        'pages/profile/index',
        'pages/login/index',
        'pages/register/index',
      ],
      window: {
        backgroundTextStyle: 'light',
        navigationBarBackgroundColor: '#00B894',
        navigationBarTitleText: 'Zero Fitness',
        navigationBarTextStyle: 'white',
      },
      tabBar: {
        color: '#999999',
        selectedColor: '#00B894',
        backgroundColor: '#ffffff',
        borderStyle: 'black',
        list: [
          {
            pagePath: 'pages/index/index',
            text: '首页',
            iconPath: './assets/tabbar/house.png',
            selectedIconPath: './assets/tabbar/house-active.png',
          },
          {
            pagePath: 'pages/training/index',
            text: '训练',
            iconPath: './assets/tabbar/dumbbell.png',
            selectedIconPath: './assets/tabbar/dumbbell-active.png',
          },
          {
            pagePath: 'pages/course/index',
            text: '课程',
            iconPath: './assets/tabbar/calendar.png',
            selectedIconPath: './assets/tabbar/calendar-active.png',
          },
          {
            pagePath: 'pages/profile/index',
            text: '我的',
            iconPath: './assets/tabbar/user.png',
            selectedIconPath: './assets/tabbar/user-active.png',
          },
        ],
      },
    })
  : {
      pages: [
        'pages/index/index',
        'pages/training/index',
        'pages/course/index',
        'pages/profile/index',
        'pages/login/index',
        'pages/register/index',
      ],
      window: {
        backgroundTextStyle: 'light',
        navigationBarBackgroundColor: '#00B894',
        navigationBarTitleText: '零健身',
        navigationBarTextStyle: 'white',
      },
      tabBar: {
        color: '#999999',
        selectedColor: '#00B894',
        backgroundColor: '#ffffff',
        borderStyle: 'black',
        list: [
          {
            pagePath: 'pages/index/index',
            text: '首页',
            iconPath: './assets/tabbar/house.png',
            selectedIconPath: './assets/tabbar/house-active.png',
          },
          {
            pagePath: 'pages/training/index',
            text: '训练',
            iconPath: './assets/tabbar/dumbbell.png',
            selectedIconPath: './assets/tabbar/dumbbell-active.png',
          },
          {
            pagePath: 'pages/course/index',
            text: '课程',
            iconPath: './assets/tabbar/calendar.png',
            selectedIconPath: './assets/tabbar/calendar-active.png',
          },
          {
            pagePath: 'pages/profile/index',
            text: '我的',
            iconPath: './assets/tabbar/user.png',
            selectedIconPath: './assets/tabbar/user-active.png',
          },
        ],
      },
    }
