'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
class StoreGroup extends ExtensibleObject {
  constructor(d) { super(d); }
  getID() { return this._data.ID; } getName() { return this._data.name || this._data.ID; }
  getStores() { const StoreMgr = require('./StoreMgr'); return new (require('../util/ArrayList'))((this._data.stores || []).map((id) => StoreMgr.getStore(id)).filter(Boolean)); }
}
module.exports = bean(StoreGroup);
