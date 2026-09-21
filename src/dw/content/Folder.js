'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const ArrayList = require('../util/ArrayList');
class Folder extends ExtensibleObject {
  constructor(data, rt) { super(data); this._rt = rt; }
  getID() { return this._data.ID; }
  getDisplayName() { return this._data.displayName || this._data.ID; }
  getName() { return this._data.name || this.getDisplayName(); }
  getDescription() { return this._data.description || null; }
  isOnline() { return this._data.online !== false; }
  isRoot() { return !this._data.parent; }
  getTemplate() { return this._data.template || null; }
  getPageTitle() { return this._data.pageTitle || null; }
  getPageDescription() { return this._data.pageDescription || null; }
  getPageKeywords() { return this._data.pageKeywords || null; }
  getPageURL() { return this._data.pageURL || null; }
  getParent() { const ContentMgr = require('./ContentMgr'); return this._data.parent ? ContentMgr.getFolder(this._data.parent) : null; }
  getSubFolders() { const ContentMgr = require('./ContentMgr'); return new ArrayList(ContentMgr._folders().filter((f) => f.parent === this._data.ID).map((f) => ContentMgr.getFolder(f.ID))); }
  getOnlineSubFolders() { return new ArrayList(this.getSubFolders().toArray().filter((f) => f.isOnline())); }
  getContent() { const ContentMgr = require('./ContentMgr'); return new ArrayList(ContentMgr._all().filter((c) => (c._data.folders || []).includes(this._data.ID))); }
  getOnlineContent() { return new ArrayList(this.getContent().toArray().filter((c) => c.isOnline())); }
  getSiteMapIncluded() { return !!this._data.siteMapIncluded; }
}
module.exports = bean(Folder);
