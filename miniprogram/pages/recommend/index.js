const api = require('../../utils/api')

Page({
  data: {
    referralCode: '', stats: { totalReferrals: 0, totalRewardPoints: 0, monthRewardPoints: 0 },
    rules: [
      '好友通过您的推荐码注册即为推荐成功',
      '好友每次充值，您获得充值金额10%的积分奖励',
      '好友每次消费，您获得消费金额10%的积分奖励',
      '每月推荐奖励上限为5000积分',
      '积分有效期365天，仅限本店消费使用'
    ]
  },

  onLoad() { this.loadData() },

  async loadData() {
    try {
      const res = await api.recommend.getMyCode()
      this.setData({
        referralCode: res.referralCode,
        stats: {
          totalReferrals: res.totalReferrals || 0,
          totalRewardPoints: res.totalRewardPoints || 0,
          monthRewardPoints: res.monthRewardPoints || 0
        }
      })
    } catch (e) {}
  },

  copyCode() {
    wx.setClipboardData({ data: this.data.referralCode, success: () => wx.showToast({ title: '已复制推荐码', icon: 'success' }) })
  },

  onShareAppMessage() {
    return {
      title: '来加入我们，享受专属会员权益！',
      path: '/miniprogram/pages/index/index?referralCode=' + this.data.referralCode
    }
  },

  viewMyReferrals() { wx.navigateTo({ url: '/miniprogram/pages/recommend/list' }) }
})
