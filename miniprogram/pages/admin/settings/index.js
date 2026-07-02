const api = require('../../../../utils/api')

Page({
  data: {
    settings: {
      rechargeBonusRate: 10,
      referralRechargeRewardRate: 10,
      referralConsumeRewardRate: 10,
      pointsDeductRate: 1,
      maxReferralRewardPerMonth: 5000,
      pointsValidityDays: 365,
      refundDeductPoints: true,
      excludedItems: ''
    },
    saving: false
  },

  onLoad() { this.loadSettings() },

  async loadSettings() {
    try {
      const s = await api.admin.getSettings()
      this.setData({
        settings: {
          rechargeBonusRate: Math.round((s.rechargeBonusRate || 0.1) * 100),
          referralRechargeRewardRate: Math.round((s.referralRechargeRewardRate || 0.1) * 100),
          referralConsumeRewardRate: Math.round((s.referralConsumeRewardRate || 0.1) * 100),
          pointsDeductRate: s.pointsDeductRate || 1,
          maxReferralRewardPerMonth: s.maxReferralRewardPerMonth || 5000,
          pointsValidityDays: s.pointsValidityDays || 365,
          refundDeductPoints: s.refundDeductPoints !== false,
          excludedItems: Array.isArray(s.excludedItems) ? s.excludedItems.join(', ') : (s.excludedItems || '')
        }
      })
    } catch (e) {}
  },

  onInput(e) { this.setData({ ['settings.' + e.currentTarget.dataset.field]: e.detail.value }) },

  onSwitch(e) { this.setData({ ['settings.' + e.currentTarget.dataset.field]: e.detail.value }) },

  async saveSettings() {
    if (this.data.saving) return
    this.setData({ saving: true })
    const s = this.data.settings
    try {
      await api.admin.updateSettings({
        rechargeBonusRate: s.rechargeBonusRate / 100,
        referralRechargeRewardRate: s.referralRechargeRewardRate / 100,
        referralConsumeRewardRate: s.referralConsumeRewardRate / 100,
        pointsDeductRate: parseInt(s.pointsDeductRate),
        maxReferralRewardPerMonth: parseInt(s.maxReferralRewardPerMonth),
        pointsValidityDays: parseInt(s.pointsValidityDays),
        refundDeductPoints: s.refundDeductPoints,
        excludedItems: s.excludedItems ? s.excludedItems.split(/[,，]/).map(s => s.trim()).filter(Boolean) : []
      })
      wx.showToast({ title: '保存成功', icon: 'success' })
    } catch (e) {} finally { this.setData({ saving: false }) }
  },

  resetDefault() {
    wx.showModal({
      title: '恢复默认', content: '确定恢复所有设置为默认值？', confirmColor: '#D4A843',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            settings: { rechargeBonusRate: 10, referralRechargeRewardRate: 10, referralConsumeRewardRate: 10, pointsDeductRate: 1, maxReferralRewardPerMonth: 5000, pointsValidityDays: 365, refundDeductPoints: true, excludedItems: '' }
          })
          wx.showToast({ title: '已恢复默认', icon: 'success' })
        }
      }
    })
  }
})
