'use strict';
const { bean } = require('../../util/bean');
class EnumValue {
  constructor(value, displayValue) {
    if (value && typeof value === 'object' && !(value instanceof EnumValue)) { displayValue = value.displayValue; value = value.value; }
    this._v = value instanceof EnumValue ? value._v : value;
    this._d = displayValue !== undefined && displayValue !== null ? displayValue : String(this._v);
  }
  getValue() { return this._v; }
  getDisplayValue() { return this._d; }
  equals(o) { if (o instanceof EnumValue) return o._v === this._v; return o === this._v; }
  hashCode() { return String(this._v); }
  compareTo(o) { const b = o instanceof EnumValue ? o._v : o; return this._v < b ? -1 : this._v > b ? 1 : 0; }
  toString() { return String(this._v); }
  valueOf() { return this._v; }
  toJSON() { return { value: this._v, displayValue: this._d }; }
}
module.exports = bean(EnumValue);
