'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const Money = require('../value/Money');
const URLUtils = require('../web/URLUtils');
const ProductOption = require('./ProductOption');
class ProductOptionModel {
  constructor(product) { this._p = product; this._selected = {}; for (const o of this.getOptions().toArray()) { const dv = o.getDefaultValue(); if (dv) this._selected[o.getID()] = dv.getID(); } }
  _currency() { const rt = require('../../runtime').current(); return rt.context.session.getCurrency().getCurrencyCode(); }
  getOptions() { return new ArrayList((this._p._data.options || []).map((o) => new ProductOption(o, this._p))); }
  getOption(id) { return this.getOptions().toArray().find((o) => o.getID() === id) || null; }
  getOptionValues(option) { return option.getOptionValues(); }
  getOptionValue(option, valueID) { return option.getOptionValues().toArray().find((v) => v.getID() === valueID) || null; }
  getSelectedOptionValue(option) { const id = this._selected[option.getID()]; return id ? this.getOptionValue(option, id) : null; }
  setSelectedOptionValue(option, value) { this._selected[option.getID()] = value ? value.getID() : undefined; }
  isSelectedOptionValue(option, value) { return this._selected[option.getID()] === value.getID(); }
  getPrice(value) { return new Money(value._price(this._currency()), this._currency()); }
  getDefaultOptionValue(option) { return option.getDefaultValue(); }
  getSelectedOptionValues() { return new ArrayList(this.getOptions().toArray().map((o) => this.getSelectedOptionValue(o)).filter(Boolean)); }
  _totalOptionPrice() { return this.getSelectedOptionValues().toArray().reduce((s, v) => s + v._price(this._currency()), 0); }
  _params() { const out = []; for (const [k, v] of Object.entries(this._selected)) if (v) out.push(`dwopt_${this._p.getID()}_${k}`, v); return out; }
  url(action, ...params) { return URLUtils.url(action, 'pid', this._p.getID(), ...this._params(), ...params); }
  urlSelectOptionValue(action, option, value) { const sel = Object.assign({}, this._selected, { [option.getID()]: value.getID() }); const p = ['pid', this._p.getID()]; for (const [k, v] of Object.entries(sel)) p.push(`dwopt_${this._p.getID()}_${k}`, v); return URLUtils.url(action, ...p); }
}
module.exports = bean(ProductOptionModel);
