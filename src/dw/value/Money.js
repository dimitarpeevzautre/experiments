'use strict';
const { bean } = require('../../util/bean');
const Decimal = require('../../dw/util/Decimal');

const CURRENCY_DIGITS = { JPY: 0, KRW: 0, HUF: 0, CLP: 0, ISK: 0, KWD: 3, BHD: 3, OMR: 3, JOD: 3 };

class Money {
  constructor(value, currencyCode) {
    if (value === Money._NA_MARK) { this._na = true; this._v = 0; this._c = null; return; }
    if (typeof currencyCode !== 'string' || !currencyCode) throw new Error('Money requires a currency code');
    this._v = value instanceof Decimal ? value.get() : Number(value);
    if (Number.isNaN(this._v)) throw new Error(`Invalid money value: ${value}`);
    this._c = currencyCode.toUpperCase();
    this._na = false;
  }
  static _digits(c) { return CURRENCY_DIGITS[c] !== undefined ? CURRENCY_DIGITS[c] : 2; }
  _round(v) { const d = Money._digits(this._c); const f = Math.pow(10, d); return Math.round((v + Number.EPSILON) * f) / f; }
  getValue() { return this._na ? 0 : this._round(this._v); }
  getValueOrNull() { return this._na ? null : this.getValue(); }
  getDecimalValue() { return this._na ? null : new Decimal(this.getValue()); }
  getCurrencyCode() { return this._na ? 'N/A' : this._c; }
  isAvailable() { return !this._na; }
  isOfSameCurrency(other) { return !!other && !this._na && !other._na && this._c === other._c; }
  isZero() { return !this._na && this.getValue() === 0; }
  isPositive() { return !this._na && this.getValue() > 0; }
  isNegative() { return !this._na && this.getValue() < 0; }
  _check(other) {
    if (!(other instanceof Money)) throw new Error('Money operation requires a Money argument');
    if (this._na || other._na) return false;
    if (this._c !== other._c) throw new Error(`Currency mismatch: ${this._c} vs ${other._c}`);
    return true;
  }
  add(o) { return this._check(o) ? new Money(this._v + o._v, this._c) : Money.NOT_AVAILABLE; }
  subtract(o) { return this._check(o) ? new Money(this._v - o._v, this._c) : Money.NOT_AVAILABLE; }
  multiply(q) { if (this._na) return Money.NOT_AVAILABLE; const n = q && typeof q.getValue === 'function' ? q.getValue() : Number(q); return new Money(this._v * n, this._c); }
  divide(q) { if (this._na) return Money.NOT_AVAILABLE; const n = q && typeof q.getValue === 'function' ? q.getValue() : Number(q); if (n === 0) throw new Error('Division by zero'); return new Money(this._v / n, this._c); }
  negate() { return this._na ? this : new Money(-this._v, this._c); }
  abs() { return this._na ? this : new Money(Math.abs(this._v), this._c); }
  addRate(r) { return this._na ? this : new Money(this._v * (1 + r), this._c); }
  addPercent(p) { return this.addRate(p / 100); }
  subtractRate(r) { return this._na ? this : new Money(this._v * (1 - r), this._c); }
  subtractPercent(p) { return this.subtractRate(p / 100); }
  percentOf(other) { if (!this._check(other) || other._v === 0) return 0; return (this._v / other._v) * 100; }
  percentLessThan(other) { if (!this._check(other) || other._v === 0) return 0; return ((other._v - this._v) / other._v) * 100; }
  percentGreaterThan(other) { if (!this._check(other) || other._v === 0) return 0; return ((this._v - other._v) / other._v) * 100; }
  prorate(...others) { return Money.prorate(this, ...others); }
  static prorate(dist, ...values) {
    const total = values.reduce((s, m) => s + m._v, 0);
    if (total === 0) return values.map(() => new Money(0, dist._c));
    return values.map((m) => new Money((dist._v * m._v) / total, dist._c));
  }
  compareTo(o) { this._check(o); return this.getValue() < o.getValue() ? -1 : this.getValue() > o.getValue() ? 1 : 0; }
  equals(o) { return o instanceof Money && ((this._na && o._na) || (this._c === o._c && this.getValue() === o.getValue())); }
  hashCode() { return `${this._c}:${this.getValue()}`; }
  min(o) { return this.compareTo(o) <= 0 ? this : o; }
  max(o) { return this.compareTo(o) >= 0 ? this : o; }
  static min(a, b) { return a.min(b); }
  static max(a, b) { return a.max(b); }
  toFormattedString() {
    if (this._na) return 'N/A';
    try { return new Intl.NumberFormat(Money._locale || 'en-US', { style: 'currency', currency: this._c }).format(this.getValue()); }
    catch (e) { return `${this._c} ${this.getValue().toFixed(Money._digits(this._c))}`; }
  }
  toNumberString() { return this._na ? 'N/A' : this.getValue().toFixed(Money._digits(this._c)); }
  toString() { return this._na ? 'N/A' : `${this.toNumberString()} ${this._c}`; }
  toJSON() { return { value: this.getValueOrNull(), currencyCode: this.getCurrencyCode() }; }
  valueOf() { return this.getValue(); }
}
Money._NA_MARK = Symbol('N/A');
Money.NOT_AVAILABLE = new Money(Money._NA_MARK);
Money.NA = Money.NOT_AVAILABLE;
module.exports = bean(Money);
