'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');

class ObjectAttributeDefinition {
  constructor(id, def = {}, system = false) { this._id = id; this._def = def; this._system = system; }
  getID() { return this._id; }
  getDisplayName() { return this._def.displayName || this._id; }
  getValueTypeCode() { return this._def.valueTypeCode || ObjectAttributeDefinition.VALUE_TYPE_STRING; }
  isSystem() { return this._system; }
  isMandatory() { return !!this._def.mandatory; }
  isMultiValueType() { return !!this._def.multiValue; }
  isSetValueType() { return !!this._def.setValue; }
  isKey() { return !!this._def.key; }
  getDefaultValue() { return this._def.defaultValue === undefined ? null : this._def.defaultValue; }
  getValues() {
    const ObjectAttributeValueDefinition = require('./ObjectAttributeValueDefinition');
    return new ArrayList((this._def.values || []).map((v) => new ObjectAttributeValueDefinition(v)));
  }
  getUnit() { return this._def.unit || null; }
  getAttributeGroups() { return new ArrayList(); }
  getObjectTypeDefinition() { return this._owner || null; }
}
Object.assign(ObjectAttributeDefinition, {
  VALUE_TYPE_STRING: 1, VALUE_TYPE_INT: 2, VALUE_TYPE_NUMBER: 3, VALUE_TYPE_TEXT: 4, VALUE_TYPE_HTML: 5, VALUE_TYPE_DATE: 6,
  VALUE_TYPE_IMAGE: 7, VALUE_TYPE_BOOLEAN: 8, VALUE_TYPE_MONEY: 9, VALUE_TYPE_QUANTITY: 10, VALUE_TYPE_DATETIME: 11,
  VALUE_TYPE_EMAIL: 12, VALUE_TYPE_PASSWORD: 13, VALUE_TYPE_SET_OF_STRING: 23, VALUE_TYPE_SET_OF_INT: 22, VALUE_TYPE_SET_OF_NUMBER: 24,
  VALUE_TYPE_ENUM_OF_STRING: 33, VALUE_TYPE_ENUM_OF_INT: 31,
});
bean(ObjectAttributeDefinition);

class ObjectAttributeGroup {
  constructor(id, displayName, attrs) { this._id = id; this._displayName = displayName; this._attrs = attrs; }
  getID() { return this._id; }
  getDisplayName() { return this._displayName || this._id; }
  getDescription() { return ''; }
  getAttributeDefinitions() { return new ArrayList(this._attrs); }
}
bean(ObjectAttributeGroup);

class ObjectTypeDefinition {
  /** @param schema {attributes: {id: def}, groups: [{id, displayName, attributes:[ids]}]} or a custom-attribute bag */
  constructor(type, schemaOrCustom = {}) {
    this._type = type;
    const schema = schemaOrCustom && schemaOrCustom.attributes ? schemaOrCustom : { attributes: Object.fromEntries(Object.keys(schemaOrCustom || {}).map((k) => [k, {}])), groups: [] };
    this._attrs = Object.entries(schema.attributes || {}).map(([id, def]) => { const d = new ObjectAttributeDefinition(id, def, !!def.system); d._owner = this; return d; });
    this._groups = (schema.groups || []).map((g) => new ObjectAttributeGroup(g.id, g.displayName, this._attrs.filter((a) => (g.attributes || []).includes(a.getID()))));
  }
  getID() { return this._type; }
  getDisplayName() { return this._type; }
  isSystem() { return false; }
  getAttributeDefinitions() { return new ArrayList(this._attrs); }
  getCustomAttributeDefinition(name) { return this._attrs.find((a) => a.getID() === name && !a.isSystem()) || null; }
  getSystemAttributeDefinition(name) { return this._attrs.find((a) => a.getID() === name && a.isSystem()) || null; }
  getAttributeGroups() { return new ArrayList(this._groups); }
  getAttributeGroup(name) { return this._groups.find((g) => g.getID() === name) || null; }
}
ObjectTypeDefinition.ObjectAttributeDefinition = ObjectAttributeDefinition;
ObjectTypeDefinition.ObjectAttributeGroup = ObjectAttributeGroup;
module.exports = bean(ObjectTypeDefinition);
