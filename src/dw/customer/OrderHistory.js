'use strict';
const { bean } = require('../../util/bean');
class OrderHistory {
  constructor(customer) { this._customer = customer; }
  _orders() { const OrderMgr = require('../order/OrderMgr'); return OrderMgr._ordersFor(this._customer); }
  getOrderCount() { return this._orders().length; }
  getOrders(query, sortString, ...args) { const OrderMgr = require('../order/OrderMgr'); return OrderMgr._query(this._orders(), query, sortString, args); }
}
module.exports = bean(OrderHistory);
