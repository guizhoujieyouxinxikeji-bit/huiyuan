# 餐饮门店会员小程序 — 后端接口文档

> 版本：v1.0  
> 最后更新：2025-04  
> 协议：HTTPS  
> 数据格式：JSON（`Content-Type: application/json`）

---

## 目录

1. [概述](#1-概述)
2. [认证模块 /auth](#2-认证模块-auth)
3. [会员模块 /member](#3-会员模块-member)
4. [充值模块 /recharge](#4-充值模块-recharge)
5. [积分模块 /points](#5-积分模块-points)
6. [推荐模块 /referral](#6-推荐模块-referral)
7. [消费模块 /consume](#7-消费模块-consume)
8. [管理后台模块 /admin](#8-管理后台模块-admin)
9. [风控规则说明](#9-风控规则说明)
10. [数据库参考设计](#10-数据库参考设计)

---

## 1. 概述

### 1.1 Base URL

```
https://your-domain.com/api/v1
```

> 部署时替换为实际域名，开发环境可使用 `http://localhost:8080/api/v1`。

### 1.2 鉴权方式

采用 **Bearer JWT** 鉴权。客户端登录成功后获取 `token`，后续请求在 Header 中携带：

```
Authorization: Bearer <token>
```

- Token 有效期：7天，过期需重新登录
- 管理后台接口需额外校验 `role` 字段（`admin` / `staff`）

### 1.3 统一响应格式

```json
{
  "code": 0,
  "msg": "success",
  "data": { }
}
```

| code | 含义 |
|------|------|
| 0 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录 / Token 失效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 1001 | 积分不足 |
| 1002 | 推荐关系已存在 |
| 1003 | 不能推荐自己 |
| 1004 | 月度奖励已达上限 |
| 1005 | 充值金额不在允许范围 |
| 2001 | 商品库存不足 |
| 2002 | 核销码无效或已使用 |

### 1.4 分页约定

分页请求统一使用以下 Query 参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码，从1开始 |
| pageSize | int | 20 | 每页条数，最大100 |

分页响应统一格式：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [],
    "total": 156,
    "page": 1,
    "pageSize": 20
  }
}
```

### 1.5 时间格式

所有时间字段均采用 **ISO 8601** 格式，时区 UTC+8：

```
2025-04-15T14:30:00+08:00
```

---

## 2. 认证模块 /auth

### 2.1 微信登录

获取访问 Token，完成新用户注册或老用户登录。

```
POST /auth/login
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 微信 `wx.login()` 返回的临时登录凭证 |
| nickname | string | 否 | 微信昵称（新用户注册时传入） |
| avatarUrl | string | 否 | 头像 URL |
| referralCode | string | 否 | 推荐码，新用户首次登录时绑定推荐关系 |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "memberId": "M202504150001",
    "isNewUser": true,
    "nickname": "张三",
    "avatarUrl": "https://...",
    "level": 1,
    "levelName": "普通会员"
  }
}
```

**业务逻辑：**
- 后端用 `code` 调用微信 `sns/jscode2session` 获取 `openid` 和 `session_key`
- 若 `openid` 不存在则自动注册，`memberId` 按规则生成
- 若传入 `referralCode` 且为新用户，自动绑定推荐关系（调用推荐绑定逻辑）
- `token` 中包含 `memberId`、`openid`、`role` 等信息

---

### 2.2 获取当前用户信息

```
GET /auth/userinfo
```

**请求参数：** 无（从 Token 中获取用户身份）

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "memberId": "M202504150001",
    "openid": "oXXXX...",
    "nickname": "张三",
    "avatarUrl": "https://...",
    "phone": "138****1234",
    "level": 2,
    "levelName": "银卡会员",
    "totalRecharge": 5000.00,
    "totalConsume": 2350.00,
    "createdAt": "2025-01-10T10:00:00+08:00"
  }
}
```

---

### 2.3 更新用户信息

```
PUT /auth/userinfo
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nickname | string | 否 | 昵称 |
| avatarUrl | string | 否 | 头像 URL |
| phone | string | 否 | 手机号（需先通过微信手机号快速验证组件获取） |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "memberId": "M202504150001",
    "nickname": "张三",
    "avatarUrl": "https://...",
    "phone": "138****1234"
  }
}
```

---

## 3. 会员模块 /member

### 3.1 获取会员详情

获取当前会员的完整信息，包含等级、积分、余额等。

```
GET /member/info
```

**请求参数：** 无

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "memberId": "M202504150001",
    "nickname": "张三",
    "avatarUrl": "https://...",
    "phone": "138****1234",
    "level": 2,
    "levelName": "银卡会员",
    "levelProgress": 65,
    "nextLevelName": "金卡会员",
    "nextLevelThreshold": 10000.00,
    "balance": 3200.00,
    "points": 1580,
    "pointsExpireDate": "2026-04-15T23:59:59+08:00",
    "totalRecharge": 8000.00,
    "totalConsume": 4800.00,
    "referralCount": 12,
    "createdAt": "2025-01-10T10:00:00+08:00"
  }
}
```

**等级规则说明：**

| 等级 | 名称 | 累计充值门槛 |
|------|------|-------------|
| 1 | 普通会员 | 0 元 |
| 2 | 银卡会员 | 3000 元 |
| 3 | 金卡会员 | 10000 元 |
| 4 | 钻石会员 | 30000 元 |
| 5 | 黑金会员 | 100000 元 |

---

### 3.2 获取会员码

获取用于店内扫码识别的会员二维码。

```
GET /member/code
```

**请求参数：** 无

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "memberId": "M202504150001",
    "qrCodeUrl": "https://your-domain.com/qr/M202504150001?t=1713168000",
    "expireAt": "2025-04-15T15:00:00+08:00",
    "barcode": "6901234567890"
  }
}
```

**业务逻辑：**
- 二维码有效期 5 分钟，过期需重新获取
- `qrCodeUrl` 指向一个包含 `memberId` 和时间戳的短链
- `barcode` 为一维码数字串，可用于扫码枪快速识别
- 前端同时渲染二维码和条形码

---

## 4. 充值模块 /recharge

### 4.1 获取充值套餐列表

```
GET /recharge/packages
```

**请求参数：** 无

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "入门套餐",
        "amount": 500.00,
        "bonusPoints": 50,
        "description": "充500送50积分",
        "tag": "",
        "sortOrder": 1
      },
      {
        "id": 2,
        "name": "热门套餐",
        "amount": 1000.00,
        "bonusPoints": 100,
        "description": "充1000送100积分",
        "tag": "热门",
        "sortOrder": 2
      },
      {
        "id": 3,
        "name": "尊享套餐",
        "amount": 3000.00,
        "bonusPoints": 300,
        "description": "充3000送300积分",
        "tag": "推荐",
        "sortOrder": 3
      },
      {
        "id": 4,
        "name": "至尊套餐",
        "amount": 5000.00,
        "bonusPoints": 500,
        "description": "充5000送500积分",
        "tag": "尊享",
        "sortOrder": 4
      }
    ],
    "minAmount": 100.00,
    "maxAmount": 50000.00
  }
}
```

**业务逻辑：**
- 赠送积分 = 充值金额 x 10%（向下取整）
- `minAmount` / `maxAmount` 为自定义金额的允许范围
- 套餐可在管理后台配置，`tag` 用于前端角标展示

---

### 4.2 创建充值订单

发起充值，调用微信支付完成付款。

```
POST /recharge/create
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| packageId | int | 否 | 套餐 ID（选套餐时传） |
| amount | decimal | 否 | 自定义金额（自定义时传，与 packageId 二选一） |

> `packageId` 和 `amount` 必须传其一，同时传时以 `packageId` 对应的金额为准。

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "orderId": "RC20250415143000001",
    "amount": 1000.00,
    "bonusPoints": 100,
    "paymentParams": {
      "timeStamp": "1713168600",
      "nonceStr": "5K8264ILTKCH16CQ2502SI8ZNMTM67VS",
      "package": "prepay_id=wx20250415143000abcdef",
      "signType": "RSA",
      "paySign": "oR9d8PuhnIc+YZ8cBHFCwfgpaK9gd7vaRvkYD7rthRAZ1xN..."
    }
  }
}
```

**业务逻辑：**
1. 校验金额是否在 `[minAmount, maxAmount]` 范围内
2. 创建充值记录，状态为 `pending`
3. 调用微信统一下单接口，返回 `paymentParams` 供前端调用 `wx.requestPayment()`
4. 支付成功回调中：
   - 更新充值记录状态为 `success`
   - 增加会员余额（`amount`）
   - 赠送积分（`amount x 10%`），写入积分流水，类型 `recharge_bonus`
   - 若会员有推荐人，给推荐人发放充值金额 x 10% 的积分奖励，类型 `referral_recharge`（受月上限约束）
   - 更新会员累计充值金额，检查是否满足升级条件

---

### 4.3 获取充值记录

```
GET /recharge/records
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| pageSize | int | 否 | 每页条数，默认20 |
| status | string | 否 | 筛选状态：`success` / `pending` / `refunded`，不传返回全部 |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "orderId": "RC20250415143000001",
        "amount": 1000.00,
        "bonusPoints": 100,
        "packageName": "热门套餐",
        "status": "success",
        "payMethod": "wechat",
        "paidAt": "2025-04-15T14:30:05+08:00",
        "createdAt": "2025-04-15T14:30:00+08:00"
      }
    ],
    "total": 8,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 5. 积分模块 /points

### 5.1 获取积分余额

```
GET /points/balance
```

**请求参数：** 无

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "available": 1580,
    "frozen": 0,
    "total": 1580,
    "expireSoon": 200,
    "expireSoonDate": "2025-05-15T23:59:59+08:00",
    "summary": {
      "totalEarned": 3200,
      "totalConsumed": 1420,
      "totalExpired": 200
    }
  }
}
```

**业务逻辑：**
- `available`：当前可用积分
- `frozen`：冻结中积分（如核销待确认）
- `expireSoon`：30天内即将过期的积分数量，用于前端提醒
- 积分采用 **先进先出（FIFO）** 原则消耗

---

### 5.2 获取积分流水

```
GET /points/flow
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| pageSize | int | 否 | 每页条数，默认20 |
| type | string | 否 | 流水类型筛选，不传返回全部 |
| direction | string | 否 | `in`（获得）/ `out`（支出），不传返回全部 |

**流水类型（type）：**

| type | 说明 | 方向 |
|------|------|------|
| recharge_bonus | 充值赠送 | in |
| referral_recharge | 推荐充值奖励 | in |
| referral_consume | 推荐消费奖励 | in |
| consume_deduct | 消费抵扣 | out |
| mall_redeem | 商城兑换 | out |
| expire | 过期失效 | out |
| refund_clawback | 退款扣回 | out |
| admin_adjust | 后台手动调整 | in/out |
| verify_deduct | 核销扣减 | out |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "id": 10001,
        "type": "recharge_bonus",
        "direction": "in",
        "points": 100,
        "title": "充值赠送积分",
        "description": "充值1000元，赠送100积分",
        "relatedOrderId": "RC20250415143000001",
        "balanceAfter": 1580,
        "expireAt": "2026-04-15T23:59:59+08:00",
        "createdAt": "2025-04-15T14:30:05+08:00"
      },
      {
        "id": 10002,
        "type": "consume_deduct",
        "direction": "out",
        "points": -50,
        "title": "消费积分抵扣",
        "description": "消费抵扣50积分（抵50元）",
        "relatedOrderId": "CS20250414180000003",
        "balanceAfter": 1480,
        "createdAt": "2025-04-14T18:00:10+08:00"
      }
    ],
    "total": 45,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 5.3 积分抵扣（店内消费时使用）

```
POST /points/redeem
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| consumeOrderId | string | 是 | 关联的消费订单 ID |
| points | int | 是 | 使用的积分数量（正整数） |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "flowId": 10003,
    "pointsUsed": 50,
    "amountDeducted": 50.00,
    "balanceAfter": 1530
  }
}
```

**业务逻辑：**
- 1积分 = 1元
- 校验可用积分 >= 请求积分数
- 使用 FIFO 原则扣减积分（优先消耗即将过期的）
- 写入积分流水，类型 `consume_deduct`
- 若消费订单退款，自动扣回对应积分（类型 `refund_clawback`）

---

### 5.4 获取积分商城商品列表

```
GET /points/mall/items
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| pageSize | int | 否 | 每页条数，默认20 |
| category | string | 否 | 分类筛选：`food`（餐品）/ `drink`（酒水）/ `coupon`（优惠券） |
| keyword | string | 否 | 关键词搜索 |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "招牌红烧肉",
        "category": "food",
        "imageUrl": "https://your-domain.com/images/items/001.jpg",
        "pointsPrice": 200,
        "originalPrice": 68.00,
        "stock": 50,
        "redeemCount": 128,
        "description": "招牌菜品，仅限堂食",
        "status": "on_sale"
      },
      {
        "id": 2,
        "name": "进口红酒一杯",
        "category": "drink",
        "imageUrl": "https://your-domain.com/images/items/002.jpg",
        "pointsPrice": 500,
        "originalPrice": 128.00,
        "stock": 20,
        "redeemCount": 45,
        "description": "指定款进口红酒，150ml/杯",
        "status": "on_sale"
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 5.5 积分商城兑换

```
POST /points/mall/redeem
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itemId | int | 是 | 商品 ID |
| quantity | int | 否 | 兑换数量，默认1 |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "redeemId": "MR20250415150000001",
    "itemId": 1,
    "itemName": "招牌红烧肉",
    "quantity": 1,
    "totalPoints": 200,
    "balanceAfter": 1380,
    "verifyCode": "HX8821456",
    "status": "pending",
    "expireAt": "2025-04-22T23:59:59+08:00"
  }
}
```

**业务逻辑：**
- 校验可用积分 >= `pointsPrice x quantity`
- 校验商品库存
- 扣减积分，写入流水，类型 `mall_redeem`
- 生成核销码 `verifyCode`，有效期 7 天
- 店员扫码核销后状态变为 `verified`
- 过期未核销，自动退回积分

---

## 6. 推荐模块 /referral

### 6.1 获取我的推荐码

```
GET /referral/my-code
```

**请求参数：** 无

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "referralCode": "REF8A3F2K",
    "qrCodeUrl": "https://your-domain.com/qr/REF8A3F2K",
    "posterUrl": "https://your-domain.com/poster/M202504150001",
    "referralCount": 12,
    "totalRewardPoints": 3600,
    "thisMonthRewardPoints": 850,
    "monthlyCap": 5000
  }
}
```

**业务逻辑：**
- 推荐码在会员注册时自动生成，格式 `REF` + 5位随机字母数字
- `posterUrl` 为服务端生成的推荐海报图片，包含小程序码
- 仅支持一级推荐，即 A 推荐 B，B 推荐 C，A 不会从 C 的行为中获得奖励

---

### 6.2 获取我推荐的会员列表

```
GET /referral/list
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| pageSize | int | 否 | 每页条数，默认20 |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "memberId": "M202502200005",
        "nickname": "李四",
        "avatarUrl": "https://...",
        "bindAt": "2025-02-20T12:00:00+08:00",
        "totalRecharge": 3000.00,
        "totalConsume": 1200.00,
        "rewardFromRecharge": 300,
        "rewardFromConsume": 120
      }
    ],
    "total": 12,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 6.3 绑定推荐关系

新用户首次进入小程序时，通过推荐链接或扫码绑定推荐人。

```
POST /referral/bind
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| referralCode | string | 是 | 推荐人的推荐码 |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "referrerId": "M202501010001",
    "referrerNickname": "王五",
    "bindAt": "2025-04-15T15:00:00+08:00"
  }
}
```

**业务逻辑：**
- 仅新用户（尚无推荐关系）可绑定
- 不能绑定自己（返回 code 1003）
- 推荐关系一旦绑定不可自行解除（仅管理后台可操作）
- 推荐码无效时返回 code 404

---

## 7. 消费模块 /consume

### 7.1 获取消费记录

```
GET /consume/records
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| pageSize | int | 否 | 每页条数，默认20 |
| startDate | string | 否 | 开始日期，格式 `YYYY-MM-DD` |
| endDate | string | 否 | 结束日期，格式 `YYYY-MM-DD` |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "orderId": "CS20250415180000001",
        "totalAmount": 380.00,
        "pointsDeducted": 50,
        "pointsDiscount": 50.00,
        "actualPaid": 330.00,
        "payMethod": "balance",
        "status": "success",
        "items": [
          { "name": "招牌红烧肉", "quantity": 1, "price": 68.00 },
          { "name": "清蒸鲈鱼", "quantity": 1, "price": 88.00 },
          { "name": "青岛啤酒", "quantity": 4, "price": 25.00 },
          { "name": "米饭", "quantity": 4, "price": 5.00 },
          { "name": "茶位费", "quantity": 4, "price": 10.00 }
        ],
        "createdAt": "2025-04-15T18:30:00+08:00"
      }
    ],
    "total": 23,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 7.2 创建消费订单

由店员操作或系统对接 POS 后创建。

```
POST /consume/create
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| memberId | string | 是 | 消费会员 ID（扫码获取） |
| totalAmount | decimal | 是 | 消费总金额（元） |
| pointsDeducted | int | 否 | 使用的积分数量，默认0 |
| payMethod | string | 是 | 支付方式：`balance`（余额）/ `wechat`（微信支付）/ `cash`（现金） |
| items | array | 否 | 消费明细列表 |
| items[].name | string | 是 | 商品名称 |
| items[].quantity | int | 是 | 数量 |
| items[].price | decimal | 是 | 单价 |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "orderId": "CS20250415183000002",
    "memberId": "M202504150001",
    "totalAmount": 380.00,
    "pointsDeducted": 50,
    "pointsDiscount": 50.00,
    "actualPaid": 330.00,
    "payMethod": "balance",
    "status": "success",
    "referrerReward": {
      "referrerId": "M202501010001",
      "rewardPoints": 38,
      "rewardType": "referral_consume"
    },
    "createdAt": "2025-04-15T18:30:00+08:00"
  }
}
```

**业务逻辑：**
1. 校验会员余额 >= `actualPaid`（余额支付时）
2. 若有积分抵扣，调用积分扣减逻辑
3. 扣减会员余额或发起微信支付
4. 若会员有推荐人：
   - 推荐人获得 `totalAmount x 10%` 积分（向下取整），类型 `referral_consume`
   - 检查推荐人当月累计奖励是否超过 5000 积分上限
5. 写入消费记录
6. 退款时：返还实际支付金额，扣回已用积分，扣回推荐人已获奖励积分

---

## 8. 管理后台模块 /admin

> 以下接口均需要 `role: admin` 或 `role: staff` 权限，部分接口仅 `admin` 可操作。

### 8.1 数据看板

```
GET /admin/dashboard
```

**请求参数：** 无

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "today": {
      "newMembers": 5,
      "rechargeAmount": 12500.00,
      "rechargeCount": 8,
      "consumeAmount": 6800.00,
      "consumeCount": 15,
      "pointsIssued": 1250,
      "pointsConsumed": 320,
      "pointsExpired": 0
    },
    "cumulative": {
      "totalMembers": 1256,
      "totalRechargeAmount": 2580000.00,
      "totalConsumeAmount": 1450000.00,
      "totalPointsIssued": 258000,
      "totalPointsConsumed": 89000,
      "totalPointsExpired": 12000,
      "activePointsBalance": 157000,
      "totalReferrals": 890
    },
    "recentRecharges": [
      {
        "orderId": "RC20250415143000001",
        "memberNickname": "张三",
        "amount": 1000.00,
        "paidAt": "2025-04-15T14:30:05+08:00"
      }
    ]
  }
}
```

---

### 8.2 会员列表

```
GET /admin/members
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| keyword | string | 否 | 搜索关键词（会员ID/昵称/手机号） |
| level | int | 否 | 按等级筛选 |
| sortBy | string | 否 | 排序字段：`createdAt` / `totalRecharge` / `totalConsume` |
| sortOrder | string | 否 | `asc` / `desc`，默认 `desc` |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "memberId": "M202504150001",
        "nickname": "张三",
        "avatarUrl": "https://...",
        "phone": "13812341234",
        "level": 2,
        "levelName": "银卡会员",
        "balance": 3200.00,
        "points": 1580,
        "totalRecharge": 8000.00,
        "totalConsume": 4800.00,
        "referralCount": 12,
        "referrerId": "M202501010001",
        "referrerNickname": "王五",
        "createdAt": "2025-01-10T10:00:00+08:00"
      }
    ],
    "total": 1256,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 8.3 推荐关系列表

```
GET /admin/referrals
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| keyword | string | 否 | 搜索（推荐人/被推荐人昵称或ID） |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "referrerId": "M202501010001",
        "referrerNickname": "王五",
        "refereeId": "M202504150001",
        "refereeNickname": "张三",
        "bindAt": "2025-01-10T10:00:00+08:00",
        "totalRewardPoints": 420
      }
    ],
    "total": 890,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 8.4 充值记录（管理端）

```
GET /admin/recharges
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| memberId | string | 否 | 按会员筛选 |
| status | string | 否 | `success` / `pending` / `refunded` |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| minAmount | decimal | 否 | 最小金额 |
| maxAmount | decimal | 否 | 最大金额 |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "orderId": "RC20250415143000001",
        "memberId": "M202504150001",
        "memberNickname": "张三",
        "amount": 1000.00,
        "bonusPoints": 100,
        "packageName": "热门套餐",
        "status": "success",
        "payMethod": "wechat",
        "paidAt": "2025-04-15T14:30:05+08:00",
        "referrerRewardPoints": 100,
        "createdAt": "2025-04-15T14:30:00+08:00"
      }
    ],
    "total": 234,
    "page": 1,
    "pageSize": 20,
    "summary": {
      "totalAmount": 125000.00,
      "totalBonusPoints": 12500,
      "totalReferrerRewards": 8900
    }
  }
}
```

---

### 8.5 消费记录（管理端）

```
GET /admin/consumes
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| memberId | string | 否 | 按会员筛选 |
| payMethod | string | 否 | 支付方式筛选 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "orderId": "CS20250415183000002",
        "memberId": "M202504150001",
        "memberNickname": "张三",
        "totalAmount": 380.00,
        "pointsDeducted": 50,
        "pointsDiscount": 50.00,
        "actualPaid": 330.00,
        "payMethod": "balance",
        "status": "success",
        "staffName": "店员小李",
        "referrerRewardPoints": 38,
        "createdAt": "2025-04-15T18:30:00+08:00"
      }
    ],
    "total": 567,
    "page": 1,
    "pageSize": 20,
    "summary": {
      "totalAmount": 89000.00,
      "totalPointsDeducted": 4500,
      "totalReferrerRewards": 8900
    }
  }
}
```

---

### 8.6 积分流水（管理端）

```
GET /admin/points-flow
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| memberId | string | 否 | 按会员筛选 |
| type | string | 否 | 流水类型筛选 |
| direction | string | 否 | `in` / `out` |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "id": 10001,
        "memberId": "M202504150001",
        "memberNickname": "张三",
        "type": "recharge_bonus",
        "direction": "in",
        "points": 100,
        "title": "充值赠送积分",
        "description": "充值1000元，赠送100积分",
        "relatedOrderId": "RC20250415143000001",
        "balanceAfter": 1580,
        "expireAt": "2026-04-15T23:59:59+08:00",
        "createdAt": "2025-04-15T14:30:05+08:00"
      }
    ],
    "total": 3456,
    "page": 1,
    "pageSize": 20,
    "summary": {
      "totalIn": 25800,
      "totalOut": 12300
    }
  }
}
```

---

### 8.7 积分核销

店员扫描会员的核销码，完成积分兑换商品的核销。

```
POST /admin/points-verify
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| verifyCode | string | 是 | 核销码 |
| operatorId | string | 否 | 操作店员 ID（可从 Token 获取） |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "verificationId": "VF20250415190000001",
    "redeemId": "MR20250415150000001",
    "memberId": "M202504150001",
    "memberNickname": "张三",
    "itemName": "招牌红烧肉",
    "pointsUsed": 200,
    "verifyCode": "HX8821456",
    "status": "verified",
    "verifiedAt": "2025-04-15T19:00:00+08:00",
    "operatorName": "店员小李"
  }
}
```

**业务逻辑：**
- 校验核销码有效且未过期
- 校验状态为 `pending`（未核销）
- 更新核销状态为 `verified`
- 核销成功后不可撤销

---

### 8.8 核销记录

```
GET /admin/points-verifications
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| status | string | 否 | `pending` / `verified` / `expired` |
| operatorId | string | 否 | 按操作店员筛选 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "verificationId": "VF20250415190000001",
        "redeemId": "MR20250415150000001",
        "memberId": "M202504150001",
        "memberNickname": "张三",
        "itemName": "招牌红烧肉",
        "pointsUsed": 200,
        "verifyCode": "HX8821456",
        "status": "verified",
        "verifiedAt": "2025-04-15T19:00:00+08:00",
        "operatorName": "店员小李",
        "createdAt": "2025-04-15T15:00:00+08:00"
      }
    ],
    "total": 89,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 8.9 获取系统设置

```
GET /admin/settings
```

**请求参数：** 无（仅 `admin` 权限）

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "rechargeBonusRate": 0.10,
    "referralRechargeRate": 0.10,
    "referralConsumeRate": 0.10,
    "monthlyRewardCap": 5000,
    "pointsValidityDays": 365,
    "pointsExchangeRate": 1.00,
    "minRechargeAmount": 100.00,
    "maxRechargeAmount": 50000.00,
    "mallRedeemExpireDays": 7,
    "excludedItems": ["包间费", "服务费", "外卖订单"],
    "levelConfig": [
      { "level": 1, "name": "普通会员", "threshold": 0 },
      { "level": 2, "name": "银卡会员", "threshold": 3000 },
      { "level": 3, "name": "金卡会员", "threshold": 10000 },
      { "level": 4, "name": "钻石会员", "threshold": 30000 },
      { "level": 5, "name": "黑金会员", "threshold": 100000 }
    ]
  }
}
```

---

### 8.10 更新系统设置

```
PUT /admin/settings
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| rechargeBonusRate | decimal | 否 | 充值赠送比例（0~1） |
| referralRechargeRate | decimal | 否 | 推荐充值奖励比例 |
| referralConsumeRate | decimal | 否 | 推荐消费奖励比例 |
| monthlyRewardCap | int | 否 | 月度推荐奖励上限（积分） |
| pointsValidityDays | int | 否 | 积分有效天数 |
| pointsExchangeRate | decimal | 否 | 积分兑换比例（元/积分） |
| minRechargeAmount | decimal | 否 | 最低充值金额 |
| maxRechargeAmount | decimal | 否 | 最高充值金额 |
| mallRedeemExpireDays | int | 否 | 商城兑换核销有效天数 |
| excludedItems | array | 否 | 不参与积分的消费项目名称 |
| levelConfig | array | 否 | 等级配置 |

> 仅传入需要更新的字段，不传的字段保持不变。

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "rechargeBonusRate": 0.10,
    "referralRechargeRate": 0.10,
    "referralConsumeRate": 0.10,
    "monthlyRewardCap": 5000,
    "updatedAt": "2025-04-15T20:00:00+08:00",
    "updatedBy": "admin"
  }
}
```

---

### 8.11 数据导出

导出充值或消费记录为 Excel 文件。

```
GET /admin/export
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 导出类型：`recharges` / `consumes` / `points-flow` / `members` |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| format | string | 否 | 文件格式：`xlsx`（默认）/ `csv` |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "downloadUrl": "https://your-domain.com/exports/recharges_20250415.xlsx",
    "fileName": "充值记录_2025-04-01_2025-04-15.xlsx",
    "fileSize": 45678,
    "recordCount": 234,
    "expireAt": "2025-04-16T20:00:00+08:00"
  }
}
```

**业务逻辑：**
- 异步生成文件，大数据量时可能返回 `status: processing`
- 下载链接有效期 24 小时
- 导出内容包括筛选范围内的全部记录

---

## 9. 风控规则说明

### 9.1 月度推荐奖励上限

- 每个推荐人每月通过推荐获得的积分总量（含推荐充值奖励 + 推荐消费奖励）不超过 **5000 积分**
- 达到上限后，当月后续被推荐人的充值/消费行为不再为推荐人产生奖励积分
- 每月 1 日 00:00 重置计数器
- 后端实现：在 `referral_monthly_rewards` 表中按月汇总，发放前检查是否超限

**计算示例：**
```
推荐人 A 本月已有奖励积分 4800
被推荐人 B 充值 5000 元 → 理论奖励 500 积分
实际发放 = min(500, 5000 - 4800) = 200 积分
剩余 300 积分奖励放弃，不可累积
```

### 9.2 积分有效期

- 所有积分自获得之日起 **365 天**有效
- 到期自动失效，不延期、不提醒（前端可选展示即将过期提醒）
- 过期积分从可用余额中扣除，写入流水类型 `expire`
- 每日凌晨定时任务扫描过期积分

**过期处理逻辑：**
```
每日 02:00 执行：
1. 查询 expire_at < 当前日期 且 未过期处理的积分批次
2. 逐条扣减可用积分
3. 写入积分流水（type: expire）
4. 标记为已处理
```

### 9.3 不参与积分的消费项目

以下类型的消费金额不计入推荐消费奖励的基数：

| 排除项 | 原因 |
|--------|------|
| 包间费 | 非餐饮消费 |
| 服务费 | 附加费用 |
| 外卖订单 | 非堂食场景 |
| 烟酒类（可选配置） | 低毛利商品 |
| 特价菜品（可选配置） | 促销商品 |

排除项目在系统设置 `excludedItems` 中配置，消费订单创建时计算 `eligibleAmount`（可积分金额）：

```
eligibleAmount = totalAmount - excludedItemsAmount
referralReward = floor(eligibleAmount * referralConsumeRate)
```

### 9.4 退款积分扣回逻辑

当消费订单发生退款/撤单时，系统自动执行以下扣回操作：

1. **扣回消费者使用的积分**：若消费时使用了积分抵扣，退款时返还积分
2. **扣回推荐人获得的奖励积分**：
   - 推荐充值奖励：退款时从推荐人账户扣回对应积分
   - 推荐消费奖励：退款时从推荐人账户扣回对应积分
3. **积分不足处理**：若推荐人可用积分不足以扣回，将余额扣至 0，差额记入 `frozen` 为负值（待充值后自动抵扣）

**扣回流程：**
```
退款触发 →
1. 查询原订单的积分流水（consume_deduct、referral_recharge、referral_consume）
2. 逐条生成反向流水（refund_clawback）
3. 扣减相关会员的可用积分
4. 更新原流水记录关联退款标记
5. 返还实际支付金额
```

### 9.5 其他风控措施

| 措施 | 说明 |
|------|------|
| 频率限制 | 同一会员每分钟最多请求 60 次 |
| 充值限额 | 单笔充值金额在 [minAmount, maxAmount] 范围内 |
| 防重放 | 充值/消费接口使用幂等性 ID（orderId） |
| 异常监控 | 单日推荐人数 > 50 或单日奖励积分 > 3000 触发告警 |
| 黑名单 | 管理后台可冻结异常会员账号 |

---

## 10. 数据库参考设计

以下为 MySQL 8.0+ 参考建表语句，实际部署时可根据需要调整索引和字段。

### 10.1 members — 会员表

```sql
CREATE TABLE members (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    member_id       VARCHAR(32) NOT NULL UNIQUE COMMENT '会员编号，如 M202504150001',
    openid          VARCHAR(64) NOT NULL UNIQUE COMMENT '微信openid',
    union_id        VARCHAR(64) DEFAULT NULL COMMENT '微信unionid',
    nickname        VARCHAR(128) DEFAULT '' COMMENT '昵称',
    avatar_url      VARCHAR(512) DEFAULT '' COMMENT '头像URL',
    phone           VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    level           TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '会员等级 1-5',
    level_name      VARCHAR(20) NOT NULL DEFAULT '普通会员' COMMENT '等级名称',
    balance         DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '账户余额（元）',
    points          INT NOT NULL DEFAULT 0 COMMENT '当前可用积分',
    frozen_points   INT NOT NULL DEFAULT 0 COMMENT '冻结积分',
    total_recharge  DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '累计充值金额',
    total_consume   DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '累计消费金额',
    referral_code   VARCHAR(16) NOT NULL UNIQUE COMMENT '推荐码',
    referrer_id     VARCHAR(32) DEFAULT NULL COMMENT '推荐人会员编号',
    referral_count  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '推荐的人数',
    status          TINYINT NOT NULL DEFAULT 1 COMMENT '状态 1正常 0冻结 -1注销',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_referrer (referrer_id),
    INDEX idx_level (level),
    INDEX idx_phone (phone),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员表';
```

### 10.2 recharge_records — 充值记录表

```sql
CREATE TABLE recharge_records (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id        VARCHAR(32) NOT NULL UNIQUE COMMENT '充值订单号',
    member_id       VARCHAR(32) NOT NULL COMMENT '会员编号',
    amount          DECIMAL(12,2) NOT NULL COMMENT '充值金额',
    bonus_points    INT NOT NULL DEFAULT 0 COMMENT '赠送积分',
    package_id      INT UNSIGNED DEFAULT NULL COMMENT '套餐ID，NULL为自定义金额',
    package_name    VARCHAR(64) DEFAULT '' COMMENT '套餐名称',
    status          VARCHAR(16) NOT NULL DEFAULT 'pending' COMMENT 'pending/success/refunded',
    pay_method      VARCHAR(16) NOT NULL DEFAULT 'wechat' COMMENT '支付方式',
    transaction_id  VARCHAR(64) DEFAULT NULL COMMENT '微信支付交易号',
    referrer_reward_points INT NOT NULL DEFAULT 0 COMMENT '推荐人获得的奖励积分',
    referrer_id     VARCHAR(32) DEFAULT NULL COMMENT '推荐人会员编号',
    paid_at         DATETIME DEFAULT NULL COMMENT '支付时间',
    refunded_at     DATETIME DEFAULT NULL COMMENT '退款时间',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_member (member_id),
    INDEX idx_status (status),
    INDEX idx_paid_at (paid_at),
    INDEX idx_referrer (referrer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='充值记录表';
```

### 10.3 consume_records — 消费记录表

```sql
CREATE TABLE consume_records (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id        VARCHAR(32) NOT NULL UNIQUE COMMENT '消费订单号',
    member_id       VARCHAR(32) NOT NULL COMMENT '会员编号',
    total_amount    DECIMAL(12,2) NOT NULL COMMENT '消费总金额',
    eligible_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '可积分金额（扣除排除项）',
    points_deducted INT NOT NULL DEFAULT 0 COMMENT '使用的积分数量',
    points_discount DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '积分抵扣金额',
    actual_paid     DECIMAL(12,2) NOT NULL COMMENT '实际支付金额',
    pay_method      VARCHAR(16) NOT NULL COMMENT 'balance/wechat/cash',
    status          VARCHAR(16) NOT NULL DEFAULT 'success' COMMENT 'success/refunded/cancelled',
    items_json      JSON DEFAULT NULL COMMENT '消费明细JSON',
    staff_id        VARCHAR(32) DEFAULT NULL COMMENT '操作店员ID',
    staff_name      VARCHAR(64) DEFAULT '' COMMENT '操作店员姓名',
    referrer_id     VARCHAR(32) DEFAULT NULL COMMENT '推荐人会员编号',
    referrer_reward_points INT NOT NULL DEFAULT 0 COMMENT '推荐人获得的奖励积分',
    refunded_at     DATETIME DEFAULT NULL COMMENT '退款时间',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_member (member_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    INDEX idx_referrer (referrer_id),
    INDEX idx_staff (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消费记录表';
```

### 10.4 points_flows — 积分流水表

```sql
CREATE TABLE points_flows (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    member_id       VARCHAR(32) NOT NULL COMMENT '会员编号',
    type            VARCHAR(32) NOT NULL COMMENT '类型: recharge_bonus/referral_recharge/referral_consume/consume_deduct/mall_redeem/expire/refund_clawback/admin_adjust/verify_deduct',
    direction       TINYINT NOT NULL COMMENT '方向 1获得 -1支出',
    points          INT NOT NULL COMMENT '积分变动数量（正数）',
    title           VARCHAR(128) NOT NULL DEFAULT '' COMMENT '标题',
    description     VARCHAR(256) DEFAULT '' COMMENT '描述',
    related_order_id VARCHAR(32) DEFAULT NULL COMMENT '关联订单号',
    balance_before  INT NOT NULL DEFAULT 0 COMMENT '变动前余额',
    balance_after   INT NOT NULL DEFAULT 0 COMMENT '变动后余额',
    expire_at       DATETIME DEFAULT NULL COMMENT '过期时间（仅获得类型有值）',
    batch_no        VARCHAR(32) DEFAULT NULL COMMENT '批次号（用于FIFO扣减追踪）',
    is_expired      TINYINT NOT NULL DEFAULT 0 COMMENT '是否已过期 0否 1是',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_member (member_id),
    INDEX idx_type (type),
    INDEX idx_direction (direction),
    INDEX idx_expire (expire_at, is_expired),
    INDEX idx_order (related_order_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分流水表';
```

### 10.5 referrals — 推荐关系表

```sql
CREATE TABLE referrals (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    referrer_id     VARCHAR(32) NOT NULL COMMENT '推荐人会员编号',
    referee_id      VARCHAR(32) NOT NULL COMMENT '被推荐人会员编号',
    referral_code   VARCHAR(16) NOT NULL COMMENT '使用的推荐码',
    total_reward_points INT NOT NULL DEFAULT 0 COMMENT '推荐人累计获得奖励积分',
    status          TINYINT NOT NULL DEFAULT 1 COMMENT '1有效 0已解除',
    bind_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',

    UNIQUE KEY uk_referee (referee_id),
    INDEX idx_referrer (referrer_id),
    INDEX idx_referral_code (referral_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推荐关系表';
```

### 10.6 referral_monthly_rewards — 推荐月度奖励汇总表

```sql
CREATE TABLE referral_monthly_rewards (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    referrer_id     VARCHAR(32) NOT NULL COMMENT '推荐人会员编号',
    year_month      VARCHAR(7) NOT NULL COMMENT '年月，格式 2025-04',
    total_reward    INT NOT NULL DEFAULT 0 COMMENT '当月累计奖励积分',
    recharge_reward INT NOT NULL DEFAULT 0 COMMENT '当月推荐充值奖励',
    consume_reward  INT NOT NULL DEFAULT 0 COMMENT '当月推荐消费奖励',
    reward_count    INT NOT NULL DEFAULT 0 COMMENT '当月奖励笔数',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_referrer_month (referrer_id, year_month),
    INDEX idx_year_month (year_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推荐月度奖励汇总表';
```

### 10.7 points_verifications — 积分核销记录表

```sql
CREATE TABLE points_verifications (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    verification_id VARCHAR(32) NOT NULL UNIQUE COMMENT '核销记录编号',
    redeem_id       VARCHAR(32) NOT NULL COMMENT '兑换记录编号',
    member_id       VARCHAR(32) NOT NULL COMMENT '会员编号',
    item_id         INT UNSIGNED NOT NULL COMMENT '商品ID',
    item_name       VARCHAR(128) NOT NULL COMMENT '商品名称',
    points_used     INT NOT NULL COMMENT '使用积分',
    verify_code     VARCHAR(16) NOT NULL UNIQUE COMMENT '核销码',
    status          VARCHAR(16) NOT NULL DEFAULT 'pending' COMMENT 'pending/verified/expired',
    operator_id     VARCHAR(32) DEFAULT NULL COMMENT '操作店员ID',
    operator_name   VARCHAR(64) DEFAULT '' COMMENT '操作店员姓名',
    verified_at     DATETIME DEFAULT NULL COMMENT '核销时间',
    expire_at       DATETIME NOT NULL COMMENT '核销码过期时间',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_member (member_id),
    INDEX idx_verify_code (verify_code),
    INDEX idx_status (status),
    INDEX idx_expire (expire_at),
    INDEX idx_operator (operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分核销记录表';
```

### 10.8 mall_items — 积分商城商品表

```sql
CREATE TABLE mall_items (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(128) NOT NULL COMMENT '商品名称',
    category        VARCHAR(32) NOT NULL COMMENT '分类: food/drink/coupon',
    image_url       VARCHAR(512) DEFAULT '' COMMENT '商品图片URL',
    points_price    INT NOT NULL COMMENT '积分价格',
    original_price  DECIMAL(10,2) DEFAULT NULL COMMENT '原价（元），用于展示',
    stock           INT NOT NULL DEFAULT 0 COMMENT '库存数量',
    redeem_count    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '累计兑换次数',
    description     TEXT COMMENT '商品描述',
    status          VARCHAR(16) NOT NULL DEFAULT 'on_sale' COMMENT 'on_sale/off_sale',
    sort_order      INT NOT NULL DEFAULT 0 COMMENT '排序权重',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分商城商品表';
```

### 10.9 mall_redeems — 积分商城兑换记录表

```sql
CREATE TABLE mall_redeems (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    redeem_id       VARCHAR(32) NOT NULL UNIQUE COMMENT '兑换记录编号',
    member_id       VARCHAR(32) NOT NULL COMMENT '会员编号',
    item_id         INT UNSIGNED NOT NULL COMMENT '商品ID',
    item_name       VARCHAR(128) NOT NULL COMMENT '商品名称（冗余）',
    quantity        INT NOT NULL DEFAULT 1 COMMENT '兑换数量',
    total_points    INT NOT NULL COMMENT '消耗积分总量',
    verify_code     VARCHAR(16) NOT NULL UNIQUE COMMENT '核销码',
    status          VARCHAR(16) NOT NULL DEFAULT 'pending' COMMENT 'pending/verified/expired/refunded',
    expire_at       DATETIME NOT NULL COMMENT '核销码过期时间',
    verified_at     DATETIME DEFAULT NULL COMMENT '核销时间',
    refunded_at     DATETIME DEFAULT NULL COMMENT '退回时间（过期未核销退回积分）',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_member (member_id),
    INDEX idx_item (item_id),
    INDEX idx_status (status),
    INDEX idx_verify_code (verify_code),
    INDEX idx_expire (expire_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分商城兑换记录表';
```

### 10.10 system_settings — 系统设置表

```sql
CREATE TABLE system_settings (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key     VARCHAR(64) NOT NULL UNIQUE COMMENT '设置键名',
    setting_value   TEXT NOT NULL COMMENT '设置值（JSON或纯文本）',
    value_type      VARCHAR(16) NOT NULL DEFAULT 'string' COMMENT '值类型: string/int/decimal/json',
    description     VARCHAR(256) DEFAULT '' COMMENT '设置说明',
    updated_by      VARCHAR(64) DEFAULT NULL COMMENT '最后修改人',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统设置表';

-- 初始化默认设置
INSERT INTO system_settings (setting_key, setting_value, value_type, description) VALUES
('recharge_bonus_rate',    '0.10',   'decimal', '充值赠送积分比例'),
('referral_recharge_rate', '0.10',   'decimal', '推荐充值奖励比例'),
('referral_consume_rate',  '0.10',   'decimal', '推荐消费奖励比例'),
('monthly_reward_cap',     '5000',   'int',     '推荐人每月奖励积分上限'),
('points_validity_days',   '365',    'int',     '积分有效天数'),
('points_exchange_rate',   '1.00',   'decimal', '积分兑换比例（元/积分）'),
('min_recharge_amount',    '100.00', 'decimal', '最低充值金额'),
('max_recharge_amount',    '50000.00','decimal', '最高充值金额'),
('mall_redeem_expire_days','7',      'int',     '商城兑换核销有效天数'),
('excluded_items',         '["包间费","服务费","外卖订单"]', 'json', '不参与积分的消费项目'),
('level_config',           '[{"level":1,"name":"普通会员","threshold":0},{"level":2,"name":"银卡会员","threshold":3000},{"level":3,"name":"金卡会员","threshold":10000},{"level":4,"name":"钻石会员","threshold":30000},{"level":5,"name":"黑金会员","threshold":100000}]', 'json', '会员等级配置');
```

---

> 文档结束。如有接口调整或新增功能，请同步更新本文档。
