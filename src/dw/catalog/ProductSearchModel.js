'use strict';
const { bean } = require('../../util/bean');
const SearchModel = require('./SearchModel');
const ProductSearchHit = require('./ProductSearchHit');
const ProductSearchRefinements = require('./ProductSearchRefinements');
const SearchStatus = require('../system/SearchStatus');
const ArrayList = require('../util/ArrayList');
const URLUtils = require('../web/URLUtils');
const D = require('./_data');

class ProductSearchModel extends SearchModel {
  constructor() { super(); this._cgid = null; this._pmin = null; this._pmax = null; this._orderableOnly = false; this._pid = null; this._hits = []; this._matched = []; this._sortOption = null; this._recursive = true; this._suggested = null; this._pmid = null; }
  setCategoryID(id) { this._cgid = id || null; } getCategoryID() { return this._cgid; }
  getCategory() { return this._cgid ? D.category(this._cgid) : null; }
  setRecursiveCategorySearch(b) { this._recursive = !!b; } isRecursiveCategorySearch() { return this._recursive; }
  isCategorySearch() { return !!this._cgid; } getCategorySearch() { return this.isCategorySearch(); }
  isRefinedCategorySearch() { return !!this._cgid && (!!this._phrase || Object.keys(this._refinements).length > 0); }
  isRefinedByCategory() { return !!this._cgid; }
  getRefinementCategory() { return this.getCategory(); }
  setRefinementCategoryID(id) { this._cgid = id; }
  setPriceMin(v) { this._pmin = v == null ? null : Number(v); } getPriceMin() { return this._pmin; }
  setPriceMax(v) { this._pmax = v == null ? null : Number(v); } getPriceMax() { return this._pmax; }
  isRefinedByPrice() { return this._pmin != null || this._pmax != null; } isRefinedByPriceRange(min, max) { return this._pmin === min && this._pmax === max; }
  setOrderableProductsOnly(b) { this._orderableOnly = !!b; } isOrderableProductsOnly() { return this._orderableOnly; }
  setProductIDs(ids) { this._pid = Array.from(ids || []); }
  setProductID(id) { this._pid = [id]; }
  setPromotionID(id) { this._pmid = id; } getPromotionID() { return this._pmid; } isRefinedByPromotion() { return !!this._pmid; }
  setSortingOption(o) { this._sortOption = o; this._sortRule = o ? o.getSortingRule() : null; } getSortingOption() { return this._sortOption; }
  getEffectiveSortingRule() { if (this._sortRule) return this._sortRule; const c = this.getCategory(); const r = c ? c.getDefaultSortingRule() : null; if (r) return r; const CatalogMgr = require('./CatalogMgr'); return CatalogMgr.getSortingRule('best-matches'); }
  getSuggestedSearchPhrase() { return this._suggested; }
  getSearchRedirect(phrase) { const redirects = D.rt().store.get('search-redirects', {}); const r = redirects[(phrase || this._phrase || '').toLowerCase()]; if (!r) return null; const URLRedirect = require('../web/URLRedirect'); return new URLRedirect(r); }
  getSearchStatus() { return this._status || new SearchStatus(SearchStatus.NOT_EXECUTED); }
  getPageMetaTags() { return new ArrayList(); }
  getDeepestCommonCategory() { const cats = this._matched.map((p) => p.getPrimaryCategory()).filter(Boolean); if (!cats.length) return this.getCategory() || D.category('root'); const paths = cats.map((c) => c._path().map((x) => x.getID())); let i = 0; while (paths.every((p) => p[i] && p[i] === paths[0][i])) i++; return D.category(paths[0][i - 1]) || D.category('root'); }
  getProductIDs() { return new ArrayList(this._hits.map((h) => h.getProductID())); }
  getRefinements() { return new ProductSearchRefinements(this, this.getCategory()); }
  _extraParams() { const p = []; if (this._cgid) p.push('cgid', this._cgid); if (this._pmin != null) p.push('pmin', this._pmin); if (this._pmax != null) p.push('pmax', this._pmax); if (this._sortRule) p.push('srule', this._sortRule.getID()); if (this._pmid) p.push('pmid', this._pmid); return p; }
  urlRefineCategory(action, category) { const id = category && category.getID ? category.getID() : category; const saved = this._cgid; this._cgid = id; const u = this.url(action); this._cgid = saved; return u; }
  urlRelaxCategory(action) { const saved = this._cgid; this._cgid = null; const u = this.url(action); this._cgid = saved; return u; }
  urlRefinePrice(action, min, max) { const s = [this._pmin, this._pmax]; this._pmin = min; this._pmax = max; const u = this.url(action); [this._pmin, this._pmax] = s; return u; }
  urlRelaxPrice(action) { const s = [this._pmin, this._pmax]; this._pmin = null; this._pmax = null; const u = this.url(action); [this._pmin, this._pmax] = s; return u; }
  urlSortingRule(action, rule) { const s = this._sortRule; this._sortRule = rule; const u = this.url(action); this._sortRule = s; return u; }
  urlSortingOption(action, option) { return this.urlSortingRule(action, option.getSortingRule()); }
  urlRefinePromotion(action, id) { const s = this._pmid; this._pmid = id; const u = this.url(action); this._pmid = s; return u; }
  urlRelaxPromotion(action) { const s = this._pmid; this._pmid = null; const u = this.url(action); this._pmid = s; return u; }
  static urlForCategory(action, cgid) { return URLUtils.url(action, 'cgid', cgid); }
  static urlForProduct(action, pid) { return URLUtils.url(action, 'pid', pid); }
  static urlRefineCategory(action, cgid) { return URLUtils.url(action, 'cgid', cgid); }
  static urlRefinePrice(action, min, max) { return URLUtils.url(action, 'pmin', min, 'pmax', max); }
  static urlSortingRule(action, rule) { return URLUtils.url(action, 'srule', rule.getID ? rule.getID() : rule); }

  search() {
    const ProductMgr = require('./ProductMgr');
    let pool = ProductMgr._all().filter((p) => p.isOnline() && !p.isVariant() && !p.isVariationGroup() || (p.isVariant() && !D.productData(p._data.masterID)));
    // include variants whose master is missing (standalone) & exclude masters' variants (grouped under masters)
    if (this._pid) pool = pool.filter((p) => this._pid.includes(p.getID()) || (p.isMaster() && p.getVariationModel().getVariants().toArray().some((v) => this._pid.includes(v.getID()))));
    const catIDs = this._cgid ? (this._recursive && D.category(this._cgid) ? D.category(this._cgid)._descendantIDs() : [this._cgid]) : null;
    if (catIDs && this._cgid !== 'root') pool = pool.filter((p) => (p._data.categories || []).some((c) => catIDs.includes(c)) || (p.isMaster() && p.getVariationModel().getVariants().toArray().some((v) => (v._data.categories || []).some((c) => catIDs.includes(c)))));
    if (!this._cgid) pool = pool.filter((p) => p.isSearchable());
    const words = this._phrase ? this._phrase.toLowerCase().split(/\s+/).filter(Boolean) : [];
    const cur = D.rt().context.session.getCurrency().getCurrencyCode();
    const hits = [];
    let promoProducts = null;
    if (this._pmid) { const PromotionMgr = D.rt().dw.get('campaign/PromotionMgr'); const promo = PromotionMgr.getPromotion(this._pmid); promoProducts = promo ? promo._productIDs() : []; }
    for (const p of pool) {
      let reps = p.isMaster() || p.isVariationGroup() ? p.getVariationModel().getVariants().toArray().filter((v) => v.isOnline()) : [p];
      if (!reps.length && !p.isMaster()) reps = [p];
      if (words.length) { const text = [p.getID(), p.getName(), p.getBrand(), p.getShortDescription(), p.getLongDescription(), p.getPageKeywords(), ...reps.map((r) => r.getID()), ...Object.values(p.getCustom().toJSON ? p.getCustom().toJSON() : {}).filter((v) => typeof v === 'string')].map((x) => (x == null ? '' : String(x))).join(' ').toLowerCase(); if (!words.every((w) => text.includes(w))) continue; }
      for (const [attr, vals] of Object.entries(this._refinements)) reps = reps.filter((r) => { const vv = (r._data.variationValues || {})[attr]; const cv = r.getCustom()[attr] != null ? r.getCustom()[attr] : p.getCustom()[attr]; const has = [vv, ...(Array.isArray(cv) ? cv : [cv])].filter((x) => x != null).map(String); return vals.some((v) => has.includes(String(v))); });
      if (this._pmin != null || this._pmax != null) reps = reps.filter((r) => { const pr = r.getPriceModel().getPrice(); return pr.isAvailable() && (this._pmin == null || pr.getValue() >= this._pmin) && (this._pmax == null || pr.getValue() <= this._pmax); });
      if (this._orderableOnly) reps = reps.filter((r) => r.getAvailabilityModel().isOrderable());
      if (promoProducts) reps = reps.filter((r) => promoProducts.includes(r.getID()) || promoProducts.includes(p.getID()));
      if (!reps.length) continue;
      if (this._pid && !this._pid.includes(p.getID())) reps = reps.filter((r) => this._pid.includes(r.getID()));
      hits.push(new ProductSearchHit(p, reps, this));
    }
    this._sort(hits);
    this._hits = hits; this._matched = hits.map((h) => h.getProduct());
    this._executed = true;
    if (!hits.length && words.length && words.some((w) => w.length > 3)) this._suggested = null;
    this._status = new SearchStatus(hits.length ? SearchStatus.SUCCESSFUL : SearchStatus.SUCCESSFUL, hits.length ? '' : 'no hits');
    return this._status;
  }
  _sort(hits) {
    const rule = this.getEffectiveSortingRule();
    const steps = rule ? rule._steps() : [];
    if (!steps.length) { if (this._phrase) return; hits.sort((a, b) => (b.getProduct().getSearchRank() - a.getProduct().getSearchRank()) || String(a.getProductID()).localeCompare(String(b.getProductID()))); return; }
    const val = (h, attr) => { const p = h.getProduct(); if (attr === 'price') return h.getMinPrice().isAvailable() ? h.getMinPrice().getValue() : Infinity; if (attr === 'name') return String(p.getName() || ''); if (attr === 'creationDate') return new Date(p._data.creationDate || 0).getTime(); const v = p[attr] !== undefined ? p[attr] : p.getCustom()[attr]; return v == null ? '' : v; };
    hits.sort((a, b) => { for (const s of steps) { const va = val(a, s.attribute); const vb = val(b, s.attribute); const r = va < vb ? -1 : va > vb ? 1 : 0; if (r) return s.direction === 'desc' ? -r : r; } return 0; });
  }
  getProductSearchHits() { return new ArrayList(this._hits).iterator(); }
  getProducts() { return new ArrayList(this._matched).iterator(); }
  getCount() { return this._hits.length; }
  getEmptyQuery() { return this.isEmptyQuery() && !this._cgid; }
  isEmptyQuery() { return super.isEmptyQuery() && !this._cgid && !this._pid && !this._pmid; }
  getPersonalizedSort() { return false; }
  isPersonalizedSort() { return false; }
  getStartIndex() { return this._start; }
  setStart(s) { this._start = s; } setPageSize(p) { this._pageSize = p; } getPageSize() { return this._pageSize; }
  addHitTypeRefinement() {} setPageSizeAndStart() {}
  static _fromParams(params) { const m = new ProductSearchModel(); SearchModel._parse(params, m); const g = (k) => { const p = params.get ? params.get(k) : null; return p && p.isSubmitted() ? p.getStringValue() : null; }; if (g('cgid')) m.setCategoryID(g('cgid')); if (g('pmin')) m.setPriceMin(g('pmin')); if (g('pmax')) m.setPriceMax(g('pmax')); if (g('pid')) m.setProductID(g('pid')); if (g('pmid')) m.setPromotionID(g('pmid')); if (g('srule')) { const CatalogMgr = require('./CatalogMgr'); m.setSortingRule(CatalogMgr.getSortingRule(g('srule'))); } return m; }
}
Object.assign(ProductSearchModel, { CATEGORYID_PARAMETER: 'cgid', PRODUCTID_PARAMETER: 'pid', PRICE_MIN_PARAMETER: 'pmin', PRICE_MAX_PARAMETER: 'pmax', SORTING_RULE_PARAMETER: 'srule', SORTING_OPTION_PARAMETER: 'sopt', PROMOTION_PRODUCT_TYPE_PARAMETER: 'pmpt', PROMOTIONID_PARAMETER: 'pmid', PROMOTION_PRODUCT_TYPE_ALL: 'all', PROMOTION_PRODUCT_TYPE_BONUS: 'bonus', PROMOTION_PRODUCT_TYPE_DISCOUNTED: 'discounted', PROMOTION_PRODUCT_TYPE_QUALIFYING: 'qualifying', REFINE_NAME_PARAMETER_PREFIX: 'prefn', REFINE_VALUE_PARAMETER_PREFIX: 'prefv', SEARCH_PHRASE_PARAMETER: 'q' });
module.exports = bean(ProductSearchModel);
