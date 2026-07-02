Component({
  options: { component: true },
  properties: {
    points: { type: Number, value: 0 },
    label: { type: String, value: '当前积分' },
    showTrend: { type: Boolean, value: false },
    trend: { type: Number, value: 0 }
  },
  data: { formattedPoints: '0', trendText: '', trendColor: '' },
  observers: {
    'points': function (v) { this.setData({ formattedPoints: String(v || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }) },
    'trend': function (v) {
      if (v > 0) this.setData({ trendText: '+' + v, trendColor: '#2ECC71' })
      else if (v < 0) this.setData({ trendText: '' + v, trendColor: '#E74C3C' })
      else this.setData({ trendText: '', trendColor: '' })
    }
  }
})
