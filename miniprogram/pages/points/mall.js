const api = require('../../utils/api')

Page({
  data: {
    balance: 0, items: [], activeCategory: 'all',
    categories: [{ key: 'all', name: '全部' }, { key: 'food', name: '餐品' }, { key: 'drink', name: '酒水' }, { key: 'special', name: '特惠' }]
  },

  onLoad() { this.loadBalance(); this.loadItems() },

  async loadBalance() {
    try { const res = await api.points.getBalance(); this.setData({ balance: res.totalPoints || 0 }) } catch (e) {}
  },

  async loadItems() {
    try {
      const res = await api.points.getMallItems()
      const items = (res.items || []).map(item => ({
        ...item,
        canRedeem: this.data.balance >= item.pointsCost,
        gradients: { food: 'linear-gradient(135deg,#3D2B1F,#5C4033)', drink: 'linear-gradient(135deg,#1B3A4B,#2E6B8A)', special: 'linear-gradient(135deg,#4A1942,#6B2D5B)' }
      }))
      this.setData({ items })
    } catch (e) {}
  },

  filterCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.key })
  },

  async redeemItem(e) {
    const item = e.currentTarget.dataset.item
    if (this.data.balance < item.pointsCost) { wx.showToast({ title: '积分不足', icon: 'none' }); return }
    wx.showModal({
      title: '确认兑换', content: '使用 ' + item.pointsCost + ' 积分兑换「' + item.name + '」？', confirmColor: '#D4A843',
      success: async (res) => {
        if (!res.confirm) return
        try {
          const result = await api.points.redeemMallItem({ itemId: item.id })
          wx.showToast({ title: '兑换成功！', icon: 'success' })
          this.setData({ balance: result.balanceAfter || (this.data.balance - item.pointsCost) })
          this.loadItems()
        } catch (e) {}
      }
    })
  }
})
