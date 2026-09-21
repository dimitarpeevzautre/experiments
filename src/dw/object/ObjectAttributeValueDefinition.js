'use strict';
const { bean } = require('../../util/bean');
class ObjectAttributeValueDefinition {
  constructor(v) { this._v = typeof v === 'object' && v !== null ? v : { value: v, displayValue: String(v) }; }
  getValue() { return this._v.value; }
  getDisplayValue() { return this._v.displayValue !== undefined ? this._v.displayValue : String(this._v.value); }
}
module.exports = bean(ObjectAttributeValueDefinition);
