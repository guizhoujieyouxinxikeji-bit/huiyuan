const api = require('../../utils/api')
const { getMemberLevel, MEMBER_LEVEL } = require('../../utils/constants')

Page({
  data: {
    userInfo: null,
    memberInfo: null,
    levelInfo: null,
    recentActivities: [],
    quickActions: [
      { icon: '💰', name: '储值充值', url: '/miniprogram/pages/recharge/index' },
      { icon: '⭐', name: '积分明细', url: '/miniprogram/pages/points/index' },
      { icon: '🎁', name: '推荐有礼', url: '/miniprogram/pages/recommend/index' },
      { icon: '🧾', name: '消费记录', url: '/miniprogram/pages/consume-record/index' }
    ]
  },

  onLoad() { this.loadMemberInfo() },

  onShow() {
    if (this.data.memberInfo) this.loadMemberInfo()
  },

  onPullDownRefresh() {
    this.loadMemberInfo().then(() => wx.stopPullDownRefresh())
  },

  async loadMemberInfo() {
    try {
      const info = await api.member.getMemberInfo()
      const level = getMemberLevel(info.totalRecharge || 0)
      const levelInfo = MEMBER_LEVEL[level]
      this.setData({ memberInfo: info, levelInfo: { ...levelInfo, key: level }, recentActivities: info.recentActivities || [] })
    } catch (e) { console.error('loadMemberInfo failed', e) }
  },

  navigateTo(e) {
    const url = e.currentTarget.dataset.url
    wx.navigateTo({ url, fail: () => wx.switchTab({ url }) })
  },

  onShareAppMessage() {
    const code = this.data.memberInfo ? this.data.memberInfo.memberCode : ''
    return { title: '尊享会员 - 专属权益等你来享', path: '/miniprogram/pages/index/index?referralCode=' + code }
  }
})