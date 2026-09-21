'use strict';
const { bean } = require('../../util/bean');
class SourceCodeInfo { constructor(code, group, status) { this._c = code; this._g = group; this._s = status; } getCode() { return this._c; } getGroup() { return this._g; } getStatus() { return this._s; } getRedirect() { return null; } }
Object.assign(SourceCodeInfo, { STATUS_ACTIVE: 1, STATUS_INACTIVE: 2, STATUS_INVALID: 3 });
module.exports = bean(SourceCodeInfo);
