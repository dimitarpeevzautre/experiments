'use strict';
const { bean } = require('../../util/bean');
class InputStream { constructor(buf) { this._b = Buffer.isBuffer(buf) ? buf : Buffer.from(String(buf || '')); } close() {} toBuffer() { return this._b; } }
module.exports = bean(InputStream);
