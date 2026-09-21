'use strict';
const { bean } = require('../../util/bean');
class Recommendation {
  constructor(d, source) { this._d = d; this._src = source; }
  getRecommendedItem() { const D = require('./_data'); return D.product(this._d.target); }
  getRecommendedItemID() { return this._d.target; }
  getRecommendationType() { return this._d.type || 1; }
  getCalloutMsg() { const MarkupText = require('../content/MarkupText'); return new MarkupText(this._d.calloutMsg || ''); }
  getShortDescription() { const MarkupText = require('../content/MarkupText'); return new MarkupText(this._d.shortDescription || ''); }
  getLongDescription() { const MarkupText = require('../content/MarkupText'); return new MarkupText(this._d.longDescription || ''); }
  getName() { return this._d.name || null; } getImage() { return null; } getCustom() { return this._d.custom || {}; }
}
module.exports = bean(Recommendation);
