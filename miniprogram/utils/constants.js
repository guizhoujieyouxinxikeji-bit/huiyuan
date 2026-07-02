const POINTS_RATE = 0.1
const REFERRAL_REWARD_RATE = 0.1

const POINTS_STATUS = { EARNED: 'earned', SPENT: 'spent', EXPIRED: 'expired', REFUNDED: 'refunded' }

const POINTS_TYPE = {
  RECHARGE_BONUS: 'recharge_bonus',
  REFERRAL_RECHARGE: 'referral_recharge',
  REFERRAL_CONSUME: 'referral_consume',
  CONSUME_DEDUCT: 'consume_deduct',
  ADMIN_ADJUST: 'admin_adjust'
}

const POINTS_TYPE_LABEL = {
  recharge_bonus: '充值赠送',
  referral_recharge: '推荐充值奖励',
  referral_consume: '推荐消费奖励',
  consume_deduct: '消费抵扣',
  admin_adjust: '管理员调整'
}

const POINTS_TYPE_ICON = {
  recharge_bonus: '💰',
  referral_recharge: '🎁',
  referral_consume: '🎉',
  consume_deduct: '🛒',
  admin_adjust: '⚙️'
}

const RECHARGE_STATUS = { PENDING: 'pending', SUCCESS: 'success', FAILED: 'failed', REFUNDED: 'refunded' }

const RECHARGE_STATUS_LABEL = {
  pending: '待支付',
  success: '成功',
  failed: '失败',
  refunded: '已退款'
}

const MEMBER_LEVEL = {
  bronze: { name: '普通会员', min: 0, max: 999, emoji: '🥉' },
  silver: { name: '银卡会员', min: 1000, max: 4999, emoji: '🥈' },
  gold: { name: '金卡会员', min: 5000, max: 19999, emoji: '🥇' },
  diamond: { name: '钻石会员', min: 20000, max: Infinity, emoji: '💎' }
}

function getMemberLevel(totalRecharge) {
  if (totalRecharge >= 20000) return 'diamond'
  if (totalRecharge >= 5000) return 'gold'
  if (totalRecharge >= 1000) return 'silver'
  return 'bronze'
}

const MAX_REFERRAL_REWARD_PER_MONTH = 5000
const POINTS_VALIDITY_DAYS = 365

const TABBAR_PAGES = [
  'pages/index/index',
  'pages/member-code/index',
  'pages/user/index'
]

module.exports = {
  POINTS_RATE, REFERRAL_REWARD_RATE,
  POINTS_STATUS, POINTS_TYPE, POINTS_TYPE_LABEL, POINTS_TYPE_ICON,
  RECHARGE_STATUS, RECHARGE_STATUS_LABEL,
  MEMBER_LEVEL, getMemberLevel,
  MAX_REFERRAL_REWARD_PER_MONTH, POINTS_VALIDITY_DAYS, TABBAR_PAGES
}
