'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const CustomerPaymentInstrument = require('./CustomerPaymentInstrument');
class Wallet {
  constructor(customer) { this._customer = customer; if (!customer._data.paymentInstruments) customer._data.paymentInstruments = []; }
  _list() { return this._customer._data.paymentInstruments; }
  getPaymentInstruments(method) { return new ArrayList(this._list().filter((p) => !method || p.paymentMethod === method).map((p) => new CustomerPaymentInstrument(p, this))); }
  createPaymentInstrument(method) { const data = { paymentMethod: method, custom: {} }; this._list().push(data); this._customer._markDirty(); return new CustomerPaymentInstrument(data, this); }
  removePaymentInstrument(pi) { const uuid = pi.getUUID(); const i = this._list().findIndex((p) => p.UUID === uuid); if (i !== -1) { this._list().splice(i, 1); this._customer._markDirty(); } }
}
module.exports = bean(Wallet);
