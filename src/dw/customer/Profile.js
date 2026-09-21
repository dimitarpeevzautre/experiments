'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const EnumValue = require('../value/EnumValue');
const Credentials = require('./Credentials');
const AddressBook = require('./AddressBook');
const Wallet = require('./Wallet');

const STRINGS = ['firstName', 'secondName', 'lastName', 'email', 'phoneHome', 'phoneBusiness', 'phoneMobile', 'fax', 'title', 'suffix', 'salutation', 'companyName', 'jobTitle', 'preferredLocale', 'taxID', 'taxIDType'];
class Profile extends ExtensibleObject {
  constructor(customer) {
    const d = customer._data;
    if (!d.profile) d.profile = { custom: {} };
    super(d.profile);
    this._customer = customer;
    this._collection = 'customers'; this._store = customer._rt.store;
  }
  _markDirty() { super._markDirty(); this._customer._markDirty(); }
  getCustomer() { return this._customer; }
  getCustomerNo() { return this._customer._data.customerNo; }
  getCredentials() { return this._customer.getCredentials(); }
  getAddressBook() { return this._customer.getAddressBook(); }
  getWallet() { return this._customer.getWallet(); }
  getGender() { const g = this._data.gender; return new EnumValue(g == null ? 0 : Number(g), g === 1 || g === '1' ? 'Male' : g === 2 || g === '2' ? 'Female' : 'Unknown'); }
  setGender(g) { this._data.gender = g instanceof EnumValue ? g.getValue() : g; this._markDirty(); }
  isMale() { return Number(this._data.gender) === 1; } isFemale() { return Number(this._data.gender) === 2; }
  getBirthday() { return this._data.birthday ? new Date(this._data.birthday) : null; }
  setBirthday(d) { this._data.birthday = d ? new Date(d).toISOString() : null; this._markDirty(); }
  getNextBirthday() { const b = this.getBirthday(); if (!b) return null; const now = new Date(); const n = new Date(now.getFullYear(), b.getMonth(), b.getDate()); if (n < now) n.setFullYear(now.getFullYear() + 1); return n; }
  getTaxIDMasked() { const t = this._data.taxID; return t ? '*'.repeat(Math.max(0, t.length - 4)) + t.slice(-4) : null; }
  getLastLoginTime() { return this._customer._data.lastLoginTime ? new Date(this._customer._data.lastLoginTime) : null; }
  getLastVisitTime() { return this._customer._data.lastVisitTime ? new Date(this._customer._data.lastVisitTime) : null; }
  getPreviousLoginTime() { return this._customer._data.previousLoginTime ? new Date(this._customer._data.previousLoginTime) : null; }
  getPreviousVisitTime() { return this._customer._data.previousVisitTime ? new Date(this._customer._data.previousVisitTime) : null; }
  getCreationDate() { return new Date(this._customer._data.creationDate || this._data.creationDate); }
  getLastModified() { return new Date(this._data.lastModified); }
  getTaxIDType() { return this._data.taxIDType ? new EnumValue(this._data.taxIDType) : null; }
  setTaxIDType(t) { this._data.taxIDType = t instanceof EnumValue ? t.getValue() : t; }
  setTaxID(t) { this._data.taxID = t; this._markDirty(); }
  getActiveData() { return this._customer.getActiveData(); }
  getSalutation() { return this._data.salutation || null; }
  describe() { const OTD = require('../object/ObjectTypeDefinition'); const rt = this._customer._rt; const schema = (rt.store.get('object-types', {}).Profile) || null; return new OTD('Profile', schema || this._data.custom); }
}
for (const f of STRINGS) {
  const cap = f[0].toUpperCase() + f.slice(1);
  if (!Profile.prototype[`get${cap}`]) Profile.prototype[`get${cap}`] = function () { return this._data[f] == null ? null : this._data[f]; };
  if (!Profile.prototype[`set${cap}`]) Profile.prototype[`set${cap}`] = function (v) { this._data[f] = v; this._markDirty(); };
}
module.exports = bean(Profile);
