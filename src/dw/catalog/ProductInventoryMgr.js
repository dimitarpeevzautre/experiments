'use strict';
const D = require('./_data');
const ProductInventoryList = require('./ProductInventoryList');
function lists() { const inv = D.rt().store.get('inventory', {}); return Object.entries(inv).map(([id, d]) => { d.ID = d.ID || id; return D.wrap(d, ProductInventoryList); }); }
module.exports = {
  getInventoryList(id) {
    const all = lists();
    if (id !== undefined) return all.find((l) => l.getID() === id) || null;
    const site = D.rt().siteData() || {};
    return (site.inventoryList && all.find((l) => l.getID() === site.inventoryList)) || all.find((l) => l._data.default) || all[0] || null;
  },
  _lists: lists,
};
