'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
class PromotionPlan {
  constructor(promotions) { this._p = promotions; }
  getPromotions(product) { if (product) return new ArrayList(this._p.filter((p) => p._appliesToProduct(product))); return new ArrayList(this._p); }
  getProductPromotions(product) { return new ArrayList(this._p.filter((p) => p.getPromotionClass() === 'PRODUCT' && (!product || p._appliesToProduct(product)))); }
  getProductPromotionsForDiscountedProduct(product) { return this.getProductPromotions(product); }
  getProductPromotionsForQualifyingProduct(product) { return this.getProductPromotions(product); }
  getOrderPromotions() { return new ArrayList(this._p.filter((p) => p.getPromotionClass() === 'ORDER')); }
  getShippingPromotions(method) { return new ArrayList(this._p.filter((p) => p.getPromotionClass() === 'SHIPPING' && (!method || !p._data.shippingMethods || p._data.shippingMethods.includes(method.getID ? method.getID() : method)))); }
  getPaymentCardPromotions() { return new ArrayList(); } getPaymentMethodPromotions() { return new ArrayList(); }
  getBonusPromotions() { return new ArrayList(this._p.filter((p) => p._data.discount && ['bonus', 'bonus_choice'].includes(p._data.discount.type))); }
  removePromotion(p) { this._p = this._p.filter((x) => x !== p); }
  _list() { return this._p; }
}
Object.assign(PromotionPlan, { SORT_BY_EXCLUSIVITY: 1, SORT_BY_START_DATE: 2 });
module.exports = bean(PromotionPlan);
