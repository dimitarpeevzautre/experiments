'use strict';
const { bean } = require('../../util/bean');
const Collection = require('./Collection');

class MapEntry {
  constructor(key, value) { this._k = key; this._v = value; }
  getKey() { return this._k; }
  getValue() { return this._v; }
}
bean(MapEntry);

class Map {
  constructor(init) {
    this._m = new globalThis.Map();
    if (init) {
      if (init instanceof Map) init._m.forEach((v, k) => this._m.set(k, v));
      else if (init && typeof init === 'object') Object.entries(init).forEach(([k, v]) => this._m.set(k, v));
    }
  }
  _key(k) {
    if (k && typeof k === 'object' && typeof k.equals === 'function') {
      for (const ek of this._m.keys()) if (ek === k || (ek && typeof ek.equals === 'function' && ek.equals(k))) return ek;
    }
    return k;
  }
  put(k, v) { const key = this._key(k); const old = this._m.get(key); this._m.set(key, v); this._changed(); return old === undefined ? null : old; }
  putAll(other) { if (other instanceof Map) other._m.forEach((v, k) => this.put(k, v)); else Object.entries(other || {}).forEach(([k, v]) => this.put(k, v)); }
  get(k) { const v = this._m.get(this._key(k)); return v === undefined ? null : v; }
  containsKey(k) { return this._m.has(this._key(k)); }
  containsValue(v) { for (const x of this._m.values()) if (Collection.eq(x, v)) return true; return false; }
  remove(k) { const key = this._key(k); const old = this._m.get(key); this._m.delete(key); this._changed(); return old === undefined ? null : old; }
  clear() { this._m.clear(); }
  size() { return this._m.size; }
  getLength() { return this._m.size; }
  isEmpty() { return this._m.size === 0; }
  getEmpty() { return this._m.size === 0; }
  keySet() { const S = require('./LinkedHashSet'); return new S(Array.from(this._m.keys())); }
  values() { const L = require('./ArrayList'); return new L(Array.from(this._m.values())); }
  entrySet() { const S = require('./LinkedHashSet'); return new S(Array.from(this._m.entries()).map(([k, v]) => new MapEntry(k, v))); }
  keys() { return this._m.keys(); }
  entries() { return this._m.entries(); }
  forEach(fn) { this._m.forEach((v, k) => fn(k, v)); }
  _changed() {}
  toString() { return `{${Array.from(this._m.entries()).map(([k, v]) => `${k}=${v}`).join(', ')}}`; }
  toJSON() { return Object.fromEntries(this._m); }
}
Map.Entry = MapEntry;
module.exports = bean(Map);
