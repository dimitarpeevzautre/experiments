'use strict';
const { bean } = require('../../util/bean');
const FormGroup = require('./FormGroup');
class FormListItem extends FormGroup {
  constructor(def, parent, index) { super(def, parent); this._index = index; this._selected = false; }
  getItemIndex() { return this._index; }
  isSelected() { return this._selected; }
  getSelected() { return this._selected; }
  setSelected(b) { this._selected = !!b; }
}
module.exports = bean(FormListItem);
