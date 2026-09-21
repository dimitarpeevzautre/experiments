'use strict';
const { bean } = require('../../util/bean');
class URLAction {
  constructor(action, siteName, locale, hostName) { this._a = action; this._site = siteName || null; this._locale = locale || null; this._host = hostName || null; }
  getAction() { return this._a; }
  getSiteName() { return this._site; }
  getLocale() { return this._locale; }
  getHostName() { return this._host; }
  toString() { return this._a; }
}
module.exports = bean(URLAction);
