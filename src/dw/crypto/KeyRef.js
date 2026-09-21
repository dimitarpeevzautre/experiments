'use strict';
const { bean } = require('../../util/bean');
/** References a private key in data/keys.json: { alias: { privateKey: pem, certificate: pem } } */
class KeyRef {
  constructor(alias) { this._alias = alias; }
  _pemOf(field) { const rt = require('../../runtime').current(); const k = rt.store.get('keys', {})[this._alias]; if (!k || !k[field]) throw new Error(`Key '${this._alias}' (${field}) not found in data/keys.json`); return k[field]; }
  get _pem() { return this._pemOf('privateKey'); }
  toString() { return this._alias; }
}
module.exports = bean(KeyRef);
