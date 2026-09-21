'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const OTD = require('../object/ObjectTypeDefinition');
/** Attribute groups come from data/object-types.json Product.groups; visible attributes = those with a value on the product. */
class ProductAttributeModel {
  constructor(product) { this._p = product; const rt = require('../../runtime').current(); this._def = new OTD('Product', rt.store.get('object-types', {}).Product || { attributes: Object.fromEntries(Object.keys(product._data.custom || {}).map((k) => [k, {}])) }); }
  getAttributeGroups() { return this._def.getAttributeGroups(); }
  getVisibleAttributeGroups() { return new ArrayList(this._def.getAttributeGroups().toArray().filter((g) => this.getVisibleAttributeDefinitions(g).size() > 0)); }
  getAttributeGroup(id) { return this._def.getAttributeGroup(id); }
  getAttributeDefinitions(group) { return group.getAttributeDefinitions(); }
  getVisibleAttributeDefinitions(group) { return new ArrayList(group.getAttributeDefinitions().toArray().filter((a) => this.getValue(a) != null && this.getValue(a) !== '')); }
  getAttributeDefinition(id) { return this._def.getCustomAttributeDefinition(id) || this._def.getSystemAttributeDefinition(id); }
  getOrderRequiredAttributeDefinitions() { return new ArrayList(); }
  getValue(def) { const id = def.getID ? def.getID() : def; const v = def.isSystem && def.isSystem() ? this._p._data[id] : this._p.getCustom()[id]; return v === undefined ? null : v; }
  getDisplayValue(def) { const v = this.getValue(def); if (v == null) return null; if (Array.isArray(v)) return v.map((x) => this._display(def, x)).join(', '); return this._display(def, v); }
  _display(def, v) { const vals = def.getValues ? def.getValues().toArray() : []; const m = vals.find((x) => String(x.getValue()) === String(v)); return m ? m.getDisplayValue() : (v && v.getDisplayValue ? v.getDisplayValue() : String(v)); }
}
module.exports = bean(ProductAttributeModel);
