'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const Quantity = require('../value/Quantity');
const Money = require('../value/Money');
class ProductPriceTable {
  /** tiers: [{quantity, price(Money), priceBook}] sorted by quantity asc */
  constructor(tiers, product) { this._t = tiers; this._p = product; }
  getQuantities() { return new ArrayList(this._t.map((t) => new Quantity(t.quantity, ''))); }
  getPrice(q) { const n = q && q.getValue ? q.getValue() : Number(q); let best = null; for (const t of this._t) if (t.quantity <= n) best = t; return best ? best.price : Money.NOT_AVAILABLE; }
  getPriceBook(q) { const n = q && q.getValue ? q.getValue() : Number(q); let best = null; for (const t of this._t) if (t.quantity <= n) best = t; return best ? best.priceBook : null; }
  getNextQuantity(q) { const n = q && q.getValue ? q.getValue() : Number(q); const t = this._t.find((x) => x.quantity > n); return t ? new Quantity(t.quantity, '') : null; }
  getPercentage(q) { const p = this.getPrice(q); const base = this._t[0] ? this._t[0].price : null; if (!base || !p.isAvailable() || base.getValue() === 0) return 0; return Math.round((1 - p.getValue() / base.getValue()) * 100); }
  getBasePriceQuantity() { return this._t[0] ? new Quantity(this._t[0].quantity, '') : new Quantity(1, ''); }
}
module.exports = bean(ProductPriceTable);
