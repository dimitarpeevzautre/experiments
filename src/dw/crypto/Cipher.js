'use strict';
const crypto = require('crypto');
const { bean } = require('../../util/bean');
const Bytes = require('../util/Bytes');
const Encoding = require('./Encoding');
/** Transformation strings like "AES/CBC/PKCS5Padding", "AES/GCM/NoPadding", "RSA/ECB/PKCS1Padding". Keys are base64. */
function nodeAlg(transformation, keyLen) {
  const [alg, mode] = String(transformation).split('/');
  const a = alg.toUpperCase();
  if (a === 'AES') return `aes-${keyLen * 8}-${(mode || 'CBC').toLowerCase()}`;
  if (a === 'DESEDE' || a === 'TRIPLEDES') return `des-ede3-${(mode || 'CBC').toLowerCase()}`;
  if (a === 'DES') return `des-${(mode || 'CBC').toLowerCase()}`;
  if (a === 'RSA') return 'RSA';
  throw new Error(`Unsupported cipher: ${transformation}`);
}
function keyBuf(k) { if (k instanceof Bytes) return k.toBuffer(); if (typeof k === 'object' && k && k._pem) return k; return Buffer.from(String(k), 'base64'); }
class Cipher {
  encrypt(message, key, transformation, salt, iterations) { return Encoding.toBase64(this.encryptBytes(new Bytes(String(message)), key, transformation, salt, iterations)); }
  decrypt(base64Msg, key, transformation, salt, iterations) { return this.decryptBytes(Encoding.fromBase64(base64Msg), key, transformation, salt, iterations).toString('UTF-8'); }
  encryptBytes(bytes, key, transformation, salt, iterations) {
    const k = keyBuf(key); const input = bytes.toBuffer();
    if (String(transformation).toUpperCase().startsWith('RSA')) return new Bytes(crypto.publicEncrypt({ key: k._pem || k, padding: crypto.constants.RSA_PKCS1_PADDING }, input));
    const alg = nodeAlg(transformation, k.length);
    const iv = salt ? Buffer.from(String(salt), 'base64') : Buffer.alloc(alg.includes('aes') ? 16 : 8);
    const c = crypto.createCipheriv(alg, k, alg.endsWith('ecb') ? null : (alg.includes('gcm') ? iv.subarray(0, 12) : iv));
    if (/nopadding/i.test(transformation) && !alg.includes('gcm')) c.setAutoPadding(false);
    const out = Buffer.concat([c.update(input), c.final()]);
    return new Bytes(alg.includes('gcm') ? Buffer.concat([out, c.getAuthTag()]) : out);
  }
  decryptBytes(bytes, key, transformation, salt, iterations) {
    const k = keyBuf(key); let input = bytes.toBuffer();
    if (String(transformation).toUpperCase().startsWith('RSA')) return new Bytes(crypto.privateDecrypt({ key: k._pem || k, padding: crypto.constants.RSA_PKCS1_PADDING }, input));
    const alg = nodeAlg(transformation, k.length);
    const iv = salt ? Buffer.from(String(salt), 'base64') : Buffer.alloc(alg.includes('aes') ? 16 : 8);
    const d = crypto.createDecipheriv(alg, k, alg.endsWith('ecb') ? null : (alg.includes('gcm') ? iv.subarray(0, 12) : iv));
    if (alg.includes('gcm')) { d.setAuthTag(input.subarray(input.length - 16)); input = input.subarray(0, input.length - 16); }
    if (/nopadding/i.test(transformation) && !alg.includes('gcm')) d.setAutoPadding(false);
    return new Bytes(Buffer.concat([d.update(input), d.final()]));
  }
  encrypt_3(...a) { return this.encrypt(...a); }
  decrypt_3(...a) { return this.decrypt(...a); }
}
Object.assign(Cipher, { CHAR_ENCODING: 'UTF-8' });
module.exports = bean(Cipher);
