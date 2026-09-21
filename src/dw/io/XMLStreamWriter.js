'use strict';
const { bean } = require('../../util/bean');
const { encodeEntities } = require('../../util/xml');
class XMLStreamWriter {
  constructor(writer) { this._w = writer; this._stack = []; this._openTag = false; this._indent = false; this._hasChildren = []; }
  _closeStart() { if (this._openTag) { this._w.write('>'); this._openTag = false; } }
  _nl(depth) { if (this._indent) this._w.write('\n' + '  '.repeat(depth)); }
  writeStartDocument(encoding, version) { this._w.write(`<?xml version="${version || '1.0'}" encoding="${typeof encoding === 'string' && !/^\d/.test(encoding) ? encoding : 'UTF-8'}"?>`); if (this._indent) this._w.write('\n'); }
  writeEndDocument() { while (this._stack.length) this.writeEndElement(); }
  writeStartElement(a, b, c) { const name = c !== undefined ? `${a}:${b}` : (b !== undefined ? b : a); this._closeStart(); if (this._stack.length) { this._hasChildren[this._stack.length - 1] = true; this._nl(this._stack.length); } else if (this._indent && this._started) this._w.write('\n'); this._started = true; this._w.write(`<${name}`); this._openTag = true; this._stack.push(name); this._hasChildren.push(false); }
  writeEmptyElement(a, b, c) { const name = c !== undefined ? `${a}:${b}` : (b !== undefined ? b : a); this._closeStart(); if (this._stack.length) { this._hasChildren[this._stack.length - 1] = true; this._nl(this._stack.length); } this._w.write(`<${name}`); this._openTag = true; this._emptyPending = true; }
  writeAttribute(a, b, c, d) { const name = d !== undefined ? `${a}:${c}` : (c !== undefined ? `${a}:${b}` : a); const value = d !== undefined ? d : (c !== undefined ? c : b); this._w.write(` ${name}="${encodeEntities(value == null ? '' : value)}"`); }
  writeNamespace(prefix, uri) { this._w.write(prefix ? ` xmlns:${prefix}="${encodeEntities(uri)}"` : ` xmlns="${encodeEntities(uri)}"`); }
  writeDefaultNamespace(uri) { this._w.write(` xmlns="${encodeEntities(uri)}"`); }
  writeCharacters(text) { this._finishEmpty(); this._closeStart(); this._w.write(encodeEntities(text == null ? '' : text)); }
  writeCData(text) { this._finishEmpty(); this._closeStart(); this._w.write(`<![CDATA[${text == null ? '' : text}]]>`); }
  writeComment(text) { this._finishEmpty(); this._closeStart(); this._w.write(`<!--${text}-->`); }
  writeProcessingInstruction(target, data) { this._finishEmpty(); this._closeStart(); this._w.write(`<?${target}${data ? ' ' + data : ''}?>`); }
  writeRaw(text) { this._finishEmpty(); this._closeStart(); this._w.write(text); }
  writeDTD(dtd) { this._w.write(dtd); }
  writeEntityRef(name) { this._closeStart(); this._w.write(`&${name};`); }
  _finishEmpty() { if (this._emptyPending) { this._w.write('/>'); this._openTag = false; this._emptyPending = false; } }
  writeEndElement() {
    this._finishEmpty();
    const name = this._stack.pop(); const hadChildren = this._hasChildren.pop();
    if (this._openTag) { this._w.write('/>'); this._openTag = false; return; }
    if (hadChildren) this._nl(this._stack.length);
    this._w.write(`</${name}>`);
  }
  flush() { this._finishEmpty(); this._w.flush && this._w.flush(); }
  close() { this._finishEmpty(); this._w.close && this._w.close(); }
  setDefaultNamespace() {} setPrefix() {}
}
module.exports = bean(XMLStreamWriter);
