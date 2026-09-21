'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const ArrayList = require('../util/ArrayList');
class CouponLineItem extends ExtensibleObject {
  constructor(data, ctnr) { super(data); this._ctnr = ctnr; this._collection = ctnr._collection; this._store = ctnr._store; this._applied = !!data.applied; }
  _markDirty() { super._markDirty(); this._ctnr._markDirty(); }
  getCouponCode() { return this._data.couponCode; }
  _coupon() { const CouponMgr = require('../campaign/CouponMgr'); return CouponMgr.getCouponByCode(this._data.couponCode); }
  _couponID() { const c = this._coupon(); return c ? c.getID() : null; }
  _promotions() { const c = this._coupon(); return c ? c.getPromotions().toArray() : []; }
  isValid() { const c = this._coupon(); return !!(c && c.isEnabled() && c._promotions_active()); }
  getValid() { return this.isValid(); }
  isApplied() { return this._applied; } getApplied() { return this._applied; }
  isBasedOnCampaign() { return this._promotions().some((p) => !!p.getCampaign()); }
  getPromotion() { const ps = this._promotions(); return ps[0] || null; }
  getPromotionID() { const p = this.getPromotion(); return p ? p.getID() : null; }
  getPromotions() { return new ArrayList(this._promotions()); }
  getStatusCode() { const Codes = require('../campaign/CouponStatusCodes'); if (!this._coupon()) return Codes.COUPON_CODE_UNKNOWN; if (!this._coupon().isEnabled()) return Codes.COUPON_DISABLED; if (!this._promotions().some((p) => p.isActive())) return Codes.NO_ACTIVE_PROMOTION; return this._applied ? Codes.APPLIED : Codes.NO_APPLICABLE_PROMOTION; }
  getPriceAdjustments() { const ids = this._promotions().map((p) => p.getID()); return new ArrayList(this._ctnr._allAdjustments().filter((a) => ids.includes(a.getPromotionID()))); }
  getBonusDiscountLineItems() { const ids = this._promotions().map((p) => p.getID()); return new ArrayList(this._ctnr.getBonusDiscountLineItems().toArray().filter((b) => ids.includes(b._data.promotionID))); }
  associatePriceAdjustment(pa) { pa._data.couponCode = this._data.couponCode; }
}
// helper on Coupon: any active promotion
require('../campaign/Coupon').prototype._promotions_active = function () { return this.getPromotions().toArray().some((p) => p.isActive()); };
module.exports = bean(CouponLineItem);
