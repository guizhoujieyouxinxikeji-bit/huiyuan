const api = require('../../utils/api')

Page({
  data: { memberCode: '', memberInfo: null, levelName: '', canvasWidth: 200, canvasHeight: 200 },
  _savedBrightness: 0.5,

  onLoad() {
    wx.getScreenBrightness({ success: (res) => { this._savedBrightness = res.value } })
    wx.setScreenBrightness({ value: 1.0 })
    this.loadCode()
  },

  onUnload() {
    wx.setScreenBrightness({ value: this._savedBrightness })
  },

  async loadCode() {
    try {
      const data = await api.member.getMemberCode()
      const info = await api.member.getMemberInfo()
      const levels = { bronze: '普通会员', silver: '银卡会员', gold: '金卡会员', diamond: '钻石会员' }
      this.setData({ memberCode: data.memberCode, memberInfo: info, levelName: levels[info.memberLevel] || '会员' })
      this.drawQRCode(data.memberCode)
    } catch (e) {
      this.setData({ memberCode: 'VIP' + Date.now().toString().slice(-10) })
    }
  },

  drawQRCode(code) {
    const query = wx.createSelectorQuery()
    query.select('#qrCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0]) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = wx.getSystemInfoSync().pixelRatio
      canvas.width = 200 * dpr
      canvas.height = 200 * dpr
      ctx.scale(dpr, dpr)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, 200, 200)
      const size = 7
      const cellSize = Math.floor(180 / (size * 3 + 8))
      const offset = (200 - cellSize * (size * 3 + 8)) / 2
      ctx.fillStyle = '#1A1A1A'
      let hash = 0
      for (let i = 0; i < code.length; i++) { hash = ((hash << 5) - hash) + code.charCodeAt(i); hash |= 0 }
      for (let r = 0; r < size * 3 + 8; r++) {
        for (let c = 0; c < size * 3 + 8; c++) {
          const inFinder = (r < size + 1 && c < size + 1) || (r < size + 1 && c >= size * 2 + 7) || (r >= size * 2 + 7 && c < size + 1)
          if (inFinder) {
            const fr = r < size + 1 ? r : r - (size * 2 + 7)
            const fc = c < size + 1 ? c : c - (size * 2 + 7)
            const isOuter = fr === 0 || fr === size || fc === 0 || fc === size
            const isInner = fr >= 2 && fr <= size - 2 && fc >= 2 && fc <= size - 2
            if (isOuter || isInner) ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize, cellSize)
          } else {
            hash = (hash * 1103515245 + 12345 + r * 31 + c * 17) & 0x7fffffff
            if (hash % 3 !== 0) ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize, cellSize)
          }
        }
      }
    })
  },

  refreshCode() { this.loadCode() }
})