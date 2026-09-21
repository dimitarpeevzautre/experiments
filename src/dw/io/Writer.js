'use strict';
const { bean } = require('../../util/bean');
class Writer {
  constructor(target) { this._chunks = []; this._target = target || null; }
  write(s, off, len) { if (s == null) return; let str = String(s); if (off !== undefined) str = str.substr(off, len); this._chunks.push(str); if (this._target && typeof this._target.write === 'function') this._target.write(str); }
  writeLine(s) { this.write(s); this.write('\n'); }
  flush() {}
  close() { this._closed = true; }
  toString() { return this._chunks.join(''); }
}
module.exports = bean(Writer);
