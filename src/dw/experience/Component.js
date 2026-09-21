'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
class Component {
  constructor(d, page) { this._d = d; this._page = page; this._attrs = d.data || d.attributes || {}; this._regions = d.regions || {}; }
  getID() { return this._d.ID || this._d.id; }
  getTypeID() { return this._d.typeID || this._d.type; }
  getName() { return this._d.name || this.getID(); }
  getAttribute(id) { const v = this._attrs[id]; return v === undefined ? null : v; }
  getAttributeIDs() { const S = require('../util/LinkedHashSet'); return new S(Object.keys(this._attrs)); }
  getRegion(id) { const Region = require('./Region'); const r = this._regions[id]; return r ? new Region(Object.assign({ ID: id }, r), this._page, this) : new Region({ ID: id, components: [] }, this._page, this); }
  getRegionIDs() { const S = require('../util/LinkedHashSet'); return new S(Object.keys(this._regions)); }
  isVisible() { return this._d.visible !== false; }
  getCustom() { return this._d.custom || {}; }
}
module.exports = bean(Component);
