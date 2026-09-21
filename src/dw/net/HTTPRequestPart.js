'use strict';
const { bean } = require('../../util/bean');
class HTTPRequestPart {
  constructor(name, value, contentType, encoding, fileName) { this._n = name; this._v = value; this._ct = contentType || null; this._enc = encoding || 'UTF-8'; this._fn = fileName || null; }
  getName() { return this._n; } getStringValue() { return typeof this._v === 'string' ? this._v : null; } getFileValue() { return typeof this._v === 'object' ? this._v : null; }
  getContentType() { return this._ct; } getEncoding() { return this._enc; } getFileName() { return this._fn; } getBytesValue() { return this._v && this._v.toBuffer ? this._v : null; }
}
module.exports = bean(HTTPRequestPart);
