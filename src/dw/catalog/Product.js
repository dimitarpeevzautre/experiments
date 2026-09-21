'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const ArrayList = require('../util/ArrayList');
const Quantity = require('../value/Quantity');
const MarkupText = require('../content/MarkupText');
const MediaFile = require('../content/MediaFile');
const D = require('./_data');

class Product extends ExtensibleObject {
  constructor(data) { super(data); this._collection = 'products'; this._store = D.rt().store; }
  getID() { return this._data.ID; }
  getName() { return this._data.name || null; }
  getShortDescription() { return this._data.shortDescription != null ? new MarkupText(this._data.shortDescription) : null; }
  getLongDescription() { return this._data.longDescription != null ? new MarkupText(this._data.longDescription) : null; }
  isOnline() { return this._data.online !== false && this._onlineByDates(); }
  _onlineByDates() { const now = Date.now(); if (this._data.onlineFrom && new Date(this._data.onlineFrom).getTime() > now) return false; if (this._data.onlineTo && new Date(this._data.onlineTo).getTime() < now) return false; return true; }
  getOnlineFlag() { return this._data.online !== false; }
  getOnlineFrom() { return this._data.onlineFrom ? new Date(this._data.onlineFrom) : null; }
  getOnlineTo() { return this._data.onlineTo ? new Date(this._data.onlineTo) : null; }
  isSearchable() { return this._data.searchable !== false; }
  getSearchableFlag() { return this.isSearchable(); }
  isMaster() { return !!this._data.master || (Array.isArray(this._data.variants) && this._data.variants.length > 0 && !this._data.masterID); }
  isVariant() { return !!this._data.masterID && !this._data.variationGroup; }
  isVariationGroup() { return !!this._data.variationGroup; }
  isProductSet() { return Array.isArray(this._data.productSetProducts) && this._data.productSetProducts.length > 0; }
  isProductSetProduct() { return Object.values(D.products()).some((p) => (p.productSetProducts || []).includes(this._data.ID)); }
  isBundle() { return Array.isArray(this._data.bundledProducts) && this._data.bundledProducts.length > 0; }
  isBundled() { return Object.values(D.products()).some((p) => (p.bundledProducts || []).some((b) => (typeof b === 'string' ? b : b.ID) === this._data.ID)); }
  isOptionProduct() { return Array.isArray(this._data.options) && this._data.options.length > 0; }
  isRetailSet() { return this.isProductSet(); }
  isAssignedToSiteCatalog() { return true; }
  isAssignedToCategory(cat) { return (this._data.categories || []).includes(cat.getID ? cat.getID() : cat); }
  isCategorized() { return (this._data.categories || []).length > 0; }
  isFacebookEnabled() { return false; } isPinterestEnabled() { return false; } isSiteMapIncluded() { return !!this._data.siteMapIncluded; }
  getBrand() { return this._data.brand || null; }
  getManufacturerName() { return this._data.manufacturerName || null; }
  getManufacturerSKU() { return this._data.manufacturerSKU || null; }
  getUPC() { return this._data.UPC || this._data.upc || null; }
  getEAN() { return this._data.EAN || this._data.ean || null; }
  getUnit() { return this._data.unit || null; }
  getUnitQuantity() { return new Quantity(this._data.unitQuantity || 1, this._data.unit || ''); }
  getTaxClassID() { return this._data.taxClassID || null; }
  getTemplate() { return this._data.template || null; }
  getPageTitle() { return this._data.pageTitle || null; }
  getPageDescription() { return this._data.pageDescription || null; }
  getPageKeywords() { return this._data.pageKeywords || null; }
  getPageURL() { return this._data.pageURL || null; }
  getPageMetaTags() { return new ArrayList(); }
  getPageMetaTag() { return null; }
  getMinOrderQuantity() { return new Quantity(this._data.minOrderQuantity || 1, this._data.unit || ''); }
  getStepQuantity() { return new Quantity(this._data.stepQuantity || 1, this._data.unit || ''); }
  getSearchPlacement() { return this._data.searchPlacement || 0; }
  getSearchRank() { return this._data.searchRank || 0; }
  getStoreTaxClassID() { return this._data.storeTaxClassID || this.getTaxClassID(); }
  getStoreReceiptName() { return this._data.storeReceiptName || this.getName(); }
  getStoreForcePriceFlag() { return !!this._data.storeForcePrice; }
  getCategories() { return new ArrayList((this._data.categories || []).map((id) => D.category(id)).filter(Boolean)); }
  getOnlineCategories() { return new ArrayList(this.getCategories().toArray().filter((c) => c.isOnline())); }
  getAllCategories() { const out = new Map(); for (const c of this.getCategories().toArray()) for (const p of c._path()) out.set(p.getID(), p); return new ArrayList(Array.from(out.values())); }
  getAllCategoryAssignments() { const CA = require('./CategoryAssignment'); return new ArrayList(this.getCategories().toArray().map((c) => new CA(this, c))); }
  getCategoryAssignments() { return this.getAllCategoryAssignments(); }
  getCategoryAssignment(cat) { const CA = require('./CategoryAssignment'); return this.isAssignedToCategory(cat) ? new CA(this, cat) : null; }
  getPrimaryCategory() { const id = this._data.primaryCategory || (this._data.categories || [])[0]; return id ? D.category(id) : null; }
  getClassificationCategory() { const id = this._data.classificationCategory || this._data.primaryCategory || (this._data.categories || [])[0]; return id ? D.category(id) : null; }
  getPrimaryCategoryAssignment() { const c = this.getPrimaryCategory(); return c ? this.getCategoryAssignment(c) : null; }
  getImages(viewType) { const imgs = (this._data.images && this._data.images[viewType]) || []; return new ArrayList(imgs.map((i) => new MediaFile(i, viewType))); }
  getImage(viewType, index = 0) { const imgs = (this._data.images && this._data.images[viewType]) || []; if (imgs[index]) return new MediaFile(imgs[index], viewType); if (this.isVariant()) { const m = this.getVariationModel().getMaster(); return m && m !== this ? m.getImage(viewType, index) : null; } return null; }
  getThumbnail() { return this.getImage('thumbnail') || this.getImage('small'); }
  getVariationModel() { const PVM = require('./ProductVariationModel'); return new PVM(this); }
  getPriceModel(optionModel) { const PPM = require('./ProductPriceModel'); return new PPM(this, optionModel); }
  getAvailabilityModel(list) { const PAM = require('./ProductAvailabilityModel'); return new PAM(this, list); }
  getOptionModel() { const POM = require('./ProductOptionModel'); return new POM(this); }
  getAttributeModel() { const PAM = require('./ProductAttributeModel'); return new PAM(this); }
  getActiveData() { const PAD = require('./ProductActiveData'); return new PAD(this._data.activeData || {}); }
  getProductSetProducts() { return new ArrayList((this._data.productSetProducts || []).map((id) => D.product(id)).filter(Boolean)); }
  getBundledProducts() { return new ArrayList((this._data.bundledProducts || []).map((b) => D.product(typeof b === 'string' ? b : b.ID)).filter(Boolean)); }
  getBundledProductQuantity(p) { const b = (this._data.bundledProducts || []).find((x) => (typeof x === 'string' ? x : x.ID) === p.getID()); return new Quantity(b && typeof b === 'object' ? b.quantity || 1 : 1, ''); }
  getBundles() { return new ArrayList(Object.values(D.products()).filter((p) => (p.bundledProducts || []).some((b) => (typeof b === 'string' ? b : b.ID) === this._data.ID)).map((p) => D.product(p.ID))); }
  getProductSets() { return new ArrayList(Object.values(D.products()).filter((p) => (p.productSetProducts || []).includes(this._data.ID)).map((p) => D.product(p.ID))); }
  getProductLinks(type) { const PL = require('./ProductLink'); return new ArrayList((this._data.productLinks || []).filter((l) => type === undefined || l.type === type).map((l) => new PL(l, this))); }
  getAllProductLinks(type) { return this.getProductLinks(type); }
  getIncomingProductLinks(type) { const PL = require('./ProductLink'); const out = []; for (const p of Object.values(D.products())) for (const l of p.productLinks || []) if (l.target === this._data.ID && (type === undefined || l.type === type)) out.push(new PL(l, D.product(p.ID))); return new ArrayList(out); }
  getAllIncomingProductLinks(type) { return this.getIncomingProductLinks(type); }
  getRecommendations(type) { const R = require('./Recommendation'); return new ArrayList((this._data.recommendations || []).filter((r) => type === undefined || r.type === type).map((r) => new R(r, this))); }
  getOrderableRecommendations(type) { return new ArrayList(this.getRecommendations(type).toArray().filter((r) => { const p = r.getRecommendedItem(); return p && p.getAvailabilityModel().isOrderable(); })); }
  getAllRecommendations(type) { return this.getRecommendations(type); }
  getVariants() { return this.getVariationModel().getVariants(); }
  getVariationGroups() { return this.getVariationModel().getVariationGroups(); }
  getMasterProduct() { return this.getVariationModel().getMaster(); }
  getPriceModelForCurrency() { return this.getPriceModel(); }
  getProductVariationModel() { return this.getVariationModel(); }
  isProductAssignedToCatalog() { return true; }
  includedInBundle(bundle) { return bundle.getBundledProducts().toArray().some((p) => p.getID() === this._data.ID); }
  describe() { const OTD = require('../object/ObjectTypeDefinition'); return new OTD('Product', D.rt().store.get('object-types', {}).Product || this._data.custom); }
  toString() { return `[Product ${this._data.ID}]`; }
  equals(o) { return o instanceof Product && o.getID() === this.getID(); }
  hashCode() { return this._data.ID; }
}
module.exports = bean(Product);
