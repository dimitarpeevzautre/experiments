'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const Quantity = require('../value/Quantity');
class ProductInventoryRecord extends ExtensibleObject {
  constructor(data, list, productID) { super(data); this._list = list; this._pid = productID; this._collection = 'inventory'; this._store = require('../../runtime').current().store; }
  getAllocation() { return new Quantity(this._data.allocation != null ? this._data.allocation : (this._data.ATS != null ? this._data.ATS : 0), ''); }
  setAllocation(q, date) { this._data.allocation = q && q.getValue ? q.getValue() : Number(q); if (this._data.ATS != null) this._data.ATS = this._data.allocation - (this._data.reserved || 0); this._markDirty(); }
  getAllocationResetDate() { return this._data.allocationResetDate ? new Date(this._data.allocationResetDate) : null; }
  getATS() { const ats = this._data.ATS != null ? this._data.ATS : (this._data.allocation || 0) - (this._data.reserved || 0) - (this._data.turnover || 0) + (this._data.preorderBackorderAllocation || 0); return new Quantity(Math.max(0, ats), ''); }
  getStockLevel() { return new Quantity(Math.max(0, (this._data.allocation != null ? this._data.allocation : this._data.ATS || 0) - (this._data.turnover || 0)), ''); }
  getOnHand() { return this.getStockLevel(); }
  getReserved() { return new Quantity(this._data.reserved || 0, ''); }
  getTurnover() { return new Quantity(this._data.turnover || 0, ''); }
  isPerpetual() { return !!this._data.perpetual; } setPerpetual(b) { this._data.perpetual = !!b; this._markDirty(); }
  isPreorderable() { return !!this._data.preorderable; } setPreorderable(b) { this._data.preorderable = !!b; this._markDirty(); }
  isBackorderable() { return !!this._data.backorderable; } setBackorderable(b) { this._data.backorderable = !!b; this._markDirty(); }
  getPreorderBackorderAllocation() { return new Quantity(this._data.preorderBackorderAllocation || 0, ''); } setPreorderBackorderAllocation(q) { this._data.preorderBackorderAllocation = q && q.getValue ? q.getValue() : Number(q); this._markDirty(); }
  getInStockDate() { return this._data.inStockDate ? new Date(this._data.inStockDate) : null; } setInStockDate(d) { this._data.inStockDate = d ? new Date(d).toISOString() : null; this._markDirty(); }
  isOnOrder() { return false; }
  _consume(qty) { if (this.isPerpetual()) return; if (this._data.ATS != null) this._data.ATS = Math.max(0, this._data.ATS - qty); else this._data.turnover = (this._data.turnover || 0) + qty; this._markDirty(); }
}
module.exports = bean(ProductInventoryRecord);
