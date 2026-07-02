const api = require('../../../../utils/api')
const { formatDate } = require('../../../../utils/util')

Page({
  data: {
    verifications: [], page: 1, hasMore: true, loadStatus: 'more',
    showForm: false, form: { memberPhone: '', points: '', items: '', remark: '' },
    todayCount: 0
  },

  onLoad() { this.loadList() },

  async loadList() {
    this.setData({ loadStatus: 'loading' })
    try {
      const res = await api.admin.getPointsVerifications(this.data.page)
      const now = new Date()
      let todayCount = 0
      const list = this.data.verifications.concat((res.list || []).map(v => {
        const d = new Date((v.createdAt || '').replace(/-/g, '/'))
        if (d.toDateString() === now.toDateString()) todayCount++
        return { ...v, dateStr: formatDate(v.createdAt, 'MM-DD HH:mm'), memberName: v.memberName || '', memberPhone: v.memberPhone || '' }
      }))
      this.setData({ verifications: list, page: this.data.page + 1, hasMore: res.hasMore !== false, loadStatus: res.hasMore === false ? 'nomore' : 'more', todayCount: this.data.todayCount + todayCount })
    } catch (e) { this.setData({ loadStatus: 'more' }) }
  },

  showForm() { this.setData({ showForm: true }) },
  hideForm() { this.setData({ showForm: false, form: { memberPhone: '', points: '', items: '', remark: '' } }) },

  onInput(e) { this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value }) },

  scanCode() {
    wx.scanCode({
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        const parts = (res.result || '').split(':')
        if (parts.length >= 2) this.setData({ 'form.memberPhone': parts[1] })
        else this.setData({ 'form.memberPhone': res.result })
      }
    })
  },

  async submitVerify() {
    const { memberPhone, points, items, remark } = this.data.form
    if (!memberPhone) { wx.showToast({ title: '请输入会员手机号', icon: 'none' }); return }
    if (!points || parseInt(points) <= 0) { wx.showToast({ title: '请输入有效积分数', icon: 'none' }); return }
    try {
      await api.admin.verifyPoints({ memberPhone, points: parseInt(points), items, remark })
      wx.showToast({ title: '核销成功', icon: 'success' })
      this.hideForm()
      this.setData({ verifications: [], page: 1, hasMore: true })
      this.loadList()
    } catch (e) {}
  },

  onReachBottom() { if (this.data.hasMore) this.loadList() }
})
