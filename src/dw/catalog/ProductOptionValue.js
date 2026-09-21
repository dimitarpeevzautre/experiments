'use strict';
const { bean } = require('../../util/bean');
class ProductOptionValue {
  constructor(d, option) { this._d = d; this._o = option; }
  getID() { return this._d.ID; } getDisplayValue() { return this._d.displayValue || this._d.ID; } getDescription() { return this._d.description || null; }
  getProductIDModifier() { return this._d.productIDModifier || null; } getProductOption() { return this._o; }
  _price(currency) { const p = this._d.price; if (p == null) return 0; if (typeof p === 'object') return p[currency] != null ? p[currency] : 0; return p; }
  equals(o) { return o instanceof ProductOptionValue && o.getID() === this.getID() && o._o.getID() === this._o.getID(); }
}
module.exports = bean(ProductOptionValue);
