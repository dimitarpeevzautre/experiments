'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const ServiceCredential = require('./ServiceCredential');
const ServiceProfile = require('./ServiceProfile');
class ServiceConfig extends ExtensibleObject {
  constructor(id, data = {}) { super(Object.assign({ custom: {} }, data)); this._id = id; this._cred = new ServiceCredential(Object.assign({ ID: data.credentialID || `${id}-cred` }, data.credential || {})); this._profile = new ServiceProfile(Object.assign({ ID: `${id}-profile` }, data.profile || {})); }
  getID() { return this._id; } getCredential() { return this._cred; } getProfile() { return this._profile; }
  getServiceType() { return this._data.serviceType || 'HTTP'; }
  isEnabled() { return this._data.enabled !== false; }
  isMockModeEnabled() { return !!this._data.mockMode; }
  isCommunicationLogEnabled() { return !!this._data.communicationLog; }
  isForcePrefixEnabled() { return false; }
  getCustomLogFilePrefix() { return this._data.logPrefix || null; }
}
module.exports = bean(ServiceConfig);
