'use strict';
const rtRef = require('../../runtime');
const ArrayList = require('../util/ArrayList');
const Coupon = require('./Coupon');
const CouponRedemption = require('./CouponRedemption');
const wrappers = new WeakMap();
function all() { const rt = rtRef.current(); return Object.entries(rt.store.get('coupons', {})).map(([id, d]) => { d.ID = d.ID || id; let w = wrappers.get(d); if (!w) { w = new Coupon(d); w._collection = 'coupons'; w._store = rt.store; wrappers.set(d, w); } return w; }); }
const CouponMgr = {
  getCoupon(id) { return all().find((c) => c.getID() === id) || null; },
  getCoupons() { return new ArrayList(all()); },
  getCouponByCode(code) { return all().find((c) => c._hasCode(code)) || null; },
  getRedemptions(couponID, code) { const rt = rtRef.current(); return new ArrayList(rt.store.get('coupon-redemptions', []).filter((r) => r.couponID === couponID && (code === undefined || r.code === code)).map((r) => new CouponRedemption(r))); },
  getRedemptionCount(couponID, code) { return CouponMgr.getRedemptions(couponID, code).size(); },
  _redeem(couponID, code, order) { const rt = rtRef.current(); const list = rt.store.get('coupon-redemptions', []); list.push({ couponID, code, orderNo: order.getOrderNo(), customerEmail: order.getCustomerEmail(), date: new Date().toISOString() }); rt.store.touch('coupon-redemptions'); },
  getRedemptionCountForCustomer(couponID, code, email) { const rt = rtRef.current(); return rt.store.get('coupon-redemptions', []).filter((r) => r.couponID === couponID && r.customerEmail === email).length; },
};
module.exports = CouponMgr;
