const api = require('../../utils/api')
const { isAdmin: checkAdmin } = require('../../utils/auth')
const { getMemberLevel, MEMBER_LEVEL } = require('../../utils/constants')

Page({
  data: {
    userInfo: null, memberInfo: null, levelInfo: null, isAdmin: false,
    menuGroups: [
      { title: '交易记录', items: [
        { icon: '💰', name: '我的充值', url: '/miniprogram/pages/recharge/record' },
        { icon: '🧾', name: '消费记录', url: '/miniprogram/pages/consume-record/index' },
        { icon: '⭐', name: '积分明细', url: '/miniprogram/pages/points/index' },
        { icon: '🛍️', name: '积分商城', url: '/miniprogram/pages/points/mall' }
      ]},
      { title: '推荐中心', items: [
        { icon: '🎁', name: '推荐有礼', url: '/miniprogram/pages/recommend/index' },
        { icon: '👥', name: '我的推荐', url: '/miniprogram/pages/recommend/list' }
      ]},
      { title: '更多', items: [
        { icon: '📞', name: '联系客服', action: 'contact' },
        { icon: 'ℹ️', name: '关于我们', action: 'about' }
      ]}
    ]
  },

  onShow() { this.loadUserInfo() },

  async loadUserInfo() {
    try {
      const info = await api.member.getMemberInfo()
      const level = getMemberLevel(info.totalRecharge || 0)
      this.setData({
        memberInfo: info,
        levelInfo: { ...MEMBER_LEVEL[level], key: level },
        isAdmin: checkAdmin()
      })
    } catch (e) { console.error(e) }
  },

  navigateTo(e) {
    const { url, action } = e.currentTarget.dataset
    if (action === 'contact') { wx.makePhoneCall({ phoneNumber: '400-000-0000' }); return }
    if (action === 'about') { wx.showModal({ title: '关于我们', content: '餐饮门店会员管理系统 v1.0', showCancel: false, confirmColor: '#D4A843' }); return }
    wx.navigateTo({ url, fail: () => wx.switchTab({ url }) })
  },

  goAdmin() { wx.navigateTo({ url: '/miniprogram/pages/admin/index' }) },

  handleLogout() {
    wx.showModal({
      title: '退出登录', content: '确定要退出登录吗？', confirmColor: '#D4A843',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          wx.reLaunch({ url: '/miniprogram/pages/index/index' })
        }
      }
    })
  }
})