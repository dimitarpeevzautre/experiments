'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const ArrayList = require('../util/ArrayList');
/** data/shipping-methods.json: { ID: { displayName, description, default, online, taxClassID, currencyCode, cost: number | [{threshold, cost}], countries: [], excludedProducts: [] } } */
class ShippingMethod extends ExtensibleObject {
  constructor(d) { super(d); }
  getID() { return this._data.ID; }
  getDisplayName() { return this._data.displayName || this._data.ID; }
  getDescription() { return this._data.description || null; }
  isDefaultMethod() { return !!this._data.default; }
  getDefaultMethod() { return this.isDefaultMethod(); }
  isOnline() { return this._data.online !== false; }
  getTaxClassID() { return this._data.taxClassID || null; }
  getCurrencyCode() { return this._data.currencyCode || null; }
  getBaseMethod() { const ShippingMgr = require('./ShippingMgr'); return this._data.baseMethod ? ShippingMgr._method(this._data.baseMethod) : null; }
  getDependentMethods() { const ShippingMgr = require('./ShippingMgr'); return new ArrayList(ShippingMgr._all().filter((m) => m._data.baseMethod === this._data.ID)); }
  _cost(basketTotal) { const c = this._data.cost; if (c == null) return 0; if (typeof c === 'number') return c; const tiers = c.slice().sort((a, b) => (a.threshold || 0) - (b.threshold || 0)); let v = tiers[0] ? tiers[0].cost : 0; for (const t of tiers) if ((t.threshold || 0) <= basketTotal) v = t.cost; return v; }
  _applicable(address) { if (!address || !this._data.countries) return true; const cc = address.getCountryCode ? address.getCountryCode().getValue() : address.countryCode; return !cc || this._data.countries.map((x) => x.toUpperCase()).includes(String(cc).toUpperCase()); }
  equals(o) { return o instanceof ShippingMethod && o.getID() === this.getID(); }
}
module.exports = bean(ShippingMethod);
