const api = require('../../../../utils/api')
const { formatDate, maskPhone } = require('../../../../utils/util')
const { MEMBER_LEVEL, getMemberLevel } = require('../../../../utils/constants')

Page({
  data: { members: [], keyword: '', page: 1, hasMore: true, loadStatus: 'more', showDetail: false, selectedMember: null },

  onLoad() { this.loadMembers() },

  async loadMembers() {
    this.setData({ loadStatus: 'loading' })
    try {
      const res = await api.admin.getMembers(this.data.page, this.data.keyword)
      const list = this.data.members.concat((res.list || []).map(m => ({
        ...m, phoneMasked: maskPhone(m.phone), dateStr: formatDate(m.createdAt, 'YYYY-MM-DD'),
        levelInfo: MEMBER_LEVEL[getMemberLevel(m.totalRecharge || 0)]
      })))
      this.setData({ members: list, page: this.data.page + 1, hasMore: res.hasMore !== false, loadStatus: res.hasMore === false ? 'nomore' : 'more' })
    } catch (e) { this.setData({ loadStatus: 'more' }) }
  },

  onInputChange(e) { this.setData({ keyword: e.detail.value }) },

  onSearch() { this.setData({ members: [], page: 1, hasMore: true }); this.loadMembers() },

  viewDetail(e) { this.setData({ selectedMember: e.currentTarget.dataset.item, showDetail: true }) },

  closeDetail() { this.setData({ showDetail: false }) },

  onReachBottom() { if (this.data.hasMore) this.loadMembers() }
})