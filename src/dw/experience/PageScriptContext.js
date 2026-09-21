'use strict';
const { bean } = require('../../util/bean');
class PageScriptContext {
  constructor(page, content, renderParameters) { this._p = page; this._content = content; this._rp = renderParameters; }
  getPage() { return this._p; } getContent() { return this._content; } getRenderParameters() { return this._rp; }
}
module.exports = bean(PageScriptContext);
