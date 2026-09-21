'use strict';
const fs = require('fs');
const path = require('path');

/**
 * JSON-backed data store. Every `<dataDir>/<name>.json` becomes a collection reachable via
 * `store.get(name)`. Collections are plain objects (usually keyed by ID). Changes are kept in
 * memory; `flush()` writes touched collections back when persistence is enabled.
 */
class Store {
  constructor(dataDir, { persist = false } = {}) {
    this.dataDir = dataDir;
    this.persist = persist;
    this.data = {};
    this.touched = new Set();
    this.load();
  }
  load() {
    this.data = {};
    if (!this.dataDir || !fs.existsSync(this.dataDir)) return;
    for (const f of fs.readdirSync(this.dataDir)) {
      if (!f.endsWith('.json')) continue;
      const name = f.slice(0, -5);
      try { this.data[name] = JSON.parse(fs.readFileSync(path.join(this.dataDir, f), 'utf8')); }
      catch (e) { throw new Error(`Failed to parse data file ${f}: ${e.message}`); }
    }
  }
  has(name) { return Object.prototype.hasOwnProperty.call(this.data, name); }
  get(name, def) {
    if (!this.has(name)) { if (def === undefined) return undefined; this.data[name] = def; }
    return this.data[name];
  }
  set(name, value) { this.data[name] = value; this.touch(name); }
  touch(name) { this.touched.add(name); }
  markDirty(obj) { if (obj && obj._collection) this.touch(obj._collection); }
  flush() {
    if (!this.persist || !this.dataDir) { this.touched.clear(); return; }
    fs.mkdirSync(this.dataDir, { recursive: true });
    for (const name of this.touched) {
      fs.writeFileSync(path.join(this.dataDir, `${name}.json`), JSON.stringify(this.data[name], null, 2));
    }
    this.touched.clear();
  }
}
module.exports = { Store };
