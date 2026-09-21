'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
class Reader {
  constructor(source) { this._s = source == null ? '' : String(source); this._i = 0; }
  read(n) { if (this._i >= this._s.length) return null; if (n === undefined) return this._s[this._i++]; const out = this._s.slice(this._i, this._i + n); this._i += n; return out; }
  readN(n) { return this.read(n); }
  readLine() { if (this._i >= this._s.length) return null; const nl = this._s.indexOf('\n', this._i); const line = nl === -1 ? this._s.slice(this._i) : this._s.slice(this._i, nl); this._i = nl === -1 ? this._s.length : nl + 1; return line.replace(/\r$/, ''); }
  readLines() { const out = []; let l; while ((l = this.readLine()) !== null) out.push(l); return new ArrayList(out); }
  readString() { const r = this._s.slice(this._i); this._i = this._s.length; return r; }
  readCharacters(n) { return this.read(n); }
  ready() { return this._i < this._s.length; }
  skip(n) { this._i += n; }
  close() {}
  getLines() { return this.readLines(); }
  getString() { return this.readString(); }
  toString() { return this._s; }
}
module.exports = bean(Reader);
