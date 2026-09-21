'use strict';
const { bean } = require('../../util/bean');
const Region = require('./Region');
class Page {
  constructor(d) { this._d = d; }
  getID() { return this._d.ID || this._d.id; }
  getTypeID() { return this._d.typeID || this._d.type; }
  getName() { return this._d.name || this.getID(); }
  getDescription() { return this._d.description || null; }
  getPageTitle() { return this._d.pageTitle || null; } getPageDescription() { return this._d.pageDescription || null; } getPageKeywords() { return this._d.pageKeywords || null; }
  isVisible() { return this._d.visible !== false; }
  hasVisibilityRules() { return false; }
  getAttribute(id) { const v = (this._d.data || this._d.attributes || {})[id]; return v === undefined ? null : v; }
  getAttributeIDs() { const S = require('../util/LinkedHashSet'); return new S(Object.keys(this._d.data || this._d.attributes || {})); }
  getRegion(id) { const r = (this._d.regions || {})[id]; return new Region(Object.assign({ ID: id }, r || { components: [] }), this); }
  getRegionIDs() { const S = require('../util/LinkedHashSet'); return new S(Object.keys(this._d.regions || {})); }
  getAspectAttribute() { return null; }
  getCustom() { return this._d.custom || {}; }
}
module.exports = bean(Page);
