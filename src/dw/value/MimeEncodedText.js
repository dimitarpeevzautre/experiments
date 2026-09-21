'use strict';
const { bean } = require('../../util/bean');
class MimeEncodedText {
  constructor(text, mimeType, encoding) { this._t = text == null ? '' : String(text); this._m = mimeType || 'text/plain;charset=UTF-8'; this._e = encoding || 'UTF-8'; }
  getText() { return this._t; }
  getMimeType() { return this._m; }
  getEncoding() { return this._e; }
  toString() { return this._t; }
}
module.exports = bean(MimeEncodedText);
