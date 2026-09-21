'use strict';
const { bean } = require('../../util/bean');
const PaymentInstrument = require('../order/PaymentInstrument');
class CustomerPaymentInstrument extends PaymentInstrument {
  constructor(data, wallet) { super(data, null); this._wallet = wallet; if (wallet) { this._collection = 'customers'; this._store = wallet._customer._rt.store; } }
  getCustomer() { return this._wallet ? this._wallet._customer : null; }
}
module.exports = bean(CustomerPaymentInstrument);
