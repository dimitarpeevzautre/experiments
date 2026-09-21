'use strict';
const { bean } = require('../../util/bean');
const Money = require('../value/Money');
const Quantity = require('../value/Quantity');
const ProductPriceInfo = require('./ProductPriceInfo');
const ProductPriceTable = require('./ProductPriceTable');
const PriceBookMgr = require('./PriceBookMgr');
const ArrayList = require('../util/ArrayList');
const D = require('./_data');

function tiersFor(def) {
  if (def == null) return [];
  if (typeof def === 'number') return [{ quantity: 1, price: def }];
  if (Array.isArray(def)) return def.map((t) => ({ quantity: t.quantity || 1, price: t.price })).sort((a, b) => a.quantity - b.quantity);
  const now = Date.now();
  if (def.from && new Date(def.from).getTime() > now) return [];
  if (def.to && new Date(def.to).getTime() < now) return [];
  if (def.tiers) return tiersFor(def.tiers);
  return def.price != null ? [{ quantity: def.quantity || 1, price: def.price }] : [];
}
/** Price of a product in a price book, following parent price book chain. */
function bookTiers(book, productID) {
  let b = book; let guard = 0;
  while (b && guard++ < 10) { const t = tiersFor(b._priceDef(productID)); if (t.length) return { tiers: t, book: b }; b = b.getParentPriceBook(); }
  return null;
}

class ProductPriceModel {
  constructor(product, optionModel) { this._p = product; this._om = optionModel || null; }
  _currency() { const rt = D.rt(); return rt.context.session ? rt.context.session.getCurrency().getCurrencyCode() : 'USD'; }
  _books() { return PriceBookMgr.getApplicablePriceBooks().toArray(); }
  _candidates(qty = 1) {
    // For master products without own price, derive from variants (min price).
    const out = [];
    for (const book of this._books()) {
      const bt = bookTiers(book, this._p.getID());
      if (bt) { let tier = null; for (const t of bt.tiers) if (t.quantity <= qty) tier = t; if (tier) out.push({ price: new Money(tier.price, book.getCurrencyCode()), book: bt.book, tiers: bt.tiers }); }
    }
    return out;
  }
  _variantPrices(fn) {
    const vs = this._p.isMaster() || this._p.isVariationGroup() ? this._p.getVariationModel().getVariants().toArray() : [];
    const prices = vs.map((v) => v.getPriceModel().getPrice()).filter((m) => m.isAvailable());
    return prices;
  }
  _optionPrice(base) { if (!this._om || !base.isAvailable()) return base; return base.add(new Money(this._om._totalOptionPrice(), base.getCurrencyCode())); }
  getPrice(qty) {
    const c = this._candidates(qty && qty.getValue ? qty.getValue() : qty || 1);
    if (c.length) { const best = c.reduce((a, b) => (b.price.getValue() < a.price.getValue() ? b : a)); return this._optionPrice(best.price); }
    const vp = this._variantPrices();
    if (vp.length) return this._optionPrice(vp.reduce((a, b) => (b.getValue() < a.getValue() ? b : a)));
    return Money.NOT_AVAILABLE;
  }
  getPriceInfo(qty) {
    const c = this._candidates(qty && qty.getValue ? qty.getValue() : qty || 1);
    if (!c.length) { const p = this.getPrice(qty); return p.isAvailable() ? new ProductPriceInfo(p, null, 0) : null; }
    const best = c.reduce((a, b) => (b.price.getValue() < a.price.getValue() ? b : a));
    const base = this.getBasePrice();
    const pct = base.isAvailable() && base.getValue() > 0 ? Math.round((1 - best.price.getValue() / base.getValue()) * 100) : 0;
    return new ProductPriceInfo(best.price, best.book, pct, best.book.getOnlineFrom(), best.book.getOnlineTo());
  }
  getPriceInfos() { return new ArrayList(this._candidates(1).map((c) => new ProductPriceInfo(c.price, c.book, 0))); }
  getBasePrice() { const c = this._candidates(1); if (!c.length) return this.getPrice(); const listBooks = c.filter((x) => !x.book.getParentPriceBook()); const use = listBooks.length ? listBooks : c; return use.reduce((a, b) => (b.price.getValue() > a.price.getValue() ? b : a)).price; }
  getBasePriceQuantity() { const c = this._candidates(1); return c.length ? new Quantity(c[0].tiers[0].quantity, '') : new Quantity(1, ''); }
  getPriceBookPrice(priceBookID) {
    const pb = PriceBookMgr.getPriceBook(priceBookID);
    if (!pb) return Money.NOT_AVAILABLE;
    const bt = bookTiers(pb, this._p.getID());
    if (bt) return new Money(bt.tiers[0].price, pb.getCurrencyCode());
    const vs = this._p.isMaster() ? this._p.getVariationModel().getVariants().toArray() : [];
    const vp = vs.map((v) => v.getPriceModel().getPriceBookPrice(priceBookID)).filter((m) => m.isAvailable());
    return vp.length ? vp.reduce((a, b) => (b.getValue() < a.getValue() ? b : a)) : Money.NOT_AVAILABLE;
  }
  getPriceBookPriceInfo(priceBookID) { const p = this.getPriceBookPrice(priceBookID); return p.isAvailable() ? new ProductPriceInfo(p, PriceBookMgr.getPriceBook(priceBookID), 0) : null; }
  getPriceBookPricePerUnit(priceBookID) { return this.getPriceBookPrice(priceBookID); }
  getPricePerUnit(qty) { return this.getPrice(qty); }
  getMinPrice() { const vp = this._variantPrices(); if (vp.length) return vp.reduce((a, b) => (b.getValue() < a.getValue() ? b : a)); return this.getPrice(); }
  getMaxPrice() { const vp = this._variantPrices(); if (vp.length) return vp.reduce((a, b) => (b.getValue() > a.getValue() ? b : a)); return this.getPrice(); }
  getMinPriceBookPrice(id) { const vs = this._p.isMaster() ? this._p.getVariationModel().getVariants().toArray() : [this._p]; const vp = vs.map((v) => v.getPriceModel().getPriceBookPrice(id)).filter((m) => m.isAvailable()); return vp.length ? vp.reduce((a, b) => (b.getValue() < a.getValue() ? b : a)) : Money.NOT_AVAILABLE; }
  getMaxPriceBookPrice(id) { const vs = this._p.isMaster() ? this._p.getVariationModel().getVariants().toArray() : [this._p]; const vp = vs.map((v) => v.getPriceModel().getPriceBookPrice(id)).filter((m) => m.isAvailable()); return vp.length ? vp.reduce((a, b) => (b.getValue() > a.getValue() ? b : a)) : Money.NOT_AVAILABLE; }
  isPriceRange() { const mn = this.getMinPrice(); const mx = this.getMaxPrice(); return mn.isAvailable() && mx.isAvailable() && mn.getValue() !== mx.getValue(); }
  getPriceRange() { return this.isPriceRange(); }
  getPriceTable() {
    const c = this._candidates(1);
    if (!c.length) return new ProductPriceTable([{ quantity: 1, price: this.getPrice(), priceBook: null }], this._p);
    const best = c.reduce((a, b) => (b.price.getValue() < a.price.getValue() || (b.price.getValue() === a.price.getValue() && b.tiers.length > a.tiers.length) ? b : a));
    return new ProductPriceTable(best.tiers.map((t) => ({ quantity: t.quantity, price: new Money(t.price, best.book.getCurrencyCode()), priceBook: best.book })), this._p);
  }
  getPriceModelForCurrency(currency) { const m = new ProductPriceModel(this._p, this._om); m._currency = () => currency; return m; }
}
module.exports = bean(ProductPriceModel);
