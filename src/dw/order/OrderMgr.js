'use strict';
const rtRef = require('../../runtime');
const Order = require('./Order');
const Status = require('../system/Status');
const SeekableIterator = require('../util/SeekableIterator');
const PersistentObject = require('../object/PersistentObject');
const { query } = require('../../internal/query');
const wrappers = new WeakMap();
function all(rt) { return rt.store.get('orders', {}); }
function wrap(rt, d) { if (!d) return null; let o = wrappers.get(d); if (!o) { o = new Order(d, rt); wrappers.set(d, o); } return o; }
const OrderMgr = {
  _all() { const rt = rtRef.current(); return Object.values(all(rt)).map((d) => wrap(rt, d)); },
  _ordersFor(customer) { return OrderMgr._all().filter((o) => o.getCustomerNo() === customer.getCustomerNo()); },
  _query(orders, q, sort, args) { return new SeekableIterator(query(orders, q, sort, args)); },
  createOrderNo() { const rt = rtRef.current(); const seq = rt.store.get('sequences', {}); seq.orderNo = (seq.orderNo || 0) + 1; rt.store.touch('sequences'); return String(seq.orderNo).padStart(8, '0'); },
  createOrderSequenceNo() { return OrderMgr.createOrderNo(); },
  createOrder(basket, orderNo) {
    const rt = rtRef.current();
    if (!basket || !basket.getAllProductLineItems().size() && !basket.getGiftCertificateLineItems().size()) { const e = new Error('Basket is empty'); e.name = 'APIException'; throw e; }
    for (const p of basket.getAllProductLineItems().toArray()) { const prod = p.getProduct(); if (prod && !prod.getAvailabilityModel().isOrderable(p.getQuantity())) { const e = new Error(`Product ${p.getProductID()} is not available in requested quantity`); e.name = 'APIException'; e.causeMessage = 'InventoryException'; throw e; } }
    const d = JSON.parse(JSON.stringify(basket._data));
    d.UUID = PersistentObject.newUUID();
    d.orderNo = orderNo || OrderMgr.createOrderNo();
    d.orderToken = PersistentObject.newUUID();
    d.status = Order.ORDER_STATUS_CREATED;
    d.creationDate = new Date().toISOString(); d.lastModified = d.creationDate;
    d.customerLocaleID = rt.context.request ? rt.context.request.getLocale() : rt.config.locale;
    d.remoteHost = rt.context.request ? rt.context.request.getHttpRemoteAddress() : '127.0.0.1';
    const c = basket.getCustomer(); if (c && c.isRegistered() && !d.customerNo) d.customerNo = c.getCustomerNo();
    if (!d.customerName) { const ba = basket.getBillingAddress(); if (ba) d.customerName = ba.getFullName(); }
    delete d.owner; delete d.temporary;
    all(rt)[d.orderNo] = d; rt.store.touch('orders');
    const BasketMgr = require('./BasketMgr');
    BasketMgr.deleteBasket(basket);
    const order = wrap(rt, d);
    rt.emit('orderCreated', order);
    return order;
  },
  placeOrder(order) {
    const rt = rtRef.current();
    if (order.getStatus().getValue() !== Order.ORDER_STATUS_CREATED) return new Status(Status.ERROR, 'ORDER_NOT_IN_CREATED_STATUS', 'Order must be in CREATED status');
    // consume inventory
    for (const p of order.getAllProductLineItems().toArray()) { const prod = p.getProduct(); if (!prod) continue; const rec = prod.getAvailabilityModel().getInventoryRecord(); if (rec) rec._consume(p.getQuantityValue()); }
    // redeem coupons
    const CouponMgr = require('../campaign/CouponMgr');
    for (const c of order.getCouponLineItems().toArray()) if (c.isApplied() && c._couponID()) CouponMgr._redeem(c._couponID(), c.getCouponCode(), order);
    order.setStatus(Order.ORDER_STATUS_NEW);
    order.setExportStatus(Order.EXPORT_STATUS_READY);
    rt.emit('orderPlaced', order);
    return new Status(Status.OK);
  },
  failOrder(order, reopenBasket) {
    const rt = rtRef.current();
    if (order.getStatus().getValue() !== Order.ORDER_STATUS_CREATED) return new Status(Status.ERROR, 'ORDER_NOT_IN_CREATED_STATUS');
    order.setStatus(Order.ORDER_STATUS_FAILED);
    if (reopenBasket) { const BasketMgr = require('./BasketMgr'); BasketMgr.createBasketFromOrder(order); }
    return new Status(Status.OK);
  },
  undoFailOrder(order) { if (order.getStatus().getValue() !== Order.ORDER_STATUS_FAILED) return new Status(Status.ERROR); order.setStatus(Order.ORDER_STATUS_CREATED); return new Status(Status.OK); },
  cancelOrder(order) { const s = order.getStatus().getValue(); if (![Order.ORDER_STATUS_NEW, Order.ORDER_STATUS_OPEN].includes(s)) return new Status(Status.ERROR, 'ORDER_STATUS_INVALID'); order.setStatus(Order.ORDER_STATUS_CANCELLED); for (const p of order.getAllProductLineItems().toArray()) { const prod = p.getProduct(); const rec = prod && prod.getAvailabilityModel().getInventoryRecord(); if (rec && !rec.isPerpetual()) rec._consume(-p.getQuantityValue()); } return new Status(Status.OK); },
  undoCancelOrder(order) { if (order.getStatus().getValue() !== Order.ORDER_STATUS_CANCELLED) return new Status(Status.ERROR); order.setStatus(Order.ORDER_STATUS_NEW); return new Status(Status.OK); },
  getOrder(orderNo, token) { const rt = rtRef.current(); const d = all(rt)[orderNo] || Object.values(all(rt)).find((o) => o.orderNo === orderNo); if (!d) return null; if (token !== undefined && d.orderToken !== token) return null; return wrap(rt, d); },
  searchOrders(q, sort, ...args) { return OrderMgr._query(OrderMgr._all(), q, sort, args); },
  searchOrder(q, ...args) { const it = OrderMgr.searchOrders(q, null, ...args); return it.hasNext() ? it.next() : null; },
  queryOrders(q, sort, ...args) { return OrderMgr.searchOrders(q, sort, ...args); },
  queryOrder(q, ...args) { return OrderMgr.searchOrder(q, ...args); },
  processOrders(fn, q, ...args) { const it = OrderMgr.searchOrders(q, null, ...args); while (it.hasNext()) fn(it.next()); },
  describeOrder() { const OTD = require('../object/ObjectTypeDefinition'); return new OTD('Order', rtRef.current().store.get('object-types', {}).Order || { attributes: {} }); },
  createShippingOrders() { return new Status(Status.OK); },
  _wrap: (d) => wrap(rtRef.current(), d),
};
module.exports = OrderMgr;
