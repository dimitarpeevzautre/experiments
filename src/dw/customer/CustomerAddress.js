'use strict';
const { bean } = require('../../util/bean');
const Address = require('../../internal/Address');
class CustomerAddress extends Address {
  constructor(data, book) { super(data); this._book = book || null; if (book) { this._collection = 'customers'; this._store = book._customer._rt.store; } }
  getCustomer() { return this._book ? this._book._customer : null; }
}
module.exports = bean(CustomerAddress);
