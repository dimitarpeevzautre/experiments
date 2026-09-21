'use strict';
const crypto = require('crypto');
const { bean } = require('../../util/bean');
const Bytes = require('../util/Bytes');
const ALG = { SHA256withRSA: 'RSA-SHA256', SHA1withRSA: 'RSA-SHA1', SHA512withRSA: 'RSA-SHA512', SHA384withRSA: 'RSA-SHA384' };
const pem = (k) => (k && k._pem ? k._pem : Buffer.isBuffer(k) ? k : String(k).includes('-----') ? String(k) : `-----BEGIN PRIVATE KEY-----\n${String(k)}\n-----END PRIVATE KEY-----`);
class Signature {
  sign(contentToSign, privateKey, algorithm) { return crypto.sign(ALG[algorithm] || algorithm, Buffer.from(String(contentToSign), 'base64'), pem(privateKey)).toString('base64'); }
  signBytes(bytes, privateKey, algorithm) { return new Bytes(crypto.sign(ALG[algorithm] || algorithm, bytes.toBuffer(), pem(privateKey))); }
  verifySignature(signature, content, publicKey, algorithm) { try { return crypto.verify(ALG[algorithm] || algorithm, Buffer.from(String(content), 'base64'), pubPem(publicKey), Buffer.from(String(signature), 'base64')); } catch (e) { return false; } }
  verifyBytesSignature(signature, content, publicKey, algorithm) { try { return crypto.verify(ALG[algorithm] || algorithm, content.toBuffer(), pubPem(publicKey), signature.toBuffer()); } catch (e) { return false; } }
  isDigestAlgorithmSupported(a) { return !!ALG[a]; }
}
function pubPem(k) { if (k && k._pem) { const p = k._pem; return p.includes('CERTIFICATE') ? crypto.createPublicKey(p) : p; } const s = String(k); return s.includes('-----') ? s : `-----BEGIN PUBLIC KEY-----\n${s}\n-----END PUBLIC KEY-----`; }
module.exports = bean(Signature);
