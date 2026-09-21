'use strict';
const { bean } = require('../../util/bean');
class ProductVariationAttribute {
  constructor(d) { this._d = d; }
  getID() { return this._d.ID; }
  getAttributeID() { return this._d.attributeID || this._d.ID; }
  getDisplayName() { return this._d.displayName || this._d.ID; }
  equals(o) { return o instanceof ProductVariationAttribute && o.getID() === this.getID(); }
  toString() { return this._d.ID; }
}
module.exports = bean(ProductVariationAttribute);
