'use strict';
const { bean } = require('../../util/bean');
const FormElement = require('./FormElement');
const ArrayList = require('../util/ArrayList');

class FormFieldOption {
  constructor(o, field) { this._o = o; this._f = field; }
  getOptionId() { return this._o.optionid; } getValue() { return this._o.value; } getHtmlValue() { return this._o.value == null ? '' : String(this._o.value); }
  getLabel() { const Resource = require('./Resource'); return this._o.label ? Resource.msg(this._o.label, 'forms', this._o.label) : this.getHtmlValue(); }
  isSelected() { return this._f.getHtmlValue() === this.getHtmlValue(); } getSelected() { return this.isSelected(); }
  isChecked() { return this.isSelected(); } getChecked() { return this.isSelected(); }
  getObject() { return this._o.object || null; } getParent() { return this._f; }
}
bean(FormFieldOption);

class FormFieldOptions {
  constructor(list) { this._l = list; }
  getOptionsCount() { return this._l.length; } getLength() { return this._l.length; }
  get(i) { return this._l[i]; }
  iterator() { return new ArrayList(this._l).iterator(); }
  [Symbol.iterator]() { return this._l[Symbol.iterator](); }
  toArray() { return this._l.slice(); }
}
bean(FormFieldOptions);

class FormField extends FormElement {
  constructor(def, parent) {
    super(def, parent);
    this._value = null; this._htmlValue = ''; this._submitted = false;
    this._options = (def.options || []).map((o) => new FormFieldOption(o, this));
    const dflt = def.attrs.default !== undefined ? def.attrs.default : (this._options.find((o) => o._o.default) || {})._o;
    if (def.attrs.default !== undefined) this.setValue(coerce(def.attrs.default, this.getType()));
    else if (dflt && dflt.value !== undefined) this.setValue(coerce(dflt.value, this.getType()));
    this._checked = false;
  }
  getType() { return this._def.attrs.type || 'string'; }
  getLabel() { const Resource = require('./Resource'); const l = this._def.attrs.label; return l ? Resource.msg(l, 'forms', l) : null; }
  getDescription() { const Resource = require('./Resource'); const l = this._def.attrs.description; return l ? Resource.msg(l, 'forms', l) : null; }
  isMandatory() { return this._def.attrs.mandatory === 'true'; }
  getMandatory() { return this.isMandatory(); }
  getMaxLength() { return this._def.attrs['max-length'] ? parseInt(this._def.attrs['max-length'], 10) : 2147483647; }
  getMinLength() { return this._def.attrs['min-length'] ? parseInt(this._def.attrs['min-length'], 10) : 0; }
  getMaxValue() { return this._def.attrs['max'] !== undefined ? coerce(this._def.attrs['max'], this.getType()) : null; }
  getMinValue() { return this._def.attrs['min'] !== undefined ? coerce(this._def.attrs['min'], this.getType()) : null; }
  getRegEx() { return this._def.attrs.regexp || null; }
  getValue() { return this._value; }
  setValue(v) { this._value = v === undefined ? null : v; this._htmlValue = v == null ? '' : (v instanceof Date ? v.toISOString() : String(v)); this._checked = this.getType() === 'boolean' ? !!v : this._checked; }
  getHtmlValue() { return this._htmlValue; }
  setHtmlValue(s) { this._htmlValue = s == null ? '' : String(s); this._submitted = true; this._value = coerce(this._htmlValue, this.getType(), this); }
  getOptions() { return new FormFieldOptions(this._options); }
  setOptions(iterable, begin, end) {
    let arr = iterable && typeof iterable.hasNext === 'function' ? drain(iterable) : Array.from(iterable || []);
    if (begin !== undefined) arr = arr.slice(begin, end === undefined ? undefined : end + 1);
    const bv = this._def.attrs['binding'];
    this._options = arr.map((o) => new FormFieldOption(typeof o === 'object' && o !== null && 'optionid' in o ? o : { optionid: String(o), value: bv && o[bv] !== undefined ? o[bv] : (o && o.value !== undefined ? o.value : o), label: o && (o.displayValue || o.label || o.name) || String(o), object: o }, this));
  }
  getSelectedOption() { return this._options.find((o) => o.isSelected()) || null; }
  getSelectedOptionObject() { const o = this.getSelectedOption(); return o ? o.getObject() : null; }
  isChecked() { return this.getType() === 'boolean' ? !!this._value : this._checked; }
  getChecked() { return this.isChecked(); }
  isSelected() { return this.isChecked(); }
  getSelected() { return this.isChecked(); }
  isSubmitted() { return this._submitted; }
  getSubmitted() { return this._submitted; }
  clearFormElement() { super.clearFormElement(); this._submitted = false; this.setValue(this._def.attrs.default !== undefined ? coerce(this._def.attrs.default, this.getType()) : null); }
  /** Validate against mandatory/regexp/length/range rules and set error state. */
  validate() {
    this._valid = true; this._error = null;
    const v = this._htmlValue;
    if (this.isMandatory() && (v === '' || v == null || (this.getType() === 'boolean' && !this._value))) { this._valid = false; this._error = this._resolveError('missing-error') || 'Missing'; }
    else if (v !== '' && v != null) {
      if (this.getRegEx() && !new RegExp(this.getRegEx()).test(v)) { this._valid = false; this._error = this._resolveError('parse-error') || this._resolveError('value-error') || 'Invalid'; }
      else if (v.length > this.getMaxLength() || v.length < this.getMinLength()) { this._valid = false; this._error = this._resolveError('range-error') || this._resolveError('value-error') || 'Out of range'; }
      else if ((this.getType() === 'integer' || this.getType() === 'number') && (Number.isNaN(Number(v)) || (this.getMinValue() != null && Number(v) < this.getMinValue()) || (this.getMaxValue() != null && Number(v) > this.getMaxValue()))) { this._valid = false; this._error = this._resolveError('range-error') || this._resolveError('parse-error') || 'Out of range'; }
    }
    if (!this._valid && this._parent) this._parent._childInvalid();
    return this._valid;
  }
  getBinding() { return this._def.attrs.binding || null; }
  toString() { return this._htmlValue; }
}
function drain(it) { const out = []; while (it.hasNext()) out.push(it.next()); return out; }
function coerce(s, type, field) {
  if (s === null || s === undefined || s === '') return type === 'boolean' ? false : null;
  switch (type) {
    case 'integer': { const n = parseInt(s, 10); return Number.isNaN(n) ? null : n; }
    case 'number': { const n = parseFloat(s); return Number.isNaN(n) ? null : n; }
    case 'boolean': return s === true || s === 'true' || s === '1' || s === 'on' || s === 'yes';
    case 'date': { const d = new Date(s); return Number.isNaN(d.getTime()) ? null : d; }
    default: return String(s);
  }
}
FormField.FormFieldOption = FormFieldOption;
FormField.FormFieldOptions = FormFieldOptions;
FormField.coerce = coerce;
module.exports = bean(FormField);
