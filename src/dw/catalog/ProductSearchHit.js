'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const Money = require('../value/Money');
class ProductSearchHit {
  /** @param product representative product (master or standalone) @param represented matching variants/products */
  constructor(product, represented, model) { this._p = product; this._rep = represented && represented.length ? represented : [product]; this._model = model; }
  getProduct() { return this._p; }
  getProductID() { return this._p.getID(); }
  getFirstRepresentedProduct() { return this._rep[0]; }
  getFirstRepresentedProductID() { return this._rep[0].getID(); }
  getLastRepresentedProduct() { return this._rep[this._rep.length - 1]; }
  getRepresentedProducts() { return new ArrayList(this._rep); }
  getRepresentedProductIDs() { return new ArrayList(this._rep.map((p) => p.getID())); }
  getRepresentedVariationValues(attr) { const vm = this._p.getVariationModel(); const id = attr && attr.getID ? attr.getID() : attr; const a = vm.getProductVariationAttribute(id); if (!a) return new ArrayList(); const seen = new Set(); const out = []; for (const v of this._rep) { const val = (v._data.variationValues || {})[id]; if (val !== undefined && !seen.has(String(val))) { seen.add(String(val)); out.push(vm._valueObj(a, val)); } } return new ArrayList(out); }
  getHitType() { return this._p.isMaster() ? ProductSearchHit.HIT_TYPE_PRODUCT_MASTER : this._p.isProductSet() ? ProductSearchHit.HIT_TYPE_PRODUCT_SET : this._p.isBundle() ? ProductSearchHit.HIT_TYPE_PRODUCT_BUNDLE : this._p.isVariationGroup() ? ProductSearchHit.HIT_TYPE_VARIATION_GROUP : ProductSearchHit.HIT_TYPE_SIMPLE; }
  _prices() { return this._rep.map((p) => p.getPriceModel().getPrice()).filter((m) => m.isAvailable()); }
  getMinPrice() { const p = this._prices(); return p.length ? p.reduce((a, b) => (b.getValue() < a.getValue() ? b : a)) : Money.NOT_AVAILABLE; }
  getMaxPrice() { const p = this._prices(); return p.length ? p.reduce((a, b) => (b.getValue() > a.getValue() ? b : a)) : Money.NOT_AVAILABLE; }
  getMinPricePerUnit() { return this.getMinPrice(); } getMaxPricePerUnit() { return this.getMaxPrice(); }
  isPriceRange() { const mn = this.getMinPrice(); const mx = this.getMaxPrice(); return mn.isAvailable() && mx.isAvailable() && mn.getValue() !== mx.getValue(); }
  getBonusDiscountLineItem() { return null; }
  getDiscountedPromotionIDs() { return new ArrayList(); }
}
Object.assign(ProductSearchHit, { HIT_TYPE_SIMPLE: 'product', HIT_TYPE_PRODUCT_MASTER: 'master', HIT_TYPE_PRODUCT_SET: 'set', HIT_TYPE_PRODUCT_BUNDLE: 'bundle', HIT_TYPE_VARIATION_GROUP: 'slicing_group' });
module.exports = bean(ProductSearchHit);
