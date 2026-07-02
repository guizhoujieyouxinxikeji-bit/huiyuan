const api = require('../../utils/api')
const { RECHARGE_STATUS_LABEL } = require('../../utils/constants')
const { formatDate, formatMoney } = require('../../utils/util')

Page({
  data: { records: [], page: 1, hasMore: true, loadStatus: 'more', totalAmount: 0, totalCount: 0 },

  onLoad() { this.loadRecords() },

  async loadRecords() {
    if (!this.data.hasMore) return
    this.setData({ loadStatus: 'loading' })
    try {
      const res = await api.recharge.getRecords(this.data.page)
      const list = (res.list || []).map(item => ({
        ...item,
        dateStr: formatDate(item.createdAt, 'YYYY-MM-DD HH:mm'),
        amountStr: formatMoney(item.amount),
        statusText: RECHARGE_STATUS_LABEL[item.status] || item.status
      }))
      const records = this.data.records.concat(list)
      let total = 0
      records.forEach(r => { if (r.status === 'success') total += (r.amount || 0) })
      this.setData({
        records, page: this.data.page + 1,
        hasMore: res.hasMore !== false,
        loadStatus: res.hasMore === false ? 'nomore' : 'more',
        totalAmount: formatMoney(total), totalCount: records.length
      })
    } catch (e) { this.setData({ loadStatus: 'more' }) }
  },

  onReachBottom() { if (this.data.hasMore) this.loadRecords() }
})
