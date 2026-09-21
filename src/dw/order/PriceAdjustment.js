'use strict';
const { bean } = require('../../util/bean');
const LineItem = require('./LineItem');
class PriceAdjustment extends LineItem {
  constructor(data, ctnr, parent) { super(data, ctnr); this._parent = parent || null; }
  getPromotionID() { return this._data.promotionID || null; }
  getPromotion() { const PromotionMgr = require('../campaign/PromotionMgr'); return this._data.promotionID ? PromotionMgr.getPromotion(this._data.promotionID) : null; }
  getCampaignID() { const p = this.getPromotion(); return p && p.getCampaign() ? p.getCampaign().getID() : null; }
  getCampaign() { const p = this.getPromotion(); return p ? p.getCampaign() : null; }
  isBasedOnCoupon() { const p = this.getPromotion(); return !!(p && p.isBasedOnCoupons()); }
  isBasedOnCampaign() { return !!this.getCampaignID(); }
  getCouponLineItem() { const p = this.getPromotion(); if (!p) return null; return this._ctnr.getCouponLineItems().toArray().find((c) => c._promotions().some((x) => x.getID() === p.getID())) || null; }
  isCustom() { return !!this._data.custom_adjustment || this._data.manual === true; }
  isManual() { return this._data.manual === true; }
  setManual(b) { this._data.manual = !!b; this._markDirty(); }
  getAppliedDiscount() { const Discount = require('../campaign/Discount'); const p = this.getPromotion(); return this._data.discount ? new Discount(this._data.discount, p, this._cur()) : (p ? p._discount(this._cur()) : null); }
  getQuantity() { return this._data.quantity == null ? 1 : this._data.quantity; }
  getReasonCode() { return this._data.reasonCode || null; } setReasonCode(c) { this._data.reasonCode = c; this._markDirty(); }
  getCreatedBy() { return this._data.createdBy || 'Customer'; }
  getProratedPrices() { const HashMap = require('../util/HashMap'); return new HashMap(); }
  setPriceValue(v) { this._data.price = Number(v); this._data.basePrice = Number(v); this._recalc(); }
  isPromotionAdjustment() { return !!this._data.promotionID && !this._data.manual; }
  getPromotionClass() { const p = this.getPromotion(); return p ? p.getPromotionClass() : null; }
}
module.exports = bean(PriceAdjustment);
