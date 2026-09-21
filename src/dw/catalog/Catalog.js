'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
class Catalog extends ExtensibleObject {
  constructor(data) { super(data); }
  getID() { return this._data.ID; }
  getDisplayName() { return this._data.displayName || this._data.ID; }
  getDescription() { return this._data.description || ''; }
  getRoot() { const D = require('./_data'); return D.category(this._data.root || 'root'); }
}
module.exports = bean(Catalog);
