'use strict';
const D = require('./_data');
const ArrayList = require('../util/ArrayList');
const LinkedHashMap = require('../util/LinkedHashMap');
const Store = require('./Store');
const StoreGroup = require('./StoreGroup');
function all() { return Object.entries(D.rt().store.get('stores', {})).map(([id, d]) => { d.ID = d.ID || id; return D.wrap(d, Store); }); }
function dist(lat1, lon1, lat2, lon2, unit) { const R = unit === 'km' ? 6371 : 3958.8; const toR = (x) => (x * Math.PI) / 180; const dLat = toR(lat2 - lat1); const dLon = toR(lon2 - lon1); const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(a)); }
const StoreMgr = {
  getStore(id) { return all().find((s) => s.getID() === id) || null; },
  getAllStores() { return new ArrayList(all()); },
  getAllStoreGroups() { return new ArrayList(Object.entries(D.rt().store.get('store-groups', {})).map(([id, d]) => { d.ID = d.ID || id; return new StoreGroup(d); })); },
  getStoreGroup(id) { return StoreMgr.getAllStoreGroups().toArray().find((g) => g.getID() === id) || null; },
  searchStoresByCoordinates(lat, lon, unit, maxDistance, query, ...args) {
    const { compile } = require('../../internal/query');
    const pred = compile(query, args);
    const m = new LinkedHashMap();
    all().filter((s) => s.isStoreLocatorEnabled() && s.getLatitude() != null && s.getLongitude() != null).map((s) => [s, dist(lat, lon, s.getLatitude(), s.getLongitude(), unit)]).filter(([s, d]) => (maxDistance == null || d <= maxDistance) && pred(s)).sort((a, b) => a[1] - b[1]).forEach(([s, d]) => m.put(s, Math.round(d * 100) / 100));
    return m;
  },
  searchStoresByPostalCode(countryCode, postalCode, unit, maxDistance, query, ...args) {
    const geo = (D.rt().store.get('postal-codes', {})[`${countryCode}-${postalCode}`]) || null;
    if (geo) return StoreMgr.searchStoresByCoordinates(geo.latitude, geo.longitude, unit, maxDistance, query, ...args);
    const m = new LinkedHashMap();
    all().filter((s) => String(s.getPostalCode()) === String(postalCode) && (!countryCode || String(s._data.countryCode).toUpperCase() === String(countryCode).toUpperCase())).forEach((s) => m.put(s, 0));
    return m;
  },
  getStoreIDFromSession() { return D.rt().context.session._storeID || null; },
  setStoreIDToSession(id) { D.rt().context.session._storeID = id; },
};
module.exports = StoreMgr;
