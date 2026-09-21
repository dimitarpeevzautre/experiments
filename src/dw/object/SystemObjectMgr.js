'use strict';
const rtRef = require('../../runtime');
const SeekableIterator = require('../util/SeekableIterator');
const ObjectTypeDefinition = require('./ObjectTypeDefinition');
const { query } = require('../../internal/query');
function objectsOf(rt, type) {
  switch (type) {
    case 'Profile': { const CM = rt.dw.get('customer/CustomerMgr'); return Object.values(rt.store.get('customers', {})).map((d) => CM._wrap(d).getProfile()); }
    case 'Order': { const OM = rt.dw.get('order/OrderMgr'); return OM._all(); }
    case 'Product': { const PM = rt.dw.get('catalog/ProductMgr'); return PM._all(); }
    case 'Content': { const CMgr = rt.dw.get('content/ContentMgr'); return CMgr._all(); }
    case 'SitePreferences': return [rt.dw.get('system/Site').getCurrent().getPreferences()];
    default: return [];
  }
}
module.exports = {
  describe(type) { const rt = rtRef.current(); const d = rt.store.get('object-types', {})[type]; return new ObjectTypeDefinition(type, d || { attributes: {} }); },
  getAllSystemObjects(type) { return new SeekableIterator(objectsOf(rtRef.current(), type)); },
  querySystemObjects(type, q, sort, ...args) { return new SeekableIterator(query(objectsOf(rtRef.current(), type), q, sort, args)); },
  querySystemObject(type, q, ...args) { const it = module.exports.querySystemObjects(type, q, null, ...args); return it.hasNext() ? it.next() : null; },
};
