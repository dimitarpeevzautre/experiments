'use strict';
const rtRef = require('../../runtime');
let depth = 0;
const Transaction = {
  begin() { depth++; },
  commit() {
    if (depth <= 0) throw new Error('Transaction.commit() called without begin()');
    depth--;
    if (depth === 0) { const rt = rtRef.current(); rt.store.flush(); rt.emit('commit'); }
  },
  rollback() { if (depth <= 0) throw new Error('Transaction.rollback() called without begin()'); depth = 0; rtRef.current().store.touched.clear(); },
  wrap(fn) {
    Transaction.begin();
    let result;
    try { result = fn(); } catch (e) { depth = 0; rtRef.current().store.touched.clear(); throw e; }
    Transaction.commit();
    return result;
  },
  isActive() { return depth > 0; },
  _depth() { return depth; },
};
module.exports = Transaction;
