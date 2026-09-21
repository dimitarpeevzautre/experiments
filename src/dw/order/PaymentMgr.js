'use strict';
const rtRef = require('../../runtime');
const ArrayList = require('../util/ArrayList');
const PaymentMethod = require('./PaymentMethod');
const PaymentCard = require('./PaymentCard');
const wrappers = new WeakMap();
function all() { const rt = rtRef.current(); const defs = rt.store.get('payment-methods', {}); const entries = Object.entries(defs); if (!entries.length) return [new PaymentMethod({ ID: 'CREDIT_CARD', name: 'Credit Card', active: true, paymentProcessor: 'BASIC_CREDIT', cards: { Visa: { name: 'Visa' }, MasterCard: { name: 'Master Card' }, Amex: { name: 'American Express', securityCodeLength: 4, numberLengths: [15] } }, custom: {} }), new PaymentMethod({ ID: 'GIFT_CERTIFICATE', name: 'Gift Certificate', active: true, paymentProcessor: 'BASIC_GIFT_CERTIFICATE', custom: {} })]; return entries.map(([id, d]) => { d.ID = d.ID || id; let w = wrappers.get(d); if (!w) { w = new PaymentMethod(d); wrappers.set(d, w); } return w; }); }
module.exports = {
  getPaymentMethod(id) { return all().find((m) => m.getID() === id) || null; },
  getActivePaymentMethods() { return new ArrayList(all().filter((m) => m.isActive())); },
  getApplicablePaymentMethods(customer, countryCode, amount) { return new ArrayList(all().filter((m) => m.isApplicable(customer, countryCode, amount))); },
  getPaymentCard(cardType) { for (const m of all()) { const c = m.getActivePaymentCards().toArray().find((x) => x.getCardType().toLowerCase() === String(cardType).toLowerCase() || x.getName().toLowerCase() === String(cardType).toLowerCase()); if (c) return c; } return null; },
};
