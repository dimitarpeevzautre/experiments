'use strict';
const { bean } = require('../../util/bean');
class CategoryAssignment {
  constructor(product, category) { this._p = product; this._c = category; }
  getProduct() { return this._p; } getCategory() { return this._c; }
  getCalloutMsg() { const MarkupText = require('../content/MarkupText'); return new MarkupText(this._p._data.calloutMsg || ''); }
  getShortDescription() { return this._p.getShortDescription(); } getLongDescription() { return this._p.getLongDescription(); }
  getName() { return this._p.getName(); } getImage() { return this._p.getImage('large'); }
  getCustom() { return this._p.getCustom(); }
}
module.exports = bean(CategoryAssignment);
