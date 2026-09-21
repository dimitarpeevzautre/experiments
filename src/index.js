'use strict';
const fs = require('fs');
const path = require('path');
const { DwRegistry, NotImplementedError } = require('./dw');
const { Loader, tryFile } = require('./loader');
const { Store } = require('./store');
const globals = require('./globals');
const runtimeRef = require('./runtime');

const DEFAULTS = {
  roots: [process.cwd()],           // directories scanned for cartridges and a `modules` folder
  cartridgePath: null,              // ['app_custom', 'app_storefront_base'] – null = all discovered
  site: 'RefArch',
  locale: 'default',
  currency: null,
  dataDir: null,                    // directory of *.json data files
  persist: false,
  port: 3000,
  hostname: 'localhost',
  logDir: null,
  logLevel: 'info',
  strictCustomAttributes: false,
  allowNodeModules: false,
  instanceType: 'development',
};

class Runtime {
  constructor(config = {}) {
    this.config = Object.assign({}, DEFAULTS, config);
    if (typeof this.config.roots === 'string') this.config.roots = [this.config.roots];
    this.roots = this.config.roots.map((r) => path.resolve(r));
    if (typeof this.config.cartridgePath === 'string') this.config.cartridgePath = this.config.cartridgePath.split(/[:;,]/).map((s) => s.trim()).filter(Boolean);
    this.dw = new DwRegistry();
    this.store = new Store(this.config.dataDir ? path.resolve(this.config.dataDir) : null, { persist: this.config.persist });
    this.loader = new Loader(this);
    this.cartridges = discoverCartridges(this.roots);
    this.moduleRoots = this.roots.map((r) => path.join(r, 'modules')).filter((d) => fs.existsSync(d));
    for (const c of Object.values(this.cartridges)) {
      const m = path.join(path.dirname(c.dir), 'modules');
      if (fs.existsSync(m) && !this.moduleRoots.includes(m)) this.moduleRoots.push(m);
    }
    this.cartridgePath = this._resolveCartridgePath();
    this.contextStack = [];
    this.listeners = {};
    runtimeRef.set(this);
    globals.install(this);
    // lazily created subsystems
    this._isml = null; this._sessions = null; this._hooks = null; this._forms = null; this._logger = null;
    this.context = this.createScriptContext();
  }

  // ---- cartridges -------------------------------------------------------
  _resolveCartridgePath() {
    let names = this.config.cartridgePath;
    if (!names) {
      const site = this.siteData();
      if (site && site.cartridgePath) names = String(site.cartridgePath).split(/[:;,]/).map((s) => s.trim()).filter(Boolean);
    }
    if (!names) names = Object.keys(this.cartridges);
    const out = [];
    for (const n of names) {
      const c = this.cartridges[n];
      if (!c) { this.log('warn', 'runtime', `Cartridge '${n}' from cartridge path not found`); continue; }
      out.push(c);
    }
    return out;
  }
  cartridge(name) { return this.cartridges[name] || null; }
  cartridgeOf(file) {
    if (!file) return null;
    let best = null;
    for (const c of Object.values(this.cartridges)) {
      if (file.startsWith(c.dir + path.sep) && (!best || c.dir.length > best.dir.length)) best = c;
    }
    return best;
  }
  setCartridgePath(names) { this.config.cartridgePath = names; this.cartridgePath = this._resolveCartridgePath(); this.loader.clearCache(); if (this._isml) this._isml.clearCache(); }

  /** Find `cartridge/<rel>` in the first cartridge on the path that has it. */
  findInCartridges(rel) {
    for (const c of this.cartridgePath) {
      const f = path.join(c.dir, 'cartridge', rel);
      if (fs.existsSync(f)) return f;
    }
    return null;
  }
  findAllInCartridges(rel) {
    return this.cartridgePath.map((c) => path.join(c.dir, 'cartridge', rel)).filter((f) => fs.existsSync(f));
  }

  /** Resolve an ISML/Velocity template name with locale fallback (de_DE -> de -> default). */
  resolveTemplate(name, locale, exts = ['.isml']) {
    name = String(name).replace(/\.isml$/, '');
    const locales = this.localeFallback(locale);
    for (const loc of locales) {
      for (const ext of exts) {
        const f = this.findInCartridges(path.join('templates', loc, name + ext));
        if (f) return f;
      }
    }
    return null;
  }
  localeFallback(locale) {
    locale = locale || (this.context && this.context.request && this.context.request.getLocale()) || this.config.locale || 'default';
    const out = [];
    if (locale && locale !== 'default') {
      out.push(locale);
      const lang = locale.split(/[_-]/)[0];
      if (lang !== locale) out.push(lang);
    }
    out.push('default');
    return out;
  }

  // ---- data ------------------------------------------------------------
  siteData(id) {
    const sites = this.store.get('sites', {});
    const sid = id || this.config.site;
    return sites[sid] || null;
  }

  // ---- subsystems --------------------------------------------------------
  get isml() { if (!this._isml) this._isml = new (require('./isml').Isml)(this); return this._isml; }
  get sessions() { if (!this._sessions) this._sessions = new (require('./session').SessionManager)(this); return this._sessions; }
  get hooks() { if (!this._hooks) this._hooks = new (require('./hooks').HookRegistry)(this); return this._hooks; }
  get forms() { if (!this._forms) this._forms = new (require('./forms').FormDefinitions)(this); return this._forms; }

  // ---- context ------------------------------------------------------------
  createScriptContext(opts = {}) {
    const Request = this.dw.get('system/Request');
    const Response = this.dw.get('system/Response');
    const session = opts.session || this.sessions.create();
    const request = new Request(Object.assign({ method: 'GET', path: '/', locale: this.config.locale, session }, opts.request || {}));
    const response = new Response();
    return { request, response, session, get customer() { return session.getCustomer(); }, set customer(c) { session._setCustomer(c); } };
  }
  pushContext(ctx) { this.contextStack.push(this.context); this.context = ctx; return ctx; }
  popContext() { this.context = this.contextStack.pop() || this.createScriptContext(); }
  /** Run fn within a request context. */
  withContext(ctx, fn) {
    this.pushContext(ctx);
    try { return fn(ctx); } finally { this.popContext(); }
  }

  // ---- public API -------------------------------------------------------
  require(spec, from) { return this.loader.require(spec, from || null, null); }
  registerClass(id, impl) { this.dw.register(id, impl); }
  /** Evaluate a JS expression/statements with SFCC globals. */
  eval(code, vars = {}) {
    const vm = require('vm');
    const names = Object.keys(vars);
    const fn = vm.compileFunction(code, ['require', ...names], { filename: '<eval>' });
    return fn(this.require.bind(this), ...names.map((n) => vars[n]));
  }
  /** Run a script file (controller module, job step, .ds) and return its exports. */
  runScript(file) {
    const abs = path.resolve(file);
    const f = tryFile(abs);
    if (!f) throw new Error(`Script not found: ${file}`);
    return this.loader.load(f, this.cartridgeOf(f));
  }
  createServer(opts) { const { createServer } = require('./http/server'); return createServer(this, opts); }
  dispatch(reqOpts) { const { dispatch } = require('./http/dispatcher'); return dispatch(this, reqOpts); }
  runJobStep(module, params, opts) { return require('./jobs').runStep(this, module, params, opts); }
  runJob(jobId, opts) { return require('./jobs').runJob(this, jobId, opts); }
  runPipeline(name, dict, opts) { return require('./pipelines').run(this, name, dict, opts); }
  renderTemplate(name, pdict) { return this.isml.renderTemplate(name, pdict); }

  // ---- logging ----------------------------------------------------------
  log(level, category, message) {
    if (!this._logger) this._logger = new (require('./logging').LogWriter)(this);
    this._logger.write(level, category, message);
  }
  on(evt, fn) { (this.listeners[evt] = this.listeners[evt] || []).push(fn); return this; }
  emit(evt, ...args) { for (const fn of this.listeners[evt] || []) fn(...args); }
}

function discoverCartridges(roots) {
  const found = {};
  const skip = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', 'static', 'templates']);
  const visit = (dir, depth) => {
    if (depth > 6) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    const hasCartridgeDir = entries.some((e) => e.isDirectory() && e.name === 'cartridge');
    if (hasCartridgeDir) {
      const name = path.basename(dir);
      if (!found[name]) found[name] = { name, dir, packageJson: readJson(path.join(dir, 'package.json')) };
      return;
    }
    for (const e of entries) {
      if (e.isDirectory() && !skip.has(e.name) && !e.name.startsWith('.')) visit(path.join(dir, e.name), depth + 1);
    }
  };
  for (const r of roots) visit(r, 0);
  return found;
}
function readJson(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } }

/** Load config from sfcc-runtime.json / dw.json in the given directory. */
function loadConfig(dir = process.cwd(), overrides = {}) {
  let cfg = {};
  const own = path.join(dir, 'sfcc-runtime.json');
  if (fs.existsSync(own)) cfg = readJson(own) || {};
  else {
    const dwjson = readJson(path.join(dir, 'dw.json'));
    if (dwjson) {
      cfg = {};
      if (dwjson.cartridgesPath) cfg.cartridgePath = dwjson.cartridgesPath;
      if (dwjson.cartridgePath) cfg.cartridgePath = dwjson.cartridgePath;
    }
  }
  cfg.roots = (cfg.roots || ['.']).map((r) => path.resolve(dir, r));
  if (cfg.dataDir) cfg.dataDir = path.resolve(dir, cfg.dataDir);
  else if (fs.existsSync(path.join(dir, 'data'))) cfg.dataDir = path.join(dir, 'data');
  return Object.assign(cfg, overrides);
}

function createRuntime(config) { return new Runtime(config); }

module.exports = { Runtime, createRuntime, loadConfig, NotImplementedError, DEFAULTS };
