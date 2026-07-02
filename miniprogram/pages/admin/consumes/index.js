const api = require('../../../../utils/api')
const { formatDate, formatMoney } = require('../../../../utils/util')

Page({
  data: { records: [], page: 1, hasMore: true, loadStatus: 'more', todayTotal: '0.00', monthTotal: '0.00', startDate: '', endDate: '' },

  onLoad() { this.loadRecords() },

  async loadRecords() {
    this.setData({ loadStatus: 'loading' })
    try {
      const res = await api.admin.getAdminConsumes(this.data.page, this.data.startDate, this.data.endDate)
      const list = this.data.records.concat((res.list || []).map(r => ({
        ...r, dateStr: formatDate(r.createdAt, 'MM-DD HH:mm'), amountStr: formatMoney(r.amount),
        actualStr: formatMoney(r.actualPayment),
        memberName: r.member ? r.member.nickname : '', memberPhone: r.member ? r.member.phone : '',
        pointsStr: r.pointsUsed ? r.pointsUsed + '积分(-¥' + formatMoney(r.pointsDeductAmount) + ')' : ''
      })))
      const now = new Date()
      let todayTotal = 0, monthTotal = 0
      list.forEach(r => {
        const d = new Date((r.createdAt || '').replace(/-/g, '/'))
        if (d.toDateString() === now.toDateString()) todayTotal += (r.amount || 0)
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) monthTotal += (r.amount || 0)
      })
      this.setData({ records: list, page: this.data.page + 1, hasMore: res.hasMore !== false, loadStatus: res.hasMore === false ? 'nomore' : 'more', todayTotal: formatMoney(todayTotal), monthTotal: formatMoney(monthTotal) })
    } catch (e) { this.setData({ loadStatus: 'more' }) }
  },

  onDateChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value, records: [], page: 1, hasMore: true })
    this.loadRecords()
  },

  exportData() {
    api.admin.exportData('consumes').then(res => {
      wx.setClipboardData({ data: res.downloadUrl, success: () => wx.showToast({ title: '下载链接已复制', icon: 'success' }) })
    }).catch(() => {})
  },

  onReachBottom() { if (this.data.hasMore) this.loadRecords() }
})
