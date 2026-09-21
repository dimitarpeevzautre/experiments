'use strict';
const fs = require('fs');
const path = require('path');
const { parse } = require('../util/xml');
const { pipelets: builtin, evalExpr } = require('./pipelets');

/**
 * Interpreter for legacy Demandware pipeline XML (cartridge/pipelines/<Name>.xml).
 * Supports start/end/jump/call/decision/loop/join nodes, pipelet nodes (Script, Assign, Eval, ...),
 * interaction (template) nodes, inline branches on connectors and target-path transitions.
 */
class PipelineRunner {
  constructor(rt) { this.rt = rt; this.cache = new Map(); }

  loadPipeline(name) {
    if (this.cache.has(name)) return this.cache.get(name);
    const file = this.rt.findInCartridges(path.join('pipelines', `${name}.xml`));
    if (!file) throw new Error(`Pipeline not found: ${name}`);
    const doc = parse(fs.readFileSync(file, 'utf8'));
    const root = doc.elements.find((e) => e.localName === 'pipeline');
    const p = { name, file, root, cartridge: this.rt.cartridgeOf(file), starts: {} };
    for (const sn of root.findAll((e) => e.localName === 'start-node')) p.starts[sn.attr('name')] = sn.parent;
    this.cache.set(name, p);
    return p;
  }

  /** Run `Pipeline-Start`; returns { dictionary, endName, rendered, redirected }. */
  run(startRef, dict = {}, opts = {}) {
    const [name, start = 'Start'] = String(startRef).split('-');
    const p = this.loadPipeline(name);
    const node = p.starts[start];
    if (!node) throw new Error(`Start node '${start}' not found in pipeline ${name}`);
    const PipelineDictionary = this.rt.dw.get('system/PipelineDictionary');
    const pdict = dict && dict.__isPDict ? dict : PipelineDictionary(Object.assign({ CurrentSession: this.rt.context.session, CurrentRequest: this.rt.context.request, CurrentCustomer: this.rt.context.customer, CurrentHttpParameterMap: this.rt.context.request ? this.rt.context.request.getHttpParameterMap() : null, CurrentForms: this.rt.context.session ? this.rt.context.session.getForms() : null }, dict));
    Object.defineProperty(pdict, '__isPDict', { value: true });
    const ctx = { rt: this.rt, pipeline: p, dict: pdict, cartridge: p.cartridge, depth: opts.depth || 0, rendered: null, redirected: false, calls: 0 };
    if (ctx.depth > 50) throw new Error('Pipeline call depth exceeded');
    const startEl = node.child('start-node');
    if (opts.checkPublic && startEl.attr('call-mode') !== 'public') throw new Error(`Start node ${startRef} is not public`);
    const end = this.execFrom(ctx, node);
    return { dictionary: pdict, endName: end, rendered: ctx.rendered, redirected: ctx.redirected };
  }

  /** Execute starting at a <node> element and following transitions. Returns end-node name (or null). */
  execFrom(ctx, node) {
    let current = node;
    let guard = 0;
    while (current) {
      if (++guard > 10000) throw new Error('Pipeline loop guard triggered');
      if (++ctx.calls > 100000) throw new Error('Pipeline step limit exceeded');
      const r = this.execNode(ctx, current);
      if (r.done) return r.end;
      current = this.next(ctx, current, r.connector);
    }
    return null;
  }

  execNode(ctx, node) {
    const el = node.elements.find((e) => !['node-display', 'branch', 'transition', 'simple-transition'].includes(e.localName));
    if (!el) return { connector: 'next' };
    switch (el.localName) {
      case 'start-node': case 'join-node': case 'text-node': return { connector: 'next' };
      case 'end-node': return { done: true, end: el.attr('name') || 'next' };
      case 'stop-node': return { done: true, end: 'stop' };
      case 'jump-node': { const r = this.run(el.attr('start-name-ref'), ctx.dict, { depth: ctx.depth + 1 }); ctx.rendered = r.rendered || ctx.rendered; ctx.redirected = ctx.redirected || r.redirected; return { done: true, end: r.endName }; }
      case 'call-node': { const r = this.run(el.attr('start-name-ref'), ctx.dict, { depth: ctx.depth + 1 }); if (r.rendered) ctx.rendered = r.rendered; if (r.redirected) ctx.redirected = true; return { connector: r.endName || 'next' }; }
      case 'pipelet-node': return { connector: this.execPipelet(ctx, el) };
      case 'decision-node': return { connector: this.decide(ctx, el) ? 'yes' : 'no' };
      case 'loop-node': return this.execLoop(ctx, node, el);
      case 'interaction-node': case 'interaction-continue-node': {
        const t = el.child('template');
        const name = t ? t.attr('name') : null;
        if (t && t.attr('dynamic') === 'true') { const n = evalExpr(this.rt, name, ctx.dict); ctx.rendered = this.render(ctx, String(n)); }
        else if (name) ctx.rendered = this.render(ctx, name);
        if (el.localName === 'interaction-continue-node') {
          const action = this.rt.context.request && this.rt.context.request.getTriggeredFormAction();
          if (action && !ctx._continued) { ctx._continued = true; return { connector: action.getFormId() }; }
        }
        return { done: true, end: 'interaction' };
      }
      default: this.rt.log('warn', 'pipeline', `Unsupported node ${el.localName} in ${ctx.pipeline.name}`); return { connector: 'next' };
    }
  }

  render(ctx, template) {
    const ISML = this.rt.dw.get('template/ISML');
    return ISML.renderTemplate(template, ctx.dict.toJSON());
  }

  decide(ctx, el) {
    const key = el.attr('condition-key'); const op = el.attr('condition-operator') || 'expr'; const val = el.attr('condition-value');
    const read = (k) => (k ? String(k).split('.').reduce((o, x) => (o == null ? o : (typeof o[x] === 'function' ? o[x]() : o[x])), ctx.dict) : undefined);
    const v = read(key);
    switch (op) {
      case 'expr': return !!evalExpr(this.rt, val != null && val !== '' ? val : key, ctx.dict);
      case 'str_empty': case 'empty': return globalThis.empty(v);
      case 'str_not_empty': case 'not_empty': return !globalThis.empty(v);
      case 'equals': case 'str_equals': case '==': return String(v) === String(val);
      case 'not_equals': case '!=': return String(v) !== String(val);
      case 'null': return v == null;
      case 'not_null': return v != null;
      case 'true': return v === true || v === 'true';
      case 'false': return !(v === true || v === 'true');
      default: return !!v;
    }
  }

  execLoop(ctx, node, el) {
    const items = String(el.attr('iterator-key')).split('.').reduce((o, k) => (o == null ? o : o[k]), ctx.dict);
    const arr = globalThis.__sfccIter(items);
    const doBranch = node.elements.find((b) => b.localName === 'branch' && b.attr('source-connector') === 'do');
    for (const item of arr) {
      ctx.dict[el.attr('element-key')] = item;
      if (doBranch) { const seg = doBranch.child('segment'); const first = seg && seg.child('node'); if (first) { const end = this.execFrom(ctx, first); if (end && end !== 'loop') return { done: true, end }; } }
    }
    return { connector: 'next' };
  }

  execPipelet(ctx, el) {
    const name = el.attr('pipelet-name');
    const cfg = {}; for (const c of el.childrenNamed('config-property')) cfg[c.attr('key')] = c.attr('value');
    const bindings = {}; for (const b of el.childrenNamed('key-binding')) bindings[b.attr('alias')] = b.attr('key');
    const impl = (this.rt.pipelets && this.rt.pipelets[name]) || builtin[name];
    if (!impl) throw new Error(`Unknown pipelet '${name}' in ${ctx.pipeline.name}; register it via runtime.pipelets['${name}'] = fn`);
    const dict = ctx.dict;
    const io = {
      binding: (alias) => bindings[alias],
      get: (alias) => { const k = bindings[alias]; if (!k) return cfg[alias] !== undefined ? cfg[alias] : null; return String(k).split('.').reduce((o, x) => (o == null ? o : o[x]), dict); },
      set: (alias, v) => { const k = bindings[alias] || alias; dict[k] = v; },
      view: () => { const PipelineDictionary = this.rt.dw.get('system/PipelineDictionary'); const v = PipelineDictionary({}); for (const [alias, key] of Object.entries(bindings)) v[alias] = String(key).split('.').reduce((o, x) => (o == null ? o : o[x]), dict); for (const [k, val] of Object.entries(dict.toJSON())) if (!(k in v)) v[k] = val; return v; },
      writeBack: (view) => { const j = view.toJSON(); for (const [alias, key] of Object.entries(bindings)) if (alias in j && !String(key).includes('.')) dict[key] = j[alias]; for (const [k, val] of Object.entries(j)) if (!(k in bindings)) dict[k] = val; },
    };
    let result;
    try { result = impl(ctx, cfg, io); }
    catch (e) { if (String(cfg.OnError || 'PIPELET_ERROR') === 'PIPELET_ERROR') { this.rt.log('error', 'pipeline', `Pipelet ${name} failed: ${e.stack || e}`); return 'error'; } throw e; }
    if (ctx.redirected) return 'next';
    return result === 0 || result === false ? 'error' : 'next';
  }

  /** Find the node to execute after `node` when leaving through `connector`. */
  next(ctx, node, connector) {
    // inline branch on this node for the connector
    const branch = node.elements.find((b) => b.localName === 'branch' && b.attr('source-connector') === connector);
    if (branch) { const seg = branch.child('segment'); const first = seg && seg.child('node'); return first || null; }
    // explicit transition with matching source connector inside node
    const inner = node.elements.find((t) => t.localName === 'transition' && (t.attr('source-connector') || 'next') === connector);
    if (inner && inner.attr('target-path')) return this.resolvePath(inner, inner.attr('target-path'));
    if (connector === 'error') { const e = new Error(`Pipeline ${ctx.pipeline.name}: unhandled error connector`); e.pipelineError = true; throw e; }
    if (connector === 'no') { /* decision without 'no' branch: fall through */ }
    // segment-level: element following this node
    const seg = node.parent; const sib = seg.elements; const idx = sib.indexOf(node);
    for (let i = idx + 1; i < sib.length; i++) {
      const s = sib[i];
      if (s.localName === 'simple-transition') continue;
      if (s.localName === 'transition') { if (s.attr('target-path')) return this.resolvePath(s, s.attr('target-path')); continue; }
      if (s.localName === 'node') return s;
    }
    return null;
  }

  resolvePath(fromEl, targetPath) {
    let cur = fromEl.parent; // element containing the transition (segment or node)
    for (const part of String(targetPath).split('/')) {
      if (part === '.' || part === '') continue;
      if (part === '..') { cur = cur.parent; continue; }
      let m;
      if ((m = /^([+-]\d+)$/.exec(part))) { const sibs = cur.parent.elements.filter((e) => ['node', 'segment', 'branch'].includes(e.localName)); const i = sibs.indexOf(cur.localName === 'transition' ? fromEl : cur); cur = sibs[i + Number(m[1])] || null; if (!cur) break; continue; }
      if ((m = /^([a-z-]+)(?:\[(\d+)\])?$/.exec(part))) { const kids = cur.childrenNamed(m[1]); cur = kids[(m[2] ? Number(m[2]) : 1) - 1] || null; if (!cur) break; continue; }
      throw new Error(`Cannot resolve pipeline path ${targetPath}`);
    }
    if (!cur) throw new Error(`Pipeline transition target not found: ${targetPath}`);
    if (cur.localName === 'segment') cur = cur.child('node');
    if (cur.localName === 'branch') cur = cur.child('segment').child('node');
    return cur;
  }
}

function run(rt, name, dict, opts) { if (!rt._pipelines) rt._pipelines = new PipelineRunner(rt); return rt._pipelines.run(name, dict, opts); }
module.exports = { PipelineRunner, run };
