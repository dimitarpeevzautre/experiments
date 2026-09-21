'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
class ClickStreamEntry {
  constructor(d) { this._d = d; }
  getPath() { return this._d.path; } getQueryString() { return this._d.query || ''; } getUrl() { return this._d.path + (this._d.query ? '?' + this._d.query : ''); }
  getPipelineName() { return this._d.pipeline; } getTimestamp() { return this._d.time; } getReferer() { return this._d.referer || null; } getRemoteAddress() { return this._d.remote || '127.0.0.1'; }
  getUserAgent() { return this._d.ua || null; } getHost() { return this._d.host || 'localhost'; } getLocale() { return this._d.locale || 'default'; }
  getParameter(name) { const m = new RegExp(`(?:^|&)${name}=([^&]*)`).exec(this._d.query || ''); return m ? decodeURIComponent(m[1]) : null; }
}
bean(ClickStreamEntry);
class ClickStream {
  constructor() { this._clicks = []; this._enabled = true; this._partial = false; }
  _add(entry) { this._clicks.push(new ClickStreamEntry(entry)); if (this._clicks.length > 50) { this._clicks.shift(); this._partial = true; } }
  getClicks() { return new ArrayList(this._clicks); }
  getFirst() { return this._clicks[0] || null; }
  getLast() { return this._clicks[this._clicks.length - 1] || null; }
  isEnabled() { return this._enabled; }
  isPartial() { return this._partial; }
}
ClickStream.ClickStreamEntry = ClickStreamEntry;
module.exports = bean(ClickStream);
