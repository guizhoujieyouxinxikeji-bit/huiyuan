const api = require('../../utils/api')

Page({
  data: {
    packages: [
      { id: 'p1', amount: 100, bonus: 10, label: '充100送10积分', tag: '' },
      { id: 'p2', amount: 300, bonus: 30, label: '充300送30积分', tag: '推荐' },
      { id: 'p3', amount: 500, bonus: 50, label: '充500送50积分', tag: '热门' },
      { id: 'p4', amount: 1000, bonus: 100, label: '充1000送100积分', tag: '超值' },
      { id: 'p5', amount: 2000, bonus: 200, label: '充2000送200积分', tag: '尊享' },
      { id: 'p6', amount: 5000, bonus: 500, label: '充5000送500积分', tag: '钻石' }
    ],
    selectedId: '', customAmount: '', customBonus: 0,
    balance: 0, agreeTerms: false, submitting: false
  },

  onLoad() { this.loadData() },

  async loadData() {
    try {
      const [pkgs, info] = await Promise.all([api.recharge.getPackages(), api.member.getMemberInfo()])
      if (pkgs && pkgs.packages) {
        this.setData({
          packages: pkgs.packages.map(p => ({
            id: p.id, amount: p.amount, bonus: p.bonusPoints,
            label: p.label, tag: p.tag || ''
          }))
        })
      }
      this.setData({ balance: info.balance || 0 })
    } catch (e) {}
  },

  selectPkg(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ selectedId: this.data.selectedId === id ? '' : id, customAmount: '', customBonus: 0 })
  },

  onCustomInput(e) {
    const val = parseFloat(e.detail.value) || 0
    this.setData({ customAmount: e.detail.value, customBonus: Math.floor(val * 10), selectedId: '' })
  },

  toggleAgree() { this.setData({ agreeTerms: !this.data.agreeTerms }) },

  getSubmitAmount() {
    if (this.data.selectedId) {
      const pkg = this.data.packages.find(p => p.id === this.data.selectedId)
      return pkg ? pkg.amount : 0
    }
    return parseFloat(this.data.customAmount) || 0
  },

  async submitRecharge() {
    const amount = this.getSubmitAmount()
    if (amount < 10) { wx.showToast({ title: '最低充值10元', icon: 'none' }); return }
    if (!this.data.agreeTerms) { wx.showToast({ title: '请先同意储值协议', icon: 'none' }); return }
    if (this.data.submitting) return
    this.setData({ submitting: true })
    try {
      const res = await api.recharge.createRecharge({ amount, paymentMethod: 'wechat' })
      if (res && res.paymentParams) {
        wx.requestPayment({
          ...res.paymentParams,
          success: () => {
            wx.showToast({ title: '充值成功！', icon: 'success' })
            setTimeout(() => wx.navigateTo({ url: '/miniprogram/pages/recharge/record' }), 1500)
          },
          fail: () => wx.showToast({ title: '支付取消', icon: 'none' })
        })
      } else {
        wx.showToast({ title: '充值成功！', icon: 'success' })
      }
    } catch (e) {} finally { this.setData({ submitting: false }) }
  }
})
