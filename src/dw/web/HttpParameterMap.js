'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const HashMap = require('../util/HashMap');

class HttpParameter {
  constructor(name, values) { this._n = name; this._v = values === undefined || values === null ? [] : Array.isArray(values) ? values.map(String) : [String(values)]; }
  getStringValue(def) { return this._v.length ? this._v[0] : (def === undefined ? null : def); }
  getValue() { return this.getStringValue(); }
  getRawValue() { return this.getStringValue(); }
  getIntValue(def) { const v = parseInt(this._v[0], 10); return Number.isNaN(v) ? (def === undefined ? null : def) : v; }
  getDoubleValue(def) { const v = parseFloat(this._v[0]); return Number.isNaN(v) ? (def === undefined ? null : def) : v; }
  getBooleanValue(def) { if (!this._v.length) return def === undefined ? null : def; const s = this._v[0].toLowerCase(); return s === 'true' || s === '1' || s === 'on' || s === 'yes'; }
  getDateValue(def) { const d = new Date(this._v[0]); return Number.isNaN(d.getTime()) ? (def === undefined ? null : def) : d; }
  getStringValues() { return new ArrayList(this._v); }
  getValues() { return this.getStringValues(); }
  getIntValues() { return new ArrayList(this._v.map((x) => parseInt(x, 10)).filter((x) => !Number.isNaN(x))); }
  getDoubleValues() { return new ArrayList(this._v.map(parseFloat).filter((x) => !Number.isNaN(x))); }
  isSubmitted() { return this._v.length > 0; }
  isEmpty() { return !this._v.length || this._v[0] === ''; }
  getEmpty() { return this.isEmpty(); }
  containsString(s) { return this._v.includes(String(s)); }
  isChecked(v) { return this._v.includes(String(v)); }
  getEncoding() { return 'UTF-8'; }
  toString() { return this.getStringValue() || ''; }
  valueOf() { return this.getStringValue(); }
}
bean(HttpParameter);

class HttpParameterMap {
  /** @param params object name -> string | string[] */
  constructor(params = {}, requestBody = null) {
    this._p = {};
    for (const [k, v] of Object.entries(params)) this._p[k] = Array.isArray(v) ? v.map(String) : [String(v)];
    this._body = requestBody;
    return new Proxy(this, {
      get(t, k) {
        if (typeof k === 'symbol' || k in t) return t[k];
        return t.get(k);
      },
      has(t, k) { return k in t || Object.prototype.hasOwnProperty.call(t._p, k); },
    });
  }
  get(name) { return new HttpParameter(name, this._p[name]); }
  isParameterSubmitted(name) { return Object.prototype.hasOwnProperty.call(this._p, name); }
  getParameterNames() { const S = require('../util/LinkedHashSet'); return new S(Object.keys(this._p)); }
  getParameterCount() { return Object.keys(this._p).length; }
  getParameterMap(prefix) { const m = new HashMap(); for (const k of Object.keys(this._p)) if (!prefix || k.startsWith(prefix)) m.put(prefix ? k.slice(prefix.length) : k, this._p[k][0]); return m; }
  getParameterMapDirect(prefix) { return this.getParameterMap(prefix); }
  getParameterMapDirectValues() { return this.getParameterMap(); }
  getRequestBodyAsString() { return this._body == null ? null : String(this._body); }
  processMultipart(callback) { const HM = require('../util/LinkedHashMap'); return new HM(); }
  isEmpty() { return Object.keys(this._p).length === 0; }
  getEmpty() { return this.isEmpty(); }
  _set(name, value) { this._p[name] = Array.isArray(value) ? value : [String(value)]; }
  toString() { return JSON.stringify(this._p); }
}
HttpParameterMap.HttpParameter = HttpParameter;
module.exports = bean(HttpParameterMap);
