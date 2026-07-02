const api = require('../../../utils/api')

Page({
  data: {
    dashboard: null,
    menuItems: [
      { icon: '👥', name: '会员管理', url: '/miniprogram/pages/admin/members/index' },
      { icon: '🔗', name: '推荐关系', url: '/miniprogram/pages/admin/referrals/index' },
      { icon: '💰', name: '充值记录', url: '/miniprogram/pages/admin/recharges/index' },
      { icon: '🧾', name: '消费记录', url: '/miniprogram/pages/admin/consumes/index' },
      { icon: '⭐', name: '积分流水', url: '/miniprogram/pages/admin/points-flow/index' },
      { icon: '✅', name: '积分核销', url: '/miniprogram/pages/admin/points-verify/index' },
      { icon: '⚙️', name: '系统设置', url: '/miniprogram/pages/admin/settings/index' }
    ]
  },

  onShow() { this.loadDashboard() },

  async loadDashboard() {
    try { const data = await api.admin.getDashboard(); this.setData({ dashboard: data }) } catch (e) {}
  },

  navigateTo(e) { wx.navigateTo({ url: e.currentTarget.dataset.url }) },

  exportData() {
    wx.showActionSheet({
      itemList: ['导出会员数据', '导出充值记录', '导出消费记录', '导出积分流水'],
      success: async (res) => {
        const types = ['members', 'recharges', 'consumes', 'points_flow']
        try {
          const data = await api.admin.exportData(types[res.tapIndex])
          wx.setClipboardData({ data: data.downloadUrl, success: () => wx.showToast({ title: '下载链接已复制', icon: 'success' }) })
        } catch (e) {}
      }
    })
  }
})