'use strict';
const { bean } = require('../../util/bean');
const Service = require('./Service');
const HTTPClient = require('../net/HTTPClient');
const HashMap = require('../util/HashMap');
class HTTPService extends Service {
  constructor(id, cb, cfg) { super(id, cb, cfg); this._method = 'POST'; this._headers = {}; this._params = {}; this._auth = 'BASIC'; this._outFile = null; this._encoding = 'UTF-8'; this._identity = null; this._client = new HTTPClient(); this._hostNameVerification = true; }
  getRequestMethod() { return this._method; } setRequestMethod(m) { this._method = String(m).toUpperCase(); return this; }
  addHeader(n, v) { this._headers[n] = String(v); return this; }
  addParam(n, v) { this._params[n] = v == null ? '' : String(v); return this; }
  getAuthentication() { return this._auth; } setAuthentication(a) { this._auth = a; return this; }
  setOutFile(f) { this._outFile = f; return this; } getOutFile() { return this._outFile; }
  getEncoding() { return this._encoding; } setEncoding(e) { this._encoding = e; return this; }
  setIdentity(k) { this._identity = k; return this; } getIdentity() { return this._identity; }
  getClient() { return this._client; }
  setHostNameVerification(b) { this._hostNameVerification = !!b; return this; } isHostNameVerification() { return this._hostNameVerification; }
  setCachingTTL(s) { this._cachingTTL = s; return this; } getCachingTTL() { return this._cachingTTL; }
  _fullURL() {
    let url = this._url || '';
    const qs = Object.entries(this._params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    return url;
  }
  _execute(request) {
    const client = this._client;
    const cred = this._config.getCredential();
    if (this._auth === 'BASIC' && cred.getUser()) client.open(this._method, this._fullURL(), cred.getUser(), cred.getPassword());
    else client.open(this._method, this._fullURL());
    for (const [k, v] of Object.entries(this._headers)) client.setRequestHeader(k, v);
    client.setTimeout(this._config.getProfile().getTimeoutMillis());
    if (this._outFile) client.sendAndReceiveToFile(request == null ? undefined : request, this._outFile);
    else client.send(request == null ? undefined : this._bodyFor(request));
    if (client.getStatusCode() === 0 || client.getStatusCode() >= 400) this._httpError = { status: client.getStatusCode(), message: client.getErrorText() || client.getStatusMessage() || `HTTP ${client.getStatusCode()}` };
    return client;
  }
  _bodyFor(request) { return request; }
  _defaultParse(client) { return client.getText(); }
}
module.exports = bean(HTTPService);
