'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const MarkupText = require('../content/MarkupText');
const F = ['name', 'address1', 'address2', 'city', 'postalCode', 'stateCode', 'countryCode', 'phone', 'fax', 'email', 'storeHours', 'storeEvents', 'image', 'latitude', 'longitude', 'storeLocatorEnabled', 'posEnabled', 'inventoryListID'];
class Store extends ExtensibleObject {
  constructor(d) { super(d); }
  getID() { return this._data.ID; }
  getCountryCode() { const EnumValue = require('../value/EnumValue'); return this._data.countryCode ? new EnumValue(this._data.countryCode) : null; }
  getStoreHours() { return this._data.storeHours ? new MarkupText(this._data.storeHours) : null; }
  getStoreEvents() { return this._data.storeEvents ? new MarkupText(this._data.storeEvents) : null; }
  getImage() { const MediaFile = require('../content/MediaFile'); return this._data.image ? new MediaFile(this._data.image) : null; }
  getInventoryList() { const PIM = require('./ProductInventoryMgr'); return this._data.inventoryListID ? PIM.getInventoryList(this._data.inventoryListID) : null; }
  getStoreGroups() { const StoreMgr = require('./StoreMgr'); return new (require('../util/ArrayList'))(StoreMgr.getAllStoreGroups().toArray().filter((g) => g._data.stores && g._data.stores.includes(this._data.ID))); }
  isStoreLocatorEnabled() { return this._data.storeLocatorEnabled !== false; }
  isPosEnabled() { return !!this._data.posEnabled; }
}
for (const f of F) { const cap = f[0].toUpperCase() + f.slice(1); if (!Store.prototype[`get${cap}`]) Store.prototype[`get${cap}`] = function () { return this._data[f] == null ? null : this._data[f]; }; }
module.exports = bean(Store);
