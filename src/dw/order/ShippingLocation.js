'use strict';
const { bean } = require('../../util/bean');
class ShippingLocation {
  constructor(addr) { this._a = addr || null; this._d = {}; }
  _g(f) { if (this._d[f] !== undefined) return this._d[f]; if (!this._a) return null; const v = this._a[f]; return v && v.getValue ? v.getValue() : (v == null ? null : v); }
  getAddress1() { return this._g('address1'); } setAddress1(v) { this._d.address1 = v; }
  getAddress2() { return this._g('address2'); } setAddress2(v) { this._d.address2 = v; }
  getCity() { return this._g('city'); } setCity(v) { this._d.city = v; }
  getPostalCode() { return this._g('postalCode'); } setPostalCode(v) { this._d.postalCode = v; }
  getStateCode() { return this._g('stateCode'); } setStateCode(v) { this._d.stateCode = v; }
  getCountryCode() { return this._g('countryCode'); } setCountryCode(v) { this._d.countryCode = v; }
  getPostBox() { return this._g('postBox'); } setPostBox(v) { this._d.postBox = v; }
  getSuite() { return this._g('suite'); } setSuite(v) { this._d.suite = v; }
}
module.exports = bean(ShippingLocation);
