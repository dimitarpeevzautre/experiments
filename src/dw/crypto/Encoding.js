'use strict';
const Bytes = require('../util/Bytes');
const toBuf = (x) => (x instanceof Bytes ? x.toBuffer() : Buffer.isBuffer(x) ? x : Buffer.from(String(x), 'utf8'));
module.exports = {
  toBase64(b) { return toBuf(b).toString('base64'); },
  fromBase64(s) { return new Bytes(Buffer.from(String(s), 'base64')); },
  toHex(b) { return toBuf(b).toString('hex'); },
  fromHex(s) { return new Bytes(Buffer.from(String(s), 'hex')); },
  toURI(s, enc) { return encodeURIComponent(String(s)).replace(/%20/g, '+'); },
  fromURI(s) { return decodeURIComponent(String(s).replace(/\+/g, ' ')); },
  toXML(s) { return require('../../util/xml').encodeEntities(s); },
  fromXML(s) { return require('../../util/xml').decodeEntities(String(s)); },
  toURIComponent(s) { return encodeURIComponent(String(s)); },
};
