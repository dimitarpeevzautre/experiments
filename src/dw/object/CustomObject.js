'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('./ExtensibleObject');
class CustomObject extends ExtensibleObject {
  constructor(data, type, schema) { Object.defineProperty(data, '__type', { value: type, enumerable: false, writable: true }); super(data); this._type = type; this._schemaDef = schema || null; }
  _schema() { return null; }
  getType() { return this._type; }
  describe() {
    const ObjectTypeDefinition = require('./ObjectTypeDefinition');
    return new ObjectTypeDefinition(this._type, this._schemaDef || this._data.custom);
  }
}
module.exports = bean(CustomObject);
