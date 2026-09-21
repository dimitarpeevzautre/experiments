'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
class SourceCodeGroup extends ExtensibleObject { constructor(d) { super(d); } getID() { return this._data.ID; } getPriceBooks() { const PBM = require('../catalog/PriceBookMgr'); return new (require('../util/ArrayList'))((this._data.priceBooks || []).map((id) => PBM.getPriceBook(id)).filter(Boolean)); } }
module.exports = bean(SourceCodeGroup);
