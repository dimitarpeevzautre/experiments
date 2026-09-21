'use strict';
const crypto = require('crypto');
const { bean } = require('../../util/bean');
const Bytes = require('../util/Bytes');
const ALG = { SHA: 'sha1', 'SHA-1': 'sha1', SHA1: 'sha1', 'SHA-256': 'sha256', SHA256: 'sha256', 'SHA-384': 'sha384', 'SHA-512': 'sha512', SHA512: 'sha512', MD5: 'md5', MD2: 'md5' };
class MessageDigest {
  constructor(algorithm) { this._alg = ALG[algorithm] || String(algorithm).toLowerCase().replace('-', ''); this._h = null; }
  digest(a, b) {
    // digest(string) -> hex; digest(algorithm, bytes) legacy -> Bytes
    if (b !== undefined) return new Bytes(crypto.createHash(ALG[a] || a).update(b instanceof Bytes ? b.toBuffer() : String(b)).digest());
    if (a instanceof Bytes) return new Bytes(crypto.createHash(this._alg).update(a.toBuffer()).digest());
    if (a === undefined) { const h = this._h || crypto.createHash(this._alg); this._h = null; return new Bytes(h.digest()); }
    return crypto.createHash(this._alg).update(String(a), 'utf8').digest('hex');
  }
  digestBytes(bytes) { return new Bytes(crypto.createHash(this._alg).update(bytes.toBuffer()).digest()); }
  updateBytes(bytes) { this._h = this._h || crypto.createHash(this._alg); this._h.update(bytes.toBuffer()); }
}
Object.assign(MessageDigest, { DIGEST_SHA_1: 'SHA-1', DIGEST_SHA_256: 'SHA-256', DIGEST_SHA_384: 'SHA-384', DIGEST_SHA_512: 'SHA-512', DIGEST_MD5: 'MD5', DIGEST_MD2: 'MD2', DIGEST_SHA: 'SHA' });
module.exports = bean(MessageDigest);
