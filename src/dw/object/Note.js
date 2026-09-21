'use strict';
const { bean } = require('../../util/bean');
class Note {
  constructor(data) { this._d = data; }
  getSubject() { return this._d.subject; }
  getText() { return this._d.text; }
  getCreatedBy() { return this._d.createdBy || 'system'; }
  getCreationDate() { return new Date(this._d.creationDate); }
}
module.exports = bean(Note);
