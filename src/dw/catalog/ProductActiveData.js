'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
class ProductActiveData extends ExtensibleObject {
  constructor(d = {}) { super(Object.assign({ custom: {} }, d)); }
  getAvailableDate() { return this._data.availableDate ? new Date(this._data.availableDate) : null; }
  getConversionWeek() { return this._data.conversionWeek || 0; } getConversionMonth() { return this._data.conversionMonth || 0; } getConversionYear() { return this._data.conversionYear || 0; }
  getImpressionsWeek() { return 0; } getImpressionsMonth() { return 0; } getImpressionsYear() { return 0; } getImpressionsDay() { return 0; }
  getOrdersWeek() { return 0; } getOrdersMonth() { return 0; } getOrdersYear() { return 0; } getOrdersDay() { return 0; }
  getRevenueWeek() { return 0; } getRevenueMonth() { return 0; } getRevenueYear() { return 0; } getRevenueDay() { return 0; }
  getUnitsWeek() { return 0; } getUnitsMonth() { return 0; } getUnitsYear() { return 0; } getUnitsDay() { return 0; }
  getViewsWeek() { return 0; } getViewsMonth() { return 0; } getViewsYear() { return 0; } getViewsDay() { return 0; }
  getReturnRate() { return 0; } getDaysAvailable() { return 0; } getSalesVelocityWeek() { return 0; } getSalesVelocityMonth() { return 0; }
  isEmpty() { return true; }
}
module.exports = bean(ProductActiveData);
