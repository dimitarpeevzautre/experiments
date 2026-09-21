'use strict';
const { bean } = require('../../util/bean');
class URLParameter { constructor(name, value, encode = true) { this._n = name; this._v = value; this._e = encode; } getName() { return this._n; } getValue() { return this._v; } isEncode() { return this._e; } }
module.exports = bean(URLParameter);
