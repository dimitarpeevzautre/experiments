'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const URL = require('../web/URL');
const URLUtils = require('../web/URLUtils');
const SearchStatus = require('../system/SearchStatus');
class ContentSearchModel {
  constructor() { this._phrase = null; this._folder = null; this._recursive = true; this._results = []; this._executed = false; this._filteredByFolder = true; }
  setSearchPhrase(p) { this._phrase = p; } getSearchPhrase() { return this._phrase; }
  setFolderID(f) { this._folder = f; } getFolderID() { return this._folder; }
  setRecursiveFolderSearch(b) { this._recursive = !!b; } isRecursiveFolderSearch() { return this._recursive; }
  setFilteredByFolder(b) { this._filteredByFolder = !!b; } isFilteredByFolder() { return this._filteredByFolder; }
  setContentID(id) { this._contentID = id; } getContentID() { return this._contentID || null; }
  isFolderSearch() { return !!this._folder; } isRefinedFolderSearch() { return !!this._folder && !!this._phrase; }
  isEmptyQuery() { return !this._phrase && !this._folder; }
  search() {
    const ContentMgr = require('./ContentMgr');
    const all = ContentMgr._all().filter((c) => c.isOnline() && (this._phrase ? c.isSearchable() : true));
    const words = this._phrase ? String(this._phrase).toLowerCase().split(/\s+/).filter(Boolean) : [];
    this._results = all.filter((c) => {
      if (this._folder && this._filteredByFolder) {
        const folders = c._data.folders || [];
        if (!folders.includes(this._folder) && !(this._recursive && folders.some((f) => isDescendant(f, this._folder)))) return false;
      }
      if (words.length) { const text = `${c.getName()} ${c.getDescription() || ''} ${c.getCustom().body || ''} ${c.getPageKeywords() || ''}`.toLowerCase(); return words.every((w) => text.includes(w)); }
      return true;
    });
    this._executed = true;
    return new SearchStatus(this._results.length ? SearchStatus.SUCCESSFUL : SearchStatus.EMPTY_QUERY);
  }
  getContent() { return new ArrayList(this._results).iterator(); }
  getContentSearchHits() { return this.getContent(); }
  getCount() { return this._results.length; }
  getFolder() { const ContentMgr = require('./ContentMgr'); return this._folder ? ContentMgr.getFolder(this._folder) : null; }
  getFolderSearchHits() { return new ArrayList().iterator(); }
  getPageMetaTags() { return new ArrayList(); }
  getSearchRedirect() { return null; }
  urlForContent(action, id) { return URLUtils.url(action, 'cid', id); }
  urlForFolder(action, id) { return URLUtils.url(action, 'fdid', id); }
  urlRefineFolder(action, id) { return URLUtils.url(action, 'q', this._phrase || '', 'fdid', id); }
  urlRelaxFolder(action) { return URLUtils.url(action, 'q', this._phrase || ''); }
  url(action) { return URLUtils.url(action, 'q', this._phrase || ''); }
  getRefinements() { return null; }
  static urlForContent(action, id) { return URLUtils.url(action, 'cid', id); }
  static urlForFolder(action, id) { return URLUtils.url(action, 'fdid', id); }
  static urlForRefine(action, name, value) { return URLUtils.url(action, name, value); }
}
function isDescendant(folderId, ancestorId) { const ContentMgr = require('./ContentMgr'); let f = ContentMgr.getFolder(folderId); let guard = 0; while (f && guard++ < 50) { if (f.getID() === ancestorId) return true; f = f.getParent(); } return false; }
ContentSearchModel.CONTENTID_PARAMETER = 'cid'; ContentSearchModel.FOLDERID_PARAMETER = 'fdid'; ContentSearchModel.SEARCHPHRASE_PARAMETER = 'q';
module.exports = bean(ContentSearchModel);
