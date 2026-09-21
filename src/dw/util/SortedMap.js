'use strict';
const { bean } = require('../../util/bean');
const List = require('./List');
class SortedMap extends require('./Map') {
  constructor(comparator) { super(); if (comparator && (typeof comparator === 'function' || typeof comparator.compare === 'function')) this._cmp = comparator; else if (comparator) this.putAll(comparator); }
  _changed() {
    const c = this._cmp;
    const f = c ? (typeof c === 'function' ? c : (a, b) => c.compare(a, b)) : List.cmp;
    const sorted = Array.from(this._m.entries()).sort((a, b) => f(a[0], b[0]));
    this._m = new globalThis.Map(sorted);
  }
  firstKey() { return this._m.keys().next().value; }
  lastKey() { let k; for (k of this._m.keys()); return k; }
  headMap(to) { const r = new SortedMap(this._cmp); for (const [k, v] of this._m) if (List.cmp(k, to) < 0) r.put(k, v); return r; }
  tailMap(from) { const r = new SortedMap(this._cmp); for (const [k, v] of this._m) if (List.cmp(k, from) >= 0) r.put(k, v); return r; }
  subMap(from, to) { const r = new SortedMap(this._cmp); for (const [k, v] of this._m) if (List.cmp(k, from) >= 0 && List.cmp(k, to) < 0) r.put(k, v); return r; }
}
module.exports = bean(SortedMap);
