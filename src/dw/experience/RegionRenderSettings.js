'use strict';
const { bean } = require('../../util/bean');
class RegionRenderSettings {
  constructor() { this._tag = 'div'; this._attrs = {}; this._componentSettings = new Map(); this._defaultComponent = null; }
  getTagName() { return this._tag; } setTagName(t) { this._tag = t; return this; }
  getAttributes() { const HashMap = require('../util/HashMap'); return new HashMap(this._attrs); } setAttributes(m) { this._attrs = m && m.toJSON ? m.toJSON() : Object.assign({}, m); return this; }
  setComponentRenderSettings(component, s) { this._componentSettings.set(component.getID ? component.getID() : component, s); return this; }
  getComponentRenderSettings(component) { return this._componentSettings.get(component.getID ? component.getID() : component) || this._defaultComponent; }
  setDefaultComponentRenderSettings(s) { this._defaultComponent = s; return this; }
  getDefaultComponentRenderSettings() { return this._defaultComponent; }
}
module.exports = bean(RegionRenderSettings);
