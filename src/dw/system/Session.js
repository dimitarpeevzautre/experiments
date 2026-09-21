'use strict';
const { bean } = require('../../util/bean');
const { createCustomAttributes } = require('../object/CustomAttributes');

class Session {
  constructor(id, rt) {
    this._id = id;
    this._rt = rt;
    this._custom = createCustomAttributes({});
    this._privacy = createCustomAttributes({});
    this._customer = null;
    this._forms = null;
    this._clickStream = null;
    this._currency = null;
    this._lastAccess = Date.now();
    this._trackingAllowed = true;
    this._sourceCodeGroup = null;
    this._userName = null;
    this._customerAuthenticated = false;
    this._customerExternallyAuthenticated = false;
    this._created = new Date();
  }
  getSessionID() { return this._id; }
  getCustom() { return this._custom; }
  getPrivacy() { return this._privacy; }
  getPrivacyCache() { return this._privacy; }
  getCustomer() {
    if (!this._customer) {
      const Customer = this._rt.dw.get('customer/Customer');
      this._customer = Customer._anonymous(this._rt);
    }
    return this._customer;
  }
  _setCustomer(c) { this._customer = c; this._customerAuthenticated = !!(c && c.isAuthenticated()); }
  isCustomerAuthenticated() { return !!this._customer && this._customer.isAuthenticated(); }
  isCustomerExternallyAuthenticated() { return !!this._customer && this._customer.isExternallyAuthenticated(); }
  getForms() {
    if (!this._forms) { const Forms = this._rt.dw.get('web/Forms'); this._forms = new Forms(this); }
    return this._forms;
  }
  getClickStream() {
    if (!this._clickStream) { const CS = this._rt.dw.get('web/ClickStream'); this._clickStream = new CS(); }
    return this._clickStream;
  }
  getCurrency() {
    const Currency = this._rt.dw.get('util/Currency');
    if (this._currency) return this._currency;
    const Site = this._rt.dw.get('system/Site');
    return Currency.getCurrency(Site.getCurrent().getDefaultCurrency());
  }
  setCurrency(c) {
    const Currency = this._rt.dw.get('util/Currency');
    this._currency = typeof c === 'string' ? Currency.getCurrency(c) : c;
  }
  getLastVisitTime() { return null; }
  getSourceCodeInfo() { return this._sourceCodeGroup; }
  setSourceCodeInfo(s) { this._sourceCodeGroup = s; }
  isTrackingAllowed() { return this._trackingAllowed; }
  setTrackingAllowed(b) { this._trackingAllowed = !!b; }
  getUserName() { return this._userName; }
  isUserAuthenticated() { return !!this._userName; }
  getStorefrontSession() { return this; }
  getAgentSession() { return null; }
  isAgentSession() { return false; }
  generateGuestSessionSignature() { return null; }
  getCreationTime() { return this._created; }
  _reset() { this._custom = createCustomAttributes({}); this._privacy = createCustomAttributes({}); this._forms = null; }
  toString() { return `[Session ${this._id}]`; }
}
module.exports = bean(Session);
