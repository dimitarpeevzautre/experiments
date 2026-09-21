'use strict';
const fs = require('fs');
const { bean } = require('../../util/bean');
const HashMap = require('../util/HashMap');
const ArrayList = require('../util/ArrayList');
const { request } = require('../../internal/syncHttp');

class HTTPClient {
  constructor() { this._method = 'GET'; this._url = null; this._headers = {}; this._timeout = 30000; this._res = null; this._identity = null; this._outFile = null; this._error = null; }
  open(method, url, user, password) {
    this._method = String(method).toUpperCase(); this._url = String(url); this._headers = {}; this._res = null; this._error = null;
    if (user !== undefined && password !== undefined) this._headers.Authorization = `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
  }
  setRequestHeader(name, value) { this._headers[name] = String(value); }
  setTimeout(ms) { this._timeout = ms; }
  getTimeout() { return this._timeout; }
  setIdentity(keyRef) { this._identity = keyRef; }
  setAllowRedirect() {}
  enableCaching() {}
  send(a, b) {
    // send(), send(text), send(text, encoding), send(file), send(parts[])
    let body = null; let bodyFile = null;
    if (a && typeof a === 'object' && a._p) bodyFile = a._p;
    else if (Array.isArray(a)) { const boundary = `----sfcc${Date.now()}`; this._headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`; body = a.map((p) => `--${boundary}\r\nContent-Disposition: form-data; name="${p.getName()}"${p.getFileName() ? `; filename="${p.getFileName()}"` : ''}\r\n${p.getContentType() ? `Content-Type: ${p.getContentType()}\r\n` : ''}\r\n${p.getStringValue() != null ? p.getStringValue() : fs.readFileSync(p.getFileValue()._p, 'latin1')}\r\n`).join('') + `--${boundary}--\r\n`; }
    else if (a !== undefined && a !== null) body = String(a);
    const rt = require('../../runtime').current();
    rt.log('debug', 'http', `${this._method} ${this._url}`);
    this._res = request({ method: this._method, url: this._url, headers: this._headers, body, timeout: this._timeout, bodyFile, outFile: this._outFile ? this._outFile._p : null });
    if (this._res.error) this._error = this._res.error;
    rt.emit('http', { method: this._method, url: this._url, status: this._res.status });
  }
  sendAndReceiveToFile(a, b) { const file = b !== undefined ? b : a; this._outFile = file; this.send(b !== undefined ? a : undefined); this._outFile = null; }
  sendMultiPart(parts) { this.send(Array.from(parts)); }
  getStatusCode() { return this._res ? this._res.status : 0; }
  getStatusMessage() { return this._res ? this._res.statusText : ''; }
  getText(encoding) { return this._res ? this._res.text : null; }
  getBytes() { const Bytes = require('../util/Bytes'); return this._res ? new Bytes(Buffer.from(this._res.text, 'utf8')) : null; }
  getErrorText() { if (!this._res) return null; if (this._res.error) return String(this._res.error); return this._res.status >= 400 ? this._res.text : null; }
  getResponseHeader(name) { if (!this._res) return null; const k = Object.keys(this._res.headers).find((h) => h.toLowerCase() === String(name).toLowerCase()); return k ? this._res.headers[k] : null; }
  getResponseHeaders(name) { if (name !== undefined) { const v = this.getResponseHeader(name); return new ArrayList(v ? String(v).split(', ') : []); } const m = new HashMap(); for (const [k, v] of Object.entries(this._res ? this._res.headers : {})) m.put(k, new ArrayList(String(v).split(', '))); return m; }
  getAllResponseHeaders() { const m = new HashMap(); for (const [k, v] of Object.entries(this._res ? this._res.headers : {})) m.put(k, v); return m; }
  getRequestMethod() { return this._method; }
  getURL() { return this._url; }
}
HTTPClient.MAX_GET_FILE_SIZE = 200 * 1024 * 1024;
HTTPClient.DEFAULT_ENCODING = 'UTF-8';
module.exports = bean(HTTPClient);
