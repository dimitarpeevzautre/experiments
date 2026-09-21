'use strict';
const { bean } = require('../../util/bean');
const FormElement = require('./FormElement');
class FormAction extends FormElement {
  constructor(def, parent) { super(def, parent); this._submitted = false; this._triggered = false; this._object = null; }
  getLabel() { const Resource = require('./Resource'); const l = this._def.attrs.label; return l ? Resource.msg(l, 'forms', l) : null; }
  getDescription() { const Resource = require('./Resource'); const l = this._def.attrs.description; return l ? Resource.msg(l, 'forms', l) : null; }
  isSubmitted() { return this._submitted; }
  getSubmitted() { return this._submitted; }
  isTriggered() { return this._triggered; }
  getTriggered() { return this._triggered; }
  getObject() { return this._object || (this._parent ? this._parent.getObject() : null); }
  isValidForm() { return this._def.attrs['valid-form'] !== 'false'; }
  getX() { return 0; } getY() { return 0; }
  clearFormElement() { super.clearFormElement(); this._submitted = false; this._triggered = false; }
}
module.exports = bean(FormAction);
