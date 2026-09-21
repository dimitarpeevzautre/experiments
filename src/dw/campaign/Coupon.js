'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const ArrayList = require('../util/ArrayList');
/** data/coupons.json: { ID: { type: 'single_code'|'multiple_codes'|'system_codes', codes: ['SAVE10'], enabled, redemptionLimitPerCode, redemptionLimitPerCustomer, redemptionLimitPerTimeFrame, campaign, promotions: [] } } */
class Coupon extends ExtensibleObject {
  constructor(d) { super(d); }
  getID() { return this._data.ID; }
  getType() { return (this._data.type || 'single_code').toUpperCase(); }
  isEnabled() { return this._data.enabled !== false; }
  getCodePrefix() { return this._data.codePrefix || null; }
  getRedemptionLimitPerCode() { return this._data.redemptionLimitPerCode == null ? 0 : this._data.redemptionLimitPerCode; }
  getRedemptionLimitPerCustomer() { return this._data.redemptionLimitPerCustomer == null ? 0 : this._data.redemptionLimitPerCustomer; }
  getRedemptionLimitPerTimeFrame() { return this._data.redemptionLimitPerTimeFrame == null ? 0 : this._data.redemptionLimitPerTimeFrame; }
  getRedemptionLimitTimeFrame() { return this._data.redemptionLimitTimeFrame || 0; }
  getPromotions() { const PromotionMgr = require('./PromotionMgr'); return new ArrayList(PromotionMgr._allPromotions().filter((p) => p._couponIDs().includes(this._data.ID))); }
  getCampaigns() { const PromotionMgr = require('./PromotionMgr'); return new ArrayList(PromotionMgr._allCampaigns().filter((c) => (c._data.coupons || []).includes(this._data.ID))); }
  getNextCouponCode() { const codes = this._codes(); if (this.getType() === 'SYSTEM_CODES') { const c = `${this._data.codePrefix || this._data.ID}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; (this._data.codes = this._data.codes || []).push(c); this._markDirty(); return c; } return codes[0] || null; }
  _codes() { return (this._data.codes || (this._data.code ? [this._data.code] : [])).map(String); }
  _hasCode(code) { if (!code) return false; const c = String(code); if (this._codes().some((x) => x.toLowerCase() === c.toLowerCase())) return true; return this.getType() === 'SYSTEM_CODES' && this._data.codePrefix && c.toUpperCase().startsWith(String(this._data.codePrefix).toUpperCase()); }
}
Object.assign(Coupon, { TYPE_SINGLE_CODE: 'SINGLE_CODE', TYPE_MULTIPLE_CODES: 'MULTIPLE_CODES', TYPE_SYSTEM_CODES: 'SYSTEM_CODES' });
module.exports = bean(Coupon);
