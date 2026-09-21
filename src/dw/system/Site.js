'use strict';
const { bean } = require('../../util/bean');
const rtRef = require('../../runtime');
const ArrayList = require('../util/ArrayList');
const Calendar = require('../util/Calendar');
const SitePreferences = require('./SitePreferences');

const cache = new Map();
class Site {
  constructor(id, data, rt) {
    this._id = id; this._d = data; this._rt = rt;
    if (!data.preferences) data.preferences = { custom: {} };
    if (!data.preferences.custom) data.preferences.custom = {};
    this._prefs = new SitePreferences(data.preferences, this);
    this._prefs._collection = 'sites'; this._prefs._store = rt.store;
  }
  static getCurrent() {
    const rt = rtRef.current();
    const id = rt.config.site;
    if (!cache.has(id) || cache.get(id)._rt !== rt) {
      const data = rt.siteData(id) || {};
      cache.set(id, new Site(id, data, rt));
    }
    return cache.get(id);
  }
  static getCalendar() { return Site.getCurrent().getCalendar(); }
  static getAllSites() { const rt = rtRef.current(); return new ArrayList(Object.keys(rt.store.get('sites', {})).map((id) => new Site(id, rt.siteData(id), rt))); }
  getID() { return this._id; }
  getName() { return this._d.name || this._id; }
  getStatus() { return this._d.status === 'protected' ? Site.SITE_STATUS_PROTECTED : this._d.status === 'offline' ? Site.SITE_STATUS_OFFLINE : Site.SITE_STATUS_ONLINE; }
  getHttpHostName() { return this._d.httpHostName || this._rt.config.hostname || 'localhost'; }
  getHttpsHostName() { return this._d.httpsHostName || this.getHttpHostName(); }
  getDefaultLocale() { return this._d.defaultLocale || 'en_US'; }
  getAllowedLocales() { return new ArrayList(this._d.allowedLocales || [this.getDefaultLocale()]); }
  getDefaultCurrency() { return this._d.currencyCode || this._d.defaultCurrency || this._rt.config.currency || 'USD'; }
  getAllowedCurrencies() { return new ArrayList(this._d.allowedCurrencies || [this.getDefaultCurrency()]); }
  getCurrencyCode() { return this.getDefaultCurrency(); }
  getTimezone() { return this._d.timezone || this._rt.config.timezone || 'UTC'; }
  getTimezoneOffset() { const now = new Date(); return -(Calendar.dateParts ? 0 : 0) + (require('../util/Calendar').dateParts(now, this.getTimezone()) ? 0 : 0); }
  getCalendar() { const c = new Calendar(); c.setTimeZone(this.getTimezone()); return c; }
  getPreferences() { return this._prefs; }
  getCustomPreferenceValue(name) { const v = this._prefs.getCustom()[name]; return v === undefined ? null : v; }
  setCustomPreferenceValue(name, v) { this._prefs.getCustom()[name] = v; }
  getPageMetaTags() { return new ArrayList(); }
  getPageMetaTag() { return null; }
  isOMSEnabled() { return false; }
  isEinsteinLocaleEnabled() { return false; }
  getSiteCatalogID() { return this._d.catalog || this._d.siteCatalog || null; }
  getStatusCode() { return this.getStatus(); }
  toString() { return `[Site ${this._id}]`; }
  equals(o) { return o instanceof Site && o._id === this._id; }
  static _clearCache() { cache.clear(); }
}
Site.SITE_STATUS_ONLINE = 0;
Site.SITE_STATUS_PROTECTED = 1;
Site.SITE_STATUS_OFFLINE = 2;
Object.defineProperty(Site, 'current', { get: () => Site.getCurrent() });
module.exports = bean(Site);
