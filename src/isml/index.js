'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/**
 * ISML template engine. Templates are parsed into a node tree and compiled into JavaScript
 * functions. Supported tags: isset, isif/iselseif/iselse, isloop (+isbreak/iscontinue/isnext),
 * isprint, isinclude (template & url), isdecorate/isreplace, isscript, iscontent, iscomment,
 * iscache, isredirect, isstatus, iscookie, isslot, isactivedatahead/isactivedatacontext,
 * isobject, isbreak, iscontinue, ismodule (custom tags), isselect/isinputfield (ignored), and
 * `${expr}` expressions evaluated with pdict, out, request, session, dw, Resource, URLUtils...
 */
class Isml {
  constructor(rt) { this.rt = rt; this.cache = new Map(); this.modules = new Map(); }
  clearCache() { this.cache.clear(); }

  renderTemplate(name, pdict = {}, locale) {
    const file = this.rt.resolveTemplate(name, locale);
    if (!file) throw new Error(`ISML template not found: ${name}`);
    return this.render(file, pdict);
  }
  render(file, pdict = {}, extra = {}) {
    const fn = this.compileFile(file);
    const ctx = this._context(pdict, extra, file);
    fn(ctx);
    return ctx.__out.join('');
  }
  /** Render but return {output, response-side effects} */
  renderInto(file, pdict, extra) { return this.render(file, pdict, extra); }

  _context(pdict, extra, file) {
    const rt = this.rt;
    const p = pdict && pdict.toJSON && !(pdict instanceof Object.getPrototypeOf(Object)) ? pdict : pdict;
    const ctx = Object.assign(Object.create(null), {
      __out: [],
      __rt: rt,
      __isml: this,
      __file: file,
      __decorator: null,
      __replaceContent: '',
      pdict: p,
      request: rt.context.request,
      response: rt.context.response,
      session: rt.context.session,
      customer: rt.context.customer,
      dw: rt.dw.namespace,
      require: rt.require.bind(rt),
      empty: globalThis.empty,
      encodeURIComponent, decodeURIComponent, encodeURI, decodeURI, JSON, Math, Date, String, Number, Boolean, Array, Object, RegExp, parseInt, parseFloat, isNaN, isFinite, console,
    }, extra || {});
    // commonly used without require in templates
    Object.defineProperty(ctx, 'Resource', { get: () => rt.dw.get('web/Resource') });
    Object.defineProperty(ctx, 'URLUtils', { get: () => rt.dw.get('web/URLUtils') });
    Object.defineProperty(ctx, 'StringUtils', { get: () => rt.dw.get('util/StringUtils') });
    Object.defineProperty(ctx, 'out', { get: () => ({ print: (...a) => ctx.__out.push(a.map(String).join('')), println: (...a) => ctx.__out.push(a.map(String).join('') + '\n') }) });
    return ctx;
  }

  compileFile(file) {
    const stat = fs.statSync(file);
    const c = this.cache.get(file);
    if (c && c.mtime === stat.mtimeMs) return c.fn;
    const src = fs.readFileSync(file, 'utf8');
    const fn = this.compile(src, file);
    this.cache.set(file, { fn, mtime: stat.mtimeMs });
    return fn;
  }

  compile(src, file = '<isml>') {
    const nodes = parse(src, file);
    const gen = new CodeGen(file);
    const body = gen.emit(nodes);
    const code = `with (__ctx) {\n${body}\n}`;
    let fn;
    try { fn = vm.compileFunction(code, ['__ctx'], { filename: file + '.js' }); }
    catch (e) { throw new Error(`Failed to compile ISML ${file}: ${e.message}\n${body.split('\n').slice(0, 30).join('\n')}`); }
    return fn;
  }
}

// ---------------------------------------------------------------- parser
/** Find the next ISML tag from `from`; returns { index, end, close, name, attrStr, selfClose } or null. Quote-aware. */
function nextTag(src, from) {
  const re = /<(\/?)(is[a-z]+)\b/gi;
  re.lastIndex = from;
  const m = re.exec(src);
  if (!m) return null;
  let i = m.index + m[0].length; let q = null; let depth = 0;
  while (i < src.length) {
    const c = src[i];
    if (q) { if (c === q && depth === 0) q = null; else if (c === '$' && src[i + 1] === '{') { depth++; i++; } else if (c === '}' && depth > 0) depth--; }
    else if (c === '"' || c === "'") q = c;
    else if (c === '>') break;
    i++;
  }
  const inner = src.slice(m.index + m[0].length, i);
  const selfClose = /\/\s*$/.test(inner);
  return { index: m.index, end: i + 1, close: m[1] === '/', name: m[2].toLowerCase(), attrStr: selfClose ? inner.replace(/\/\s*$/, '') : inner, selfClose };
}
function parseAttrs(s) {
  const attrs = {};
  let i = 0; const n = s.length;
  while (i < n) {
    while (i < n && /\s/.test(s[i])) i++;
    if (i >= n) break;
    let j = i; while (j < n && !/[\s=]/.test(s[j])) j++;
    const name = s.slice(i, j).toLowerCase();
    i = j; while (i < n && /\s/.test(s[i])) i++;
    if (s[i] !== '=') { if (name) attrs[name] = true; continue; }
    i++; while (i < n && /\s/.test(s[i])) i++;
    const q = s[i];
    if (q === '"' || q === "'") {
      i++; let start = i; let depth = 0;
      while (i < n) { const c = s[i]; if (c === q && depth === 0) break; if (c === '$' && s[i + 1] === '{') { depth++; i++; } else if (c === '}' && depth > 0) depth--; i++; }
      attrs[name] = s.slice(start, i); i++;
    } else { let start = i; while (i < n && !/\s/.test(s[i])) i++; attrs[name] = s.slice(start, i); }
  }
  return attrs;
}
function parse(src, file) {
  const root = { type: 'root', children: [] };
  const stack = [root];
  let pos = 0;
  const top = () => stack[stack.length - 1];
  let t;
  while ((t = nextTag(src, pos))) {
    const { name, close, selfClose } = t;
    if (t.index > pos) top().children.push({ type: 'text', value: src.slice(pos, t.index) });
    pos = t.end;
    if (name === 'iscomment' && !close) {
      const end = src.toLowerCase().indexOf('</iscomment>', pos);
      pos = end === -1 ? src.length : end + '</iscomment>'.length;
      continue;
    }
    if (name === 'isscript' && !close) {
      const end = src.toLowerCase().indexOf('</isscript>', pos);
      top().children.push({ type: 'isscript', code: src.slice(pos, end === -1 ? src.length : end) });
      pos = end === -1 ? src.length : end + '</isscript>'.length;
      continue;
    }
    if (close) {
      let i = stack.length - 1;
      while (i > 0 && stack[i].type !== name) i--;
      if (i > 0) stack.length = i;
      continue;
    }
    const node = { type: name, attrs: parseAttrs(t.attrStr), children: [], file };
    if (name === 'iselseif' || name === 'iselse') {
      let j = stack.length - 1; while (j > 0 && stack[j].type !== 'isif') j--;
      if (j > 0) { const isif = stack[j]; stack.length = j + 1; (isif.branches = isif.branches || []).push(node); stack.push(node); }
      continue;
    }
    top().children.push(node);
    if (BLOCK_TAGS.has(name) && !selfClose) stack.push(node);
  }
  if (pos < src.length) root.children.push({ type: 'text', value: src.slice(pos) });
  return root.children;
}
const BLOCK_TAGS = new Set(['isif', 'isloop', 'isdecorate', 'isreplace', 'isobject', 'isactivedatacontext', 'isbonusdiscountlineitem', 'isreportcontrol']);

// ---------------------------------------------------------------- codegen
class CodeGen {
  constructor(file) { this.file = file; this.n = 0; this.customTags = {}; }
  uid(p) { return `__${p}${++this.n}`; }
  /** Convert an attribute value with ${} expressions into a JS expression string. */
  attrExpr(v) {
    if (v === true || v === undefined) return 'true';
    const s = String(v);
    if (/^\$\{[\s\S]*\}$/.test(s) && s.indexOf('${', 2) === -1) return `(${s.slice(2, -1)})`;
    if (!s.includes('${')) return JSON.stringify(s);
    // mixed literal & expressions -> string concat
    const parts = []; let last = 0; let i;
    while ((i = s.indexOf('${', last)) !== -1) {
      if (i > last) parts.push(JSON.stringify(s.slice(last, i)));
      const end = matchBrace(s, i + 2);
      parts.push(`__str(${s.slice(i + 2, end)})`);
      last = end + 1;
    }
    if (last < s.length) parts.push(JSON.stringify(s.slice(last)));
    return parts.join(' + ') || '""';
  }
  emit(nodes) {
    const out = [];
    out.push('const __str = (v) => (v === null || v === undefined ? "" : String(v));');
    out.push('const __print = (v) => __out.push(__str(v));');
    out.push('const __enc = (v) => __str(v).replace(/[&<>"\']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\\"": "&quot;", "\'": "&#39;" }[c]));');
    out.push('const __iter = (v) => { if (v == null) return []; if (Array.isArray(v)) return v; if (typeof v[Symbol.iterator] === "function" && typeof v !== "string") return Array.from(v); if (typeof v.iterator === "function") { const a = []; const it = v.iterator(); while (it.hasNext()) a.push(it.next()); return a; } if (typeof v.hasNext === "function") { const a = []; while (v.hasNext()) a.push(v.next()); return a; } if (typeof v === "object") return Object.values(v); return [v]; };');
    out.push('const __fmt = (v, style, formatter) => __isml.format(v, style, formatter);');
    out.push('let __contentType = null;');
    out.push('var __pdictOverlay = pdict;');
    out.push(this.block(nodes));
    out.push('if (__decorator) { __isml.decorate(__ctx, __decorator); }');
    return out.join('\n');
  }
  block(nodes) { return nodes.map((n) => this.node(n)).join('\n'); }
  text(value) {
    if (!value) return '';
    // handle ${} expressions inside text
    const parts = []; let last = 0; let i;
    while ((i = value.indexOf('${', last)) !== -1) {
      if (i > last) parts.push(`__out.push(${JSON.stringify(value.slice(last, i))});`);
      const end = matchBrace(value, i + 2);
      if (end === -1) { parts.push(`__out.push(${JSON.stringify(value.slice(i))});`); last = value.length; break; }
      parts.push(`__print(__enc(${value.slice(i + 2, end)}));`);
      last = end + 1;
    }
    if (last < value.length) parts.push(`__out.push(${JSON.stringify(value.slice(last))});`);
    return parts.join('\n');
  }
  node(n) {
    const a = n.attrs || {};
    switch (n.type) {
      case 'text': return this.text(n.value);
      case 'isscript': return `{\n${n.code}\n}`;
      case 'isset': {
        const scope = (a.scope || 'page').toLowerCase();
        const val = this.attrExpr(a.value);
        if (scope === 'session') return `session.custom[${JSON.stringify(a.name)}] = ${val};`;
        if (scope === 'request') return `request.custom[${JSON.stringify(a.name)}] = ${val};`;
        if (scope === 'pdict') return `pdict[${JSON.stringify(a.name)}] = ${val};`;
        return `pdict[${JSON.stringify(a.name)}] = ${val}; __ctx[${JSON.stringify(a.name)}] = pdict[${JSON.stringify(a.name)}];`;
      }
      case 'isif': {
        let code = `if (${this.attrExpr(a.condition)}) {\n${this.block(n.children)}\n}`;
        for (const b of n.branches || []) {
          if (b.type === 'iselseif') code += ` else if (${this.attrExpr(b.attrs.condition)}) {\n${this.block(b.children)}\n}`;
          else code += ` else {\n${this.block(b.children)}\n}`;
        }
        return code;
      }
      case 'isloop': {
        const items = this.attrExpr(a.items || a.iterator);
        const v = a.var || a.alias || this.uid('item');
        const status = a.status;
        const begin = a.begin !== undefined ? this.attrExpr(a.begin) : '0';
        const end = a.end !== undefined ? this.attrExpr(a.end) : 'null';
        const step = a.step !== undefined ? this.attrExpr(a.step) : '1';
        const arr = this.uid('arr'); const i = this.uid('i');
        return `{ const ${arr} = __iter(${items}); const __end = ${end}; const __begin = ${begin}; const __step = Math.max(1, ${step});
  for (let ${i} = __begin; ${i} < ${arr}.length && (__end === null || ${i} <= __end); ${i} += __step) {
    __ctx[${JSON.stringify(v)}] = pdict[${JSON.stringify(v)}] = ${arr}[${i}];
    ${status ? `__ctx[${JSON.stringify(status)}] = pdict[${JSON.stringify(status)}] = { count: (${i} - __begin) / __step + 1, index: ${i}, first: ${i} === __begin, last: ${i} + __step >= ${arr}.length || (__end !== null && ${i} + __step > __end), odd: (((${i} - __begin) / __step) % 2) === 0, even: (((${i} - __begin) / __step) % 2) === 1, length: ${arr}.length };` : ''}
    ${this.block(n.children)}
  } }`;
      }
      case 'isbreak': return 'break;';
      case 'iscontinue': case 'isnext': return 'continue;';
      case 'isprint': {
        const val = this.attrExpr(a.value);
        const enc = a.encoding && String(a.encoding).toLowerCase() === 'off' ? false : true;
        const style = a.style ? this.attrExpr(a.style) : 'null';
        const formatter = a.formatter ? this.attrExpr(a.formatter) : 'null';
        const tz = a.timezone ? this.attrExpr(a.timezone) : 'null';
        const expr = `__fmt(${val}, ${style}, ${formatter}, ${tz})`;
        return `__print(${enc ? `__enc(${expr})` : expr});`;
      }
      case 'isinclude': {
        if (a.template) return `__out.push(__isml.include(__ctx, ${this.attrExpr(a.template)}, ${JSON.stringify(n.file)}));`;
        if (a.url) return `__out.push(__isml.remoteInclude(__ctx, ${this.attrExpr(a.url)}));`;
        if (a.sf_toolkit) return '';
        return '';
      }
      case 'isdecorate': return `__decorator = ${this.attrExpr(a.template)};\n${this.block(n.children)}`;
      case 'isreplace': return '__out.push(__replaceContent);';
      case 'iscontent': {
        const parts = [];
        if (a.type) parts.push(`__isml.setContentType(__ctx, ${this.attrExpr(a.type)}, ${a.charset ? this.attrExpr(a.charset) : 'null'});`);
        if (a.compact) parts.push('__ctx.__compact = true;');
        return parts.join('\n');
      }
      case 'iscache': return '';
      case 'isredirect': return `response.redirect(${this.attrExpr(a.location)}${a.permanent && this.attrExpr(a.permanent) !== '"false"' ? ', 301' : ''});`;
      case 'isstatus': return `response.setStatus(Number(${this.attrExpr(a.value)}));`;
      case 'iscookie': return `{ const __c = new dw.web.Cookie(${this.attrExpr(a.name)}, ${this.attrExpr(a.value)}); ${a.maxage !== undefined ? `__c.setMaxAge(Number(${this.attrExpr(a.maxage)}));` : ''} ${a.path ? `__c.setPath(${this.attrExpr(a.path)});` : ''} ${a.domain ? `__c.setDomain(${this.attrExpr(a.domain)});` : ''} ${a.secure ? `__c.setSecure(${this.attrExpr(a.secure)});` : ''} response.addHttpCookie(__c); }`;
      case 'isslot': return `__out.push(__isml.slot(__ctx, ${JSON.stringify(a)}));`;
      case 'isobject': return `${this.block(n.children)}`;
      case 'isactivedatahead': case 'isactivedatacontext': return this.block(n.children || []);
      case 'ismodule': {
        this.customTags[(a.name || '').toLowerCase()] = a;
        return `__isml.registerModule(${JSON.stringify(n.file)}, ${JSON.stringify(a)});`;
      }
      case 'isselect': case 'isinputfield': return `__out.push(__isml.inputField(__ctx, ${JSON.stringify(a)}, ${this.attrExprMap(a)}));`;
      case 'isbonusdiscountlineitem': case 'isreportcontrol': return this.block(n.children || []);
      default: {
        // custom tag defined via <ismodule name="...">
        return `__out.push(__isml.customTag(__ctx, ${JSON.stringify(n.type)}, ${this.attrExprMap(a)}, ${JSON.stringify(n.file)}));`;
      }
    }
  }
  attrExprMap(a) {
    return `{ ${Object.entries(a).map(([k, v]) => `${JSON.stringify(k)}: ${this.attrExpr(v)}`).join(', ')} }`;
  }
}
function matchBrace(s, from) {
  let depth = 1; let i = from; let q = null;
  while (i < s.length) {
    const c = s[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; }
    else if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i; }
    i++;
  }
  return -1;
}

// ---------------------------------------------------------------- runtime helpers on Isml
Object.assign(Isml.prototype, {
  include(ctx, template, fromFile) {
    const file = this.rt.resolveTemplate(template);
    if (!file) throw new Error(`Included template not found: ${template} (from ${fromFile})`);
    const fn = this.compileFile(file);
    const sub = this._context(ctx.pdict, {}, file);
    // page-scope variables are shared with includes
    for (const k of Object.keys(ctx)) if (!(k in sub) && !k.startsWith('__')) sub[k] = ctx[k];
    fn(sub);
    if (sub.__contentType) this.setContentType(ctx, sub.__contentType);
    return sub.__out.join('');
  },
  decorate(ctx, template) {
    const content = ctx.__out.join('');
    ctx.__out.length = 0;
    const file = this.rt.resolveTemplate(template);
    if (!file) throw new Error(`Decorator template not found: ${template}`);
    const fn = this.compileFile(file);
    const sub = this._context(ctx.pdict, { __replaceContent: content }, file);
    for (const k of Object.keys(ctx)) if (!(k in sub) && !k.startsWith('__')) sub[k] = ctx[k];
    fn(sub);
    ctx.__out.push(sub.__out.join(''));
  },
  remoteInclude(ctx, url) {
    const { renderInclude } = require('../http/dispatcher');
    return renderInclude(this.rt, String(url));
  },
  setContentType(ctx, type, charset) {
    ctx.__contentType = type;
    const resp = this.rt.context.response;
    if (resp) resp.setContentType(charset ? `${type};charset=${charset}` : (type.includes('charset') ? type : `${type};charset=UTF-8`));
  },
  format(v, style, formatter, timezone) {
    if (v === null || v === undefined) return '';
    const Money = this.rt.dw.get('value/Money');
    const Quantity = this.rt.dw.get('value/Quantity');
    const Calendar = this.rt.dw.get('util/Calendar');
    const StringUtils = this.rt.dw.get('util/StringUtils');
    if (v instanceof Money) return formatter ? StringUtils.formatNumber(v.getValue(), formatter) : v.toFormattedString();
    if (v instanceof Quantity) return String(v.getValue());
    if (v instanceof Date || v instanceof Calendar) {
      const d = v instanceof Calendar ? v.getTime() : v;
      const tz = timezone || (v instanceof Calendar ? v.getTimeZone() : this.rt.dw.get('system/Site').getCurrent().getTimezone());
      if (formatter) return Calendar.format(d, formatter, tz);
      switch (style) {
        case 'DATE_SHORT': return Calendar.format(d, 'M/d/yy', tz);
        case 'DATE_LONG': return Calendar.format(d, 'MMMM d, yyyy', tz);
        case 'DATE_TIME': return Calendar.format(d, 'M/d/yy h:mm a', tz);
        default: return Calendar.format(d, 'MMM d, yyyy', tz);
      }
    }
    if (typeof v === 'number') {
      if (formatter) return StringUtils.formatNumber(v, formatter);
      if (style === 'INTEGER') return StringUtils.formatInteger(v);
      if (style === 'DECIMAL') return StringUtils.formatNumber(v, '#,##0.00');
      if (style === 'MONEY_SHORT' || style === 'MONEY_LONG') return new Money(v, this.rt.context.session.getCurrency().getCurrencyCode()).toFormattedString();
      return String(v);
    }
    if (typeof v === 'object' && typeof v.getMarkup === 'function') return v.getMarkup();
    return String(v);
  },
  slot(ctx, attrs) {
    const SlotMgr = this.rt.dw.get('campaign/SlotMgr');
    try { return SlotMgr && typeof SlotMgr.render === 'function' ? SlotMgr.render(attrs, ctx.pdict) : ''; } catch (e) { return `<!-- slot ${attrs.id}: ${e.message} -->`; }
  },
  inputField(ctx, attrs, values) {
    const f = values.formfield;
    if (!f) return '';
    const type = (values.type || 'input').toLowerCase();
    const name = f.getHtmlName();
    const val = f.getHtmlValue ? f.getHtmlValue() : '';
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    let html = '';
    if (type === 'select' || (attrs.type === undefined && f.getOptions && f.getOptions().getOptionsCount())) {
      html = `<select name="${name}" id="${name}">` + (f.getOptions ? f.getOptions().toArray().map((o) => `<option value="${esc(o.getHtmlValue())}"${o.isSelected() ? ' selected' : ''}>${esc(o.getLabel())}</option>`).join('') : '') + '</select>';
    } else if (type === 'textarea') html = `<textarea name="${name}" id="${name}">${esc(val)}</textarea>`;
    else if (type === 'checkbox') html = `<input type="checkbox" name="${name}" id="${name}" value="true"${f.isChecked && f.isChecked() ? ' checked' : ''}>`;
    else if (type === 'hidden') html = `<input type="hidden" name="${name}" id="${name}" value="${esc(val)}">`;
    else html = `<input type="${type === 'input' ? 'text' : type}" name="${name}" id="${name}" value="${esc(val)}"${f.isMandatory && f.isMandatory() ? ' required' : ''}${f.getMaxLength && f.getMaxLength() < 2147483647 ? ` maxlength="${f.getMaxLength()}"` : ''}>`;
    const label = f.getLabel && f.getLabel() ? `<label for="${name}">${esc(f.getLabel())}</label>` : '';
    const err = f.isValid && !f.isValid() ? `<span class="error">${esc(f.getError())}</span>` : '';
    return `${label}${html}${err}`;
  },
  registerModule(file, attrs) {
    const key = String(attrs.name || '').toLowerCase();
    this.modules.set(key, { template: attrs.template, attrs: Object.keys(attrs).filter((k) => !['name', 'template'].includes(k)) });
  },
  customTag(ctx, name, values, fromFile) {
    const def = this.modules.get(name.toLowerCase());
    if (!def) throw new Error(`Unknown ISML tag <${name}> in ${fromFile} (declare it with <ismodule>)`);
    const file = this.rt.resolveTemplate(def.template);
    if (!file) throw new Error(`Template ${def.template} for custom tag <${name}> not found`);
    const fn = this.compileFile(file);
    const pdict = Object.create(null);
    Object.assign(pdict, ctx.pdict && typeof ctx.pdict === 'object' ? ctx.pdict : {});
    Object.assign(pdict, values);
    const sub = this._context(pdict, {}, file);
    for (const [k, v] of Object.entries(values)) sub[k] = v;
    fn(sub);
    return sub.__out.join('');
  },
});

module.exports = { Isml, parse };
