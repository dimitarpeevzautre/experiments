'use strict';
const { bean } = require('../../util/bean');
const Collection = require('./Collection');

class List extends Collection {
  get(i) { if (i < 0 || i >= this._a.length) throw new Error(`java.lang.IndexOutOfBoundsException: Index: ${i}, Size: ${this._a.length}`); return this._a[i]; }
  set(i, v) { const old = this._a[i]; this._a[i] = v; this._changed(); return old; }
  addAt(i, v) { this._a.splice(i, 0, v); this._changed(); }
  removeAt(i) { const [v] = this._a.splice(i, 1); this._changed(); return v; }
  indexOf(v) { return this._a.findIndex((x) => Collection.eq(x, v)); }
  lastIndexOf(v) { for (let i = this._a.length - 1; i >= 0; i--) if (Collection.eq(this._a[i], v)) return i; return -1; }
  subList(from, to) { return new this.constructor(this._a.slice(from, to)); }
  slice(from, to) { return this.subList(from, to); }
  concat(...others) { const r = new this.constructor(this._a); others.forEach((o) => r.addAll(o)); return r; }
  reverse() { this._a.reverse(); this._changed(); }
  rotate(n) { const len = this._a.length; if (!len) return; n = ((n % len) + len) % len; this._a = this._a.slice(-n).concat(this._a.slice(0, -n)); this._changed(); }
  shuffle() { for (let i = this._a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this._a[i], this._a[j]] = [this._a[j], this._a[i]]; } }
  sort(comparator) {
    if (comparator && typeof comparator.compare === 'function') this._a.sort((a, b) => comparator.compare(a, b));
    else if (typeof comparator === 'function') this._a.sort(comparator);
    else this._a.sort((a, b) => cmp(a, b));
    this._changed();
  }
  swap(i, j) { [this._a[i], this._a[j]] = [this._a[j], this._a[i]]; }
  fill(v) { this._a.fill(v); }
  replaceAll(a, b) { let ch = false; this._a = this._a.map((x) => { if (Collection.eq(x, a)) { ch = true; return b; } return x; }); return ch; }
  join(sep = ',') { return this._a.map(String).join(sep); }
  map(fn) { return new this.constructor(this._a.map(fn)); }
  filter(fn) { return new this.constructor(this._a.filter(fn)); }
  some(fn) { return this._a.some(fn); }
  every(fn) { return this._a.every(fn); }
  reduce(fn, init) { return init === undefined ? this._a.reduce(fn) : this._a.reduce(fn, init); }
}
function cmp(a, b) {
  if (a && typeof a.compareTo === 'function') return a.compareTo(b);
  if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0;
  return a < b ? -1 : a > b ? 1 : 0;
}
List.cmp = cmp;
module.exports = bean(List);
