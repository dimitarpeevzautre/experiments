'use strict';
const { bean } = require('../../util/bean');
const HTTPClient = require('./HTTPClient');
class WebDAVClient {
  constructor(rootUrl, user, password) { this._root = String(rootUrl).replace(/\/$/, ''); this._user = user; this._pw = password; this._status = 0; }
  _http(method, path, body) { const c = new HTTPClient(); c.open(method, `${this._root}/${String(path).replace(/^\//, '')}`, this._user, this._pw); c.send(body); this._status = c.getStatusCode(); this._text = c.getText(); return c.getStatusCode() < 400; }
  get(path) { this._http('GET', path); return this._text; }
  put(path, content) { return this._http('PUT', path, content && content._p ? require('fs').readFileSync(content._p, 'utf8') : content); }
  del(path) { return this._http('DELETE', path); }
  mkcol(path) { return this._http('MKCOL', path); }
  copy(a, b) { return false; } move(a, b) { return false; } propfind() { return []; } options() { return []; }
  getStatusCode() { return this._status; } getStatusText() { return ''; } succeeded() { return this._status > 0 && this._status < 400; } close() {}
}
module.exports = bean(WebDAVClient);
