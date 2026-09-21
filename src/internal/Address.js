'use strict';
const { bean } = require('../util/bean');
const ExtensibleObject = require('../dw/object/ExtensibleObject');
const EnumValue = require('../dw/value/EnumValue');
const FIELDS = ['firstName', 'secondName', 'lastName', 'address1', 'address2', 'city', 'postalCode', 'stateCode', 'phone', 'companyName', 'suffix', 'salutation', 'title', 'jobTitle', 'postBox', 'countryCode'];

/** Shared implementation of dw.customer.CustomerAddress / dw.order.OrderAddress. */
class Address extends ExtensibleObject {
  constructor(data = {}) { super(data); }
  getID() { return this._data.ID || null; }
  setID(id) { this._data.ID = id; this._markDirty(); }
  getCountryCode() { const c = this._data.countryCode; return c == null ? new EnumValue(null, '') : new EnumValue(String(c).toUpperCase(), countryName(c)); }
  setCountryCode(c) { this._data.countryCode = c == null ? null : (c instanceof EnumValue ? c.getValue() : String(c)); this._markDirty(); }
  getFullName() { return [this._data.firstName, this._data.secondName, this._data.lastName].filter(Boolean).join(' '); }
  getStateCode() { return this._data.stateCode || null; }
  setStateCode(s) { this._data.stateCode = s; this._markDirty(); }
  isEquivalentAddress(other) {
    if (!other) return false;
    const norm = (v) => (v == null ? '' : String(v).trim().toLowerCase());
    const cc = (a) => norm(a.getCountryCode && a.getCountryCode() ? a.getCountryCode().getValue() : a.countryCode);
    return ['firstName', 'lastName', 'address1', 'address2', 'city', 'postalCode', 'stateCode'].every((f) => norm(this._data[f]) === norm(other._data ? other._data[f] : other[f])) && cc(this) === cc(other);
  }
  _copyFrom(other) { for (const f of FIELDS) { const v = other._data ? other._data[f] : other[f]; if (v !== undefined) this._data[f] = v instanceof EnumValue ? v.getValue() : v; } if (other._data && other._data.custom) Object.assign(this._custom, other._data.custom); this._markDirty(); }
}
for (const f of FIELDS) {
  if (f === 'countryCode' || f === 'stateCode') continue;
  const cap = f[0].toUpperCase() + f.slice(1);
  Address.prototype[`get${cap}`] = function () { return this._data[f] == null ? null : this._data[f]; };
  Address.prototype[`set${cap}`] = function (v) { this._data[f] = v; this._markDirty(); };
}
function countryName(c) { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(String(c).toUpperCase()); } catch (e) { return String(c); } }
Address.FIELDS = FIELDS;
module.exports = bean(Address);
