'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
class CustomerList extends ExtensibleObject {
  constructor(id) { super({ ID: id, custom: {} }); }
  getID() { return this._data.ID; }
  getDescription() { return ''; }
}
module.exports = bean(CustomerList);
