'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
class SitePreferences extends ExtensibleObject {
  constructor(data, site) { super(data); this._site = site; }
  getSite() { return this._site; }
}
module.exports = bean(SitePreferences);
