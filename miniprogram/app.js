App({
  onLaunch() {
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = systemInfo
    this.globalData.statusBarHeight = systemInfo.statusBarHeight
    this.globalData.navBarHeight = 44
    this.checkLogin()
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    if (!token) return
    this.globalData.token = token
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) this.globalData.userInfo = userInfo
    this.verifyToken(token)
  },

  verifyToken(token) {
    wx.request({
      url: this.globalData.baseUrl + '/auth/verify',
      header: { 'Authorization': 'Bearer ' + token },
      success: (res) => {
        if (res.data && res.data.code !== 0) {
          this.clearLoginState()
        }
      },
      fail: () => {}
    })
  },

  clearLoginState() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    this.globalData.token = ''
    this.globalData.userInfo = null
  },

  checkAdmin() {
    const userInfo = this.globalData.userInfo
    if (!userInfo) return false
    return userInfo.role === 'admin' || userInfo.role === 'manager'
  },

  globalData: {
    baseUrl: 'https://your-api-domain.com/api/v1',
    userInfo: null,
    token: '',
    systemInfo: null,
    statusBarHeight: 0,
    navBarHeight: 44,
    memberLevels: {
      bronze: { name: '普通会员', min: 0, max: 999, emoji: '🥉' },
      silver: { name: '银卡会员', min: 1000, max: 4999, emoji: '🥈' },
      gold: { name: '金卡会员', min: 5000, max: 19999, emoji: '🥇' },
      diamond: { name: '钻石会员', min: 20000, max: Infinity, emoji: '💎' }
    }
  }
})