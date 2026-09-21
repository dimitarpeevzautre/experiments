'use strict';
const { bean } = require('../../util/bean');
class Currency {
  constructor(code) { this._c = String(code).toUpperCase(); }
  static getCurrency(code) { return code ? new Currency(code) : null; }
  getCurrencyCode() { return this._c; }
  getSymbol() { try { return new Intl.NumberFormat('en', { style: 'currency', currency: this._c, currencyDisplay: 'narrowSymbol' }).formatToParts(1).find((p) => p.type === 'currency').value; } catch (e) { return this._c; } }
  getName() { try { return new Intl.DisplayNames(['en'], { type: 'currency' }).of(this._c); } catch (e) { return this._c; } }
  getDefaultFractionDigits() { const Money = require('../value/Money'); return Money._digits(this._c); }
  toString() { return this._c; }
  equals(o) { return o instanceof Currency && o._c === this._c; }
}
module.exports = bean(Currency);
