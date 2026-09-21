'use strict';
const D = require('./_data');
const Catalog = require('./Catalog');
const ArrayList = require('../util/ArrayList');
module.exports = {
  getSiteCatalog() { const id = D.siteCatalogID(); const cats = D.rt().store.get('catalogs', {}); return new Catalog(Object.assign({ ID: id, root: 'root', custom: {} }, cats[id] || {})); },
  getCatalog(id) { const cats = D.rt().store.get('catalogs', {}); return cats[id] || id === D.siteCatalogID() ? new Catalog(Object.assign({ ID: id, root: 'root', custom: {} }, cats[id] || {})) : null; },
  getCategory(id) { return D.category(id); },
  getSortingRules() { const SortingRule = require('./SortingRule'); return new ArrayList(Object.entries(D.rt().store.get('sorting-rules', {})).map(([id, d]) => new SortingRule(Object.assign({ ID: id }, d)))); },
  getSortingRule(id) { const SortingRule = require('./SortingRule'); const d = D.rt().store.get('sorting-rules', {})[id]; return d || SortingRule.BUILTIN[id] ? new SortingRule(Object.assign({ ID: id }, d || SortingRule.BUILTIN[id])) : null; },
  getSortingOptions() { const SortingOption = require('./SortingOption'); return new ArrayList(Object.entries(D.rt().store.get('sorting-options', {})).map(([id, d]) => new SortingOption(Object.assign({ ID: id }, d)))); },
  getSortingOption(id) { const SortingOption = require('./SortingOption'); const d = D.rt().store.get('sorting-options', {})[id]; return d ? new SortingOption(Object.assign({ ID: id }, d)) : null; },
};
