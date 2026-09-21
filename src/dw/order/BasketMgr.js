'use strict';
const rtRef = require('../../runtime');
const Basket = require('./Basket');
const ArrayList = require('../util/ArrayList');
const PersistentObject = require('../object/PersistentObject');
const wrappers = new WeakMap();
function all(rt) { return rt.store.get('baskets', {}); }
function wrap(rt, d) { if (!d) return null; let b = wrappers.get(d); if (!b) { b = new Basket(d, rt); wrappers.set(d, b); } return b; }
function ownerKey(rt) { const s = rt.context.session; const c = s.getCustomer(); return c.isRegistered() ? `customer:${c.getCustomerNo()}` : `session:${s.getSessionID()}`; }
const BasketMgr = {
  getCurrentBasket() {
    const rt = rtRef.current();
    const key = ownerKey(rt);
    const d = Object.values(all(rt)).find((b) => b.owner === key && !b.orderNo);
    return wrap(rt, d);
  },
  getCurrentOrNewBasket() {
    const rt = rtRef.current();
    let b = BasketMgr.getCurrentBasket();
    if (b) return b;
    const key = ownerKey(rt);
    const c = rt.context.session.getCustomer();
    const d = { UUID: PersistentObject.newUUID(), owner: key, customerNo: c.isRegistered() ? c.getCustomerNo() : null, customerEmail: c.isRegistered() && c.getProfile() ? c.getProfile().getEmail() : null, creationDate: new Date().toISOString(), lastModified: new Date().toISOString(), custom: {} };
    all(rt)[d.UUID] = d; rt.store.touch('baskets');
    return wrap(rt, d);
  },
  getBasket(uuid) { const rt = rtRef.current(); return wrap(rt, all(rt)[uuid]); },
  getBaskets(customer) { const rt = rtRef.current(); const key = `customer:${customer.getCustomerNo()}`; return new ArrayList(Object.values(all(rt)).filter((b) => b.owner === key && !b.orderNo).map((d) => wrap(rt, d))); },
  getStoredBasket() { return null; },
  deleteBasket(basket) { const rt = rtRef.current(); delete all(rt)[basket.getUUID()]; rt.store.touch('baskets'); },
  deleteTemporaryBasket(b) { BasketMgr.deleteBasket(b); },
  createBasketFromOrder(order) { const rt = rtRef.current(); const d = JSON.parse(JSON.stringify(order._data)); delete d.orderNo; delete d.orderToken; delete d.status; d.UUID = PersistentObject.newUUID(); d.owner = ownerKey(rt); d.creationDate = new Date().toISOString(); all(rt)[d.UUID] = d; rt.store.touch('baskets'); return wrap(rt, d); },
  createTemporaryBasket() { const rt = rtRef.current(); const d = { UUID: PersistentObject.newUUID(), owner: `temp:${Date.now()}`, temporary: true, creationDate: new Date().toISOString(), lastModified: new Date().toISOString(), custom: {} }; all(rt)[d.UUID] = d; return wrap(rt, d); },
  getTemporaryBaskets() { const rt = rtRef.current(); return new ArrayList(Object.values(all(rt)).filter((b) => b.temporary).map((d) => wrap(rt, d))); },
  createAgentBasket() { const b = BasketMgr.createTemporaryBasket(); b._data.agent = true; b._data.temporary = false; return b; },
  /** Re-own the session basket when a customer logs in (platform merges baskets). */
  _onLogin(customer) {
    const rt = rtRef.current();
    const sessionKey = `session:${rt.context.session.getSessionID()}`; const custKey = `customer:${customer.getCustomerNo()}`;
    const sessionBasket = Object.values(all(rt)).find((b) => b.owner === sessionKey && !b.orderNo);
    const custBasket = Object.values(all(rt)).find((b) => b.owner === custKey && !b.orderNo);
    if (sessionBasket && custBasket) { sessionBasket.productLineItems = custBasket.productLineItems.concat(sessionBasket.productLineItems); delete all(rt)[custBasket.UUID]; }
    if (sessionBasket) { sessionBasket.owner = custKey; sessionBasket.customerNo = customer.getCustomerNo(); const p = customer.getProfile(); if (p && !sessionBasket.customerEmail) sessionBasket.customerEmail = p.getEmail(); }
    rt.store.touch('baskets');
  },
  _wrap: (d) => wrap(rtRef.current(), d),
};
module.exports = BasketMgr;
