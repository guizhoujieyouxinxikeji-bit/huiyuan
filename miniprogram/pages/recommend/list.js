const api = require('../../utils/api')
const { formatDate } = require('../../utils/util')

Page({
  data: { list: [], page: 1, hasMore: true, loadStatus: 'more', total: 0, totalReward: 0 },

  onLoad() { this.loadList() },

  async loadList() {
    this.setData({ loadStatus: 'loading' })
    try {
      const res = await api.recommend.getList(this.data.page)
      const list = this.data.list.concat((res.list || []).map(item => ({
        ...item,
        phoneMasked: item.phone || '',
        dateStr: formatDate(item.bindAt, 'YYYY-MM-DD'),
        rewardStr: item.totalRewardEarned || 0
      })))
      let totalReward = 0
      list.forEach(r => totalReward += (r.totalRewardEarned || 0))
      this.setData({
        list, page: this.data.page + 1,
        hasMore: res.hasMore !== false,
        loadStatus: res.hasMore === false ? 'nomore' : 'more',
        total: list.length, totalReward
      })
    } catch (e) { this.setData({ loadStatus: 'more' }) }
  },

  onReachBottom() { if (this.data.hasMore) this.loadList() }
})
