'use strict';
const rtRef = require('../../runtime');
const CustomObject = require('./CustomObject');
const SeekableIterator = require('../util/SeekableIterator');
const ObjectTypeDefinition = require('./ObjectTypeDefinition');
const { query } = require('../../internal/query');

/** data/custom-objects.json: { "TypeID": { "keyValue": { custom: {...} } } }; key attribute name in data/object-types.json */
const wrappers = new WeakMap();
function all(rt) { return rt.store.get('custom-objects', {}); }
function typeDef(rt, type) { return (rt.store.get('object-types', {})[type]) || null; }
function keyAttr(rt, type) { const d = typeDef(rt, type); return (d && d.key) || 'ID'; }
function wrap(rt, type, data) {
  if (!data) return null;
  let o = wrappers.get(data);
  if (!o) { o = new CustomObject(data, type, typeDef(rt, type)); o._collection = 'custom-objects'; o._store = rt.store; wrappers.set(data, o); }
  return o;
}
const CustomObjectMgr = {
  createCustomObject(type, key) {
    const rt = rtRef.current();
    const types = all(rt);
    types[type] = types[type] || {};
    if (types[type][String(key)]) throw new Error(`Custom object ${type}/${key} already exists`);
    const data = { custom: { [keyAttr(rt, type)]: key } };
    types[type][String(key)] = data;
    rt.store.touch('custom-objects');
    return wrap(rt, type, data);
  },
  getCustomObject(type, key) { const rt = rtRef.current(); const t = all(rt)[type]; return t ? wrap(rt, type, t[String(key)]) : null; },
  remove(co) { const rt = rtRef.current(); const t = all(rt)[co.getType()]; if (!t) return; for (const [k, v] of Object.entries(t)) if (v === co._data) delete t[k]; rt.store.touch('custom-objects'); },
  getAllCustomObjects(type) { const rt = rtRef.current(); const t = all(rt)[type] || {}; return new SeekableIterator(Object.values(t).map((d) => wrap(rt, type, d))); },
  queryCustomObjects(type, q, sortString, ...args) { const rt = rtRef.current(); const t = all(rt)[type] || {}; return new SeekableIterator(query(Object.values(t).map((d) => wrap(rt, type, d)), q, sortString, args)); },
  queryCustomObject(type, q, ...args) { const it = CustomObjectMgr.queryCustomObjects(type, q, null, ...args); return it.hasNext() ? it.next() : null; },
  describe(type) { const rt = rtRef.current(); const d = typeDef(rt, type); return new ObjectTypeDefinition(type, d || { attributes: {} }); },
};
module.exports = CustomObjectMgr;
