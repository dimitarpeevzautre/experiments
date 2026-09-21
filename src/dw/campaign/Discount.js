'use strict';
const { bean } = require('../../util/bean');
const Money = require('../value/Money');
/** Discount definitions: { type: 'amount'|'percentage'|'fixed_price'|'free'|'free_shipping'|'bonus'|'bonus_choice'|'price_book_price'|'total_fixed_price', value, quantity, productIDs, maxBonusItems, priceBookID } */
class Discount {
  constructor(def, promotion, currency) { this._d = def; this._promo = promotion; this._cur = currency; this._qty = def.quantity || 1; }
  getType() { return TYPE_MAP[this._d.type] || Discount.TYPE_AMOUNT; }
  getPromotion() { return this._promo; }
  getQuantity() { return this._qty; }
  getItemPromotionTiers() { return null; }
  // per-type accessors
  getAmount() { return new Money(this._d.value || 0, this._cur); }
  getPercentage() { return this._d.value || 0; }
  getFixedPrice() { return new Money(this._d.value || 0, this._cur); }
  getBonusProducts() { const ArrayList = require('../util/ArrayList'); const PM = require('../catalog/ProductMgr'); return new ArrayList((this._d.bonusProductIDs || this._d.productIDs || []).map((id) => PM.getProduct(id)).filter(Boolean)); }
  getBonusProductIDs() { const ArrayList = require('../util/ArrayList'); return new ArrayList(this._d.bonusProductIDs || this._d.productIDs || []); }
  getMaxBonusItems() { return this._d.maxBonusItems || 1; }
  getBonusProductPrice(p) { return new Money(0, this._cur); }
  getPriceBookID() { return this._d.priceBookID || null; }
  /** Apply to a base price for `qty` units → discount amount (positive Money). */
  _amountFor(base, qty = 1) {
    switch (this._d.type) {
      case 'percentage': return base.multiply(this._d.value / 100);
      case 'amount': return new Money(Math.min(base.getValue(), (this._d.value || 0) * (this._d.perUnit ? qty : 1)), this._cur);
      case 'fixed_price': { const target = new Money((this._d.value || 0) * qty, this._cur); return base.subtract(target).getValue() > 0 ? base.subtract(target) : new Money(0, this._cur); }
      case 'total_fixed_price': { const target = new Money(this._d.value || 0, this._cur); return base.subtract(target).getValue() > 0 ? base.subtract(target) : new Money(0, this._cur); }
      case 'free': case 'free_shipping': return base;
      case 'price_book_price': return new Money(0, this._cur);
      default: return new Money(0, this._cur);
    }
  }
}
const TYPE_MAP = { amount: 'AMOUNT', percentage: 'PERCENTAGE', fixed_price: 'FIXED_PRICE', free: 'FREE', free_shipping: 'FREE_SHIPPING', bonus: 'BONUS', bonus_choice: 'BONUS_CHOICE', price_book_price: 'PRICEBOOK_PRICE', total_fixed_price: 'TOTAL_FIXED_PRICE', percent_off_options: 'PERCENT_OFF_OPTIONS' };
Object.assign(Discount, { TYPE_AMOUNT: 'AMOUNT', TYPE_PERCENTAGE: 'PERCENTAGE', TYPE_FIXED_PRICE: 'FIXED_PRICE', TYPE_FREE: 'FREE', TYPE_FREE_SHIPPING: 'FREE_SHIPPING', TYPE_BONUS: 'BONUS', TYPE_BONUS_CHOICE: 'BONUS_CHOICE', TYPE_PRICEBOOK_PRICE: 'PRICEBOOK_PRICE', TYPE_TOTAL_FIXED_PRICE: 'TOTAL_FIXED_PRICE', TYPE_PERCENT_OFF_OPTIONS: 'PERCENT_OFF_OPTIONS', TYPE_FIXED_PRICE_SHIPPING: 'FIXED_PRICE_SHIPPING' });
module.exports = bean(Discount);
