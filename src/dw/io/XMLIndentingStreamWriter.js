'use strict';
const XMLStreamWriter = require('./XMLStreamWriter');
class XMLIndentingStreamWriter extends XMLStreamWriter {
  constructor(w) { super(w); this._indent = true; }
  setIndent(s) { this._indentStr = s; } getIndent() { return this._indentStr || '  '; }
  setNewLine(nl) { this._newLine = nl; } getNewLine() { return this._newLine || '\n'; }
}
module.exports = XMLIndentingStreamWriter;
