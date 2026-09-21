'use strict';
const { bean } = require('../../util/bean');
const MediaFile = require('../content/MediaFile');
class ProductVariationAttributeValue {
  constructor(d, attr) { this._d = typeof d === 'object' ? d : { value: d }; this._attr = attr; }
  getID() { return String(this._d.value); }
  getValue() { return this._d.value; }
  getDisplayValue() { return this._d.displayValue != null ? this._d.displayValue : String(this._d.value); }
  getDescription() { return this._d.description || null; }
  getImage(viewType) { return this._d.images && this._d.images[viewType] ? new MediaFile(Array.isArray(this._d.images[viewType]) ? this._d.images[viewType][0] : this._d.images[viewType], viewType) : null; }
  getImages(viewType) { const ArrayList = require('../util/ArrayList'); const i = this._d.images && this._d.images[viewType]; return new ArrayList(i ? (Array.isArray(i) ? i : [i]).map((x) => new MediaFile(x, viewType)) : []); }
  equals(o) { return o instanceof ProductVariationAttributeValue ? String(o._d.value) === String(this._d.value) : String(o) === String(this._d.value); }
  toString() { return String(this._d.value); }
}
module.exports = bean(ProductVariationAttributeValue);
