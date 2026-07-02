const api = require('../../utils/api')
const { POINTS_TYPE_LABEL, POINTS_TYPE_ICON } = require('../../utils/constants')
const { formatDate } = require('../../utils/util')

Page({
  data: {
    balance: 0, flows: [], page: 1, hasMore: true, loadStatus: 'more',
    activeTab: 'all',
    tabs: [
      { key: 'all', name: '全部' }, { key: 'earned', name: '获得' },
      { key: 'spent', name: '消费' }, { key: 'expired', name: '过期' }
    ]
  },

  onLoad() { this.loadBalance(); this.loadFlows() },

  async loadBalance() {
    try { const res = await api.points.getBalance(); this.setData({ balance: res.totalPoints || res.availablePoints || 0 }) } catch (e) {}
  },

  async loadFlows() {
    this.setData({ loadStatus: 'loading' })
    try {
      const res = await api.points.getFlow(this.data.page, 20, this.data.activeTab)
      const list = (res.list || []).map(item => ({
        ...item,
        icon: POINTS_TYPE_ICON[item.type] || '⭐',
        desc: POINTS_TYPE_LABEL[item.type] || item.description || '积分变动',
        dateStr: formatDate(item.createdAt, 'MM-DD HH:mm'),
        isPositive: item.status === 'earned',
        pointsStr: (item.status === 'earned' ? '+' : '') + item.points
      }))
      const flows = this.data.flows.concat(list)
      this.setData({
        flows, page: this.data.page + 1,
        hasMore: res.hasMore !== false,
        loadStatus: res.hasMore === false ? 'nomore' : 'more'
      })
    } catch (e) { this.setData({ loadStatus: 'more' }) }
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key
    if (key === this.data.activeTab) return
    this.setData({ activeTab: key, page: 1, flows: [], hasMore: true, loadStatus: 'more' })
    this.loadFlows()
  },

  onReachBottom() { if (this.data.hasMore) this.loadFlows() }
})
