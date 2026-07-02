const api = require('../../../../utils/api')
const { formatDate } = require('../../../../utils/util')
const { POINTS_TYPE_LABEL } = require('../../../../utils/constants')

Page({
  data: {
    flows: [], page: 1, hasMore: true, loadStatus: 'more', activeTab: 'all',
    tabs: [{ key: 'all', name: '全部' }, { key: 'recharge_bonus', name: '充值赠送' }, { key: 'referral_recharge', name: '推荐充值' }, { key: 'referral_consume', name: '推荐消费' }, { key: 'consume_deduct', name: '消费抵扣' }, { key: 'admin_adjust', name: '管理调整' }],
    todayIssued: 0, todayConsumed: 0, todayExpired: 0
  },

  onLoad() { this.loadFlows() },

  async loadFlows() {
    this.setData({ loadStatus: 'loading' })
    try {
      const res = await api.admin.getPointsFlows(this.data.page, this.data.activeTab)
      const colors = { recharge_bonus: '#D4A843', referral_recharge: '#2ECC71', referral_consume: '#3498DB', consume_deduct: '#E74C3C', admin_adjust: '#888' }
      const list = this.data.flows.concat((res.list || []).map(f => ({
        ...f, dateStr: formatDate(f.createdAt, 'MM-DD HH:mm'),
        typeLabel: POINTS_TYPE_LABEL[f.type] || f.type,
        typeColor: colors[f.type] || '#888',
        isPositive: f.status === 'earned',
        pointsStr: (f.status === 'earned' ? '+' : '') + f.points,
        memberName: f.member ? f.member.nickname : '', memberPhone: f.member ? f.member.phone : ''
      })))
      this.setData({ flows: list, page: this.data.page + 1, hasMore: res.hasMore !== false, loadStatus: res.hasMore === false ? 'nomore' : 'more' })
    } catch (e) { this.setData({ loadStatus: 'more' }) }
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key
    if (key === this.data.activeTab) return
    this.setData({ activeTab: key, flows: [], page: 1, hasMore: true })
    this.loadFlows()
  },

  exportData() {
    api.admin.exportData('points_flow').then(res => {
      wx.setClipboardData({ data: res.downloadUrl, success: () => wx.showToast({ title: '下载链接已复制', icon: 'success' }) })
    }).catch(() => {})
  },

  onReachBottom() { if (this.data.hasMore) this.loadFlows() }
})
