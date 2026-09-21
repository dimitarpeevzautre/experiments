'use strict';
const crypto = require('crypto');
const { bean } = require('../../util/bean');
const Bytes = require('../util/Bytes');
const ALG = { HmacSHA256: 'sha256', HmacSHA512: 'sha512', HmacSHA384: 'sha384', HmacSHA1: 'sha1', HmacMD5: 'md5' };
class Mac {
  constructor(algorithm) { this._alg = ALG[algorithm] || String(algorithm).replace(/^Hmac/i, '').toLowerCase(); }
  digest(input, key) { const k = key instanceof Bytes ? key.toBuffer() : String(key); const i = input instanceof Bytes ? input.toBuffer() : String(input); return new Bytes(crypto.createHmac(this._alg, k).update(i).digest()); }
}
Object.assign(Mac, { HMAC_SHA_256: 'HmacSHA256', HMAC_SHA_384: 'HmacSHA384', HMAC_SHA_512: 'HmacSHA512', HMAC_SHA_1: 'HmacSHA1', HMAC_MD5: 'HmacMD5' });
module.exports = bean(Mac);
