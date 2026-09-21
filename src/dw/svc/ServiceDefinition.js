'use strict';
/** Legacy ServiceRegistry definition: holds callbacks and configure() chain; createService() instantiates. */
class ServiceDefinition {
  constructor(id, cb) { this._id = id; this._cb = cb || {}; this._mock = false; this._throw = false; }
  configure(cb) { Object.assign(this._cb, cb); return this; }
  setMock() { this._mock = true; return this; }
  isMock() { return this._mock; }
  setThrowOnError() { this._throw = true; return this; }
  isThrowOnError() { return this._throw; }
  getServiceID() { return this._id; }
  getConfiguration() { return require('./LocalServiceRegistry').createService(this._id, this._cb).getConfiguration(); }
  createService() { const s = require('./LocalServiceRegistry').createService(this._id, this._cb); if (this._mock) s.setMock(); if (this._throw) s.setThrowOnError(true); return s; }
}
module.exports = ServiceDefinition;
