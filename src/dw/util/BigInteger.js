'use strict';
const { bean } = require('../../util/bean');
class BigInteger {
  constructor(v = 0) { this._v = typeof v === 'bigint' ? v : BigInt(v instanceof BigInteger ? v._v : Math.trunc(Number(v))); }
  static _n(x) { return x instanceof BigInteger ? x._v : BigInt(Math.trunc(Number(x))); }
  get() { return Number(this._v); }
  add(x) { return new BigInteger(this._v + BigInteger._n(x)); }
  subtract(x) { return new BigInteger(this._v - BigInteger._n(x)); }
  multiply(x) { return new BigInteger(this._v * BigInteger._n(x)); }
  divide(x) { return new BigInteger(this._v / BigInteger._n(x)); }
  negate() { return new BigInteger(-this._v); }
  abs() { return new BigInteger(this._v < 0n ? -this._v : this._v); }
  compareTo(x) { const o = BigInteger._n(x); return this._v < o ? -1 : this._v > o ? 1 : 0; }
  equals(x) { return BigInteger._n(x) === this._v; }
  toString() { return this._v.toString(); }
  valueOf() { return Number(this._v); }
}
module.exports = bean(BigInteger);
