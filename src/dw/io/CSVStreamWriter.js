'use strict';
const { bean } = require('../../util/bean');
class CSVStreamWriter {
  constructor(writer, separator = ',', quote = '"') { this._w = writer; this._sep = separator; this._q = quote; }
  writeNext(fields) {
    const arr = Array.isArray(fields) ? fields : Array.from(fields);
    const line = arr.map((f) => { const s = f == null ? '' : String(f); return s.includes(this._sep) || s.includes(this._q) || /[\r\n]/.test(s) ? this._q + s.split(this._q).join(this._q + this._q) + this._q : s; }).join(this._sep);
    this._w.write(line + '\n');
  }
  close() { this._w.close(); }
}
module.exports = bean(CSVStreamWriter);
