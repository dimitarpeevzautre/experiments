'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const ArrayList = require('../util/ArrayList');
const MarkupText = require('../content/MarkupText');
const Money = require('../value/Money');
const Discount = require('./Discount');
/**
 * data/promotions.json entry:
 * { ID, name, promotionClass: 'product'|'order'|'shipping', enabled, campaign, calloutMsg, details, rank, exclusivity,
 *   startDate, endDate, customerGroups: [], coupons: [], sourceCodeGroups: [],
 *   discount: { type, value, quantity, ... }, products: [ids] | categories: [ids] | all: true (discounted products),
 *   qualifyingProducts/qualifyingCategories, minQuantity, minAmount (threshold), shippingMethods: [], combinable: true }
 */
class Promotion extends ExtensibleObject {
  constructor(d) { super(d); }
  getID() { return this._data.ID; } getName() { return this._data.name || this._data.ID; }
  getDescription() { return this._data.description || null; }
  getCalloutMsg() { return new MarkupText(this._data.calloutMsg || ''); }
  getDetails() { return new MarkupText(this._data.details || ''); }
  getImage() { const MediaFile = require('../content/MediaFile'); return this._data.image ? new MediaFile(this._data.image) : null; }
  getPromotionClass() { return (this._data.promotionClass || 'product').toUpperCase(); }
  isEnabled() { return this._data.enabled !== false; }
  isActive() { const now = Date.now(); const c = this.getCampaign(); if (c && !c.isActive()) return false; return this.isEnabled() && (!this._data.startDate || new Date(this._data.startDate).getTime() <= now) && (!this._data.endDate || new Date(this._data.endDate).getTime() >= now); }
  getStartDate() { return this._data.startDate ? new Date(this._data.startDate) : null; } getEndDate() { return this._data.endDate ? new Date(this._data.endDate) : null; }
  getRank() { return this._data.rank == null ? null : this._data.rank; }
  getExclusivity() { return this._data.exclusivity || Promotion.EXCLUSIVITY_NO; }
  getCampaign() { const PromotionMgr = require('./PromotionMgr'); return this._data.campaign ? PromotionMgr.getCampaign(this._data.campaign) : null; }
  getCustomerGroups() { const CM = require('../customer/CustomerMgr'); return new ArrayList((this._groups()).map((g) => CM.getCustomerGroup(g)).filter(Boolean)); }
  _groups() { const c = this.getCampaign(); return (this._data.customerGroups || []).concat(c ? c._data.customerGroups || [] : []); }
  _couponIDs() { const c = this.getCampaign(); return (this._data.coupons || []).concat(c ? c._data.coupons || [] : []); }
  getCoupons() { const CouponMgr = require('./CouponMgr'); return new ArrayList(this._couponIDs().map((id) => CouponMgr.getCoupon(id)).filter(Boolean)); }
  isBasedOnCoupons() { return this._couponIDs().length > 0; }
  isBasedOnCoupon() { return this.isBasedOnCoupons(); }
  isBasedOnCustomerGroups() { return this._groups().length > 0; }
  isBasedOnSourceCodes() { return (this._data.sourceCodeGroups || []).length > 0; }
  getSourceCodeGroups() { return new ArrayList(); }
  isRefinable() { return this._data.refinable !== false; }
  getQualifierMatchMode() { return this._data.qualifierMatchMode || 'any'; }
  getConditionalDescription() { return new MarkupText(this._data.conditionalDescription || ''); }
  getCombinablePromotions() { return new ArrayList(this._data.combinablePromotions || []); }
  getTags() { return new ArrayList(this._data.tags || []); }
  getPromotionalPrice(product, optionModel) {
    if (this.getPromotionClass() !== Promotion.PROMOTION_CLASS_PRODUCT || !this._appliesToProduct(product)) return Money.NOT_AVAILABLE;
    const base = product.getPriceModel(optionModel).getPrice();
    if (!base.isAvailable()) return Money.NOT_AVAILABLE;
    const d = this._discount(base.getCurrencyCode());
    if (!d || ['bonus', 'bonus_choice'].includes(this._data.discount.type)) return Money.NOT_AVAILABLE;
    if (this._data.discount.type === 'price_book_price') return product.getPriceModel().getPriceBookPrice(this._data.discount.priceBookID);
    return base.subtract(d._amountFor(base, 1));
  }
  _discount(currency) { return this._data.discount ? new Discount(this._data.discount, this, currency) : null; }
  _productIDs() { const PM = require('../catalog/ProductMgr'); const ids = new Set(this._data.products || []); for (const c of this._data.categories || []) for (const p of PM._byCategory(c, true)) ids.add(p.getID()); return Array.from(ids); }
  _appliesToProduct(product) {
    if (!product) return false;
    if (this._data.all || (!this._data.products && !this._data.categories && !this._data.excludedProducts)) return !(this._data.excludedProducts || []).includes(product.getID());
    const id = product.getID(); const master = product.isVariant() ? product.getVariationModel().getMaster() : null;
    if ((this._data.excludedProducts || []).includes(id)) return false;
    if ((this._data.products || []).includes(id) || (master && (this._data.products || []).includes(master.getID()))) return true;
    const cats = product.getAllCategories().toArray().map((c) => c.getID());
    return (this._data.categories || []).some((c) => cats.includes(c));
  }
  _qualifies(lineItemCtnr) {
    // customer groups
    const rt = require('../../runtime').current();
    const customer = lineItemCtnr && lineItemCtnr.getCustomer ? lineItemCtnr.getCustomer() || rt.context.customer : rt.context.customer;
    const groups = this._groups();
    if (groups.length && customer && !groups.some((g) => customer.isMemberOfCustomerGroup(g))) return false;
    if (this.isBasedOnCoupons()) { if (!lineItemCtnr) return false; const codes = lineItemCtnr.getCouponLineItems().toArray().filter((c) => c.isValid()).map((c) => c._couponID()); if (!this._couponIDs().some((id) => codes.includes(id))) return false; }
    if (lineItemCtnr && this._data.minAmount != null) { const total = lineItemCtnr.getMerchandizeTotalPrice ? lineItemCtnr.getMerchandizeTotalPrice() : null; if (!total || total.getValue() < this._data.minAmount) return false; }
    if (lineItemCtnr && this._data.minQuantity != null) { const q = lineItemCtnr.getProductQuantityTotal ? lineItemCtnr.getProductQuantityTotal() : 0; if (q < this._data.minQuantity) return false; }
    if (lineItemCtnr && (this._data.qualifyingProducts || this._data.qualifyingCategories)) {
      const plis = lineItemCtnr.getAllProductLineItems().toArray();
      const ok = plis.some((pli) => { const p = pli.getProduct(); if (!p) return false; if ((this._data.qualifyingProducts || []).includes(p.getID())) return true; const cats = p.getAllCategories().toArray().map((c) => c.getID()); return (this._data.qualifyingCategories || []).some((c) => cats.includes(c)); });
      if (!ok) return false;
    }
    return true;
  }
  toString() { return `[Promotion ${this._data.ID}]`; }
  equals(o) { return o instanceof Promotion && o.getID() === this.getID(); }
}
Object.assign(Promotion, { PROMOTION_CLASS_PRODUCT: 'PRODUCT', PROMOTION_CLASS_ORDER: 'ORDER', PROMOTION_CLASS_SHIPPING: 'SHIPPING', EXCLUSIVITY_NO: 'NO', EXCLUSIVITY_CLASS: 'CLASS', EXCLUSIVITY_GLOBAL: 'GLOBAL', QUALIFIER_MATCH_MODE_ANY: 'any', QUALIFIER_MATCH_MODE_ALL: 'all' });
module.exports = bean(Promotion);
