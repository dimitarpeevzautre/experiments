'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const D = require('./_data');
const ProductSuggestions = require('./ProductSuggestions');
const SearchSuggestions = require('./SearchSuggestions');
class SuggestModel {
  constructor() { this._phrase = ''; this._max = 5; this._filtered = true; }
  setSearchPhrase(p) { this._phrase = String(p || '').trim(); } getSearchPhrase() { return this._phrase; }
  setMaxSuggestions(n) { this._max = n; } getMaxSuggestions() { return this._max; }
  setFilteredByFolder(b) { this._filtered = !!b; } addRefinementValues() {} setRefinementValues() {}
  _words() { return this._phrase.toLowerCase().split(/\s+/).filter(Boolean); }
  getProductSuggestions() {
    const w = this._words(); const ProductMgr = require('./ProductMgr');
    const prods = w.length ? ProductMgr._all().filter((p) => p.isOnline() && p.isSearchable() && !p.isVariant() && w.every((x) => `${p.getName() || ''} ${p.getID()} ${p.getBrand() || ''}`.toLowerCase().includes(x))).slice(0, this._max) : [];
    const terms = this._terms((p) => `${p.getName() || ''} ${p.getBrand() || ''}`, ProductMgr._all());
    return new ProductSuggestions(prods, prods.map((p) => p.getName()).filter(Boolean).slice(0, this._max), terms, this._phrase);
  }
  getCategorySuggestions() { const w = this._words(); const cats = w.length ? Object.keys(D.categories()).map((id) => D.category(id)).filter((c) => c.isOnline() && w.every((x) => c.getDisplayName().toLowerCase().includes(x))).slice(0, this._max) : []; const s = new SearchSuggestions(cats.map((c) => c.getDisplayName()), [], this._phrase); s.getSuggestedCategories = () => new ArrayList(cats.map((c) => ({ getCategory: () => c, category: c }))).iterator(); return s; }
  getContentSuggestions() { const ContentMgr = D.rt().dw.get('content/ContentMgr'); const w = this._words(); const c = w.length ? ContentMgr._all().filter((x) => x.isOnline() && x.isSearchable() && w.every((y) => `${x.getName()}`.toLowerCase().includes(y))).slice(0, this._max) : []; const s = new SearchSuggestions(c.map((x) => x.getName()), [], this._phrase); s.getSuggestedContent = () => new ArrayList(c.map((x) => ({ getContent: () => x, content: x }))).iterator(); return s; }
  getBrandSuggestions() { const ProductMgr = require('./ProductMgr'); const w = this._words(); const brands = Array.from(new Set(ProductMgr._all().map((p) => p.getBrand()).filter(Boolean))).filter((b) => w.every((x) => b.toLowerCase().includes(x))).slice(0, this._max); return new SearchSuggestions(brands, [], this._phrase); }
  getCustomSuggestions() { return new SearchSuggestions([], [], this._phrase); }
  getPopularSearchPhrases() { return new ArrayList(D.rt().store.get('popular-searches', [])).iterator(); }
  getRecentSearchPhrases() { const s = D.rt().context.session; return new ArrayList(s._recentSearches || []).iterator(); }
  _terms(textOf, items) { const last = this._words().pop(); if (!last) return []; const words = new Set(); for (const i of items) for (const t of String(textOf(i) || '').toLowerCase().split(/\W+/)) if (t.startsWith(last) && t !== last) words.add(t); return Array.from(words).slice(0, this._max); }
}
SuggestModel.SEARCH_PHRASE_PARAMETER = 'q';
module.exports = bean(SuggestModel);
