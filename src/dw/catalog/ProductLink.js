'use strict';
const { bean } = require('../../util/bean');
class ProductLink {
  constructor(d, source) { this._d = d; this._src = source; }
  getSourceProduct() { return this._src; }
  getTargetProduct() { const D = require('./_data'); return D.product(this._d.target); }
  getTypeCode() { return this._d.type || ProductLink.LINKTYPE_OTHER; }
}
Object.assign(ProductLink, { LINKTYPE_CROSS_SELL: 1, LINKTYPE_REPLACEMENT: 2, LINKTYPE_UP_SELL: 3, LINKTYPE_ACCESSORY: 4, LINKTYPE_NEWER_VERSION: 5, LINKTYPE_ALT_ORDERUNIT: 6, LINKTYPE_SPARE_PART: 7, LINKTYPE_OTHER: 8 });
module.exports = bean(ProductLink);
