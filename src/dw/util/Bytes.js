'use strict';
const { bean } = require('../../util/bean');
class Bytes {
  constructor(input, encoding) {
    if (Buffer.isBuffer(input)) this._b = input;
    else if (input instanceof Bytes) this._b = Buffer.from(input._b);
    else if (input == null) this._b = Buffer.alloc(0);
    else this._b = Buffer.from(String(input), normEnc(encoding));
  }
  static from(buf) { return new Bytes(buf); }
  getLength() { return this._b.length; }
  byteAt(i) { return this._b[i]; }
  bytesAt(i, len) { return new Bytes(this._b.subarray(i, i + len)); }
  reverse() { return new Bytes(Buffer.from(this._b).reverse()); }
  intValue() { return this._b.readInt32BE(0); }
  toString(encoding) { return this._b.toString(normEnc(encoding)); }
  toBuffer() { return this._b; }
  equals(o) { return o instanceof Bytes && o._b.equals(this._b); }
}
function normEnc(e) { if (!e) return 'utf8'; const s = String(e).toLowerCase().replace('-', ''); if (s === 'utf8') return 'utf8'; if (s === 'iso88591' || s === 'latin1') return 'latin1'; if (s === 'usascii' || s === 'ascii') return 'ascii'; if (s === 'utf16' || s === 'utf16le') return 'utf16le'; return s; }
Bytes.MAX_BYTES = 10 * 1024 * 1024;
module.exports = bean(Bytes);
