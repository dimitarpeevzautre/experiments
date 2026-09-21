'use strict';
const path = require('path');
const rtRef = require('../../runtime');
const Page = require('./Page');
const Component = require('./Component');
const PageScriptContext = require('./PageScriptContext');
const ComponentScriptContext = require('./ComponentScriptContext');
const ComponentRenderSettings = require('./ComponentRenderSettings');
const HashMap = require('../util/HashMap');
/**
 * Page Designer pages from data/pages.json: { pageID: { typeID: 'storePage', regions: { main: { components: [{ id, typeID, data:{}, regions:{} }] } }, data:{} } }
 * Page/component types are cartridge scripts: cartridge/experience/pages/<type>.js & cartridge/experience/components/<type>.js exporting render(context).
 */
function findScript(rt, kind, typeID) {
  const rel = path.join('experience', kind, ...String(typeID).split('.')) + '.js';
  return rt.findInCartridges(rel);
}
function toHashMap(o) { const m = new HashMap(); for (const [k, v] of Object.entries(o || {})) m.put(k, v); return m; }
function attrsHtml(attrs) { return Object.entries(attrs || {}).map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`).join(''); }

const PageMgr = {
  getPage(id) { const rt = rtRef.current(); const d = rt.store.get('pages', {})[id]; if (!d) return null; d.ID = d.ID || id; return new Page(d); },
  getPageByCategory(category, visibleOnly, aspectTypeID) { const rt = rtRef.current(); const cid = category.getID ? category.getID() : category; const e = Object.entries(rt.store.get('pages', {})).find(([, d]) => d.category === cid && (!aspectTypeID || d.aspectTypeID === aspectTypeID)); return e ? PageMgr.getPage(e[0]) : null; },
  getPageByProduct(product, visibleOnly, aspectTypeID) { const rt = rtRef.current(); const pid = product.getID ? product.getID() : product; const e = Object.entries(rt.store.get('pages', {})).find(([, d]) => d.product === pid); return e ? PageMgr.getPage(e[0]) : null; },
  getPagesByCategory() { return null; },
  renderPage(pageID, parametersOrAspect, params) {
    const rt = rtRef.current();
    const page = PageMgr.getPage(pageID);
    if (!page) return '';
    const renderParams = typeof parametersOrAspect === 'string' && params === undefined ? parametersOrAspect : (params !== undefined ? params : parametersOrAspect);
    const script = findScript(rt, 'pages', page.getTypeID());
    if (!script) throw new Error(`Page type script not found for '${page.getTypeID()}' (experience/pages/...)`);
    const mod = rt.loader.load(script, rt.cartridgeOf(script));
    const ctx = new PageScriptContext(page, toHashMap(page._d.data || page._d.attributes), typeof renderParams === 'string' ? renderParams : JSON.stringify(renderParams || {}));
    PageMgr._stack = PageMgr._stack || []; PageMgr._stack.push(page);
    try { return String(typeof mod.render === 'function' ? mod.render(ctx) : ''); } finally { PageMgr._stack.pop(); }
  },
  renderRegion(region, settings) {
    const rt = rtRef.current();
    const tag = settings ? settings.getTagName() : 'div';
    const attrs = settings ? settings.getAttributes().toJSON() : { class: `experience-region experience-${region.getID()}` };
    let html = `<${tag}${attrsHtml(attrs)}>`;
    for (const c of region.getVisibleComponents().toArray()) {
      const cs = settings ? settings.getComponentRenderSettings(c) || settings.getDefaultComponentRenderSettings() : null;
      const cTag = cs ? cs.getTagName() : 'div';
      const cAttrs = cs ? cs.getAttributes().toJSON() : { class: `experience-component experience-${String(c.getTypeID()).replace(/\./g, '-')}` };
      const script = findScript(rt, 'components', c.getTypeID());
      let inner = '';
      if (script) { const mod = rt.loader.load(script, rt.cartridgeOf(script)); const ctx = new ComponentScriptContext(c, toHashMap(c._attrs), '{}', cs || new ComponentRenderSettings()); inner = String(typeof mod.render === 'function' ? mod.render(ctx) : ''); }
      else inner = `<!-- component type ${c.getTypeID()} has no script -->`;
      html += `<${cTag}${attrsHtml(cAttrs)}>${inner}</${cTag}>`;
    }
    return html + `</${tag}>`;
  },
  serializePage(pageID, params) { const rt = rtRef.current(); const d = rt.store.get('pages', {})[pageID]; return d ? JSON.stringify(d) : null; },
  getCustomEditor() { return null; },
};
module.exports = PageMgr;
