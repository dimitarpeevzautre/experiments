'use strict';
const { bean } = require('../../util/bean');
class CouponRedemption { constructor(d) { this._d = d; } getCode() { return this._d.code; } getCustomerEmail() { return this._d.customerEmail || null; } getOrderNo() { return this._d.orderNo; } getRedemptionDate() { return new Date(this._d.date); } getCouponID() { return this._d.couponID; } }
module.exports = bean(CouponRedemption);
