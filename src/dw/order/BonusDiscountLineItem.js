'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const ArrayList = require('../util/ArrayList');
const Money = require('../value/Money');
class BonusDiscountLineItem extends ExtensibleObject {
  constructor(data, ctnr) { super(data); this._ctnr = ctnr; this._collection = ctnr._collection; this._store = ctnr._store; }
  getPromotionID() { return this._data.promotionID; }
  getPromotion() { const PM = require('../campaign/PromotionMgr'); return PM.getPromotion(this._data.promotionID); }
  getCouponLineItem() { return this._ctnr.getCouponLineItems().toArray().find((c) => c._promotions().some((p) => p.getID() === this._data.promotionID)) || null; }
  getBonusProducts() { const PM = require('../catalog/ProductMgr'); return new ArrayList((this._data.bonusProductIDs || []).map((id) => PM.getProduct(id)).filter(Boolean)); }
  getMaxBonusItems() { return this._data.maxBonusItems || 1; }
  getBonusProductLineItems() { return new ArrayList(this._ctnr.getAllProductLineItems().toArray().filter((p) => p._data.bonusDiscountLineItemUUID === this.getUUID())); }
  getBonusProductPrice(product) { return new Money(0, this._ctnr.getCurrencyCode()); }
  isBonusChoiceRuleBased() { return !!this._data.ruleBased; }
  getRemainingBonusItems() { return this.getMaxBonusItems() - this.getBonusProductLineItems().toArray().reduce((s, p) => s + p.getQuantityValue(), 0); }
}
module.exports = bean(BonusDiscountLineItem);
