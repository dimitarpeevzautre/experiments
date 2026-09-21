'use strict';
const { bean } = require('../../util/bean');
const ProductAvailabilityLevels = require('./ProductAvailabilityLevels');
const ProductInventoryMgr = require('./ProductInventoryMgr');
class ProductAvailabilityModel {
  constructor(product, list) { this._p = product; this._list = list || ProductInventoryMgr.getInventoryList(); }
  getInventoryRecord() { return this._list ? this._list.getRecord(this._p.getID()) : null; }
  _ats() { const r = this.getInventoryRecord(); if (!r) return 0; return r.isPerpetual() ? Infinity : r.getATS().getValue(); }
  _masterOrSet() { return this._p.isMaster() || this._p.isProductSet() || this._p.isBundle() || this._p.isVariationGroup(); }
  _children() { if (this._p.isMaster() || this._p.isVariationGroup()) return this._p.getVariationModel().getVariants().toArray(); if (this._p.isProductSet()) return this._p.getProductSetProducts().toArray(); if (this._p.isBundle()) return this._p.getBundledProducts().toArray(); return []; }
  isOrderable(qty) {
    if (!this._p.isOnline()) return false;
    const n = qty === undefined ? this._p.getMinOrderQuantity().getValue() : (qty.getValue ? qty.getValue() : Number(qty));
    if (this._p.isBundle()) return this._children().every((c) => c.getAvailabilityModel().isOrderable(n * this._p.getBundledProductQuantity(c).getValue()));
    if (this._p.isMaster() || this._p.isVariationGroup() || this._p.isProductSet()) return this._children().some((c) => c.getAvailabilityModel().isOrderable(n));
    const r = this.getInventoryRecord();
    if (!r) return false;
    if (r.isPerpetual()) return true;
    if (r.getATS().getValue() >= n) return true;
    return (r.isPreorderable() || r.isBackorderable()) && r.getPreorderBackorderAllocation().getValue() >= n;
  }
  isInStock(qty) {
    const n = qty === undefined ? 1 : (qty.getValue ? qty.getValue() : Number(qty));
    if (this._masterOrSet()) return this._children().some((c) => c.getAvailabilityModel().isInStock(n));
    const r = this.getInventoryRecord(); if (!r) return false; return r.isPerpetual() || r.getATS().getValue() >= n;
  }
  getAvailability() {
    if (this._masterOrSet()) { const c = this._children(); if (!c.length) return 0; return Math.max(...c.map((x) => x.getAvailabilityModel().getAvailability())); }
    const r = this.getInventoryRecord(); if (!r) return 0; if (r.isPerpetual()) return 1; const alloc = r.getAllocation().getValue(); return alloc > 0 ? Math.min(1, r.getATS().getValue() / alloc) : (r.getATS().getValue() > 0 ? 1 : 0);
  }
  getAvailabilityStatus() {
    const r = this._masterOrSet() ? null : this.getInventoryRecord();
    if (this._masterOrSet()) return this.isInStock() ? ProductAvailabilityModel.AVAILABILITY_STATUS_IN_STOCK : ProductAvailabilityModel.AVAILABILITY_STATUS_NOT_AVAILABLE;
    if (!r) return ProductAvailabilityModel.AVAILABILITY_STATUS_NOT_AVAILABLE;
    if (r.isPerpetual() || r.getATS().getValue() > 0) return ProductAvailabilityModel.AVAILABILITY_STATUS_IN_STOCK;
    if (r.isPreorderable() && r.getPreorderBackorderAllocation().getValue() > 0) return ProductAvailabilityModel.AVAILABILITY_STATUS_PREORDER;
    if (r.isBackorderable() && r.getPreorderBackorderAllocation().getValue() > 0) return ProductAvailabilityModel.AVAILABILITY_STATUS_BACKORDER;
    return ProductAvailabilityModel.AVAILABILITY_STATUS_NOT_AVAILABLE;
  }
  getAvailabilityLevels(qty) {
    const n = qty && qty.getValue ? qty.getValue() : Number(qty);
    const r = this.getInventoryRecord();
    if (!r) return new ProductAvailabilityLevels(0, 0, 0, n);
    if (r.isPerpetual()) return new ProductAvailabilityLevels(n, 0, 0, 0);
    const inStock = Math.min(n, r.getATS().getValue());
    let rest = n - inStock; let pre = 0; let back = 0;
    const pb = r.getPreorderBackorderAllocation().getValue();
    if (rest > 0 && r.isPreorderable()) { pre = Math.min(rest, pb); rest -= pre; }
    else if (rest > 0 && r.isBackorderable()) { back = Math.min(rest, pb); rest -= back; }
    return new ProductAvailabilityLevels(inStock, pre, back, rest);
  }
  getTimeToOutOfStock() { return 0; }
  getSKUCoverage() { if (!this._masterOrSet()) return this.isInStock() ? 1 : 0; const c = this._children(); return c.length ? c.filter((x) => x.getAvailabilityModel().isInStock()).length / c.length : 0; }
  isAvailable() { return this.isOrderable(); }
}
Object.assign(ProductAvailabilityModel, { AVAILABILITY_STATUS_IN_STOCK: 'IN_STOCK', AVAILABILITY_STATUS_PREORDER: 'PREORDER', AVAILABILITY_STATUS_BACKORDER: 'BACKORDER', AVAILABILITY_STATUS_NOT_AVAILABLE: 'NOT_AVAILABLE' });
module.exports = bean(ProductAvailabilityModel);
