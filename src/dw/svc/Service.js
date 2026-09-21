'use strict';
const { bean } = require('../../util/bean');
const Result = require('./Result');
const ServiceConfig = require('./ServiceConfig');
const rtRef = require('../../runtime');

/** Base service: implements the createRequest -> execute -> parseResponse lifecycle with mocking and error handling. */
class Service {
  constructor(id, callbacks = {}, configData = {}) {
    this._id = id; this._cb = callbacks; this._config = new ServiceConfig(id, configData);
    this._url = this._config.getCredential().getURL(); this._throwOnError = false; this._mock = this._config.isMockModeEnabled(); this._credentialID = null; this._response = null; this._cachingTTL = 0;
  }
  getConfiguration() { return this._config; }
  getURL() { return this._url; } setURL(u) { this._url = String(u); return this; }
  isThrowOnError() { return this._throwOnError; } setThrowOnError(b) { this._throwOnError = !!b; return this; }
  isMock() { return this._mock; } setMock() { this._mock = true; return this; }
  getCredentialID() { return this._credentialID; }
  setCredentialID(id) {
    this._credentialID = id;
    const rt = rtRef.current();
    const creds = rt.store.get('service-credentials', {});
    if (creds[id]) { const ServiceCredential = require('./ServiceCredential'); this._config._cred = new ServiceCredential(Object.assign({ ID: id }, creds[id])); this._url = this._config.getCredential().getURL(); }
    return this;
  }
  getResponse() { return this._response; }
  setCachingTTL(s) { this._cachingTTL = s; }
  _prepare() {}
  _execute(request) { throw new Error('Service subclass must implement _execute'); }
  _defaultParse(response) { return response; }
  call(...args) {
    const rt = rtRef.current();
    const cb = this._cb;
    const start = Date.now();
    try {
      if (typeof cb.initServiceClient === 'function') this._client = cb.initServiceClient.call(cb, this);
      const request = typeof cb.createRequest === 'function' ? cb.createRequest.call(cb, this, ...args) : (args.length ? args[0] : null);
      this._prepare();
      let response;
      if (this._mock || (rt.config.mockServices && !(rt.config.mockServices instanceof Array && !rt.config.mockServices.includes(this._id)))) {
        if (typeof cb.mockCall === 'function') response = cb.mockCall.call(cb, this, request);
        else if (typeof cb.mockFull === 'function') { const r = cb.mockFull.call(cb, this, request); this._response = r; return new Result({ ok: true, status: 'OK', object: r, mockResult: true }); }
        else throw new Error(`Service ${this._id} is in mock mode but has no mockCall callback`);
        this._response = response;
        const obj = typeof cb.parseResponse === 'function' ? cb.parseResponse.call(cb, this, response) : this._defaultParse(response);
        rt.emit('service', { id: this._id, mock: true, ms: Date.now() - start });
        return new Result({ ok: true, status: 'OK', object: obj, mockResult: true });
      }
      if (!this._config.isEnabled()) return this._fail(new Result({ ok: false, status: Result.SERVICE_UNAVAILABLE, unavailableReason: Result.UNAVAILABLE_DISABLED, errorMessage: 'Service disabled' }));
      if (typeof cb.executeOverride === 'function' || typeof cb.execute === 'function') {
        response = (cb.executeOverride || cb.execute).call(cb, this, request);
      } else response = this._execute(request);
      this._response = response;
      if (this._httpError) { const err = this._httpError; this._httpError = null; return this._fail(new Result({ ok: false, status: err.status === 0 ? Result.SERVICE_UNAVAILABLE : Result.ERROR, error: err.status, errorMessage: err.message, unavailableReason: err.status === 0 ? Result.UNAVAILABLE_TIMEOUT : null, object: null })); }
      const obj = typeof cb.parseResponse === 'function' ? cb.parseResponse.call(cb, this, response) : this._defaultParse(response);
      rt.emit('service', { id: this._id, ms: Date.now() - start });
      if (this._config.isCommunicationLogEnabled() || rt.config.logLevel === 'debug') {
        const reqLog = typeof cb.getRequestLogMessage === 'function' ? cb.getRequestLogMessage.call(cb, request) : String(request == null ? '' : typeof request === 'object' ? JSON.stringify(request) : request);
        const resLog = typeof cb.getResponseLogMessage === 'function' ? cb.getResponseLogMessage.call(cb, response) : String(response && response.text !== undefined ? response.text : response);
        const filter = typeof cb.filterLogMessage === 'function' ? (m) => cb.filterLogMessage.call(cb, m) : (m) => m;
        rt.log('debug', `service.${this._id}`, `REQUEST: ${filter(reqLog)}\nRESPONSE: ${filter(resLog)}`);
      }
      return new Result({ ok: true, status: 'OK', object: obj });
    } catch (e) {
      rt.log('error', `service.${this._id}`, e.stack || String(e));
      return this._fail(new Result({ ok: false, status: Result.ERROR, error: 500, errorMessage: e.message || String(e), msg: e.message || String(e) }));
    }
  }
  _fail(result) { if (this._throwOnError) { const e = new Error(result.getErrorMessage() || result.getStatus()); e.result = result; throw e; } return result; }
  getID() { return this._id; }
}
module.exports = bean(Service);
