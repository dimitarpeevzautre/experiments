'use strict';
const { bean } = require('../../util/bean');

class FormElementValidationResult {
  constructor(valid = true, message = null, data = {}) { this._v = valid; this._m = message; this._d = data; }
  isValid() { return this._v; } getMessage() { return this._m; } getData() { return this._d; }
  addData(k, v) { this._d[k] = v; }
}
bean(FormElementValidationResult);

class FormElement {
  constructor(def, parent, id) {
    this._def = def; this._parent = parent || null; this._id = id || def.id;
    this._valid = true; this._error = null; this._dynamicHtmlName = null;
  }
  getFormId() { return this._id; }
  getParent() { return this._parent; }
  getHtmlName() { return (this._parent ? this._parent.getHtmlName() + '_' : 'dwfrm_') + this._id; }
  getDynamicHtmlName() { if (!this._dynamicHtmlName) this._dynamicHtmlName = `${this.getHtmlName()}_d0${Math.random().toString(36).slice(2, 12)}`; return this._dynamicHtmlName; }
  isValid() { return this._valid; }
  getValid() { return this._valid; }
  getError() { return this._error; }
  invalidateFormElement(error) { this._valid = false; this._error = error || this._resolveError('value-error') || this._resolveError('range-error') || 'Invalid'; if (this._parent) this._parent._childInvalid(); }
  invalidate() { this.invalidateFormElement(); }
  clearFormElement() { this._valid = true; this._error = null; }
  getFormType() { return this._def.attrs && this._def.attrs['form-type'] || null; }
  _resolveError(attr) {
    const key = this._def.attrs && this._def.attrs[attr];
    if (!key) return null;
    const Resource = require('./Resource');
    return Resource.msg(key, 'forms', key);
  }
  _root() { let p = this; while (p._parent) p = p._parent; return p; }
  toString() { return `[${this.constructor.name} ${this.getHtmlName()}]`; }
}
FormElement.FormElementValidationResult = FormElementValidationResult;
module.exports = bean(FormElement);
