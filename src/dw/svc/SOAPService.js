'use strict';
const Service = require('./Service');
class SOAPService extends Service {
  constructor(id, cb, cfg) { super(id, cb, cfg); this._auth = 'BASIC'; this._svcClient = null; }
  getAuthentication() { return this._auth; } setAuthentication(a) { this._auth = a; return this; }
  getServiceClient() { return this._svcClient; } setServiceClient(c) { this._svcClient = c; return this; }
  _execute(request) { if (typeof this._cb.execute !== 'function') throw new Error(`SOAPService ${this._id}: WSDL clients are not supported; provide an execute(svc, request) callback`); return this._cb.execute(this, request); }
}
module.exports = SOAPService;
