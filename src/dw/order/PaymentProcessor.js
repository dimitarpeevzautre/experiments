'use strict';
const { bean } = require('../../util/bean');
class PaymentProcessor {
  constructor(id) { this._id = id; }
  getID() { return this._id; }
  getPreferenceValue(name) { const rt = require('../../runtime').current(); const p = rt.store.get('payment-processors', {})[this._id]; return p && p.preferences && p.preferences[name] !== undefined ? p.preferences[name] : null; }
  equals(o) { return o instanceof PaymentProcessor && o._id === this._id; }
  toString() { return this._id; }
}
module.exports = bean(PaymentProcessor);
