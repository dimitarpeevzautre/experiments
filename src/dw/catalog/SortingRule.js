'use strict';
const { bean } = require('../../util/bean');
class SortingRule {
  constructor(d) { this._d = d; }
  getID() { return this._d.ID; }
  isRuleBased() { return !!this._d.ruleBased; }
  getDisplayName() { return this._d.displayName || this._d.ID; }
  _steps() { return this._d.steps || SortingRule.BUILTIN[this._d.ID] && SortingRule.BUILTIN[this._d.ID].steps || []; }
}
SortingRule.BUILTIN = {
  'best-matches': { steps: [] },
  'price-low-to-high': { steps: [{ attribute: 'price', direction: 'asc' }] },
  'price-high-to-low': { steps: [{ attribute: 'price', direction: 'desc' }] },
  'product-name-ascending': { steps: [{ attribute: 'name', direction: 'asc' }] },
  'product-name-descending': { steps: [{ attribute: 'name', direction: 'desc' }] },
  'top-sellers': { steps: [] },
  'most-popular': { steps: [] },
  'new-arrivals': { steps: [{ attribute: 'creationDate', direction: 'desc' }] },
};
module.exports = bean(SortingRule);
