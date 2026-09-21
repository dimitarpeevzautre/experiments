'use strict';
const fs = require('fs');
const path = require('path');
const { parse } = require('../util/xml');

/**
 * Loads form definitions (`cartridge/forms/<locale>/<name>.xml`) and turns them into a plain
 * definition tree consumed by dw.web.FormGroup.
 *   { type:'group', id, fields: [...], groups: [...], actions: [...], includes resolved }
 */
class FormDefinitions {
  constructor(rt) { this.rt = rt; this.cache = new Map(); }
  clearCache() { this.cache.clear(); }
  get(name, locale) {
    const key = `${name}|${locale || ''}`;
    if (this.cache.has(key)) return this.cache.get(key);
    let file = null;
    for (const loc of this.rt.localeFallback(locale)) {
      file = this.rt.findInCartridges(path.join('forms', loc, `${name}.xml`));
      if (file) break;
    }
    if (!file) { this.cache.set(key, null); return null; }
    const doc = parse(fs.readFileSync(file, 'utf8'));
    const root = doc.elements[0];
    const def = this._group(root, name, locale);
    def.file = file;
    this.cache.set(key, def);
    return def;
  }
  _group(node, id, locale) {
    const def = { type: 'group', id, attrs: node.attrs, children: [] };
    for (const el of node.elements) {
      switch (el.localName) {
        case 'field': def.children.push({ type: 'field', id: el.attr('formid'), attrs: el.attrs, options: el.childrenNamed('options').flatMap((o) => o.childrenNamed('option').map((op) => ({ optionid: op.attr('optionid'), value: op.attr('value'), label: op.attr('label'), default: op.attr('default') === 'true' }))) }); break;
        case 'group': def.children.push(this._group(el, el.attr('formid'), locale)); break;
        case 'list': { const g = this._group(el, el.attr('formid'), locale); g.type = 'list'; def.children.push(g); break; }
        case 'action': def.children.push({ type: 'action', id: el.attr('formid'), attrs: el.attrs }); break;
        case 'include': {
          const inc = this.get(el.attr('formid'), locale);
          if (inc) def.children.push(Object.assign({}, inc, { id: el.attr('formid'), attrs: Object.assign({}, inc.attrs, el.attrs) }));
          break;
        }
        default: break;
      }
    }
    return def;
  }
}
module.exports = { FormDefinitions };
