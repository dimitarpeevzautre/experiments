'use strict';
const { bean } = require('../../util/bean');
class ComponentRenderSettings {
  constructor() { this._tag = 'div'; this._attrs = {}; }
  getTagName() { return this._tag; } setTagName(t) { this._tag = t; return this; }
  getAttributes() { const HashMap = require('../util/HashMap'); return new HashMap(this._attrs); } setAttributes(m) { this._attrs = m && m.toJSON ? m.toJSON() : Object.assign({}, m); return this; }
}
module.exports = bean(ComponentRenderSettings);
