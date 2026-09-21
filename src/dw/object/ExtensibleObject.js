'use strict';
const { bean } = require('../../util/bean');
const PersistentObject = require('./PersistentObject');
const { createCustomAttributes } = require('./CustomAttributes');

class ExtensibleObject extends PersistentObject {
  constructor(data = {}) {
    super(data);
    if (!data.custom || typeof data.custom !== 'object') data.custom = {};
    Object.defineProperty(this, '_custom', { value: createCustomAttributes(data.custom, this, this._schema()), writable: true, enumerable: false });
    // keep proxy target === data.custom so persistence sees changes
    data.custom = this._custom;
  }
  _schema() { return null; }
  getCustom() { return this._custom; }
  describe() {
    const ObjectTypeDefinition = require('./ObjectTypeDefinition');
    return new ObjectTypeDefinition(this.constructor.name, this._data.custom);
  }
}
module.exports = bean(ExtensibleObject);
