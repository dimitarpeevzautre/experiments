'use strict';
const { bean } = require('../../util/bean');
class OutputStream { constructor() { this._chunks = []; } write(b) { this._chunks.push(Buffer.isBuffer(b) ? b : Buffer.from(String(b))); } close() {} toBuffer() { return Buffer.concat(this._chunks); } }
module.exports = bean(OutputStream);
