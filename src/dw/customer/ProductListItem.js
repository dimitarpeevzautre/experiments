'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const Quantity = require('../value/Quantity');
class ProductListItem extends ExtensibleObject {
  constructor(data, list) { super(data); this._list = list; this._collection = 'product-lists'; this._store = list._rt.store; }
  getID() { return this._data.UUID; }
  getList() { return this._list; }
  getProductID() { return this._data.productID || null; }
  getProduct() { const PM = require('../catalog/ProductMgr'); return this._data.productID ? PM.getProduct(this._data.productID) : null; }
  getQuantity() { return new Quantity(this._data.quantity == null ? 1 : this._data.quantity, ''); }
  getQuantityValue() { return this._data.quantity == null ? 1 : this._data.quantity; }
  setQuantityValue(q) { this._data.quantity = q; this._markDirty(); }
  getPurchasedQuantity() { return new Quantity(this._data.purchasedQuantity || 0, ''); }
  getPurchasedQuantityValue() { return this._data.purchasedQuantity || 0; }
  setPurchasedQuantityValue(q) { this._data.purchasedQuantity = q; this._markDirty(); }
  getPriority() { return this._data.priority || 0; } setPriority(p) { this._data.priority = p; this._markDirty(); }
  isPublic() { return this._data.public !== false; } setPublic(b) { this._data.public = !!b; this._markDirty(); }
  getType() { return this._data.type || ProductListItem.TYPE_PRODUCT; }
  getProductOptionModel() { const p = this.getProduct(); return p ? p.getOptionModel() : null; }
  setProductOptionModel() {}
}
Object.assign(ProductListItem, { TYPE_PRODUCT: 1, TYPE_GIFT_CERTIFICATE: 2 });
module.exports = bean(ProductListItem);
