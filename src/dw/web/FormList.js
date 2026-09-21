'use strict';
const { bean } = require('../../util/bean');
const FormGroup = require('./FormGroup');
const FormListItem = require('./FormListItem');
const ArrayList = require('../util/ArrayList');
/** A repeating form group bound to a collection (e.g. addresses). Items are FormListItem groups. */
class FormList extends FormGroup {
  constructor(def, parent) {
    super({ type: 'group', id: def.id, attrs: def.attrs, children: [] }, parent);
    this._itemDef = def;
    this._items = [];
    this._selectMany = def.attrs['select-many'] === 'true';
  }
  copyFrom(collection) {
    this._items = [];
    const arr = collection == null ? [] : Array.isArray(collection) ? collection : typeof collection.toArray === 'function' ? collection.toArray() : Array.from(collection);
    arr.forEach((obj, i) => {
      const item = new FormListItem({ type: 'group', id: `i${i}`, attrs: {}, children: this._itemDef.children }, this, i);
      item.copyFrom(obj);
      this._items.push(item);
      this._children[`i${i}`] = item; if (!this._order.includes(`i${i}`)) this._order.push(`i${i}`);
    });
  }
  getChildCount() { return this._items.length; }
  getSelectedObject() { const s = this._items.find((i) => i.isSelected()); return s ? s.getObject() : null; }
  getSelectedObjects() { return new ArrayList(this._items.filter((i) => i.isSelected()).map((i) => i.getObject())); }
  getSelectManyItems() { return new ArrayList(this._items.filter((i) => i.isSelected())); }
  getSelectOneItem() { return this._items.find((i) => i.isSelected()) || null; }
  getSelectedObjectsCount() { return this._items.filter((i) => i.isSelected()).length; }
  isSelectMany() { return this._selectMany; }
  getItems() { return new ArrayList(this._items); }
}
module.exports = bean(FormList);
