function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (typeof date === 'string') date = new Date(date.replace(/-/g, '/'))
  if (!(date instanceof Date)) date = new Date(date)
  const map = {
    'YYYY': date.getFullYear(),
    'MM': String(date.getMonth() + 1).padStart(2, '0'),
    'DD': String(date.getDate()).padStart(2, '0'),
    'HH': String(date.getHours()).padStart(2, '0'),
    'mm': String(date.getMinutes()).padStart(2, '0'),
    'ss': String(date.getSeconds()).padStart(2, '0')
  }
  let result = format
  Object.keys(map).forEach(key => { result = result.replace(key, map[key]) })
  return result
}

function formatMoney(amount) {
  return Number(amount || 0).toFixed(2)
}

function formatPoints(points) {
  return String(points || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone || ''
  return phone.substring(0, 3) + '****' + phone.substring(7)
}

function showToast(title, icon = 'none') {
  wx.showToast({ title, icon, duration: 2000 })
}

function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true })
}

function hideLoading() {
  wx.hideLoading()
}

function showConfirm(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title, content,
      confirmColor: '#D4A843',
      success: (res) => resolve(res.confirm)
    })
  })
}

function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

function throttle(fn, delay = 300) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= delay) { last = now; fn.apply(this, args) }
  }
}

function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

function copyToClipboard(text) {
  wx.setClipboardData({
    data: text,
    success: () => showToast('已复制到剪贴板')
  })
}

function generateShareParams(memberCode) {
  return {
    title: '来加入我们，享受专属会员权益！',
    path: '/miniprogram/pages/index/index?referralCode=' + (memberCode || '')
  }
}

module.exports = {
  formatDate, formatMoney, formatPoints, maskPhone,
  showToast, showLoading, hideLoading, showConfirm,
  debounce, throttle, validatePhone, copyToClipboard, generateShareParams
}
