'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
class PageMetaTag {
  constructor(id, content, title = false, name = false, property = false) { this._id = id; this._c = content; this._t = title; this._n = name; this._p = property; }
  getID() { return this._id; } getContent() { return this._c; } isTitle() { return this._t; } isName() { return this._n; } isProperty() { return this._p; }
}
bean(PageMetaTag);
class PageMetaData {
  constructor() { this._title = null; this._desc = null; this._kw = null; this._tags = []; }
  getTitle() { return this._title; } setTitle(t) { this._title = t; }
  getDescription() { return this._desc; } setDescription(d) { this._desc = d; }
  getKeywords() { return this._kw; } setKeywords(k) { this._kw = k; }
  getPageMetaTags() { return new ArrayList(this._tags); }
  addPageMetaTag(tag) { this._tags.push(tag); }
  addPageMetaTags(tags) { for (const t of tags) this._tags.push(t); }
  isPageMetaTagSet(id) { return this._tags.some((t) => t.getID() === id); }
}
PageMetaData.PageMetaTag = PageMetaTag;
module.exports = bean(PageMetaData);
