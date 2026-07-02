Component({
  options: { component: true },
  properties: {
    title: { type: String, value: '' },
    back: { type: Boolean, value: false },
    bgColor: { type: String, value: '#1A1A1A' },
    color: { type: String, value: '#FFFFFF' }
  },
  data: { statusBarHeight: 20, navBarHeight: 44 },
  lifetimes: {
    attached() {
      const info = wx.getSystemInfoSync()
      this.setData({ statusBarHeight: info.statusBarHeight || 20, navBarHeight: 44 })
    }
  },
  methods: {
    goBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) { wx.navigateBack() }
      else { wx.switchTab({ url: '/miniprogram/pages/index/index' }) }
    }
  }
})
