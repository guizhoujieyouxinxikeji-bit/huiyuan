const api = require('../../../../utils/api')
const { formatDate } = require('../../../../utils/util')

Page({
  data: { list: [], page: 1, hasMore: true, loadStatus: 'more', totalPairs: 0, monthNew: 0 },

  onLoad() { this.loadList() },

  async loadList() {
    this.setData({ loadStatus: 'loading' })
    try {
      const res = await api.admin.getReferrals(this.data.page)
      const list = this.data.list.concat((res.list || []).map(item => ({
        ...item, dateStr: formatDate(item.bindAt, 'YYYY-MM-DD'),
        referrerPhone: item.referrer ? item.referrer.phone : '',
        referredPhone: item.referred ? item.referred.phone : ''
      })))
      this.setData({ list, page: this.data.page + 1, hasMore: res.hasMore !== false, loadStatus: res.hasMore === false ? 'nomore' : 'more', totalPairs: (res.total || list.length) })
    } catch (e) { this.setData({ loadStatus: 'more' }) }
  },

  onReachBottom() { if (this.data.hasMore) this.loadList() }
})