'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const ArrayList = require('../util/ArrayList');
const PaymentProcessor = require('./PaymentProcessor');
const PaymentCard = require('./PaymentCard');
/** data/payment-methods.json: { CREDIT_CARD: { name, active, paymentProcessor, description, cards: { Visa: {...} }, countries: [], minAmount, maxAmount, customerGroups: [] } } */
class PaymentMethod extends ExtensibleObject {
  constructor(d) { super(d); }
  getID() { return this._data.ID; } getName() { return this._data.name || this._data.ID; } getDescription() { return this._data.description || null; }
  isActive() { return this._data.active !== false; }
  getImage() { const MediaFile = require('../content/MediaFile'); return this._data.image ? new MediaFile(this._data.image) : null; }
  getPaymentProcessor() { return this._data.paymentProcessor ? new PaymentProcessor(this._data.paymentProcessor) : null; }
  getActivePaymentCards() { return new ArrayList(Object.entries(this._data.cards || {}).map(([id, c]) => new PaymentCard(Object.assign({ ID: id, custom: {} }, c))).filter((c) => c.isActive())); }
  getApplicablePaymentCards(customer, countryCode, amount) { return this.getActivePaymentCards(); }
  isApplicable(customer, countryCode, amount) {
    if (!this.isActive()) return false;
    if (this._data.countries && countryCode && !this._data.countries.map((x) => x.toUpperCase()).includes(String(countryCode).toUpperCase())) return false;
    if (amount != null) { if (this._data.minAmount != null && amount < this._data.minAmount) return false; if (this._data.maxAmount != null && amount > this._data.maxAmount) return false; }
    if (this._data.customerGroups && this._data.customerGroups.length && customer && !this._data.customerGroups.some((g) => customer.isMemberOfCustomerGroup(g))) return false;
    return true;
  }
  equals(o) { return o instanceof PaymentMethod && o.getID() === this.getID(); }
}
Object.assign(PaymentMethod, { METHOD_CREDIT_CARD: 'CREDIT_CARD', METHOD_GIFT_CERTIFICATE: 'GIFT_CERTIFICATE', METHOD_BANK_TRANSFER: 'BANK_TRANSFER', METHOD_BML: 'BML', METHOD_DW_ANDROID_PAY: 'DW_ANDROID_PAY', METHOD_DW_APPLE_PAY: 'DW_APPLE_PAY', METHOD_DW_GOOGLE_PAY: 'DW_GOOGLE_PAY' });
module.exports = bean(PaymentMethod);
