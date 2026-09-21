'use strict';
const caches = new Map();
class Cache {
  constructor(id) { this._id = id; this._m = new Map(); }
  get(key, loader) {
    if (this._m.has(key)) { const e = this._m.get(key); if (!e.exp || e.exp > Date.now()) return e.v; this._m.delete(key); }
    if (typeof loader === 'function') { const v = loader(); if (v !== undefined) this._m.set(key, { v, exp: 0 }); return v === undefined ? null : v; }
    return null;
  }
  put(key, value) { this._m.set(key, { v: value, exp: 0 }); }
  invalidate(key) { this._m.delete(key); }
  invalidateAll() { this._m.clear(); }
}
module.exports = {
  getCache(id) { if (!caches.has(id)) caches.set(id, new Cache(id)); return caches.get(id); },
  Cache,
};
