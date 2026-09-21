'use strict';
const fs = require('fs');
const path = require('path');
const Writer = require('./Writer');
const File = require('./File');
class FileWriter extends Writer {
  constructor(file, encodingOrAppend, append) {
    super();
    this._p = file instanceof File ? file._p : String(file);
    this._append = typeof encodingOrAppend === 'boolean' ? encodingOrAppend : !!append;
    this._enc = typeof encodingOrAppend === 'string' ? encodingOrAppend : 'utf8';
    fs.mkdirSync(path.dirname(this._p), { recursive: true });
    if (!this._append) fs.writeFileSync(this._p, '');
    this._fd = fs.openSync(this._p, 'a');
  }
  write(s, off, len) { if (s == null) return; let str = String(s); if (off !== undefined) str = str.substr(off, len); fs.writeSync(this._fd, str); }
  flush() {}
  close() { if (this._fd !== null) { fs.closeSync(this._fd); this._fd = null; } }
}
module.exports = FileWriter;
