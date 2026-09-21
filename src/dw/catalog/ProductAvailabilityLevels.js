'use strict';
const { bean } = require('../../util/bean');
const Quantity = require('../value/Quantity');
class ProductAvailabilityLevels {
  constructor(inStock, preorder, backorder, notAvailable) { this._i = inStock; this._p = preorder; this._b = backorder; this._n = notAvailable; }
  getInStock() { return new Quantity(this._i, ''); } getPreorder() { return new Quantity(this._p, ''); } getBackorder() { return new Quantity(this._b, ''); } getNotAvailable() { return new Quantity(this._n, ''); }
  getCount() { return (this._i > 0) + (this._p > 0) + (this._b > 0) + (this._n > 0); }
}
module.exports = bean(ProductAvailabilityLevels);
