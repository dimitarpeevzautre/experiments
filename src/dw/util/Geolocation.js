'use strict';
const { bean } = require('../../util/bean');
class Geolocation {
  constructor(d = {}) { this._d = d; }
  getCountryCode() { return this._d.countryCode || 'US'; }
  getCountryName() { return this._d.countryName || 'United States'; }
  getRegionCode() { return this._d.regionCode || ''; }
  getRegionName() { return this._d.regionName || ''; }
  getCity() { return this._d.city || ''; }
  getPostalCode() { return this._d.postalCode || ''; }
  getLatitude() { return this._d.latitude || 0; }
  getLongitude() { return this._d.longitude || 0; }
  getMetroCode() { return this._d.metroCode || ''; }
  getAvailable() { return true; }
  isAvailable() { return true; }
}
module.exports = bean(Geolocation);
