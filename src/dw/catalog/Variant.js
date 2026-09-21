'use strict';
const { bean } = require('../../util/bean');
const Product = require('./Product');
class Variant extends Product {
  getMasterProduct() { const D = require('./_data'); return D.product(this._data.masterID); }
  getName() { return this._data.name || (this.getMasterProduct() && this.getMasterProduct().getName()) || null; }
  getShortDescription() { return this._data.shortDescription != null ? super.getShortDescription() : (this.getMasterProduct() ? this.getMasterProduct().getShortDescription() : null); }
  getLongDescription() { return this._data.longDescription != null ? super.getLongDescription() : (this.getMasterProduct() ? this.getMasterProduct().getLongDescription() : null); }
  getBrand() { return this._data.brand || (this.getMasterProduct() && this.getMasterProduct().getBrand()) || null; }
  getCategories() { const c = super.getCategories(); return c.size() ? c : (this.getMasterProduct() ? this.getMasterProduct().getCategories() : c); }
  getPrimaryCategory() { return super.getPrimaryCategory() || (this.getMasterProduct() ? this.getMasterProduct().getPrimaryCategory() : null); }
  getImages(viewType) { const i = super.getImages(viewType); return i.size() ? i : (this.getMasterProduct() ? this.getMasterProduct().getImages(viewType) : i); }
  getTaxClassID() { return this._data.taxClassID || (this.getMasterProduct() && this.getMasterProduct().getTaxClassID()) || null; }
  getTemplate() { return this._data.template || (this.getMasterProduct() && this.getMasterProduct().getTemplate()) || null; }
  getVariationValues() { return this._data.variationValues || {}; }
}
module.exports = bean(Variant);
