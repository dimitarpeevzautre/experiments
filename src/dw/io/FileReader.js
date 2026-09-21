'use strict';
const fs = require('fs');
const Reader = require('./Reader');
const File = require('./File');
class FileReader extends Reader {
  constructor(file, encoding) { const p = file instanceof File ? file._p : String(file); super(fs.readFileSync(p, enc(encoding))); }
}
function enc(e) { if (!e) return 'utf8'; const s = String(e).toLowerCase().replace('-', ''); return s === 'iso88591' || s === 'latin1' ? 'latin1' : s === 'utf16' ? 'utf16le' : 'utf8'; }
module.exports = FileReader;
