'use strict';
const D = require('./_data');
const SeekableIterator = require('../util/SeekableIterator');
const ArrayList = require('../util/ArrayList');
module.exports = {
  getProduct(id) { return id == null ? null : D.product(String(id)); },
  _all() { return Object.keys(D.products()).map((id) => D.product(id)); },
  queryAllSiteProducts() { return new SeekableIterator(module.exports._all()); },
  queryAllSiteProductsSorted() { return new SeekableIterator(module.exports._all().sort((a, b) => String(a.getID()).localeCompare(String(b.getID())))); },
  queryProductsInCatalog(catalog) { return new SeekableIterator(module.exports._all()); },
  queryProductsInCatalogSorted(catalog) { return module.exports.queryAllSiteProductsSorted(); },
  _byCategory(catID, deep) { const cat = D.category(catID); if (!cat) return []; const ids = deep ? cat._descendantIDs() : [catID]; return module.exports._all().filter((p) => (p._data.categories || []).some((c) => ids.includes(c))); },
};
