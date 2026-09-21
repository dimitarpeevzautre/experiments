'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
class ExternalProfile extends ExtensibleObject {
  constructor(data, customer) { super(data); this._customer = customer; }
  getAuthenticationProviderID() { return this._data.authenticationProviderID; }
  getExternalID() { return this._data.externalID; }
  getEmail() { return this._data.email || null; } setEmail(e) { this._data.email = e; this._customer._markDirty(); }
  getCustomer() { return this._customer; }
  getLastLoginTime() { return this._data.lastLoginTime ? new Date(this._data.lastLoginTime) : null; }
}
module.exports = bean(ExternalProfile);
