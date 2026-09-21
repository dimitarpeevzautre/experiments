'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const Component = require('./Component');
class Region {
  constructor(d, page, parent) { this._d = d; this._page = page; this._parent = parent || null; }
  getID() { return this._d.ID || this._d.id; }
  getSize() { return (this._d.components || []).length; }
  getVisibleComponents() { return new ArrayList((this._d.components || []).map((c) => new Component(c, this._page)).filter((c) => c.isVisible())); }
  getComponents() { return new ArrayList((this._d.components || []).map((c) => new Component(c, this._page))); }
}
module.exports = bean(Region);
