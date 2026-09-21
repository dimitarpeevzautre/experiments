'use strict';
const { bean } = require('../../util/bean');
class SearchStatus { constructor(status = 0, desc = '') { this._s = status; this._d = desc; } getStatus() { return this._s; } getDescription() { return this._d; } }
Object.assign(SearchStatus, { SUCCESSFUL: 0, EMPTY_QUERY: 1, LIMITED: 2, NO_CATALOG: 3, NO_CATEGORY: 4, NO_INDEX: 5, NOT_EXECUTED: 6, OFFLINE_CATEGORY: 7, ERROR: 8 });
module.exports = bean(SearchStatus);
