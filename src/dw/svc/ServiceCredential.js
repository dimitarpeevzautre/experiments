'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
class ServiceCredential extends ExtensibleObject {
  constructor(data = {}) { super(Object.assign({ custom: {} }, data)); }
  getID() { return this._data.ID || null; } getURL() { return this._data.URL || this._data.url || null; } getUser() { return this._data.user || null; } getPassword() { return this._data.password || null; }
}
module.exports = bean(ServiceCredential);
