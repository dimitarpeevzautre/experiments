'use strict';
const fs = require('fs');
const { bean } = require('../../util/bean');
const Bytes = require('../util/Bytes');
class RandomAccessFileReader {
  constructor(file) { this._fd = fs.openSync(file._p, 'r'); this._pos = 0; this._len = fs.fstatSync(this._fd).size; }
  getPosition() { return this._pos; } setPosition(p) { this._pos = p; } length() { return this._len; }
  readBytes(n) { const b = Buffer.alloc(Math.min(n, this._len - this._pos)); fs.readSync(this._fd, b, 0, b.length, this._pos); this._pos += b.length; return new Bytes(b); }
  readByte() { return this.readBytes(1).byteAt(0); }
  close() { fs.closeSync(this._fd); }
}
module.exports = bean(RandomAccessFileReader);
