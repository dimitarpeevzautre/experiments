'use strict';
const { bean } = require('../../util/bean');
const Cookie = require('./Cookie');
class Cookies {
  constructor(list = []) {
    this._c = list.map((c) => (c instanceof Cookie ? c : new Cookie(c.name, c.value)));
    return new Proxy(this, { get(t, k) { if (typeof k === 'symbol' || k in t) return t[k]; if (/^\d+$/.test(k)) return t._c[Number(k)]; const c = t._c.find((x) => x.getName() === k); return c || undefined; } });
  }
  getCookieCount() { return this._c.length; }
  getLength() { return this._c.length; }
  get(i) { return this._c[i]; }
  [Symbol.iterator]() { return this._c[Symbol.iterator](); }
}
module.exports = bean(Cookies);
