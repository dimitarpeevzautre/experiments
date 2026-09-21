'use strict';
const { bean } = require('../../util/bean');
class Quantity {
  constructor(value, unit) {
    if (value === Quantity._NA) { this._na = true; this._v = 0; this._u = ''; return; }
    this._v = Number(value); this._u = unit || ''; this._na = false;
    if (Number.isNaN(this._v)) throw new Error(`Invalid quantity: ${value}`);
  }
  getValue() { return this._v; }
  getValueOrNull() { return this._na ? null : this._v; }
  getDecimalValue() { const Decimal = require('../util/Decimal'); return this._na ? null : new Decimal(this._v); }
  getUnit() { return this._u; }
  isAvailable() { return !this._na; }
  isOfSameUnit(o) { return !!o && this._u === o._u; }
  _check(o) { if (!(o instanceof Quantity)) throw new Error('Quantity required'); if (this._u !== o._u) throw new Error(`Unit mismatch ${this._u} vs ${o._u}`); }
  add(o) { this._check(o); return new Quantity(this._v + o._v, this._u); }
  subtract(o) { this._check(o); return new Quantity(this._v - o._v, this._u); }
  multiply(n) { return new Quantity(this._v * n, this._u); }
  divide(n) { return new Quantity(this._v / n, this._u); }
  round(precision) { const f = Math.pow(10, precision || 0); return new Quantity(Math.round(this._v * f) / f, this._u); }
  compareTo(o) { this._check(o); return this._v < o._v ? -1 : this._v > o._v ? 1 : 0; }
  equals(o) { return o instanceof Quantity && o._v === this._v && o._u === this._u; }
  hashCode() { return `${this._v}${this._u}`; }
  toString() { return this._na ? 'N/A' : `${this._v}${this._u ? ' ' + this._u : ''}`; }
  toJSON() { return { value: this._v, unit: this._u }; }
  valueOf() { return this._v; }
}
Quantity._NA = Symbol('N/A');
Quantity.NOT_AVAILABLE = new Quantity(Quantity._NA);
module.exports = bean(Quantity);
