'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const MarkupText = require('../content/MarkupText');
class SlotContent {
  constructor(d) { this._d = d; }
  getSlotID() { return this._d.slotID; } getSlotConfigurationID() { return this._d.configID || 'default'; }
  getCalloutMsg() { return new MarkupText(this._d.calloutMsg || ''); }
  getCustom() { return this._d.custom || {}; }
  getContent() {
    const rt = require('../../runtime').current();
    const items = this._d.content || [];
    return new ArrayList(items.map((c) => { if (this._d.contentType === 'products') return rt.dw.get('catalog/ProductMgr').getProduct(c); if (this._d.contentType === 'categories') return rt.dw.get('catalog/CatalogMgr').getCategory(c); if (this._d.contentType === 'content_assets') return rt.dw.get('content/ContentMgr').getContent(c); if (this._d.contentType === 'recommended_products') return rt.dw.get('catalog/ProductMgr').getProduct(c); return new MarkupText(c); }).filter(Boolean));
  }
  getRecommenderName() { return this._d.recommenderName || null; }
}
module.exports = bean(SlotContent);
