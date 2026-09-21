'use strict';
const { bean } = require('../../util/bean');
const URL = require('../web/URL');
class MediaFile {
  constructor(d = {}, viewType) { this._d = typeof d === 'string' ? { path: d } : d; this._vt = viewType || this._d.viewType || null; }
  _base() {
    const rt = require('../../runtime').current();
    const Site = rt.dw.get('system/Site');
    const p = this._d.path || this._d.url || '';
    if (/^https?:\/\//.test(p) || p.startsWith('//')) return p;
    const catalog = Site.getCurrent().getSiteCatalogID() || 'storefront-catalog';
    return `/on/demandware.static/-/Sites-${catalog}/default/${p.replace(/^\//, '')}`;
  }
  getURL() { return new URL(this._base()); }
  getAbsURL() { return new URL(this._base()).abs(); }
  getHttpURL() { return new URL(this._base()).http(); }
  getHttpsURL() { return new URL(this._base()).https(); }
  getImageURL(transform) { let u = this._base(); if (transform && typeof transform === 'object') { const q = Object.entries(transform).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'); if (q) u += (u.includes('?') ? '&' : '?') + q; } return new URL(u); }
  getAbsImageURL(t) { return this.getImageURL(t).abs(); }
  getHttpImageURL(t) { return this.getImageURL(t).http(); }
  getHttpsImageURL(t) { return this.getImageURL(t).https(); }
  getAlt() { return this._d.alt || null; }
  getTitle() { return this._d.title || null; }
  getViewType() { return this._vt; }
  toString() { return this._base(); }
}
module.exports = bean(MediaFile);
