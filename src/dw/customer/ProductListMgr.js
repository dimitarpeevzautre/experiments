'use strict';
const rtRef = require('../../runtime');
const ArrayList = require('../util/ArrayList');
const SeekableIterator = require('../util/SeekableIterator');
const ProductList = require('./ProductList');
const { query } = require('../../internal/query');
function all(rt) { return rt.store.get('product-lists', {}); }
function wrap(rt, d) { return d ? new ProductList(d, rt) : null; }
const ProductListMgr = {
  getProductList(a, b) {
    const rt = rtRef.current();
    if (typeof a === 'string' && b === undefined) return wrap(rt, all(rt)[a] || Object.values(all(rt)).find((l) => l.ID === a));
    const customerNo = a && (a.getCustomerNo ? a.getCustomerNo() : a.getCustomer ? a.getCustomer().getCustomerNo() : null);
    return wrap(rt, Object.values(all(rt)).find((l) => l.ownerNo === customerNo && l.type === b));
  },
  getProductLists(customer, type, eventType) {
    const rt = rtRef.current();
    const no = customer && customer.getCustomerNo ? customer.getCustomerNo() : (customer && customer.getCustomer ? customer.getCustomer().getCustomerNo() : null);
    return new ArrayList(Object.values(all(rt)).filter((l) => l.ownerNo === no && (type === undefined || l.type === type) && (eventType === undefined || l.eventType === eventType)).map((d) => wrap(rt, d)));
  },
  createProductList(customer, type) {
    const rt = rtRef.current();
    const d = { ID: require('../object/PersistentObject').newUUID(), type, ownerNo: customer && customer.getCustomerNo ? customer.getCustomerNo() : null, items: [], custom: {}, public: false };
    all(rt)[d.ID] = d; rt.store.touch('product-lists');
    return wrap(rt, d);
  },
  removeProductList(list) { const rt = rtRef.current(); const id = list.getID(); for (const [k, v] of Object.entries(all(rt))) if (k === id || v.ID === id) delete all(rt)[k]; rt.store.touch('product-lists'); },
  queryProductLists(q, sort, ...args) { const rt = rtRef.current(); return new SeekableIterator(query(Object.values(all(rt)).map((d) => wrap(rt, d)), q, sort, args)); },
  findProductLists(customer, type, eventType) { return ProductListMgr.getProductLists(customer, type, eventType); },
};
module.exports = ProductListMgr;
