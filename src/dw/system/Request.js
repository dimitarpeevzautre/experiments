'use strict';
const { bean } = require('../../util/bean');
const HttpParameterMap = require('../web/HttpParameterMap');
const Cookies = require('../web/Cookies');
const { createCustomAttributes } = require('../object/CustomAttributes');

class Request {
  /**
   * @param o { method, path, query, params, headers, cookies, body, locale, session, host, protocol, remoteAddress, include }
   */
  constructor(o = {}) {
    this._o = o;
    this._method = (o.method || 'GET').toUpperCase();
    this._path = o.path || '/';
    this._query = o.query || '';
    this._headers = lowerKeys(o.headers || {});
    this._params = new HttpParameterMap(o.params || {}, o.body);
    this._cookies = new Cookies(o.cookies || []);
    this._locale = o.locale || 'default';
    this._session = o.session || null;
    this._custom = createCustomAttributes({});
    this._pageMetaData = null;
    this._include = !!o.include;
    this._id = o.requestID || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    this._geo = null;
    this._triggeredForm = null;
    this._triggeredFormAction = null;
    this._controller = o.controller || null;
    this._action = o.action || null;
  }
  getHttpMethod() { return this._method; }
  getHttpPath() { return this._path; }
  getHttpQueryString() { return this._query; }
  getHttpURL() { const URL = require('../web/URL'); return new URL(`${this.getHttpProtocol()}://${this.getHttpHost()}${this._path}${this._query ? '?' + this._query : ''}`); }
  getHttpHost() { return this._o.host || this._headers.host || 'localhost'; }
  getHttpProtocol() { return this._o.protocol || 'http'; }
  isHttpSecure() { return this.getHttpProtocol() === 'https'; }
  getHttpHeaders() { const HashMap = require('../util/HashMap'); const m = new HashMap(this._headers); const get = m.get.bind(m); m.get = (k) => get(String(k).toLowerCase()); const has = m.containsKey.bind(m); m.containsKey = (k) => has(String(k).toLowerCase()); return m; }
  getHttpHeader(name) { return this._headers[String(name).toLowerCase()] || null; }
  getHttpCookies() { return this._cookies; }
  getHttpParameterMap() { return this._params; }
  getHttpParameters() { return this._params; }
  getHttpReferer() { return this._headers.referer || null; }
  getHttpRemoteAddress() { return this._o.remoteAddress || '127.0.0.1'; }
  getHttpUserAgent() { return this._headers['user-agent'] || null; }
  getHttpLocale() { return this._headers['accept-language'] ? this._headers['accept-language'].split(',')[0] : this._locale; }
  getLocale() { return this._locale; }
  setLocale(l) { this._locale = l; return true; }
  getSession() { return this._session; }
  getCustom() { return this._custom; }
  getRequestID() { return this._id; }
  isIncludeRequest() { return this._include; }
  getIncludeRequest() { return this._include; }
  getGeolocation() { if (!this._geo) { const G = require('../util/Geolocation'); this._geo = new G(this._o.geolocation || {}); } return this._geo; }
  setGeolocation(g) { this._geo = g; }
  getPageMetaData() { if (!this._pageMetaData) { const P = require('../web/PageMetaData'); this._pageMetaData = new P(); } return this._pageMetaData; }
  getTriggeredForm() { return this._triggeredForm; }
  getTriggeredFormAction() { return this._triggeredFormAction; }
  isSCAPI() { return false; }
  getSCAPIPathParameters() { return null; }
  getSCAPIVersion() { return null; }
  getClientId() { return null; }
  getOcapiVersion() { return null; }
  getRequestBodyAsString() { return this._params.getRequestBodyAsString(); }
  addHttpHeaderOverride() {}
  getFormSubmissionPrefix() { return 'dwfrm_'; }
  /** internal: controller-action of this request */
  _route() { return { controller: this._controller, action: this._action }; }
}
function lowerKeys(o) { const r = {}; for (const [k, v] of Object.entries(o)) r[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : v; return r; }
module.exports = bean(Request);
