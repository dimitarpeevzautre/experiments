'use strict';
const { bean } = require('../../util/bean');
class Result {
  constructor(o = {}) { this._o = Object.assign({ ok: true, status: 'OK', object: null, error: 0, errorMessage: null, msg: null, unavailableReason: null, mockResult: false }, o); }
  isOk() { return this._o.ok; } getOk() { return this._o.ok; }
  getStatus() { return this._o.status; }
  getObject() { return this._o.object; }
  getError() { return this._o.error; }
  getErrorMessage() { return this._o.errorMessage; }
  getMsg() { return this._o.msg; }
  getUnavailableReason() { return this._o.unavailableReason; }
  isMockResult() { return this._o.mockResult; } getMockResult() { return this._o.mockResult; }
  toString() { return `Result[${this._o.status}${this._o.errorMessage ? ': ' + this._o.errorMessage : ''}]`; }
}
Object.assign(Result, { OK: 'OK', ERROR: 'ERROR', SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE', UNAVAILABLE_TIMEOUT: 'TIMEOUT', UNAVAILABLE_CIRCUIT_BROKEN: 'CIRCUIT_BROKEN', UNAVAILABLE_RATE_LIMITED: 'RATE_LIMITED', UNAVAILABLE_DISABLED: 'DISABLED', UNAVAILABLE_CONFIG_PROBLEM: 'CONFIG_PROBLEM' });
module.exports = bean(Result);
