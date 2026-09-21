'use strict';
const { bean } = require('../../util/bean');
const PaymentInstrument = require('./PaymentInstrument');
const Money = require('../value/Money');
class OrderPaymentInstrument extends PaymentInstrument {
  constructor(data, ctnr) { super(data, ctnr); this._collection = ctnr._collection; this._store = ctnr._store; }
  _markDirty() { super._markDirty(); if (this._ctnr) this._ctnr._markDirty(); }
  getCapturedAmount() { return new Money(this._data.capturedAmount || 0, this._ctnr.getCurrencyCode()); }
  getRefundedAmount() { return new Money(this._data.refundedAmount || 0, this._ctnr.getCurrencyCode()); }
  getBankAccountDriversLicenseLastDigits() { return super.getBankAccountDriversLicenseLastDigits(); }
}
module.exports = bean(OrderPaymentInstrument);
