'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const Money = require('../value/Money');
/** Base line item: price fields stored as numbers in the currency of the container. */
class LineItem extends ExtensibleObject {
  constructor(data, ctnr) { super(data); this._ctnr = ctnr; if (ctnr) { this._collection = ctnr._collection; this._store = ctnr._store; } }
  _markDirty() { super._markDirty(); if (this._ctnr) this._ctnr._markDirty(); }
  _cur() { return this._ctnr.getCurrencyCode(); }
  _m(v) { return v == null ? Money.NOT_AVAILABLE : new Money(v, this._cur()); }
  getLineItemCtnr() { return this._ctnr; }
  getLineItemText() { return this._data.lineItemText || null; } setLineItemText(t) { this._data.lineItemText = t; this._markDirty(); }
  getBasePrice() { return this._m(this._data.basePrice); } setBasePrice(m) { this._data.basePrice = m.getValue(); this._markDirty(); }
  getPrice() { return this._m(this._data.price); }
  getPriceValue() { return this._data.price == null ? null : this._data.price; }
  setPriceValue(v) { this._data.price = v == null ? null : Number(v); this._data.basePrice = this._qty() ? this._data.price / this._qty() : this._data.price; this._data.priceOverride = true; this._recalc(); }
  getNetPrice() { return this._m(this._data.netPrice); } setNetPrice(m) { this._data.netPrice = m.getValue(); this._markDirty(); }
  getGrossPrice() { return this._m(this._data.grossPrice); } setGrossPrice(m) { this._data.grossPrice = m.getValue(); this._markDirty(); }
  getTax() { return this._m(this._data.tax); } setTax(m) { this._data.tax = m.getValue(); this._markDirty(); }
  getTaxRate() { return this._data.taxRate == null ? 0 : this._data.taxRate; } setTaxRate(r) { this._data.taxRate = r; this._markDirty(); }
  getTaxBasis() { return this.getPrice(); }
  getTaxClassID() { return this._data.taxClassID || null; } setTaxClassID(id) { this._data.taxClassID = id; this._markDirty(); }
  updateTax(rate, basis) { this._data.taxRate = rate == null ? this.getTaxRate() : rate; const b = basis ? basis.getValue() : this._data.price || 0; this._data.tax = round(b * this._data.taxRate); this._recalc(); }
  updateTaxAmount(tax) { this._data.tax = tax.getValue(); this._recalc(); }
  updatePrice(m) { this._data.price = m.getValue(); this._data.basePrice = this._qty() ? m.getValue() / this._qty() : m.getValue(); this._recalc(); }
  _qty() { return 1; }
  _recalc() {
    const TaxMgr = require('./TaxMgr');
    const p = this._data.price || 0; const t = this._data.tax || 0;
    if (TaxMgr.getTaxationPolicy() === TaxMgr.TAX_POLICY_GROSS) { this._data.grossPrice = p; this._data.netPrice = round(p - t); } else { this._data.netPrice = p; this._data.grossPrice = round(p + t); }
    this._markDirty();
  }
  isTaxPolicyGross() { const TaxMgr = require('./TaxMgr'); return TaxMgr.getTaxationPolicy() === TaxMgr.TAX_POLICY_GROSS; }
}
function round(v) { return Math.round((v + Number.EPSILON) * 100) / 100; }
LineItem.round = round;
module.exports = bean(LineItem);
