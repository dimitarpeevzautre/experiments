'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
class CustomerGroup extends ExtensibleObject {
  constructor(data, rt) { super(data); this._rt = rt; this._collection = 'customer-groups'; this._store = rt.store; }
  getID() { return this._data.ID; }
  getDescription() { return this._data.description || ''; }
  isRuleBased() { return !!this._data.ruleBased; }
  assignCustomer(customer) { if (this.isRuleBased()) throw new Error('Cannot assign to rule-based group'); const groups = customer._data.customerGroups = customer._data.customerGroups || []; if (!groups.includes(this.getID())) { groups.push(this.getID()); customer._markDirty(); } }
  unassignCustomer(customer) { const groups = customer._data.customerGroups || []; const i = groups.indexOf(this.getID()); if (i !== -1) { groups.splice(i, 1); customer._markDirty(); } }
  toString() { return this.getID(); }
  equals(o) { return o instanceof CustomerGroup && o.getID() === this.getID(); }
}
module.exports = bean(CustomerGroup);
