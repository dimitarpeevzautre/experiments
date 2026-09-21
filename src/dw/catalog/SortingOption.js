'use strict';
const { bean } = require('../../util/bean');
class SortingOption {
  constructor(d) { this._d = d; }
  getID() { return this._d.ID; } getDisplayName() { return this._d.displayName || this._d.ID; } getDescription() { return this._d.description || ''; }
  getSortingRule() { const CatalogMgr = require('./CatalogMgr'); return CatalogMgr.getSortingRule(this._d.sortingRule || this._d.ID); }
}
module.exports = bean(SortingOption);
