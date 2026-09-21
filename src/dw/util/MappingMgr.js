'use strict';
const ArrayList = require('./ArrayList');
const HashMap = require('./HashMap');
/** Mappings loaded from data/mappings.json: { mappingName: { key: {col: val} } } */
module.exports = {
  _all() { return require('../../runtime').current().store.get('mappings', {}); },
  get(mappingName, key) { const m = this._all()[mappingName]; if (!m) throw new Error(`Mapping not found: ${mappingName}`); const v = m[key]; return v == null ? null : new HashMap(v); },
  getFirst(mappingName, key) { const v = this.get(mappingName, key); return v ? v.values().get(0) : null; },
  getMappingNames() { return new ArrayList(Object.keys(this._all())); },
  keyIterator(mappingName) { const m = this._all()[mappingName] || {}; const SeekableIterator = require('./SeekableIterator'); return new SeekableIterator(Object.keys(m)); },
};
