'use strict';
const { bean } = require('../../util/bean');
class AuthenticationStatus {
  constructor(status, customer) { this._s = status; this._c = customer || null; }
  getStatus() { return this._s; }
  getCustomer() { return this._c; }
  isAuthenticated() { return this._s === AuthenticationStatus.AUTH_OK; }
  getAuthenticated() { return this.isAuthenticated(); }
}
Object.assign(AuthenticationStatus, { AUTH_OK: 'AUTH_OK', ERROR_UNKNOWN: 'ERROR_UNKNOWN', ERROR_CUSTOMER_DISABLED: 'ERROR_CUSTOMER_DISABLED', ERROR_CUSTOMER_LOCKED: 'ERROR_CUSTOMER_LOCKED', ERROR_CUSTOMER_NOT_FOUND: 'ERROR_CUSTOMER_NOT_FOUND', ERROR_PASSWORD_MISMATCH: 'ERROR_PASSWORD_MISMATCH', ERROR_PASSWORD_EXPIRED: 'ERROR_PASSWORD_EXPIRED' });
module.exports = bean(AuthenticationStatus);
