'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('./ArrayList');
/**
 * Read-only collection with qualifier-based `select` and named sorting rules.
 * Used for product variants, variation attributes, shipments etc.
 * Qualifiers/sorts are plain objects: { ORDERABLE: fn, ... }.
 */
class FilteringCollection extends ArrayList {
  constructor(items, qualifiers = {}, sorts = {}) {
    super(items);
    this._qualifiers = qualifiers;
    this._sorts = sorts;
    for (const [k, fn] of Object.entries(qualifiers)) Object.defineProperty(this, k, { value: fn, enumerable: true });
    for (const [k, fn] of Object.entries(sorts)) if (!(k in this)) Object.defineProperty(this, k, { value: fn, enumerable: true });
  }
  select(qualifier) {
    const fn = typeof qualifier === 'function' ? qualifier : this._qualifiers[qualifier];
    if (!fn) throw new Error(`Unknown qualifier ${qualifier}`);
    return new FilteringCollection(this._a.filter((x) => fn(x)), this._qualifiers, this._sorts);
  }
  sort(rule) {
    if (rule === undefined || rule === null) return new FilteringCollection(this._a.slice().sort((a, b) => ArrayList.cmp(a, b)), this._qualifiers, this._sorts);
    const fn = typeof rule === 'function' ? rule : this._sorts[rule];
    if (typeof fn !== 'function') { super.sort(rule); return this; }
    return new FilteringCollection(this._a.slice().sort(fn), this._qualifiers, this._sorts);
  }
}
module.exports = bean(FilteringCollection);
