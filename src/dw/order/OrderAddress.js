'use strict';
const { bean } = require('../../util/bean');
const Address = require('../../internal/Address');
class OrderAddress extends Address {
  constructor(data, ctnr) { super(data); this._ctnr = ctnr || null; if (ctnr) { this._collection = ctnr._collection; this._store = ctnr._store; } }
  _markDirty() { super._markDirty(); if (this._ctnr) this._ctnr._markDirty(); }
}
module.exports = bean(OrderAddress);
