'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
class PriceBook extends ExtensibleObject {
  constructor(data) { super(data); }
  getID() { return this._data.ID; }
  getCurrencyCode() { return (this._data.currencyCode || 'USD').toUpperCase(); }
  getDisplayName() { return this._data.displayName || this._data.ID; }
  getDescription() { return this._data.description || null; }
  isOnline() { return this._data.online !== false; }
  getOnlineFlag() { return this.isOnline(); }
  getOnlineFrom() { return this._data.onlineFrom ? new Date(this._data.onlineFrom) : null; }
  getOnlineTo() { return this._data.onlineTo ? new Date(this._data.onlineTo) : null; }
  getParentPriceBook() { const PBM = require('./PriceBookMgr'); return this._data.parent ? PBM.getPriceBook(this._data.parent) : null; }
  /** Price definition for a product: number | { price, tiers: [{quantity, price}], from, to } */
  _priceDef(productID) { const p = (this._data.prices || {})[productID]; return p === undefined ? null : p; }
  equals(o) { return o instanceof PriceBook && o.getID() === this.getID(); }
}
module.exports = bean(PriceBook);
