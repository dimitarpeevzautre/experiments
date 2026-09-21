'use strict';
const { bean } = require('../../util/bean');
class ProductPriceInfo {
  constructor(price, priceBook, percentage, onlineFrom, onlineTo) { this._price = price; this._pb = priceBook; this._pct = percentage || 0; this._from = onlineFrom || null; this._to = onlineTo || null; }
  getPrice() { return this._price; } getPriceBook() { return this._pb; } getPercentage() { return this._pct; } getOnlineFrom() { return this._from; } getOnlineTo() { return this._to; }
  getPriceInfo() { return ''; }
}
module.exports = bean(ProductPriceInfo);
