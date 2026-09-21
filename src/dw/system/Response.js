'use strict';
const { bean } = require('../../util/bean');
const Cookie = require('../web/Cookie');

class PrintWriter {
  constructor(resp) { this._r = resp; }
  print(...s) { this._r._chunks.push(s.map((x) => (x == null ? '' : String(x))).join('')); }
  println(...s) { this.print(...s); this._r._chunks.push('\n'); }
  write(s) { this.print(s); }
  flush() {}
  close() {}
}

class Response {
  constructor() {
    this._chunks = [];
    this._status = 200;
    this._statusMessage = null;
    this._headers = {};
    this._cookies = [];
    this._contentType = 'text/html;charset=UTF-8';
    this._redirect = null;
    this._writer = new PrintWriter(this);
    this._expires = null;
    this._vary = null;
    this._buffered = true;
  }
  getWriter() { return this._writer; }
  setContentType(ct) { this._contentType = ct; }
  getContentType() { return this._contentType; }
  setStatus(code, msg) { this._status = code; if (msg) this._statusMessage = msg; }
  getStatus() { return this._status; }
  setHttpHeader(name, value) { this._headers[name] = value; }
  addHttpHeader(name, value) { const k = name; if (this._headers[k] === undefined) this._headers[k] = value; else this._headers[k] = [].concat(this._headers[k], value); }
  containsHttpHeader(name) { return this._headers[name] !== undefined; }
  addHttpCookie(c) { if (!(c instanceof Cookie)) throw new Error('addHttpCookie expects a dw.web.Cookie'); this._cookies.push(c); }
  redirect(target, status) {
    this._redirect = target && typeof target.toString === 'function' ? String(target) : String(target);
    this._status = status || 302;
    this._headers.Location = this._redirect;
  }
  setExpires(ms) { this._expires = ms; }
  setVaryBy(v) { this._vary = v; }
  setBuffered(b) { this._buffered = !!b; }
  isBuffered() { return this._buffered; }
  setPageMetaTag() {}
  getRedirectLocation() { return this._redirect; }
  /** internal helpers */
  _body() { return this._chunks.join(''); }
  _reset() { this._chunks = []; }
  toJSON() { return { status: this._status, headers: this._headers, contentType: this._contentType, body: this._body(), redirect: this._redirect }; }
}
Response.PrintWriter = PrintWriter;
module.exports = bean(Response);
