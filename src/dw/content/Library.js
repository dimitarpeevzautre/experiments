'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
class Library extends ExtensibleObject {
  constructor(id) { super({ ID: id, custom: {} }); }
  getID() { return this._data.ID; }
  getDisplayName() { return this._data.ID; }
  getRoot() { const ContentMgr = require('./ContentMgr'); return ContentMgr.getFolder('root'); }
}
module.exports = bean(Library);
