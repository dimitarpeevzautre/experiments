'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const ApproachingDiscount = require('./ApproachingDiscount');
/** Result of evaluating promotions against a basket. Holds product/shipping/order discounts to be applied. */
class DiscountPlan {
  constructor(ctnr, entries) { this._ctnr = ctnr; this._entries = entries; /* {target: 'product'|'order'|'shipping'|'bonus', item, promotion, discount} */ }
  getLineItemCtnr() { return this._ctnr; }
  getProductDiscounts(pli) { return new ArrayList(this._entries.filter((e) => e.target === 'product' && e.item === pli).map((e) => e.discount)); }
  getShippingDiscounts(shipment) { return new ArrayList(this._entries.filter((e) => e.target === 'shipping' && e.item === shipment).map((e) => e.discount)); }
  getOrderDiscounts() { return new ArrayList(this._entries.filter((e) => e.target === 'order').map((e) => e.discount)); }
  getBonusDiscounts() { return new ArrayList(this._entries.filter((e) => e.target === 'bonus').map((e) => e.discount)); }
  removeDiscount(d) { this._entries = this._entries.filter((e) => e.discount !== d); }
  getApproachingOrderDiscounts() { return this._approaching('ORDER', this._ctnr.getMerchandizeTotalPrice ? this._ctnr.getAdjustedMerchandizeTotalPrice(false).getValue() : 0); }
  getApproachingShippingDiscounts(shipment) { return this._approaching('SHIPPING', this._ctnr.getAdjustedMerchandizeTotalPrice ? this._ctnr.getAdjustedMerchandizeTotalPrice(false).getValue() : 0); }
  _approaching(cls, current) {
    const PromotionMgr = require('./PromotionMgr');
    const cur = this._ctnr.getCurrencyCode();
    const out = [];
    for (const p of PromotionMgr.getActiveCustomerPromotions().getPromotions().toArray()) {
      if (p.getPromotionClass() !== cls || p._data.minAmount == null) continue;
      if (p.isBasedOnCoupons() && !p._qualifies(this._ctnr)) continue;
      if (current < p._data.minAmount) out.push(new ApproachingDiscount(p, p._discount(cur), p._data.minAmount, current, cur));
    }
    return new ArrayList(out);
  }
  _entriesFor(target) { return this._entries.filter((e) => e.target === target); }
}
module.exports = bean(DiscountPlan);
