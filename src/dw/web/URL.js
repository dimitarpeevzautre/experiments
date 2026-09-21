'use strict';
const { bean } = require('../../util/bean');
class URL {
  constructor(str) { this._s = String(str); }
  append(name, value) { const sep = this._s.includes('?') ? '&' : '?'; return new URL(`${this._s}${sep}${encodeURIComponent(name)}=${encodeURIComponent(value == null ? '' : String(value))}`); }
  appendCSRFTokenBM() { return this; }
  abs() { if (/^https?:\/\//.test(this._s)) return this; const rt = require('../../runtime').current(); const Site = rt.dw.get('system/Site'); return new URL(`${this._proto()}://${Site.getCurrent().getHttpHostName()}${this._s}`); }
  relative() { return new URL(this._s.replace(/^https?:\/\/[^/]+/, '')); }
  http() { return new URL(this.abs()._s.replace(/^https:/, 'http:')); }
  https() { return new URL(this.abs()._s.replace(/^http:/, 'https:')); }
  host(h) { return new URL(this.abs()._s.replace(/^(https?:\/\/)[^/]+/, `$1${h}`)); }
  siteHost() { return this.abs(); }
  _proto() { const rt = require('../../runtime').current(); return rt.context.request && rt.context.request.isHttpSecure() ? 'https' : 'http'; }
  toString() { return this._s; }
  toJSON() { return this._s; }
  valueOf() { return this._s; }
  equals(o) { return String(o) === this._s; }
}
module.exports = bean(URL);
