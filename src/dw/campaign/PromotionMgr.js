'use strict';
const rtRef = require('../../runtime');
const ArrayList = require('../util/ArrayList');
const Promotion = require('./Promotion');
const Campaign = require('./Campaign');
const PromotionPlan = require('./PromotionPlan');
const DiscountPlan = require('./DiscountPlan');
const Discount = require('./Discount');
const Money = require('../value/Money');
const pw = new WeakMap(); const cw = new WeakMap();
function wrap(map, d, Cls, coll) { let w = map.get(d); if (!w) { w = new Cls(d); w._collection = coll; w._store = rtRef.current().store; map.set(d, w); } return w; }
function allPromotions() { return Object.entries(rtRef.current().store.get('promotions', {})).map(([id, d]) => { d.ID = d.ID || id; return wrap(pw, d, Promotion, 'promotions'); }); }
function allCampaigns() { return Object.entries(rtRef.current().store.get('campaigns', {})).map(([id, d]) => { d.ID = d.ID || id; return wrap(cw, d, Campaign, 'campaigns'); }); }
function byRank(a, b) { const ra = a.getRank() == null ? Infinity : a.getRank(); const rb = b.getRank() == null ? Infinity : b.getRank(); return ra - rb; }

const PromotionMgr = {
  _allPromotions: allPromotions, _allCampaigns: allCampaigns,
  getPromotion(id) { return allPromotions().find((p) => p.getID() === id) || null; },
  getCampaign(id) { return allCampaigns().find((c) => c.getID() === id) || null; },
  getPromotions() { return new ArrayList(allPromotions()); },
  getCampaigns() { return new ArrayList(allCampaigns()); },
  getActivePromotions() { return new PromotionPlan(allPromotions().filter((p) => p.isActive()).sort(byRank)); },
  getActiveCustomerPromotions() { return new PromotionPlan(allPromotions().filter((p) => p.isActive() && p._qualifies(null) && !p.isBasedOnCoupons()).sort(byRank)); },
  getActivePromotionsForCampaign(campaign, from, to) { return new PromotionPlan(allPromotions().filter((p) => p.isActive() && p._data.campaign === campaign.getID()).sort(byRank)); },
  getActiveCustomerPromotionsForCampaign(campaign) { return PromotionMgr.getActivePromotionsForCampaign(campaign); },
  getUpcomingPromotions(days) { const lim = Date.now() + (days || 7) * 86400000; return new PromotionPlan(allPromotions().filter((p) => p.isEnabled() && p.getStartDate() && p.getStartDate().getTime() > Date.now() && p.getStartDate().getTime() < lim)); },
  getUpcomingCustomerPromotions(days) { return PromotionMgr.getUpcomingPromotions(days); },
  /** Evaluate all active promotions applicable to a basket (including coupon-based ones with valid coupons). */
  getDiscounts(ctnr, plan) {
    const promos = plan ? plan._list() : allPromotions().filter((p) => p.isActive()).sort(byRank);
    const cur = ctnr.getCurrencyCode();
    const entries = [];
    const usedClasses = new Set(); let globalExclusive = false;
    for (const p of promos) {
      if (!p._qualifies(ctnr)) continue;
      if (globalExclusive) break;
      const cls = p.getPromotionClass();
      if (p.getExclusivity() === 'CLASS' && usedClasses.has(cls)) continue;
      const d = p._discount(cur);
      if (!d) continue;
      let applied = false;
      if (cls === 'PRODUCT') {
        if (['bonus', 'bonus_choice'].includes(p._data.discount.type)) { entries.push({ target: 'bonus', item: null, promotion: p, discount: d }); applied = true; }
        else for (const pli of ctnr.getAllProductLineItems().toArray()) { if (pli.isBonusProductLineItem() || !p._appliesToProduct(pli.getProduct())) continue; entries.push({ target: 'product', item: pli, promotion: p, discount: d }); applied = true; }
      } else if (cls === 'ORDER') { entries.push({ target: 'order', item: null, promotion: p, discount: d }); applied = true; }
      else if (cls === 'SHIPPING') { for (const sh of ctnr.getShipments().toArray()) { const m = sh.getShippingMethod(); if (p._data.shippingMethods && (!m || !p._data.shippingMethods.includes(m.getID()))) continue; entries.push({ target: 'shipping', item: sh, promotion: p, discount: d }); applied = true; } }
      if (applied) { if (p.getExclusivity() === 'CLASS') usedClasses.add(cls); if (p.getExclusivity() === 'GLOBAL') globalExclusive = true; }
    }
    // mark coupon line items applied
    const applied = new Set(entries.map((e) => e.promotion.getID()));
    for (const cli of ctnr.getCouponLineItems().toArray()) cli._applied = cli.isValid() && cli._promotions().some((pr) => applied.has(pr.getID()));
    return new DiscountPlan(ctnr, entries);
  },
  /** Apply a discount plan (or compute one) to the basket: creates price adjustments. */
  applyDiscounts(ctnrOrPlan) {
    const plan = ctnrOrPlan instanceof DiscountPlan ? ctnrOrPlan : PromotionMgr.getDiscounts(ctnrOrPlan);
    const ctnr = plan.getLineItemCtnr();
    const cur = ctnr.getCurrencyCode();
    ctnr._clearPromotionAdjustments();
    for (const e of plan._entriesFor('product')) {
      const pli = e.item; const base = pli.getPrice(); if (!base.isAvailable()) continue;
      const amount = e.discount._amountFor(base, pli.getQuantityValue());
      if (amount.getValue() <= 0) continue;
      pli._createPromotionAdjustment(e.promotion, amount.negate(), e.discount);
    }
    for (const e of plan._entriesFor('order')) {
      const base = ctnr.getAdjustedMerchandizeTotalPrice(false); if (!base.isAvailable()) continue;
      const amount = e.discount._amountFor(base, 1); if (amount.getValue() <= 0) continue;
      ctnr._createPromotionAdjustment(e.promotion, amount.negate(), e.discount);
    }
    for (const e of plan._entriesFor('shipping')) {
      const sh = e.item; const sli = sh.getStandardShippingLineItem(); if (!sli) continue; const base = sli.getPrice(); if (!base.isAvailable()) continue;
      const amount = e.discount._amountFor(base, 1); if (amount.getValue() <= 0) continue;
      sh._createPromotionAdjustment(e.promotion, amount.negate(), e.discount, sli);
    }
    for (const e of plan._entriesFor('bonus')) ctnr._createBonusDiscountLineItem(e.promotion, e.discount);
    ctnr.updateTotals();
    return plan;
  },
  getPromotionPlan() { return PromotionMgr.getActivePromotions(); },
};
module.exports = PromotionMgr;
