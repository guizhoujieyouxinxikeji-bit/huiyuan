const api = require('../../utils/api')
const { formatDate, formatMoney } = require('../../utils/util')

Page({
  data: { records: [], page: 1, hasMore: true, loadStatus: 'more', monthTotal: '0.00' },

  onLoad() { this.loadRecords() },

  async loadRecords() {
    this.setData({ loadStatus: 'loading' })
    try {
      const res = await api.consume.getRecords(this.data.page)
      const list = this.data.records.concat((res.list || []).map(item => ({
        ...item,
        dateStr: formatDate(item.createdAt, 'MM-DD HH:mm'),
        amountStr: formatMoney(item.amount),
        pointsStr: item.pointsUsed ? '-' + item.pointsUsed + '积分抵扣' : '',
        actualStr: formatMoney(item.actualPayment),
        referrerStr: item.referrerReward ? '推荐人获得' + item.referrerReward.rewardPoints + '积分' : ''
      })))
      let monthTotal = 0
      const now = new Date()
      list.forEach(r => {
        const d = new Date((r.createdAt || '').replace(/-/g, '/'))
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) monthTotal += (r.amount || 0)
      })
      this.setData({
        records: list, page: this.data.page + 1,
        hasMore: res.hasMore !== false,
        loadStatus: res.hasMore === false ? 'nomore' : 'more',
        monthTotal: formatMoney(monthTotal)
      })
    } catch (e) { this.setData({ loadStatus: 'more' }) }
  },

  onReachBottom() { if (this.data.hasMore) this.loadRecords() }
})
