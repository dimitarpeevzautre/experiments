'use strict';
const { bean } = require('../../util/bean');
class CSVStreamReader {
  constructor(reader, separator = ',', quote = '"', skipLines = 0) {
    this._text = typeof reader === 'string' ? reader : reader.readString();
    this._sep = separator; this._q = quote; this._i = 0;
    for (let k = 0; k < skipLines; k++) this.readNext();
  }
  readNext() {
    if (this._i >= this._text.length) return null;
    const s = this._text; const row = []; let field = ''; let inQ = false; let i = this._i;
    for (; i < s.length; i++) {
      const c = s[i];
      if (inQ) { if (c === this._q) { if (s[i + 1] === this._q) { field += c; i++; } else inQ = false; } else field += c; }
      else if (c === this._q) inQ = true;
      else if (c === this._sep) { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; i++; break; }
      else field += c;
    }
    row.push(field);
    this._i = i;
    if (row.length === 1 && row[0] === '' && this._i >= s.length && s[s.length - 1] !== this._sep) return this._i > s.length ? null : (s.slice(0, s.length).trimEnd().length ? row : null);
    return row;
  }
  readAll() { const out = []; let r; while ((r = this.readNext()) !== null) out.push(r); return new (require('../util/ArrayList'))(out); }
  close() {}
}
module.exports = bean(CSVStreamReader);
