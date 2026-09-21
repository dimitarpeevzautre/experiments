'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const ArrayList = require('../util/ArrayList');
class Campaign extends ExtensibleObject {
  constructor(d) { super(d); }
  getID() { return this._data.ID; } getDescription() { return this._data.description || null; }
  isEnabled() { return this._data.enabled !== false; }
  getStartDate() { return this._data.startDate ? new Date(this._data.startDate) : null; } getEndDate() { return this._data.endDate ? new Date(this._data.endDate) : null; }
  isActive() { const now = Date.now(); return this.isEnabled() && (!this._data.startDate || new Date(this._data.startDate).getTime() <= now) && (!this._data.endDate || new Date(this._data.endDate).getTime() >= now); }
  isApplicableInStorefront() { return this._data.applicableInStorefront !== false; }
  getCustomerGroups() { const CM = require('../customer/CustomerMgr'); return new ArrayList((this._data.customerGroups || []).map((g) => CM.getCustomerGroup(g)).filter(Boolean)); }
  getCoupons() { const CouponMgr = require('./CouponMgr'); return new ArrayList((this._data.coupons || []).map((c) => CouponMgr.getCoupon(c)).filter(Boolean)); }
  getSourceCodeGroups() { return new ArrayList(); }
  getPromotions() { const PromotionMgr = require('./PromotionMgr'); return new ArrayList(PromotionMgr._allPromotions().filter((p) => p._data.campaign === this._data.ID)); }
  isBasedOnCoupons() { return (this._data.coupons || []).length > 0; }
  isBasedOnCustomerGroups() { return (this._data.customerGroups || []).length > 0; }
  isBasedOnSourceCodes() { return (this._data.sourceCodeGroups || []).length > 0; }
}
module.exports = bean(Campaign);
