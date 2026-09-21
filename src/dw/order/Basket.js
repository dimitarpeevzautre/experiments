'use strict';
const { bean } = require('../../util/bean');
const LineItemCtnr = require('./LineItemCtnr');
class Basket extends LineItemCtnr {
  constructor(data, rt) { super(data, rt, 'baskets'); }
  getCustomerNo() { return this._data.customerNo || null; }
  setCustomerNo(no) { this._data.customerNo = no; this._markDirty(); }
  getInventoryReservationExpiry() { return this._data.reservationExpiry ? new Date(this._data.reservationExpiry) : null; }
  reserveInventory(ttl, removeIfNotAvailable) { for (const p of this.getAllProductLineItems().toArray()) { const prod = p.getProduct(); if (prod && !prod.getAvailabilityModel().isOrderable(p.getQuantity())) { if (removeIfNotAvailable) this.removeProductLineItem(p); else return false; } } this._data.reservationExpiry = new Date(Date.now() + (ttl || 10) * 60000).toISOString(); return true; }
  startCheckout() { this._data.checkoutStarted = new Date().toISOString(); this._markDirty(); }
  isAgentBasket() { return !!this._data.agent; }
  isTemporary() { return !!this._data.temporary; }
  getOrderNo() { return null; }
  releaseInventory() { this._data.reservationExpiry = null; }
  setBusinessType(t) { super.setBusinessType(t); }
  getLastModified() { return new Date(this._data.lastModified); }
  getCreationDate() { return new Date(this._data.creationDate); }
  updateCurrency() { const rt = this._rt; const c = rt.context.session.getCurrency().getCurrencyCode(); if (c !== this._data.currencyCode) { this._data.currencyCode = c; for (const p of this.getAllProductLineItems().toArray()) { delete p._data.priceOverride; p._updatePriceFromProduct(); } this.updateTotals(); } }
}
module.exports = bean(Basket);
