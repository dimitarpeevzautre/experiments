'use strict';
const { bean } = require('../../util/bean');
/** dw.util.Template – Velocity-like template rendering ($var, ${var.prop}, #if/#foreach basic). */
class Template {
  constructor(templateName, localeID) { this._name = templateName; this._locale = localeID || null; }
  setLocale(l) { this._locale = l; }
  render(map) {
    const rt = require('../../runtime').current();
    const MimeEncodedText = require('../value/MimeEncodedText');
    const file = rt.resolveTemplate(this._name, this._locale, ['.vs', '.vm', '.isml', '']);
    if (!file) throw new Error(`Template not found: ${this._name}`);
    const fs = require('fs');
    const src = fs.readFileSync(file, 'utf8');
    if (file.endsWith('.isml')) {
      return new MimeEncodedText(rt.isml.render(file, map ? Object.fromEntries(Object.entries(map.toJSON ? map.toJSON() : map)) : {}), 'text/html;charset=UTF-8', 'UTF-8');
    }
    return new MimeEncodedText(renderVelocity(src, map && map.toJSON ? map.toJSON() : (map || {})), 'text/plain;charset=UTF-8', 'UTF-8');
  }
}
function lookup(ctx, path) {
  return path.split('.').reduce((o, k) => {
    if (o == null) return o;
    if (typeof o.get === 'function' && !(k in o)) return o.get(k);
    const v = o[k];
    return typeof v === 'function' ? v.call(o) : v;
  }, ctx);
}
function renderVelocity(src, ctx) {
  // #foreach($x in $list) ... #end
  src = src.replace(/#foreach\s*\(\s*\$(\w+)\s+in\s+\$\{?([\w.]+)\}?\s*\)([\s\S]*?)#end/g, (m, v, listPath, body) => {
    let list = lookup(ctx, listPath);
    if (list && typeof list.toArray === 'function') list = list.toArray();
    return (list || []).map((item) => renderVelocity(body, { ...ctx, [v]: item })).join('');
  });
  src = src.replace(/#if\s*\(\s*\$\{?!?([\w.]+)\}?\s*\)([\s\S]*?)(?:#else([\s\S]*?))?#end/g, (m, cond, a, b) => {
    const neg = m.startsWith('#if($!') || m.startsWith('#if( $!');
    const v = lookup(ctx, cond);
    const truthy = !!v && !(typeof v === 'object' && typeof v.isEmpty === 'function' && v.isEmpty());
    return (neg ? !truthy : truthy) ? a : (b || '');
  });
  return src.replace(/\$!?\{?([A-Za-z_][\w.]*)\}?/g, (m, path) => { const v = lookup(ctx, path); return v == null ? (m.startsWith('$!') ? '' : m) : String(v); });
}
Template.renderVelocity = renderVelocity;
module.exports = bean(Template);
