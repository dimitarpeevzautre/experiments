'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const ProductInventoryRecord = require('./ProductInventoryRecord');
class ProductInventoryList extends ExtensibleObject {
  constructor(data) { super(data); if (!data.records) data.records = {}; }
  getID() { return this._data.ID; }
  getDescription() { return this._data.description || null; }
  getDefaultInStockFlag() { return !!this._data.defaultInStock; }
  getRecord(productOrID) { const id = productOrID && productOrID.getID ? productOrID.getID() : productOrID; const r = this._data.records[id]; if (r) return new ProductInventoryRecord(r, this, id); if (this._data.defaultInStock) return new ProductInventoryRecord({ perpetual: true, ATS: 999999, custom: {} }, this, id); return null; }
  createRecord(productOrID) { const id = productOrID && productOrID.getID ? productOrID.getID() : productOrID; if (!this._data.records[id]) { this._data.records[id] = { allocation: 0, ATS: 0, custom: {} }; require('../../runtime').current().store.touch('inventory'); } return this.getRecord(id); }
  equals(o) { return o instanceof ProductInventoryList && o.getID() === this.getID(); }
}
module.exports = bean(ProductInventoryList);
