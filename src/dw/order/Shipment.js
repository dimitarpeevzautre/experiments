'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const ArrayList = require('../util/ArrayList');
const Money = require('../value/Money');
const EnumValue = require('../value/EnumValue');
const OrderAddress = require('./OrderAddress');
const ShippingLineItem = require('./ShippingLineItem');
const PriceAdjustment = require('./PriceAdjustment');
const LineItem = require('./LineItem');
const sum = (arr) => LineItem.round(arr.reduce((s, v) => s + (v || 0), 0));

class Shipment extends ExtensibleObject {
  constructor(data, ctnr) { super(data); this._ctnr = ctnr; this._collection = ctnr._collection; this._store = ctnr._store; if (!data.shippingLineItems) data.shippingLineItems = []; if (!data.priceAdjustments) data.priceAdjustments = []; }
  _markDirty() { super._markDirty(); this._ctnr._markDirty(); }
  _cur() { return this._ctnr.getCurrencyCode(); }
  _m(v) { return new Money(v || 0, this._cur()); }
  getID() { return this._data.ID || 'me'; } setID(id) { this._data.ID = id; this._markDirty(); }
  getShipmentNo() { return this._data.shipmentNo || null; }
  isDefault() { return !!this._data.default; }
  getDefault() { return this.isDefault(); }
  getLineItemCtnr() { return this._ctnr; }
  isGift() { return !!this._data.gift; } setGift(b) { this._data.gift = !!b; this._markDirty(); }
  getGiftMessage() { return this._data.giftMessage || null; } setGiftMessage(m) { this._data.giftMessage = m; this._markDirty(); }
  getTrackingNumber() { return this._data.trackingNumber || null; } setTrackingNumber(t) { this._data.trackingNumber = t; this._markDirty(); }
  getShippingStatus() { return new EnumValue(this._data.shippingStatus == null ? Shipment.SHIPPING_STATUS_NOTSHIPPED : this._data.shippingStatus, this._data.shippingStatus === Shipment.SHIPPING_STATUS_SHIPPED ? 'SHIPPED' : 'NOTSHIPPED'); }
  setShippingStatus(s) { this._data.shippingStatus = s instanceof EnumValue ? s.getValue() : s; this._markDirty(); }
  getShippingAddress() { return this._data.shippingAddress ? new OrderAddress(this._data.shippingAddress, this._ctnr) : null; }
  createShippingAddress() { this._data.shippingAddress = { custom: {} }; this._markDirty(); return this.getShippingAddress(); }
  removeShippingAddress() { this._data.shippingAddress = null; this._markDirty(); }
  getShippingMethod() { const ShippingMgr = require('./ShippingMgr'); return this._data.shippingMethodID ? ShippingMgr._method(this._data.shippingMethodID) : null; }
  getShippingMethodID() { return this._data.shippingMethodID || null; }
  setShippingMethod(m) { this._data.shippingMethodID = m ? m.getID() : null; this._markDirty(); }
  getProductLineItems() { return new ArrayList(this._ctnr.getAllProductLineItems().toArray().filter((p) => (p._data.shipmentUUID || this._ctnr.getDefaultShipment().getUUID()) === this.getUUID())); }
  getGiftCertificateLineItems() { return new ArrayList(this._ctnr.getGiftCertificateLineItems().toArray().filter((g) => (g._data.shipmentUUID || this._ctnr.getDefaultShipment().getUUID()) === this.getUUID())); }
  getAllLineItems() { return new ArrayList([...this.getProductLineItems().toArray(), ...this.getGiftCertificateLineItems().toArray(), ...this.getShippingLineItems().toArray(), ...this.getShippingPriceAdjustments().toArray()]); }
  getShippingLineItems() { return new ArrayList(this._data.shippingLineItems.map((s) => new ShippingLineItem(s, this._ctnr, this))); }
  getShippingLineItem(id) { return this.getShippingLineItems().toArray().find((s) => s.getID() === id) || null; }
  getStandardShippingLineItem() { return this.getShippingLineItem(ShippingLineItem.STANDARD_SHIPPING_ID); }
  createShippingLineItem(id) { const d = { ID: id, price: 0, basePrice: 0, custom: {}, priceAdjustments: [] }; this._data.shippingLineItems.push(d); this._markDirty(); return new ShippingLineItem(d, this._ctnr, this); }
  removeShippingLineItem(sli) { this._data.shippingLineItems = this._data.shippingLineItems.filter((s) => s.UUID !== sli.getUUID()); this._markDirty(); }
  getShippingPriceAdjustments() { return new ArrayList(this._data.priceAdjustments.map((a) => new PriceAdjustment(a, this._ctnr, this))); }
  getAllShippingPriceAdjustments() { return new ArrayList([...this.getShippingPriceAdjustments().toArray(), ...this.getShippingLineItems().toArray().flatMap((s) => s.getShippingPriceAdjustments().toArray())]); }
  getShippingPriceAdjustmentByPromotionID(id) { return this.getAllShippingPriceAdjustments().toArray().find((a) => a.getPromotionID() === id) || null; }
  createShippingPriceAdjustment(promotionID) { const d = { promotionID, manual: true, price: 0, basePrice: 0, custom: {} }; this._data.priceAdjustments.push(d); this._markDirty(); return new PriceAdjustment(d, this._ctnr, this); }
  _createPromotionAdjustment(promotion, amount, discount, sli) { const d = { promotionID: promotion.getID(), price: amount.getValue(), basePrice: amount.getValue(), discount: discount ? discount._d : null, custom: {}, lineItemText: promotion.getCalloutMsg().getMarkup() }; (sli ? sli._data.priceAdjustments : this._data.priceAdjustments).push(d); this._markDirty(); const pa = new PriceAdjustment(d, this._ctnr, this); pa._recalc(); return pa; }
  removeShippingPriceAdjustment(pa) { this._data.priceAdjustments = this._data.priceAdjustments.filter((a) => a.UUID !== pa.getUUID()); for (const s of this._data.shippingLineItems) s.priceAdjustments = (s.priceAdjustments || []).filter((a) => a.UUID !== pa.getUUID()); this._markDirty(); }
  _clearPromotionAdjustments() { this._data.priceAdjustments = this._data.priceAdjustments.filter((a) => a.manual); for (const s of this._data.shippingLineItems) s.priceAdjustments = (s.priceAdjustments || []).filter((a) => a.manual); }
  // totals
  getMerchandizeTotalPrice() { return this._m(sum(this.getProductLineItems().toArray().map((p) => p._data.price))); }
  getAdjustedMerchandizeTotalPrice(withOrder) { return this._m(sum(this.getProductLineItems().toArray().map((p) => p.getAdjustedPrice(!!withOrder).getValue()))); }
  getProratedMerchandizeTotalPrice() { return this.getAdjustedMerchandizeTotalPrice(true); }
  getMerchandizeTotalTax() { return this._m(sum(this.getProductLineItems().toArray().map((p) => p._data.tax))); }
  getAdjustedMerchandizeTotalTax() { return this._m(sum(this.getProductLineItems().toArray().map((p) => p.getAdjustedTax().getValue()))); }
  getMerchandizeTotalNetPrice() { return this._m(sum(this.getProductLineItems().toArray().map((p) => p._data.netPrice))); }
  getMerchandizeTotalGrossPrice() { return this._m(sum(this.getProductLineItems().toArray().map((p) => p._data.grossPrice))); }
  getAdjustedMerchandizeTotalNetPrice() { return this._m(sum(this.getProductLineItems().toArray().map((p) => p.getAdjustedNetPrice().getValue()))); }
  getAdjustedMerchandizeTotalGrossPrice() { return this._m(sum(this.getProductLineItems().toArray().map((p) => p.getAdjustedGrossPrice().getValue()))); }
  getShippingTotalPrice() { return this._m(sum(this.getShippingLineItems().toArray().map((s) => s._data.price))); }
  getAdjustedShippingTotalPrice() { return this._m(sum(this.getShippingLineItems().toArray().map((s) => s.getAdjustedPrice().getValue())) + sum(this._data.priceAdjustments.map((a) => a.price))); }
  getShippingTotalTax() { return this._m(sum(this.getShippingLineItems().toArray().map((s) => s._data.tax))); }
  getAdjustedShippingTotalTax() { return this._m(sum(this.getShippingLineItems().toArray().map((s) => s.getAdjustedTax().getValue())) + sum(this._data.priceAdjustments.map((a) => a.tax))); }
  getShippingTotalNetPrice() { return this._m(sum(this.getShippingLineItems().toArray().map((s) => s._data.netPrice))); }
  getShippingTotalGrossPrice() { return this._m(sum(this.getShippingLineItems().toArray().map((s) => s._data.grossPrice))); }
  getAdjustedShippingTotalNetPrice() { return this.isTaxGross() ? this.getAdjustedShippingTotalPrice().subtract(this.getAdjustedShippingTotalTax()) : this.getAdjustedShippingTotalPrice(); }
  getAdjustedShippingTotalGrossPrice() { return this.isTaxGross() ? this.getAdjustedShippingTotalPrice() : this.getAdjustedShippingTotalPrice().add(this.getAdjustedShippingTotalTax()); }
  isTaxGross() { const TaxMgr = require('./TaxMgr'); return TaxMgr.getTaxationPolicy() === TaxMgr.TAX_POLICY_GROSS; }
  getGiftCertificateTotalPrice() { return this._m(sum(this.getGiftCertificateLineItems().toArray().map((g) => g._data.price))); }
  getGiftCertificateTotalTax() { return this._m(0); }
  getGiftCertificateTotalNetPrice() { return this.getGiftCertificateTotalPrice(); } getGiftCertificateTotalGrossPrice() { return this.getGiftCertificateTotalPrice(); }
  getTotalTax() { return this.getAdjustedMerchandizeTotalTax().add(this.getAdjustedShippingTotalTax()); }
  getTotalNetPrice() { return this.getAdjustedMerchandizeTotalNetPrice().add(this.getAdjustedShippingTotalNetPrice()).add(this.getGiftCertificateTotalPrice()); }
  getTotalGrossPrice() { return this.getAdjustedMerchandizeTotalGrossPrice().add(this.getAdjustedShippingTotalGrossPrice()).add(this.getGiftCertificateTotalPrice()); }
  getProductLineItemsCount() { return this.getProductLineItems().size(); }
  toString() { return `[Shipment ${this.getID()}]`; }
}
Object.assign(Shipment, { SHIPPING_STATUS_NOTSHIPPED: 0, SHIPPING_STATUS_SHIPPED: 2 });
module.exports = bean(Shipment);
