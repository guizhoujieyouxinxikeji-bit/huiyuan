const app = getApp()

function getBaseUrl() { return app.globalData.baseUrl }
function getToken() { return app.globalData.token || wx.getStorageSync('token') || '' }

function request(options) {
  return new Promise((resolve, reject) => {
    const { url, method = 'GET', data, showLoading: loading = false } = options
    if (loading) wx.showLoading({ title: '加载中...', mask: true })
    wx.request({
      url: getBaseUrl() + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      success(res) {
        if (loading) wx.hideLoading()
        if (res.statusCode === 401) {
          app.clearLoginState()
          wx.showToast({ title: '请重新登录', icon: 'none' })
          setTimeout(() => wx.reLaunch({ url: '/miniprogram/pages/index/index' }), 1500)
          reject(new Error('Unauthorized'))
          return
        }
        if (res.data && res.data.code === 0) {
          resolve(res.data.data)
        } else {
          const msg = (res.data && res.data.msg) || '请求失败'
          wx.showToast({ title: msg, icon: 'none' })
          reject(new Error(msg))
        }
      },
      fail(err) {
        if (loading) wx.hideLoading()
        wx.showToast({ title: '网络连接失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

function get(url, data) { return request({ url, method: 'GET', data }) }
function post(url, data) { return request({ url, method: 'POST', data }) }
function put(url, data) { return request({ url, method: 'PUT', data }) }
function del(url, data) { return request({ url, method: 'DELETE', data }) }

const auth = {
  login: (code, referralCode) => post('/auth/login', { code, referralCode }),
  getUserInfo: () => get('/auth/userinfo'),
  updateUserInfo: (data) => put('/auth/userinfo', data)
}

const member = {
  getMemberInfo: () => get('/member/info'),
  getMemberCode: () => get('/member/code')
}

const recharge = {
  getPackages: () => get('/recharge/packages'),
  createRecharge: (data) => post('/recharge/create', data),
  getRecords: (page = 1, pageSize = 20) => get('/recharge/records', { page, pageSize })
}

const points = {
  getBalance: () => get('/points/balance'),
  getFlow: (page = 1, pageSize = 20, type = 'all') => get('/points/flow', { page, pageSize, type }),
  redeem: (data) => post('/points/redeem', data),
  getMallItems: () => get('/points/mall/items'),
  redeemMallItem: (data) => post('/points/mall/redeem', data)
}

const recommend = {
  getMyCode: () => get('/referral/my-code'),
  getList: (page = 1, pageSize = 20) => get('/referral/list', { page, pageSize }),
  bind: (code) => post('/referral/bind', { referralCode: code })
}

const consume = {
  getRecords: (page = 1, pageSize = 20) => get('/consume/records', { page, pageSize }),
  create: (data) => post('/consume/create', data)
}

const admin = {
  getDashboard: () => get('/admin/dashboard'),
  getMembers: (page = 1, keyword = '') => get('/admin/members', { page, pageSize: 20, keyword }),
  getReferrals: (page = 1) => get('/admin/referrals', { page, pageSize: 20 }),
  getAdminRecharges: (page = 1, status = 'all') => get('/admin/recharges', { page, pageSize: 20, status }),
  getAdminConsumes: (page = 1, startDate = '', endDate = '') => get('/admin/consumes', { page, pageSize: 20, startDate, endDate }),
  getPointsFlows: (page = 1, type = 'all') => get('/admin/points-flow', { page, pageSize: 20, type }),
  getPointsVerifications: (page = 1) => get('/admin/points-verifications', { page, pageSize: 20 }),
  verifyPoints: (data) => post('/admin/points-verify', data),
  getSettings: () => get('/admin/settings'),
  updateSettings: (data) => put('/admin/settings', data),
  exportData: (type) => get('/admin/export', { type })
}

module.exports = { request, get, post, put, del, auth, member, recharge, points, recommend, consume, admin }
