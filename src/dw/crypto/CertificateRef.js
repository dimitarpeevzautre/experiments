'use strict';
const { bean } = require('../../util/bean');
class CertificateRef {
  constructor(alias) { this._alias = alias; }
  get _pem() { const rt = require('../../runtime').current(); const k = rt.store.get('keys', {})[this._alias]; if (!k || !(k.certificate || k.publicKey)) throw new Error(`Certificate '${this._alias}' not found in data/keys.json`); return k.certificate || k.publicKey; }
  toString() { return this._alias; }
}
module.exports = bean(CertificateRef);
