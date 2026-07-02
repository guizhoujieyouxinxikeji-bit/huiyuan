function getToken() { return wx.getStorageSync('token') || '' }
function setToken(token) { wx.setStorageSync('token', token) }
function removeToken() { wx.removeStorageSync('token') }
function isLoggedIn() { return !!getToken() }

function getUserInfo() {
  try { return JSON.parse(wx.getStorageSync('userInfo') || '{}') }
  catch (e) { return {} }
}
function setUserInfo(info) { wx.setStorageSync('userInfo', JSON.stringify(info)) }
function removeUserInfo() { wx.removeStorageSync('userInfo') }

function isAdmin() {
  const info = getUserInfo()
  return info.role === 'admin' || info.role === 'manager'
}

function logout() {
  removeToken()
  removeUserInfo()
  wx.reLaunch({ url: '/miniprogram/pages/index/index' })
}

module.exports = { getToken, setToken, removeToken, isLoggedIn, getUserInfo, setUserInfo, removeUserInfo, isAdmin, logout }
