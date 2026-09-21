'use strict';
const { bean } = require('../../util/bean');
const Money = require('../value/Money');
class ApproachingDiscount {
  constructor(promotion, discount, threshold, current, currency) { this._p = promotion; this._d = discount; this._t = threshold; this._c = current; this._cur = currency; }
  getPromotion() { return this._p; } getDiscount() { return this._d; }
  getConditionThreshold() { return new Money(this._t, this._cur); }
  getMerchandiseTotal() { return new Money(this._c, this._cur); }
  getDistanceFromConditionThreshold() { return new Money(Math.max(0, this._t - this._c), this._cur); }
  isConditionSatisfied() { return this._c >= this._t; }
}
module.exports = bean(ApproachingDiscount);
