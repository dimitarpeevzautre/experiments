'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const ProductOptionValue = require('./ProductOptionValue');
class ProductOption {
  constructor(d, product) { this._d = d; this._p = product; }
  getID() { return this._d.ID; }
  getDisplayName() { return this._d.displayName || this._d.ID; }
  getDescription() { return this._d.description || null; }
  getImage() { return null; }
  getHtmlName() { return `dwopt_${this._p.getID()}_${this._d.ID}`; }
  getOptionValues() { return new ArrayList((this._d.values || []).map((v) => new ProductOptionValue(v, this))); }
  getDefaultValue() { const dv = (this._d.values || []).find((v) => v.default) || (this._d.values || [])[0]; return dv ? new ProductOptionValue(dv, this) : null; }
  equals(o) { return o instanceof ProductOption && o.getID() === this.getID(); }
}
module.exports = bean(ProductOption);
