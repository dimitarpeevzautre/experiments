'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const ArrayList = require('../util/ArrayList');
const ProductListItem = require('./ProductListItem');
class ProductList extends ExtensibleObject {
  constructor(data, rt) { super(data); this._rt = rt; this._collection = 'product-lists'; this._store = rt.store; if (!data.items) data.items = []; }
  getID() { return this._data.ID || this._data.UUID; }
  getType() { return this._data.type; }
  getName() { return this._data.name || null; } setName(n) { this._data.name = n; this._markDirty(); }
  getDescription() { return this._data.description || null; } setDescription(d) { this._data.description = d; this._markDirty(); }
  isPublic() { return !!this._data.public; } setPublic(b) { this._data.public = !!b; this._markDirty(); }
  getOwner() { const CM = require('./CustomerMgr'); return this._data.ownerNo ? CM.getCustomerByCustomerNumber(this._data.ownerNo) : null; }
  isAnonymous() { return !this._data.ownerNo; }
  getItems() { return new ArrayList(this._data.items.map((i) => new ProductListItem(i, this))); }
  getProductItems() { return new ArrayList(this._data.items.filter((i) => (i.type || 1) === 1).map((i) => new ProductListItem(i, this))); }
  getGiftCertificateItems() { return new ArrayList(this._data.items.filter((i) => i.type === 2).map((i) => new ProductListItem(i, this))); }
  getPublicItems() { return new ArrayList(this._data.items.filter((i) => i.public !== false).map((i) => new ProductListItem(i, this))); }
  getItem(id) { const i = this._data.items.find((x) => x.UUID === id); return i ? new ProductListItem(i, this) : null; }
  createProductItem(product) { const i = { productID: product.getID ? product.getID() : String(product), quantity: 1, type: 1, custom: {} }; this._data.items.push(i); this._markDirty(); return new ProductListItem(i, this); }
  createGiftCertificateItem() { const i = { type: 2, quantity: 1, custom: {} }; this._data.items.push(i); this._markDirty(); return new ProductListItem(i, this); }
  removeItem(item) { const idx = this._data.items.findIndex((x) => x.UUID === item.getUUID()); if (idx !== -1) { this._data.items.splice(idx, 1); this._markDirty(); } }
  getEventCity() { return this._data.eventCity || null; } setEventCity(v) { this._data.eventCity = v; }
  getEventCountry() { return this._data.eventCountry || null; } setEventCountry(v) { this._data.eventCountry = v; }
  getEventState() { return this._data.eventState || null; } setEventState(v) { this._data.eventState = v; }
  getEventType() { return this._data.eventType || null; } setEventType(v) { this._data.eventType = v; }
  getEventDate() { return this._data.eventDate ? new Date(this._data.eventDate) : null; } setEventDate(d) { this._data.eventDate = d ? new Date(d).toISOString() : null; }
  getRegistrant() { return null; } getCoRegistrant() { return null; } createRegistrant() { return null; } createCoRegistrant() { return null; }
  getShippingAddress() { return null; } setShippingAddress() {} getPostEventShippingAddress() { return null; } setPostEventShippingAddress() {}
  getCurrentShippingAddress() { return null; }
  getExportStatus() { const EnumValue = require('../value/EnumValue'); return new EnumValue(0, 'NOT_EXPORTED'); }
}
Object.assign(ProductList, { TYPE_WISH_LIST: 10, TYPE_GIFT_REGISTRY: 11, TYPE_SHOPPING_LIST: 12, TYPE_CUSTOM_1: 15, TYPE_CUSTOM_2: 16, TYPE_CUSTOM_3: 17, EXPORT_STATUS_NOTEXPORTED: 0, EXPORT_STATUS_EXPORTED: 1 });
module.exports = bean(ProductList);
