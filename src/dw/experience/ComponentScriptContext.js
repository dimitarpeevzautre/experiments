'use strict';
const { bean } = require('../../util/bean');
class ComponentScriptContext {
  constructor(component, content, renderParameters, renderSettings) { this._c = component; this._content = content; this._rp = renderParameters; this._rs = renderSettings; }
  getComponent() { return this._c; } getContent() { return this._content; } getRenderParameters() { return this._rp; } getComponentRenderSettings() { return this._rs; }
}
module.exports = bean(ComponentScriptContext);
