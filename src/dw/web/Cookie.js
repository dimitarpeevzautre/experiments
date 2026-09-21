'use strict';
const { bean } = require('../../util/bean');
class Cookie {
  constructor(name, value) { this._n = name; this._v = value == null ? '' : String(value); this._path = '/'; this._domain = null; this._maxAge = -1; this._secure = false; this._httpOnly = false; this._version = 0; this._comment = null; }
  getName() { return this._n; }
  getValue() { return this._v; }
  setValue(v) { this._v = v == null ? '' : String(v); }
  getPath() { return this._path; }
  setPath(p) { this._path = p; }
  getDomain() { return this._domain; }
  setDomain(d) { this._domain = d; }
  getMaxAge() { return this._maxAge; }
  setMaxAge(a) { this._maxAge = a; }
  getSecure() { return this._secure; }
  setSecure(s) { this._secure = !!s; }
  isHttpOnly() { return this._httpOnly; }
  setHttpOnly(h) { this._httpOnly = !!h; }
  getVersion() { return this._version; }
  setVersion(v) { this._version = v; }
  getComment() { return this._comment; }
  setComment(c) { this._comment = c; }
  toSetCookieHeader() {
    let s = `${this._n}=${encodeURIComponent(this._v)}; Path=${this._path}`;
    if (this._domain) s += `; Domain=${this._domain}`;
    if (this._maxAge >= 0) s += `; Max-Age=${this._maxAge}`;
    if (this._secure) s += '; Secure';
    if (this._httpOnly) s += '; HttpOnly';
    return s;
  }
}
Cookie.EMPTYNAME = '';
module.exports = bean(Cookie);
