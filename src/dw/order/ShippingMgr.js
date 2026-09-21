'use strict';
const rtRef = require('../../runtime');
const ArrayList = require('../util/ArrayList');
const ShippingMethod = require('./ShippingMethod');
const ShipmentShippingModel = require('./ShipmentShippingModel');
const ProductShippingModel = require('./ProductShippingModel');
const Money = require('../value/Money');
const wrappers = new WeakMap();
function all() { const rt = rtRef.current(); const defs = rt.store.get('shipping-methods', {}); const entries = Object.entries(defs); if (!entries.length) return [defaultMethod(rt)]; return entries.map(([id, d]) => { d.ID = d.ID || id; let w = wrappers.get(d); if (!w) { w = new ShippingMethod(d); wrappers.set(d, w); } return w; }); }
let dflt = null;
function defaultMethod(rt) { if (!dflt) dflt = new ShippingMethod({ ID: 'DEFAULT_SHIPPING', displayName: 'Standard', default: true, cost: 0, custom: {} }); return dflt; }
const ShippingMgr = {
  _all: all,
  _method(id) { return all().find((m) => m.getID() === id) || null; },
  getAllShippingMethods() { return new ArrayList(all()); },
  getDefaultShippingMethod() { return all().find((m) => m.isDefaultMethod() && m.isOnline()) || all().find((m) => m.isOnline()) || null; },
  getShipmentShippingModel(shipment) { return new ShipmentShippingModel(shipment); },
  getProductShippingModel(product) { return new ProductShippingModel(product); },
  /** Recalculate shipping line item prices for all shipments in the container. */
  applyShippingCost(ctnr) {
    for (const sh of ctnr.getShipments().toArray()) {
      const m = sh.getShippingMethod();
      let sli = sh.getStandardShippingLineItem();
      if (!m) { if (sli) sli.setPriceValue && sli.setPriceValue(0); continue; }
      if (!sli) sli = sh.createShippingLineItem(require('./ShippingLineItem').STANDARD_SHIPPING_ID);
      const cost = new ShipmentShippingModel(sh).getShippingCost(m).getAmount();
      let extra = 0;
      for (const pli of sh.getProductLineItems().toArray()) { const p = pli.getProduct(); if (!p) continue; const sc = new ProductShippingModel(p).getShippingCost(m); if (sc) extra += sc.getAmount().getValue() * pli.getQuantityValue(); }
      sli._data.basePrice = cost.getValue() + extra; sli._data.price = cost.getValue() + extra; sli._data.taxClassID = m.getTaxClassID(); sli._recalc();
    }
    ctnr.updateTotals();
  },
};
module.exports = ShippingMgr;
