'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
class CustomerActiveData extends ExtensibleObject {
  constructor(data = {}) { super(data); }
  getOrders() { return this._data.orders || 0; } getOrderValue() { return this._data.orderValue || 0; } getAvgOrderValue() { return this._data.avgOrderValue || 0; }
  getLastOrderDate() { return this._data.lastOrderDate ? new Date(this._data.lastOrderDate) : null; }
  getProductsOrdered() { return this._data.productsOrdered || 0; } getVisitsYear() { return 0; } getVisitsMonth() { return 0; } getVisitsWeek() { return 0; }
  getViewedPromotions() { return new (require('../util/ArrayList'))(); } getViewedCategories() { return new (require('../util/ArrayList'))(); } getViewedProducts() { return new (require('../util/ArrayList'))(); }
  isEmpty() { return Object.keys(this._data).filter((k) => !['UUID', 'creationDate', 'lastModified', 'custom'].includes(k)).length === 0; }
}
module.exports = bean(CustomerActiveData);
