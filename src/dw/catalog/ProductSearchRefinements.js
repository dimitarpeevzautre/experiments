'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const D = require('./_data');

class ProductSearchRefinementValue {
  constructor(def, value, displayValue, hitCount, extra = {}) { this._def = def; this._v = value; this._d = displayValue; this._h = hitCount; this._x = extra; }
  getValue() { return this._v; } getDisplayValue() { return this._d != null ? this._d : String(this._v); } getHitCount() { return this._h; }
  getPresentationID() { return this._x.presentationID || null; } getDescription() { return this._x.description || null; }
  getValueFrom() { return this._x.from != null ? this._x.from : 0; } getValueTo() { return this._x.to != null ? this._x.to : 0; }
  getID() { return String(this._v); }
  isSelectable() { return true; }
}
bean(ProductSearchRefinementValue);

class ProductSearchRefinementDefinition {
  constructor(d) { this._d = d; }
  getAttributeID() { return this._d.attributeID || null; }
  getDisplayName() { return this._d.displayName || this._d.attributeID || (this._d.type === 'category' ? 'Category' : this._d.type === 'price' ? 'Price' : this._d.type === 'promotion' ? 'Promotion' : ''); }
  isCategoryRefinement() { return this._d.type === 'category'; } isPriceRefinement() { return this._d.type === 'price'; } isPromotionRefinement() { return this._d.type === 'promotion'; } isAttributeRefinement() { return this._d.type === 'attribute' || (!this._d.type && !!this._d.attributeID); }
  getCategoryRefinement() { return this.isCategoryRefinement(); } getPriceRefinement() { return this.isPriceRefinement(); } getAttributeRefinement() { return this.isAttributeRefinement(); } getPromotionRefinement() { return this.isPromotionRefinement(); }
  getValueTypeCode() { return this._d.valueTypeCode || 1; }
  getCutoffThreshold() { return this._d.cutoffThreshold || 0; }
  getDisplayType() { return this._d.displayType || null; }
  getPresentationID() { return this._d.presentationID || null; }
  isMultiSelect() { return !!this._d.multiSelect; }
  getBuckets() { return new ArrayList(this._d.buckets || []); }
  _id() { return this.isCategoryRefinement() ? 'cgid' : this.isPriceRefinement() ? 'price' : this.isPromotionRefinement() ? 'pmid' : this.getAttributeID(); }
}
bean(ProductSearchRefinementDefinition);

class ProductSearchRefinements {
  constructor(model, category) { this._m = model; this._cat = category; this._defs = ProductSearchRefinements._definitionsFor(category, model); }
  static _definitionsFor(category, model) {
    // Explicit refinement config on category (inherited) or site; else auto: category, price, all variation attributes + custom attrs flagged as refinable.
    let cfg = null; let c = category;
    while (c && !cfg) { cfg = c._data.refinements || null; c = c.getParent(); }
    if (!cfg) cfg = (D.rt().siteData() || {}).refinements || null;
    if (cfg) return cfg.map((d) => new ProductSearchRefinementDefinition(d));
    const defs = [{ type: 'category', displayName: 'Category' }, { type: 'price', displayName: 'Price', buckets: [[0, 20], [20, 50], [50, 100], [100, 500], [500, Infinity]] }];
    const attrs = new Map();
    const hits = model ? model._matched : Object.values(D.products()).map((p) => D.product(p.ID));
    for (const p of hits) { const m = p.isVariant() ? p.getVariationModel().getMaster() : p; for (const a of m.getVariationModel().getProductVariationAttributes().toArray()) if (!attrs.has(a.getID())) attrs.set(a.getID(), a.getDisplayName()); }
    for (const [id, dn] of attrs) defs.push({ type: 'attribute', attributeID: id, displayName: dn });
    for (const [id, def] of Object.entries((D.rt().store.get('object-types', {}).Product || { attributes: {} }).attributes || {})) if (def.refinable && !attrs.has(id)) defs.push({ type: 'attribute', attributeID: id, displayName: def.displayName || id });
    return defs.map((d) => new ProductSearchRefinementDefinition(d));
  }
  getRefinementDefinitions() { return new ArrayList(this._defs); }
  getAllRefinementDefinitions() { return new ArrayList(this._defs); }
  getRefinementDefinition(id) { return this._defs.find((d) => d._id() === id) || null; }
  getCategoryRefinementDefinition() { return this._defs.find((d) => d.isCategoryRefinement()) || null; }
  getPriceRefinementDefinition() { return this._defs.find((d) => d.isPriceRefinement()) || null; }
  getPromotionRefinementDefinition() { return this._defs.find((d) => d.isPromotionRefinement()) || null; }
  getAllRefinementValues(def, ...rest) { return this.getRefinementValues(def, ...rest); }
  getRefinementValues(def) {
    const m = this._m; const hits = m ? m._matched : [];
    if (def.isCategoryRefinement()) {
      const cat = this._cat || D.category('root');
      const subs = cat ? cat.getOnlineSubCategories().toArray() : [];
      return new ArrayList(subs.map((s) => { const ids = s._descendantIDs(); const count = hits.filter((p) => (p.getCategories().toArray().map((x) => x.getID())).some((id) => ids.includes(id))).length; return new ProductSearchRefinementValue(def, s.getID(), s.getDisplayName(), count); }).filter((v) => v.getHitCount() > 0 || !m));
    }
    if (def.isPriceRefinement()) {
      const buckets = def._d.buckets && def._d.buckets.length ? def._d.buckets : [[0, 20], [20, 50], [50, 100], [100, 500], [500, Infinity]];
      const cur = D.rt().context.session.getCurrency().getCurrencyCode();
      const Money = require('../value/Money');
      return new ArrayList(buckets.map((b) => { const [from, to] = Array.isArray(b) ? b : [b.from, b.to]; const count = hits.filter((p) => { const pr = p.getPriceModel().getMinPrice(); return pr.isAvailable() && pr.getValue() >= from && pr.getValue() < to; }).length; const label = to === Infinity || to == null ? `${new Money(from, cur).toFormattedString()} and up` : `${new Money(from, cur).toFormattedString()} - ${new Money(to, cur).toFormattedString()}`; return new ProductSearchRefinementValue(def, `${from}-${to === Infinity ? '' : to}`, label, count, { from, to: to === Infinity ? 0 : to }); }).filter((v) => v.getHitCount() > 0));
    }
    if (def.isPromotionRefinement()) { const PromotionMgr = D.rt().dw.get('campaign/PromotionMgr'); return new ArrayList(PromotionMgr.getActivePromotions().toArray().map((p) => new ProductSearchRefinementValue(def, p.getID(), p.getName(), 0))); }
    const id = def.getAttributeID();
    const counts = new Map();
    for (const p of hits) {
      const vals = new Set();
      const reps = p.isMaster() || p.isVariationGroup() ? p.getVariationModel().getVariants().toArray() : [p];
      for (const r of reps) { const vv = (r._data.variationValues || {})[id]; if (vv !== undefined) vals.add(String(vv)); const cv = r.getCustom()[id]; if (cv != null) (Array.isArray(cv) ? cv : [cv]).forEach((x) => vals.add(String(x))); }
      const cv = p.getCustom()[id]; if (cv != null) (Array.isArray(cv) ? cv : [cv]).forEach((x) => vals.add(String(x)));
      for (const v of vals) counts.set(v, (counts.get(v) || 0) + 1);
    }
    const display = (v) => { for (const p of hits) { const m2 = p.isVariant() ? p.getVariationModel().getMaster() : p; const a = m2.getVariationModel().getProductVariationAttribute(id); if (a) { const val = m2.getVariationModel().getAllValues(a).toArray().find((x) => String(x.getValue()) === v); if (val) return val.getDisplayValue(); } } return v; };
    return new ArrayList(Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([v, c]) => new ProductSearchRefinementValue(def, v, display(v), c)));
  }
  getRefinementValue(def, value) { return this.getRefinementValues(def).toArray().find((v) => String(v.getValue()) === String(value)) || null; }
  getNextLevelCategoryRefinementValues(category) { const def = this.getCategoryRefinementDefinition(); const saved = this._cat; this._cat = category; const r = def ? this.getRefinementValues(def) : new ArrayList(); this._cat = saved; return r; }
  getNextLevelRefinementValues(category) { return this.getNextLevelCategoryRefinementValues(category); }
  getRefinementCategory() { return this._cat; }
  getRefinementColor() { return null; }
}
ProductSearchRefinements.Definition = ProductSearchRefinementDefinition;
ProductSearchRefinements.Value = ProductSearchRefinementValue;
module.exports = bean(ProductSearchRefinements);
