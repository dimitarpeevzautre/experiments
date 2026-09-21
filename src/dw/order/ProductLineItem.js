'use strict';
const { bean } = require('../../util/bean');
const LineItem = require('./LineItem');
const PriceAdjustment = require('./PriceAdjustment');
const ArrayList = require('../util/ArrayList');
const Quantity = require('../value/Quantity');
const Money = require('../value/Money');

class ProductLineItem extends LineItem {
  constructor(data, ctnr) { super(data, ctnr); if (!data.priceAdjustments) data.priceAdjustments = []; if (data.quantity == null) data.quantity = 1; }
  _qty() { return this._data.quantity || 1; }
  getProductID() { return this._data.productID; }
  getProduct() { const PM = require('../catalog/ProductMgr'); return this._data.productID ? PM.getProduct(this._data.productID) : null; }
  getProductName() { const p = this.getProduct(); return this._data.productName || (p ? p.getName() : null); }
  setProductName(n) { this._data.productName = n; this._markDirty(); }
  getLineItemText() { return this._data.lineItemText || this.getProductName(); }
  isCatalogProduct() { return !!this.getProduct(); }
  getCatalogProduct() { return this.isCatalogProduct(); }
  getQuantity() { const p = this.getProduct(); return new Quantity(this._data.quantity, p ? p.getUnit() || '' : ''); }
  getQuantityValue() { return this._data.quantity; }
  setQuantityValue(q) { if (q <= 0) throw new Error('Quantity must be > 0'); this._data.quantity = q; for (const b of this.getBundledProductLineItems().toArray()) b._data.quantity = q * (b._data.bundleQty || 1); this._updatePriceFromProduct(); }
  getMinOrderQuantity() { const p = this.getProduct(); return p ? p.getMinOrderQuantity() : new Quantity(1, ''); }
  getMinOrderQuantityValue() { return this.getMinOrderQuantity().getValue(); }
  getStepQuantity() { const p = this.getProduct(); return p ? p.getStepQuantity() : new Quantity(1, ''); }
  getShipment() { return this._ctnr.getShipments().toArray().find((s) => s.getUUID() === this._data.shipmentUUID) || this._ctnr.getDefaultShipment(); }
  setShipment(s) { this._data.shipmentUUID = s.getUUID(); this._markDirty(); }
  getPosition() { return this._data.position || 0; } setPosition(p) { this._data.position = p; this._markDirty(); }
  isGift() { return !!this._data.gift; } setGift(b) { this._data.gift = !!b; this._markDirty(); }
  getGiftMessage() { return this._data.giftMessage || null; } setGiftMessage(m) { this._data.giftMessage = m; this._markDirty(); }
  getManufacturerName() { const p = this.getProduct(); return this._data.manufacturerName || (p ? p.getManufacturerName() : null); } setManufacturerName(v) { this._data.manufacturerName = v; }
  getManufacturerSKU() { const p = this.getProduct(); return this._data.manufacturerSKU || (p ? p.getManufacturerSKU() : null); } setManufacturerSKU(v) { this._data.manufacturerSKU = v; }
  getCategory() { const CatalogMgr = require('../catalog/CatalogMgr'); return this._data.categoryID ? CatalogMgr.getCategory(this._data.categoryID) : null; }
  getCategoryID() { return this._data.categoryID || null; } setCategoryID(id) { this._data.categoryID = id; this._markDirty(); }
  getProductInventoryList() { const PIM = require('../catalog/ProductInventoryMgr'); return this._data.inventoryListID ? PIM.getInventoryList(this._data.inventoryListID) : null; }
  getProductInventoryListID() { return this._data.inventoryListID || null; }
  setProductInventoryList(l) { this._data.inventoryListID = l ? l.getID() : null; this._markDirty(); }
  isReserved() { return !!this._data.reserved; }
  getExternalLineItemStatus() { return this._data.externalLineItemStatus || null; } setExternalLineItemStatus(s) { this._data.externalLineItemStatus = s; }
  getExternalLineItemText() { return this._data.externalLineItemText || null; } setExternalLineItemText(s) { this._data.externalLineItemText = s; }
  // option / bundle structure
  isOptionProductLineItem() { return !!this._data.optionID; }
  getOptionProductLineItem() { return this.isOptionProductLineItem(); }
  getOptionID() { return this._data.optionID || null; }
  getOptionValueID() { return this._data.optionValueID || null; }
  getParent() { return this._data.parentUUID ? this._ctnr.getAllProductLineItems().toArray().find((p) => p.getUUID() === this._data.parentUUID) || null : null; }
  getOptionProductLineItems() { return new ArrayList(this._ctnr.getAllProductLineItems().toArray().filter((p) => p._data.parentUUID === this.getUUID() && p._data.optionID)); }
  getBundledProductLineItems() { return new ArrayList(this._ctnr.getAllProductLineItems().toArray().filter((p) => p._data.parentUUID === this.getUUID() && !p._data.optionID)); }
  isBundledProductLineItem() { return !!this._data.parentUUID && !this._data.optionID; }
  getBundledProductLineItem() { return this.isBundledProductLineItem(); }
  getOptionModel() { const p = this.getProduct(); if (!p) return null; const om = p.getOptionModel(); for (const o of this.getOptionProductLineItems().toArray()) { const opt = om.getOption(o.getOptionID()); if (opt) om.setSelectedOptionValue(opt, om.getOptionValue(opt, o.getOptionValueID())); } return om; }
  isBonusProductLineItem() { return !!this._data.bonus; }
  getBonusProductLineItem() { return this.isBonusProductLineItem(); }
  getBonusDiscountLineItem() { return this._data.bonusDiscountLineItemUUID ? this._ctnr.getBonusDiscountLineItems().toArray().find((b) => b.getUUID() === this._data.bonusDiscountLineItemUUID) || null : null; }
  getQuantityOptions() { return null; }
  // pricing
  _updatePriceFromProduct() {
    if (this._data.priceOverride) { this._data.price = LineItem.round(this._data.basePrice * this._qty()); this._recalc(); return; }
    const p = this.getProduct();
    let base;
    if (this.isOptionProductLineItem()) { const parent = this.getParent(); const pp = parent ? parent.getProduct() : null; const om = pp ? pp.getOptionModel() : null; const opt = om ? om.getOption(this._data.optionID) : null; const val = opt ? om.getOptionValue(opt, this._data.optionValueID) : null; base = val ? om.getPrice(val).multiply(1) : new Money(0, this._cur()); this._data.basePrice = base.getValue(); this._data.price = LineItem.round(base.getValue() * this._qty()); if (this._data.taxClassID == null && pp) this._data.taxClassID = pp.getTaxClassID(); this._recalc(); return; }
    if (!p) { this._recalc(); return; }
    base = p.getPriceModel().getPrice(this.getQuantity());
    if (this.isBonusProductLineItem()) base = new Money(0, this._cur());
    if (this.isBundledProductLineItem()) base = new Money(0, this._cur());
    if (!base.isAvailable()) { this._data.basePrice = null; this._data.price = null; this._markDirty(); return; }
    this._data.basePrice = base.getValue();
    this._data.price = LineItem.round(base.getValue() * this._qty());
    if (this._data.taxClassID == null) this._data.taxClassID = p.getTaxClassID();
    this._recalc();
  }
  updatePrice(m) { this._data.price = m.getValue(); this._data.basePrice = m.getValue() / this._qty(); this._data.priceOverride = true; this._recalc(); }
  updateOptionPrice() { this._updatePriceFromProduct(); }
  getPriceAdjustments() { return new ArrayList(this._data.priceAdjustments.map((a) => new PriceAdjustment(a, this._ctnr, this))); }
  getPriceAdjustmentByPromotionID(id) { return this.getPriceAdjustments().toArray().find((a) => a.getPromotionID() === id) || null; }
  getPriceAdjustmentsByPromotionID(id) { return new ArrayList(this.getPriceAdjustments().toArray().filter((a) => a.getPromotionID() === id)); }
  createPriceAdjustment(promotionID, discount) { const d = { promotionID, manual: !discount || !discount._promo, price: 0, basePrice: 0, quantity: this._qty(), custom: {} }; if (discount) { d.discount = discount._d; const amt = discount._amountFor(this.getPrice(), this._qty()); d.price = -amt.getValue(); d.basePrice = d.price; } this._data.priceAdjustments.push(d); const pa = new PriceAdjustment(d, this._ctnr, this); pa._recalc(); this._recalcAdjusted(); return pa; }
  _createPromotionAdjustment(promotion, amount, discount) { const d = { promotionID: promotion.getID(), price: amount.getValue(), basePrice: amount.getValue(), quantity: this._qty(), discount: discount ? discount._d : null, custom: {}, lineItemText: promotion.getCalloutMsg().getMarkup() }; this._data.priceAdjustments.push(d); const pa = new PriceAdjustment(d, this._ctnr, this); pa._recalc(); this._recalcAdjusted(); return pa; }
  removePriceAdjustment(pa) { const i = this._data.priceAdjustments.findIndex((a) => a.UUID === pa.getUUID()); if (i !== -1) this._data.priceAdjustments.splice(i, 1); this._recalcAdjusted(); }
  removePriceAdjustments() { this._data.priceAdjustments = []; this._recalcAdjusted(); }
  _clearPromotionAdjustments() { this._data.priceAdjustments = this._data.priceAdjustments.filter((a) => a.manual); this._recalcAdjusted(); }
  _recalcAdjusted() { this._markDirty(); }
  _adjTotal() { return this._data.priceAdjustments.reduce((s, a) => s + (a.price || 0), 0); }
  getAdjustedPrice(withOrderAdj) { if (!this.getPrice().isAvailable()) return Money.NOT_AVAILABLE; let v = (this._data.price || 0) + this._adjTotal(); if (withOrderAdj) v += this._proratedOrderAdj(); return new Money(LineItem.round(v), this._cur()); }
  getProratedPrice() { return this.getAdjustedPrice(true); }
  _proratedOrderAdj() { const ctnr = this._ctnr; const total = ctnr.getAdjustedMerchandizeTotalPrice(false).getValue(); if (!total) return 0; const orderAdj = ctnr._orderAdjTotal(); return LineItem.round((orderAdj * this.getAdjustedPrice(false).getValue()) / total); }
  getAdjustedTax() { return new Money(LineItem.round((this._data.tax || 0) + this._data.priceAdjustments.reduce((s, a) => s + (a.tax || 0), 0)), this._cur()); }
  getAdjustedNetPrice() { const TaxMgr = require('./TaxMgr'); return TaxMgr.getTaxationPolicy() === TaxMgr.TAX_POLICY_GROSS ? this.getAdjustedPrice().subtract(this.getAdjustedTax()) : this.getAdjustedPrice(); }
  getAdjustedGrossPrice() { const TaxMgr = require('./TaxMgr'); return TaxMgr.getTaxationPolicy() === TaxMgr.TAX_POLICY_GROSS ? this.getAdjustedPrice() : this.getAdjustedPrice().add(this.getAdjustedTax()); }
  getProratedPriceAdjustmentPrices() { const HashMap = require('../util/HashMap'); return new HashMap(); }
  updateTax(rate, basis) { super.updateTax(rate, basis); for (const a of this._data.priceAdjustments) { a.taxRate = this._data.taxRate; a.tax = LineItem.round((a.price || 0) * this._data.taxRate); } this._markDirty(); }
  updateTaxAmount(tax) { super.updateTaxAmount(tax); }
  getShippingLineItem() { const sh = this.getShipment(); return sh ? sh.getShippingLineItems().toArray().find((s) => s._data.productLineItemUUID === this.getUUID()) || null : null; }
  replaceProduct(product) { this._data.productID = product.getID(); this._data.productName = product.getName(); delete this._data.priceOverride; this._updatePriceFromProduct(); }
  getOrderItem() { return null; }
  getTaxBasis() { return this.getPrice(); }
  toString() { return `[ProductLineItem ${this._data.productID} x${this._data.quantity}]`; }
}
module.exports = bean(ProductLineItem);
