'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const Profile = require('./Profile');
const Credentials = require('./Credentials');
const AddressBook = require('./AddressBook');
const Wallet = require('./Wallet');
const CustomerGroup = require('./CustomerGroup');
const ExternalProfile = require('./ExternalProfile');
const CustomerActiveData = require('./CustomerActiveData');
const OrderHistory = require('./OrderHistory');

class Customer {
  constructor(data, rt, { registered = true } = {}) {
    Object.defineProperty(this, '_data', { value: data, writable: true, enumerable: false });
    this._rt = rt; this._registered = registered; this._authenticated = false; this._external = false;
    if (!data.ID) data.ID = require('../object/PersistentObject').newUUID();
    this._collection = 'customers'; this._store = rt.store;
    this._profile = null;
  }
  static _anonymous(rt) { return new Customer({ ID: require('../object/PersistentObject').newUUID(), customerGroups: [] }, rt, { registered: false }); }
  _markDirty() { if (this._registered) { this._data.lastModified = new Date().toISOString(); this._rt.store.touch('customers'); } }
  getID() { return this._data.ID; }
  getProfile() { if (!this._registered) return null; if (!this._profile) this._profile = new Profile(this); return this._profile; }
  getCredentials() { if (!this._cred) this._cred = new Credentials(this); return this._cred; }
  getAddressBook() { if (!this._registered) return null; if (!this._book) this._book = new AddressBook(this); return this._book; }
  getWallet() { if (!this._wallet) this._wallet = new Wallet(this); return this._wallet; }
  getActiveData() { if (!this._active) this._active = new CustomerActiveData(this._data.activeData = this._data.activeData || {}); return this._active; }
  getOrderHistory() { return new OrderHistory(this); }
  isAuthenticated() { return this._authenticated; }
  isRegistered() { return this._registered; }
  isAnonymous() { return !this._registered; }
  isExternallyAuthenticated() { return this._external; }
  getCustomerNo() { return this._data.customerNo || null; }
  getNote() { return this._data.note || null; } setNote(n) { this._data.note = n; this._markDirty(); }
  getNotes() { const Note = require('../object/Note'); return new ArrayList((this._data.notes || []).map((n) => new Note(n))); }
  addNote(subject, text) { const Note = require('../object/Note'); const n = { subject, text, creationDate: new Date().toISOString() }; (this._data.notes = this._data.notes || []).push(n); this._markDirty(); return new Note(n); }
  getCustomerGroups() {
    const rt = this._rt;
    const defs = rt.store.get('customer-groups', {});
    const ids = new Set(this._data.customerGroups || []);
    ids.add('Everyone');
    ids.add(this._registered ? 'Registered' : 'Unregistered');
    for (const [id, def] of Object.entries(defs)) if (def.ruleBased && def.rule && evalRule(def.rule, this)) ids.add(id);
    return new ArrayList(Array.from(ids).map((id) => new CustomerGroup(Object.assign({ ID: id, custom: {} }, defs[id] || {}), rt)));
  }
  isMemberOfCustomerGroup(g) { const id = g && g.getID ? g.getID() : g; return this.getCustomerGroups().toArray().some((x) => x.getID() === id); }
  isMemberOfCustomerGroups(...groups) { return groups.flat().every((g) => this.isMemberOfCustomerGroup(g)); }
  getExternalProfiles() { return new ArrayList((this._data.externalProfiles || []).map((p) => new ExternalProfile(p, this))); }
  getExternalProfile(providerID, externalID) { const p = (this._data.externalProfiles || []).find((x) => x.authenticationProviderID === providerID && x.externalID === externalID); return p ? new ExternalProfile(p, this) : null; }
  createExternalProfile(providerID, externalID) { const p = { authenticationProviderID: providerID, externalID, custom: {} }; (this._data.externalProfiles = this._data.externalProfiles || []).push(p); this._markDirty(); return new ExternalProfile(p, this); }
  removeExternalProfile(ep) { const list = this._data.externalProfiles || []; const i = list.findIndex((x) => x.authenticationProviderID === ep.getAuthenticationProviderID() && x.externalID === ep.getExternalID()); if (i !== -1) list.splice(i, 1); this._markDirty(); }
  getProductLists(type) { const PLM = require('./ProductListMgr'); return PLM.getProductLists(this, type); }
  getGlobalPartyID() { return this._data.globalPartyID || null; }
  getCDPData() { return null; }
  equals(o) { return o instanceof Customer && o.getID() === this.getID(); }
  toString() { return `[Customer ${this._data.customerNo || this._data.ID}]`; }
  toJSON() { return { ID: this._data.ID, customerNo: this._data.customerNo, registered: this._registered, authenticated: this._authenticated }; }
}
function evalRule(rule, customer) {
  try {
    if (typeof rule === 'string') { const vm = require('vm'); return !!vm.runInNewContext(rule, { customer, profile: customer.getProfile(), session: customer._rt.context.session }); }
    return false;
  } catch (e) { return false; }
}
module.exports = bean(Customer);
