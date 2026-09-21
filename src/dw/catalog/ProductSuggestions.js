'use strict';
const { bean } = require('../../util/bean');
const SearchSuggestions = require('./SearchSuggestions');
const ArrayList = require('../util/ArrayList');
class SuggestedProduct { constructor(p) { this._p = p; } getProductSearchHit() { const H = require('./ProductSearchHit'); return new H(this._p, null); } }
bean(SuggestedProduct);
class ProductSuggestions extends SearchSuggestions {
  constructor(products, phrases, terms, original) { super(phrases, terms, original); this._products = products; }
  getSuggestedProducts() { return new ArrayList(this._products.map((p) => new SuggestedProduct(p))).iterator(); }
  hasSuggestions() { return this._products.length > 0 || super.hasSuggestions(); }
}
module.exports = bean(ProductSuggestions);
