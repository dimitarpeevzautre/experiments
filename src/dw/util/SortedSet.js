'use strict';
const { bean } = require('../../util/bean');
const List = require('./List');
class SortedSet extends require('./Set') {
  constructor(comparator, ...args) {
    super();
    if (comparator && (typeof comparator === 'function' || typeof comparator.compare === 'function')) this._cmp = comparator;
    else if (comparator !== undefined) this.addAll(comparator);
    args.forEach((a) => this.addAll(a));
  }
  _changed() {
    const c = this._cmp;
    this._a.sort(c ? (typeof c === 'function' ? c : (a, b) => c.compare(a, b)) : List.cmp);
  }
  first() { return this._a[0]; }
  last() { return this._a[this._a.length - 1]; }
  pollFirst() { return this._a.shift(); }
  pollLast() { return this._a.pop(); }
  headSet(to) { return new SortedSet(this._cmp, this._a.filter((x) => List.cmp(x, to) < 0)); }
  tailSet(from) { return new SortedSet(this._cmp, this._a.filter((x) => List.cmp(x, from) >= 0)); }
  subSet(from, to) { return new SortedSet(this._cmp, this._a.filter((x) => List.cmp(x, from) >= 0 && List.cmp(x, to) < 0)); }
  toArray() { return this._a.slice(); }
}
module.exports = bean(SortedSet);
