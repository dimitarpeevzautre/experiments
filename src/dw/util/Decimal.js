'use strict';
const { bean } = require('../../util/bean');
/** BigDecimal-like wrapper. Uses JS numbers with careful rounding – sufficient for commerce math. */
class Decimal {
  constructor(v) {
    if (v === undefined || v === null) v = 0;
    if (v instanceof Decimal) v = v._v;
    if (typeof v === 'object' && typeof v.getValue === 'function') v = v.getValue();
    this._v = typeof v === 'string' ? parseFloat(v) : Number(v);
    if (Number.isNaN(this._v)) throw new Error(`Invalid decimal: ${v}`);
  }
  static _n(x) { return x instanceof Decimal ? x._v : Number(x); }
  get() { return this._v; }
  add(x) { return new Decimal(this._v + Decimal._n(x)); }
  subtract(x) { return new Decimal(this._v - Decimal._n(x)); }
  multiply(x) { return new Decimal(this._v * Decimal._n(x)); }
  divide(x) { const d = Decimal._n(x); if (d === 0) throw new Error('Division by zero'); return new Decimal(this._v / d); }
  negate() { return new Decimal(-this._v); }
  abs() { return new Decimal(Math.abs(this._v)); }
  round(precision = 0) { const f = Math.pow(10, precision); return new Decimal(Math.round((this._v + Number.EPSILON * Math.sign(this._v)) * f) / f); }
  addPercent(p) { return new Decimal(this._v * (1 + Decimal._n(p) / 100)); }
  subtractPercent(p) { return new Decimal(this._v * (1 - Decimal._n(p) / 100)); }
  compareTo(x) { const o = Decimal._n(x); return this._v < o ? -1 : this._v > o ? 1 : 0; }
  equals(x) { return (x instanceof Decimal || typeof x === 'number') && Decimal._n(x) === this._v; }
  hashCode() { return String(this._v); }
  toString() { return String(this._v); }
  valueOf() { return this._v; }
  toJSON() { return this._v; }
}
module.exports = bean(Decimal);
