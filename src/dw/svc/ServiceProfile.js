'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
class ServiceProfile extends ExtensibleObject {
  constructor(data = {}) { super(Object.assign({ custom: {} }, data)); }
  getID() { return this._data.ID || null; } getTimeoutMillis() { return this._data.timeoutMillis || 30000; } getRateLimitCalls() { return this._data.rateLimitCalls || 0; } getRateLimitMillis() { return this._data.rateLimitMillis || 0; }
  getCbCalls() { return this._data.cbCalls || 0; } getCbMillis() { return this._data.cbMillis || 0; }
}
module.exports = bean(ServiceProfile);
