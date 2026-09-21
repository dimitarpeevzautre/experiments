'use strict';
const { bean } = require('../../util/bean');
const FormElement = require('./FormElement');
const FormField = require('./FormField');
const FormAction = require('./FormAction');
const ArrayList = require('../util/ArrayList');

class FormGroup extends FormElement {
  constructor(def, parent, id) {
    super(def, parent, id);
    this._children = {};
    this._order = [];
    this._object = null;
    this._triggeredAction = null;
    this._submitted = false;
    for (const c of def.children || []) this._addChild(c);
    return new Proxy(this, {
      get(t, k) { if (typeof k === 'symbol' || k in t) return t[k]; if (Object.prototype.hasOwnProperty.call(t._children, k)) return t._children[k]; return undefined; },
      has(t, k) { return k in t || Object.prototype.hasOwnProperty.call(t._children, k); },
      ownKeys(t) { return Reflect.ownKeys(t).concat(t._order.filter((k) => !(k in t))); },
      getOwnPropertyDescriptor(t, k) { if (Object.prototype.hasOwnProperty.call(t._children, k)) return { enumerable: true, configurable: true, value: t._children[k] }; return Reflect.getOwnPropertyDescriptor(t, k); },
    });
  }
  _addChild(def) {
    let el;
    if (def.type === 'field') el = new FormField(def, this);
    else if (def.type === 'action') el = new FormAction(def, this);
    else if (def.type === 'list') { const FormList = require('./FormList'); el = new FormList(def, this); }
    else el = new FormGroup(def, this);
    this._children[def.id] = el;
    this._order.push(def.id);
    return el;
  }
  getChildCount() { return this._order.length; }
  getObject() { return this._object; }
  setObject(o) { this._object = o; }
  getTriggeredAction() { return this._triggeredAction; }
  isSubmitted() { return this._submitted; }
  getSubmitted() { return this._submitted; }
  getSecureKeyHtmlName() { return `${this.getHtmlName()}_securekey`; }
  getSecureKeyValue() { return 'local'; }
  _childInvalid() { this._valid = false; if (this._parent) this._parent._childInvalid(); }
  _each(fn) { for (const k of this._order) fn(this._children[k], k); }
  _fields() { const out = []; const walk = (g) => g._each((c) => { if (c instanceof FormField) out.push(c); else if (c instanceof FormGroup) walk(c); }); walk(this); return out; }
  _actions() { const out = []; const walk = (g) => g._each((c) => { if (c instanceof FormAction) out.push(c); else if (c instanceof FormGroup) walk(c); }); walk(this); return out; }
  clearFormElement() { super.clearFormElement(); this._object = null; this._triggeredAction = null; this._submitted = false; this._each((c) => c.clearFormElement()); }
  invalidateFormElement(error) { this._valid = false; this._error = error || null; if (this._parent) this._parent._childInvalid(); }
  /** Copy values from a business object into the fields using their `binding` attribute. */
  copyFrom(obj) {
    if (obj == null) return;
    this._object = obj;
    this._each((c) => {
      const binding = c._def.attrs.binding;
      if (c instanceof FormField) {
        if (binding) { const v = readBinding(obj, binding); if (v !== undefined) c.setValue(v); }
      } else if (c instanceof FormGroup) {
        c.copyFrom(binding ? readBinding(obj, binding) : obj);
      }
    });
  }
  /** Copy field values into a business object using bindings. */
  copyTo(obj) {
    if (obj == null) return;
    this._each((c) => {
      const binding = c._def.attrs.binding;
      if (c instanceof FormField) { if (binding) writeBinding(obj, binding, c.getValue()); }
      else if (c instanceof FormGroup) { c.copyTo(binding ? readBinding(obj, binding) : obj); }
    });
  }
  /** Populate from submitted parameters {htmlName: value}; returns triggered action. */
  _accept(params) {
    let triggered = null;
    for (const f of this._fields()) {
      const name = f.getHtmlName();
      if (Object.prototype.hasOwnProperty.call(params, name)) { f.setHtmlValue(Array.isArray(params[name]) ? params[name][0] : params[name]); f.validate(); }
      else if (f.getType() === 'boolean' && this._submittedGroup(params, f)) { f.setHtmlValue('false'); f.validate(); }
    }
    for (const a of this._actions()) {
      const name = a.getHtmlName();
      if (Object.prototype.hasOwnProperty.call(params, name) || Object.keys(params).some((k) => k === `${name}.x`)) {
        a._submitted = true; a._triggered = true; triggered = a;
        let g = a._parent; while (g) { g._triggeredAction = a; g._submitted = true; g = g._parent; }
      }
    }
    this._submitted = this._submitted || Object.keys(params).some((k) => k.startsWith(this.getHtmlName() + '_'));
    if (triggered && !triggered.isValidForm()) { this._valid = true; for (const f of this._fields()) f.clearFormElement(); }
    return triggered;
  }
  _submittedGroup(params, field) { const prefix = field._parent ? field._parent.getHtmlName() + '_' : 'dwfrm_'; return Object.keys(params).some((k) => k.startsWith(prefix)); }
  getFormElements() { return new ArrayList(this._order.map((k) => this._children[k])); }
}
function readBinding(obj, binding) {
  return String(binding).split('.').reduce((o, k) => {
    if (o == null) return undefined;
    if (typeof o.get === 'function' && !(k in o)) return o.get(k);
    const v = o[k];
    return v && typeof v === 'object' && typeof v.getValue === 'function' && !(v instanceof FormGroup) && !(v instanceof FormField) ? v.getValue() : v;
  }, obj);
}
function writeBinding(obj, binding, value) {
  const parts = String(binding).split('.');
  const last = parts.pop();
  const target = parts.reduce((o, k) => (o == null ? o : o[k]), obj);
  if (target == null) return;
  const setter = 'set' + last[0].toUpperCase() + last.slice(1);
  if (typeof target[setter] === 'function') target[setter](value);
  else target[last] = value;
}
module.exports = bean(FormGroup);
