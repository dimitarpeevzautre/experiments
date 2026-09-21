'use strict';
const { bean } = require('../../util/bean');
const crypto = require('crypto');

class PersistentObject {
  constructor(data = {}) {
    Object.defineProperty(this, '_data', { value: data, writable: true, enumerable: false });
    if (!data.UUID) data.UUID = PersistentObject.newUUID();
    if (!data.creationDate) data.creationDate = new Date().toISOString();
    if (!data.lastModified) data.lastModified = data.creationDate;
  }
  static newUUID() { return crypto.randomBytes(14).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 28).padEnd(28, 'a'); }
  getUUID() { return this._data.UUID; }
  getCreationDate() { return new Date(this._data.creationDate); }
  getLastModified() { return new Date(this._data.lastModified); }
  _markDirty() { this._data.lastModified = new Date().toISOString(); if (this._store) this._store.markDirty(this); }
  equals(o) { return o === this || (o instanceof PersistentObject && o.getUUID() === this.getUUID()); }
  hashCode() { return this.getUUID(); }
  toString() { return `[${this.constructor.name} ${this._data.ID || this._data.UUID}]`; }
  toJSON() { return this._data; }
}
module.exports = bean(PersistentObject);
