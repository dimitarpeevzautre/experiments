'use strict';
/** Internal helpers shared by the catalog package (not a dw class: name starts with underscore). */
const rtRef = require('../../runtime');
const wrappers = new WeakMap();
function rt() { return rtRef.current(); }
function products() { return rt().store.get('products', {}); }
function categories() { return rt().store.get('categories', {}); }
function productData(id) { const p = products()[id]; if (p && !p.ID) p.ID = id; return p || null; }
function categoryData(id) { const c = categories()[id]; if (c && !c.ID) c.ID = id; return c || null; }
function wrap(data, Cls, ...args) { if (!data) return null; let w = wrappers.get(data); if (!w) { w = new Cls(data, ...args); wrappers.set(data, w); } return w; }
function product(id) {
  const d = productData(id);
  if (!d) return null;
  const Product = require('./Product');
  const Variant = require('./Variant');
  const VariationGroup = require('./VariationGroup');
  const Cls = d.variationGroup ? VariationGroup : (d.masterID && !d.master ? Variant : Product);
  return wrap(d, Cls);
}
function category(id) { const d = categoryData(id); const Category = require('./Category'); return wrap(d, Category); }
function siteCatalogID() { const s = rt().siteData() || {}; return s.catalog || s.siteCatalog || Object.keys(rt().store.get('catalogs', {}))[0] || 'storefront-catalog'; }
module.exports = { rt, products, categories, productData, categoryData, product, category, wrap, siteCatalogID };
