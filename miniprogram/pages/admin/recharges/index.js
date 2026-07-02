const api = require('../../../../utils/api')
const { formatDate, formatMoney } = require('../../../../utils/util')
const { RECHARGE_STATUS_LABEL } = require('../../../../utils/constants')

Page({
  data: {
    records: [], page: 1, hasMore: true, loadStatus: 'more', activeFilter: 'all',
    filters: [{ key: 'all', name: '全部' }, { key: 'success', name: '成功' }, { key: 'pending', name: '待支付' }, { key: 'refunded', name: '已退款' }],
    totalAmount: 0, totalCount: 0
  },

  onLoad() { this.loadRecords() },

  async loadRecords() {
    this.setData({ loadStatus: 'loading' })
    try {
      const res = await api.admin.getAdminRecharges(this.data.page, this.data.activeFilter)
      const list = this.data.records.concat((res.list || []).map(r => ({
        ...r, dateStr: formatDate(r.createdAt, 'MM-DD HH:mm'),
        amountStr: formatMoney(r.amount), statusText: RECHARGE_STATUS_LABEL[r.status] || r.status,
        memberName: r.member ? r.member.nickname : '', memberPhone: r.member ? r.member.phone : ''
      })))
      let total = 0; list.forEach(r => { if (r.status === 'success') total += (r.amount || 0) })
      this.setData({ records: list, page: this.data.page + 1, hasMore: res.hasMore !== false, loadStatus: res.hasMore === false ? 'nomore' : 'more', totalAmount: formatMoney(total), totalCount: list.length })
    } catch (e) { this.setData({ loadStatus: 'more' }) }
  },

  switchFilter(e) {
    const key = e.currentTarget.dataset.key
    if (key === this.data.activeFilter) return
    this.setData({ activeFilter: key, records: [], page: 1, hasMore: true })
    this.loadRecords()
  },

  exportData() {
    api.admin.exportData('recharges').then(res => {
      wx.setClipboardData({ data: res.downloadUrl, success: () => wx.showToast({ title: '下载链接已复制', icon: 'success' }) })
    }).catch(() => {})
  },

  onReachBottom() { if (this.data.hasMore) this.loadRecords() }
})