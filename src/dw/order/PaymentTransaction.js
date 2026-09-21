'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const Money = require('../value/Money');
class PaymentTransaction extends ExtensibleObject {
  constructor(data, instrument) { super(data); this._pi = instrument; }
  getAmount() { const a = this._data.amount; return a == null ? Money.NOT_AVAILABLE : new Money(a.value !== undefined ? a.value : a, a.currencyCode || (this._pi && this._pi._currency()) || 'USD'); }
  setAmount(m) { this._data.amount = m instanceof Money ? { value: m.getValue(), currencyCode: m.getCurrencyCode() } : m; this._markDirty(); }
  getTransactionID() { return this._data.transactionID || null; }
  setTransactionID(id) { this._data.transactionID = id; this._markDirty(); }
  getType() { const EnumValue = require('../value/EnumValue'); return new EnumValue(this._data.type || PaymentTransaction.TYPE_AUTH); }
  setType(t) { this._data.type = t && t.getValue ? t.getValue() : t; this._markDirty(); }
  getPaymentProcessor() { if (!this._data.paymentProcessor) return null; const PP = require('./PaymentProcessor'); return new PP(this._data.paymentProcessor); }
  setPaymentProcessor(p) { this._data.paymentProcessor = p && p.getID ? p.getID() : p; this._markDirty(); }
  getPaymentInstrument() { return this._pi; }
  getAccountID() { return this._data.accountID || null; } setAccountID(v) { this._data.accountID = v; }
  getAccountType() { return this._data.accountType || null; } setAccountType(v) { this._data.accountType = v; }
}
Object.assign(PaymentTransaction, { TYPE_AUTH: 'AUTH', TYPE_CAPTURE: 'CAPTURE', TYPE_AUTH_REVERSAL: 'AUTH_REVERSAL', TYPE_CREDIT: 'CREDIT' });
module.exports = bean(PaymentTransaction);
