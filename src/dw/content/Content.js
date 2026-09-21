'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const MarkupText = require('./MarkupText');
const ArrayList = require('../util/ArrayList');
class Content extends ExtensibleObject {
  constructor(data, rt) {
    super(data); this._rt = rt; this._collection = 'content'; this._store = rt.store;
    const c = this._custom;
    if (typeof data.custom.body === 'string') c.body = new MarkupText(data.custom.body);
  }
  getID() { return this._data.ID; }
  getName() { return this._data.name || this._data.ID; }
  getDescription() { return this._data.description || null; }
  isOnline() { return this._data.online !== false; }
  getOnlineFlag() { return this.isOnline(); }
  isSearchable() { return !!this._data.searchable; }
  getSearchableFlag() { return this.isSearchable(); }
  getTemplate() { return this._data.template || null; }
  getPageTitle() { return this._data.pageTitle || null; }
  getPageDescription() { return this._data.pageDescription || null; }
  getPageKeywords() { return this._data.pageKeywords || null; }
  getPageURL() { return this._data.pageURL || null; }
  getPageMetaTags() { return new ArrayList(); }
  getPageMetaTag() { return null; }
  isSiteMapIncluded() { return !!this._data.siteMapIncluded; }
  getSiteMapChangeFrequency() { return this._data.siteMapChangeFrequency || null; }
  getSiteMapPriority() { return this._data.siteMapPriority || 0; }
  getFolders() { const ContentMgr = require('./ContentMgr'); return new ArrayList((this._data.folders || []).map((id) => ContentMgr.getFolder(id)).filter(Boolean)); }
  getClassificationFolder() { const ContentMgr = require('./ContentMgr'); const id = this._data.classificationFolder || (this._data.folders || [])[0]; return id ? ContentMgr.getFolder(id) : null; }
  getOnlineFolders() { return new ArrayList(this.getFolders().toArray().filter((f) => f.isOnline())); }
}
module.exports = bean(Content);
