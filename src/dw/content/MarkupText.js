'use strict';
const { bean } = require('../../util/bean');
class MarkupText {
  constructor(markup) { this._m = markup == null ? '' : String(markup); }
  getMarkup() { return this._m; }
  getSource() { return this._m; }
  toString() { return this._m; }
  toJSON() { return this._m; }
  valueOf() { return this._m; }
}
module.exports = bean(MarkupText);
