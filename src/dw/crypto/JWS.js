'use strict';
const crypto = require('crypto');
const { bean } = require('../../util/bean');
const b64u = (b) => Buffer.from(b).toString('base64url');
class JWSHeader {
  constructor(obj = {}) { this._h = obj; }
  static parse(json) { return new JWSHeader(typeof json === 'string' ? JSON.parse(json) : json); }
  static parseEncoded(s) { return new JWSHeader(JSON.parse(Buffer.from(s, 'base64url').toString())); }
  getAlgorithm() { return this._h.alg; } getKeyID() { return this._h.kid; } toString() { return JSON.stringify(this._h); } toMap() { return this._h; }
}
bean(JWSHeader);
class JWS {
  constructor(header, payloadOrParsed) {
    if (typeof header === 'string' && payloadOrParsed === undefined) { const [h, p, s] = header.split('.'); this._h = JWSHeader.parseEncoded(h); this._p = Buffer.from(p, 'base64url'); this._sig = s; }
    else { this._h = header; this._p = Buffer.from(String(payloadOrParsed)); this._sig = null; }
  }
  static parse(s) { return new JWS(s); }
  getHeader() { return this._h; }
  getPayload() { return this._p.toString(); }
  getSignature() { return this._sig; }
  _signingInput() { return `${b64u(this._h.toString())}.${b64u(this._p)}`; }
  sign(keyRef) {
    const alg = this._h.getAlgorithm();
    if (/^HS/.test(alg)) this._sig = b64u(crypto.createHmac(`sha${alg.slice(2)}`, Buffer.from(String(keyRef), 'base64')).update(this._signingInput()).digest());
    else this._sig = b64u(crypto.sign(`RSA-SHA${alg.slice(2)}`, Buffer.from(this._signingInput()), keyRef._pem || keyRef));
    return this._sig;
  }
  verify(certOrKey) {
    const alg = this._h.getAlgorithm();
    try {
      if (/^HS/.test(alg)) return b64u(crypto.createHmac(`sha${alg.slice(2)}`, Buffer.from(String(certOrKey), 'base64')).update(this._signingInput()).digest()) === this._sig;
      const key = certOrKey._pem ? (certOrKey._pem.includes('CERTIFICATE') ? crypto.createPublicKey(certOrKey._pem) : certOrKey._pem) : certOrKey;
      return crypto.verify(`RSA-SHA${alg.slice(2)}`, Buffer.from(this._signingInput()), key, Buffer.from(this._sig, 'base64url'));
    } catch (e) { return false; }
  }
  serialize() { return `${this._signingInput()}.${this._sig || ''}`; }
}
JWS.JWSHeader = JWSHeader;
module.exports = bean(JWS);
