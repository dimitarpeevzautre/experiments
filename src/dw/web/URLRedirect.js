'use strict';
const { bean } = require('../../util/bean');
class URLRedirect { constructor(d) { this._d = typeof d === 'string' ? { location: d, status: 301 } : d; } getLocation() { return this._d.location; } getStatus() { return this._d.status || 301; } }
module.exports = bean(URLRedirect);
