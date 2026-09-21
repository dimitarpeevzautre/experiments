'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const ArrayList = require('../util/ArrayList');
const MediaFile = require('../content/MediaFile');
const MarkupText = require('../content/MarkupText');
const D = require('./_data');

class Category extends ExtensibleObject {
  constructor(data) { super(data); this._collection = 'categories'; this._store = D.rt().store; }
  getID() { return this._data.ID; }
  getDisplayName() { return this._data.displayName || this._data.name || this._data.ID; }
  getDescription() { return this._data.description || null; }
  isOnline() { return this._data.online !== false; }
  getOnlineFlag() { return this.isOnline(); }
  isRoot() { return !this._data.parent; }
  isTopLevel() { const p = this.getParent(); return !!p && p.isRoot(); }
  getParent() { return this._data.parent ? D.category(this._data.parent) : null; }
  getTemplate() { return this._data.template || null; }
  getImage() { return this._data.image ? new MediaFile(this._data.image) : null; }
  getThumbnail() { return this._data.thumbnail ? new MediaFile(this._data.thumbnail) : null; }
  getPageTitle() { return this._data.pageTitle || null; }
  getPageDescription() { return this._data.pageDescription || null; }
  getPageKeywords() { return this._data.pageKeywords || null; }
  getPageURL() { return this._data.pageURL || null; }
  getPageMetaTags() { return new ArrayList(); }
  getPageMetaTag() { return null; }
  getDefaultSortingRule() { const CatalogMgr = require('./CatalogMgr'); return this._data.defaultSortingRule ? CatalogMgr.getSortingRule(this._data.defaultSortingRule) : (this.getParent() ? this.getParent().getDefaultSortingRule() : null); }
  getSubCategories() { return new ArrayList(Object.keys(D.categories()).filter((id) => D.categoryData(id).parent === this._data.ID).sort((a, b) => (D.categoryData(a).position || 0) - (D.categoryData(b).position || 0)).map((id) => D.category(id))); }
  getOnlineSubCategories() { return new ArrayList(this.getSubCategories().toArray().filter((c) => c.isOnline())); }
  hasOnlineSubCategories() { return this.getOnlineSubCategories().size() > 0; }
  getProducts() { return new ArrayList(Object.keys(D.products()).filter((id) => (D.productData(id).categories || []).includes(this._data.ID)).map((id) => D.product(id))); }
  getOnlineProducts() { return new ArrayList(this.getProducts().toArray().filter((p) => p.isOnline())); }
  hasOnlineProducts() { return this.getOnlineProducts().size() > 0; }
  getProductAssignments() { const CategoryAssignment = require('./CategoryAssignment'); return new ArrayList(this.getProducts().toArray().map((p) => new CategoryAssignment(p, this))); }
  getOnlineCategoryAssignments() { const CategoryAssignment = require('./CategoryAssignment'); return new ArrayList(this.getOnlineProducts().toArray().map((p) => new CategoryAssignment(p, this))); }
  getAllRecommendations() { return new ArrayList(); }
  getRecommendations() { return new ArrayList(); }
  getOrderableRecommendations() { return new ArrayList(); }
  getSearchPlacement() { return this._data.searchPlacement || 0; }
  getSearchRank() { return this._data.searchRank || 0; }
  isSiteMapIncluded() { return !!this._data.siteMapIncluded; }
  getSiteMapChangeFrequency() { return this._data.siteMapChangeFrequency || null; }
  getSiteMapPriority() { return this._data.siteMapPriority || 0; }
  getIncomingCategoryLinks() { return new ArrayList(); } getOutgoingCategoryLinks() { return new ArrayList(); }
  getCategoryAssignments() { return this.getProductAssignments(); }
  getAllRefinementDefinitions() { return new ArrayList(); }
  getRefinementDefinitions() { const PSR = require('./ProductSearchRefinements'); return new ArrayList(PSR._definitionsFor(this)); }
  getDisplayNameByLocale() { return this.getDisplayName(); }
  getShowInMenu() { return this._data.showInMenu !== false; }
  isShowInMenu() { return this.getShowInMenu(); }
  getOrderableProducts() { return new ArrayList(this.getOnlineProducts().toArray().filter((p) => p.getAvailabilityModel().isOrderable())); }
  _path() { const out = [this]; let p = this.getParent(); while (p) { out.unshift(p); p = p.getParent(); } return out; }
  _descendantIDs() { const out = [this._data.ID]; for (const c of this.getSubCategories().toArray()) out.push(...c._descendantIDs()); return out; }
  toString() { return `[Category ${this._data.ID}]`; }
  equals(o) { return o instanceof Category && o.getID() === this.getID(); }
}
module.exports = bean(Category);
