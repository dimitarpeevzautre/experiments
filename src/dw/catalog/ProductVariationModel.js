'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const FilteringCollection = require('../util/FilteringCollection');
const HashMap = require('../util/HashMap');
const ProductVariationAttribute = require('./ProductVariationAttribute');
const ProductVariationAttributeValue = require('./ProductVariationAttributeValue');
const URLUtils = require('../web/URLUtils');
const D = require('./_data');

class ProductVariationModel {
  constructor(product) {
    this._p = product;
    const masterData = product.isVariant() || product.isVariationGroup() ? D.productData(product._data.masterID) : product._data;
    this._master = masterData ? D.product(masterData.ID) : product;
    this._masterData = masterData || product._data;
    this._selected = {};
    if (product.isVariant() || product.isVariationGroup()) Object.assign(this._selected, product._data.variationValues || {});
  }
  _attrs() { return (this._masterData.variationAttributes || []).map((a) => new ProductVariationAttribute(a)); }
  _attrData(id) { return (this._masterData.variationAttributes || []).find((a) => a.ID === id) || null; }
  _variantIDs() { return this._masterData.variants || []; }
  _allVariants() { return this._variantIDs().map((id) => D.product(id)).filter(Boolean); }
  getMaster() { return this._master; }
  isMaster() { return this._p === this._master && this._p.isMaster(); }
  getProductVariationAttributes() { return new ArrayList(this._attrs()); }
  getProductVariationAttribute(id) { const a = this._attrData(id); return a ? new ProductVariationAttribute(a) : null; }
  getVariants(filter) {
    let vs = this._allVariants();
    if (filter) {
      const entries = filter instanceof HashMap ? Array.from(filter.entries()) : Object.entries(filter);
      vs = vs.filter((v) => entries.every(([k, val]) => String((v._data.variationValues || {})[k]) === String(val)));
    }
    return new FilteringCollection(vs, { ORDERABLE: (v) => v.getAvailabilityModel().isOrderable(), ONLINE: (v) => v.isOnline() }, { BYPRICE: (a, b) => a.getPriceModel().getPrice().getValue() - b.getPriceModel().getPrice().getValue() });
  }
  getVariationGroups() { return new ArrayList((this._masterData.variationGroups || []).map((id) => D.product(id)).filter(Boolean)); }
  getDefaultVariant() { const id = this._masterData.defaultVariant; const all = this._allVariants(); if (id) return D.product(id); return all.find((v) => v.getAvailabilityModel().isOrderable()) || all[0] || null; }
  getSelectedVariant() {
    const attrs = this._attrs();
    if (!attrs.length) return null;
    if (!attrs.every((a) => this._selected[a.getID()] !== undefined)) return null;
    return this._allVariants().find((v) => attrs.every((a) => String((v._data.variationValues || {})[a.getID()]) === String(this._selected[a.getID()]))) || null;
  }
  getSelectedVariants() { return new ArrayList(this._allVariants().filter((v) => Object.entries(this._selected).every(([k, val]) => String((v._data.variationValues || {})[k]) === String(val)))); }
  getSelectedValue(attr) { const v = this._selected[attr.getID()]; if (v === undefined) return null; return this._valueObj(attr, v); }
  isSelectedAttributeValue(attr, value) { return String(this._selected[attr.getID()]) === String(value.getID ? value.getID() : value); }
  setSelectedAttributeValue(attrID, valueID) { if (valueID === null || valueID === undefined || valueID === '') delete this._selected[attrID]; else this._selected[attrID] = valueID; }
  _valueObj(attr, v) {
    const a = this._attrData(attr.getID());
    const def = a && (a.values || []).find((x) => String(typeof x === 'object' ? x.value : x) === String(v));
    return new ProductVariationAttributeValue(def || { value: v }, attr);
  }
  getAllValues(attr) {
    const a = this._attrData(attr.getID());
    if (a && a.values && a.values.length) return new ArrayList(a.values.map((v) => new ProductVariationAttributeValue(v, attr)));
    const seen = new Map();
    for (const v of this._allVariants()) { const val = (v._data.variationValues || {})[attr.getID()]; if (val !== undefined && !seen.has(String(val))) seen.set(String(val), this._valueObj(attr, val)); }
    return new ArrayList(Array.from(seen.values()));
  }
  getFilteredValues(attr) {
    const others = Object.entries(this._selected).filter(([k]) => k !== attr.getID());
    const vals = new Set(this._allVariants().filter((v) => others.every(([k, val]) => String((v._data.variationValues || {})[k]) === String(val))).map((v) => String((v._data.variationValues || {})[attr.getID()])));
    return new ArrayList(this.getAllValues(attr).toArray().filter((v) => vals.has(String(v.getValue()))));
  }
  hasOrderableVariants(attr, value) {
    const others = Object.entries(this._selected).filter(([k]) => k !== attr.getID());
    return this._allVariants().some((v) => String((v._data.variationValues || {})[attr.getID()]) === String(value.getID ? value.getID() : value) && others.every(([k, val]) => String((v._data.variationValues || {})[k]) === String(val)) && v.getAvailabilityModel().isOrderable());
  }
  getVariationValue(product, attr) { const v = (product._data.variationValues || {})[attr.getID()]; return v === undefined ? null : this._valueObj(attr, v); }
  getHtmlName(attr) { return `dwvar_${this._master.getID()}_${attr.getID()}`; }
  getImages(viewType) { const sv = this.getSelectedVariant(); const src = sv || this._p; return src.getImages(viewType); }
  getImage(viewType, index) { const sv = this.getSelectedVariant(); return (sv || this._p).getImage(viewType, index || 0); }
  _params() { const out = ['pid', this._master.getID()]; for (const [k, v] of Object.entries(this._selected)) out.push(`dwvar_${this._master.getID()}_${k}`, v); return out; }
  url(action, ...params) { return URLUtils.url(action, ...this._params(), ...params); }
  urlSelectVariationValue(action, attr, value) { const sel = Object.assign({}, this._selected, { [attr.getID()]: value.getID ? value.getID() : value }); const p = ['pid', this._master.getID()]; for (const [k, v] of Object.entries(sel)) p.push(`dwvar_${this._master.getID()}_${k}`, v); return URLUtils.url(action, ...p); }
  urlUnselectVariationValue(action, attr) { const sel = Object.assign({}, this._selected); delete sel[attr.getID()]; const p = ['pid', this._master.getID()]; for (const [k, v] of Object.entries(sel)) p.push(`dwvar_${this._master.getID()}_${k}`, v); return URLUtils.url(action, ...p); }
  getSelectedVariationValue(attr) { return this.getSelectedValue(attr); }
  setSelectedVariationValue(attrID, valueID) { this.setSelectedAttributeValue(attrID, valueID); }
  getProductVariationAttributeValue(attr, valueID) { return this.getAllValues(attr).toArray().find((v) => String(v.getID()) === String(valueID)) || null; }
  getVariationValues(attr) { return this.getAllValues(attr); }
}
module.exports = bean(ProductVariationModel);
