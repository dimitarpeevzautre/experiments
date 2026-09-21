'use strict';
const Service = require('./Service');
class GenericService extends Service { _execute(request) { if (typeof this._cb.execute !== 'function') throw new Error(`GenericService ${this._id} requires an execute callback`); return this._cb.execute(this, request); } }
module.exports = GenericService;
