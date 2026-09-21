'use strict';
const { bean } = require('../../util/bean');
const LineItem = require('./LineItem');
const PriceAdjustment = require('./PriceAdjustment');
const ArrayList = require('../util/ArrayList');
const Money = require('../value/Money');
class ShippingLineItem extends LineItem {
  constructor(data, ctnr, shipment) { super(data, ctnr); this._sh = shipment; if (!data.priceAdjustments) data.priceAdjustments = []; }
  getID() { return this._data.ID; }
  getShipment() { return this._sh; }
  isOrderExternallyTaxed() { return false; }
  getShippingPriceAdjustments() { return new ArrayList(this._data.priceAdjustments.map((a) => new PriceAdjustment(a, this._ctnr, this))); }
  getPriceAdjustments() { return this.getShippingPriceAdjustments(); }
  createShippingPriceAdjustment(promotionID) { const d = { promotionID, manual: true, price: 0, basePrice: 0, custom: {} }; this._data.priceAdjustments.push(d); return new PriceAdjustment(d, this._ctnr, this); }
  removeShippingPriceAdjustment(pa) { this._data.priceAdjustments = this._data.priceAdjustments.filter((a) => a.UUID !== pa.getUUID()); this._markDirty(); }
  _adjTotal() { return this._data.priceAdjustments.reduce((s, a) => s + (a.price || 0), 0); }
  getAdjustedPrice() { return this.getPrice().isAvailable() ? new Money(LineItem.round((this._data.price || 0) + this._adjTotal()), this._cur()) : Money.NOT_AVAILABLE; }
  getAdjustedTax() { return new Money(LineItem.round((this._data.tax || 0) + this._data.priceAdjustments.reduce((s, a) => s + (a.tax || 0), 0)), this._cur()); }
  getAdjustedNetPrice() { return this.isTaxPolicyGross() ? this.getAdjustedPrice().subtract(this.getAdjustedTax()) : this.getAdjustedPrice(); }
  getAdjustedGrossPrice() { return this.isTaxPolicyGross() ? this.getAdjustedPrice() : this.getAdjustedPrice().add(this.getAdjustedTax()); }
  updateTax(rate, basis) { super.updateTax(rate, basis); for (const a of this._data.priceAdjustments) { a.taxRate = this._data.taxRate; a.tax = LineItem.round((a.price || 0) * this._data.taxRate); } }
}
ShippingLineItem.STANDARD_SHIPPING_ID = 'STANDARD_SHIPPING';
module.exports = bean(ShippingLineItem);
