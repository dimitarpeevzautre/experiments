'use strict';
const { bean } = require('../../util/bean');

class Iterator {
  constructor(items) { this._items = Array.from(items); this._i = 0; }
  hasNext() { return this._i < this._items.length; }
  next() {
    if (this._i >= this._items.length) throw new Error('java.util.NoSuchElementException');
    return this._items[this._i++];
  }
  asList() { return new (require('./ArrayList'))(this._items.slice(this._i)); }
  [Symbol.iterator]() { return this._items.slice(this._i)[Symbol.iterator](); }
}
bean(Iterator);

class Collection {
  constructor(...args) {
    this._a = [];
    for (const a of args) this.addAll(a);
  }
  static _toArray(x) {
    if (x == null) return [];
    if (Array.isArray(x)) return x;
    if (x instanceof Collection) return x._a;
    if (x instanceof Iterator) return x._items.slice(x._i);
    if (typeof x[Symbol.iterator] === 'function' && typeof x !== 'string') return Array.from(x);
    if (typeof x.iterator === 'function') { const out = []; const it = x.iterator(); while (it.hasNext()) out.push(it.next()); return out; }
    return [x];
  }
  add(...items) { let changed = false; for (const i of items) { if (this._accept(i)) { this._a.push(i); changed = true; } } this._changed(); return changed; }
  add1(item) { return this.add(item); }
  addAll(other) { return this.add(...Collection._toArray(other)); }
  _accept() { return true; }
  _changed() {}
  clear() { this._a.length = 0; this._changed(); }
  contains(v) { return this._a.some((x) => eq(x, v)); }
  containsAll(other) { return Collection._toArray(other).every((v) => this.contains(v)); }
  getLength() { return this._a.length; }
  size() { return this._a.length; }
  isEmpty() { return this._a.length === 0; }
  getEmpty() { return this._a.length === 0; }
  iterator() { return new Iterator(this._a); }
  remove(v) {
    const i = this._a.findIndex((x) => eq(x, v));
    if (i === -1) return false;
    this._a.splice(i, 1); this._changed(); return true;
  }
  removeAll(other) { let ch = false; for (const v of Collection._toArray(other)) while (this.remove(v)) ch = true; return ch; }
  retainAll(other) { const keep = Collection._toArray(other); const before = this._a.length; this._a = this._a.filter((x) => keep.some((k) => eq(k, x))); this._changed(); return before !== this._a.length; }
  toArray(start, size) {
    if (start === undefined) return this._a.slice();
    return this._a.slice(start, size === undefined ? undefined : start + size);
  }
  [Symbol.iterator]() { return this._a[Symbol.iterator](); }
  toString() { return `[${this._a.map(String).join(', ')}]`; }
  toJSON() { return this._a; }
  // convenience used by many scripts (Rhino exposes Java 8 default methods too)
  forEach(fn) { this._a.slice().forEach((x, i) => fn(x, i)); }
  stream() { return this._a.slice(); }
}
function eq(a, b) {
  if (a === b) return true;
  if (a && b && typeof a.equals === 'function' && typeof a !== 'string') { try { return !!a.equals(b); } catch (e) { return false; } }
  return false;
}
Collection.eq = eq;
Collection.Iterator = Iterator;
module.exports = bean(Collection);
