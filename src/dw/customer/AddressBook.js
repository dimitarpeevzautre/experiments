'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const CustomerAddress = require('./CustomerAddress');
class AddressBook {
  constructor(customer) { this._customer = customer; const d = customer._data; if (!d.addresses) d.addresses = []; }
  _list() { return this._customer._data.addresses; }
  _wrap(a) { return new CustomerAddress(a, this); }
  getAddresses() { return new ArrayList(this._list().map((a) => this._wrap(a))); }
  getAddress(id) { const a = this._list().find((x) => x.ID === id); return a ? this._wrap(a) : null; }
  createAddress(id) {
    if (!id || this._list().some((x) => x.ID === id)) return null;
    const data = { ID: id, custom: {} };
    this._list().push(data); this._customer._markDirty();
    return this._wrap(data);
  }
  removeAddress(addr) { const id = addr && (addr.getID ? addr.getID() : addr.ID); const i = this._list().findIndex((x) => x.ID === id); if (i !== -1) { this._list().splice(i, 1); if (this._customer._data.preferredAddressID === id) this._customer._data.preferredAddressID = null; this._customer._markDirty(); } }
  getPreferredAddress() { const id = this._customer._data.preferredAddressID; return id ? this.getAddress(id) : (this._list().length ? this._wrap(this._list()[0]) : null); }
  setPreferredAddress(addr) { this._customer._data.preferredAddressID = addr ? addr.getID() : null; this._customer._markDirty(); }
}
module.exports = bean(AddressBook);
