'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { transform } = require('./util/transform');

/**
 * Module loader implementing SFCC `require` semantics:
 *   dw/pkg/Class                 -> dw API class
 *   ~/cartridge/...              -> current cartridge
 *   star/cartridge/...           -> first cartridge on the cartridge path containing the file
 *   <cartridgeName>/cartridge/.. -> that cartridge
 *   ./x, ../x                    -> relative
 *   name                         -> <root>/modules/name (e.g. `server` in SFRA)
 * plus `module.superModule`, `.ds` scripts, `.json` files and Rhino syntax transforms.
 */
class Loader {
  constructor(rt) {
    this.rt = rt;
    this.cache = new Map();
  }

  clearCache() { this.cache.clear(); }

  /** Resolve `spec` requested from `fromFile` (may be null for top-level requires). */
  resolve(spec, fromFile, fromCartridge) {
    const rt = this.rt;
    if (typeof spec !== 'string' || !spec) throw new TypeError('require() expects a module id string');
    if (/^dw[/.]/.test(spec)) return { dw: spec.replace(/^dw[/.]/, '').replace(/\./g, '/') };
    if (spec.startsWith('~/')) {
      const cart = fromCartridge || (fromFile && rt.cartridgeOf(fromFile));
      if (!cart) throw new Error(`Cannot resolve '${spec}' outside of a cartridge`);
      return this._file(path.join(cart.dir, spec.slice(2)), spec, cart);
    }
    if (spec.startsWith('*/')) {
      for (const cart of rt.cartridgePath) {
        const f = tryFile(path.join(cart.dir, spec.slice(2)));
        if (f) return { file: f, cartridge: cart };
      }
      throw notFound(spec, fromFile);
    }
    if (spec.startsWith('./') || spec.startsWith('../')) {
      const base = fromFile ? path.dirname(fromFile) : process.cwd();
      const abs = path.resolve(base, spec);
      return this._file(abs, spec, fromCartridge || rt.cartridgeOf(abs));
    }
    if (path.isAbsolute(spec)) return this._file(spec, spec, rt.cartridgeOf(spec));
    const first = spec.split('/')[0];
    const cart = rt.cartridge(first);
    if (cart && spec.includes('/')) return this._file(path.join(cart.dir, spec.slice(first.length + 1)), spec, cart);
    // bare module name -> modules/ directory
    for (const root of rt.moduleRoots) {
      const f = tryFile(path.join(root, spec));
      if (f) return { file: f, cartridge: rt.cartridgeOf(f) };
    }
    // Some projects put shared modules under a cartridge's `cartridge/modules`
    for (const c of rt.cartridgePath) {
      const f = tryFile(path.join(c.dir, 'cartridge', 'modules', spec)) || tryFile(path.join(c.dir, 'modules', spec));
      if (f) return { file: f, cartridge: c };
    }
    if (rt.config.allowNodeModules) {
      try { return { file: require.resolve(spec, { paths: [fromFile ? path.dirname(fromFile) : process.cwd(), ...rt.roots] }), node: true }; } catch (e) { /* fallthrough */ }
    }
    throw notFound(spec, fromFile);
  }

  _file(abs, spec, cart) {
    const f = tryFile(abs);
    if (!f) throw notFound(spec, abs);
    return { file: f, cartridge: cart };
  }

  require(spec, fromFile, fromCartridge) {
    const r = this.resolve(spec, fromFile, fromCartridge);
    if (r.dw) return this.rt.dw.get(r.dw);
    if (r.node) return require(r.file);
    return this.load(r.file, r.cartridge);
  }

  /** Load (or fetch from cache) the module at `file`. */
  load(file, cartridge) {
    const cached = this.cache.get(file);
    if (cached) return cached.exports;
    const rt = this.rt;
    cartridge = cartridge || rt.cartridgeOf(file);
    const module = { id: file, filename: file, exports: {}, loaded: false, cartridge: cartridge ? cartridge.name : null, superModule: undefined, children: [] };
    this.cache.set(file, module);
    try {
      if (file.endsWith('.json')) {
        module.exports = JSON.parse(fs.readFileSync(file, 'utf8'));
      } else if (file.endsWith('.isml') || file.endsWith('.properties') || file.endsWith('.xml')) {
        module.exports = fs.readFileSync(file, 'utf8');
      } else {
        module.superModule = this._superModule(file, cartridge);
        const fn = this.compile(file);
        const req = this.makeRequire(file, cartridge);
        req.main = module;
        req.cache = this.cache;
        req.resolve = (s) => { const r = this.resolve(s, file, cartridge); return r.file || r.dw; };
        fn.call(module.exports, module.exports, req, module, file, path.dirname(file));
      }
      module.loaded = true;
      return module.exports;
    } catch (e) {
      this.cache.delete(file);
      throw e;
    }
  }

  makeRequire(file, cartridge) {
    return (spec) => this.require(spec, file, cartridge);
  }

  _superModule(file, cartridge) {
    if (!cartridge) return undefined;
    const rel = path.relative(cartridge.dir, file);
    const idx = this.rt.cartridgePath.findIndex((c) => c.name === cartridge.name);
    const candidates = idx === -1 ? [] : this.rt.cartridgePath.slice(idx + 1);
    for (const c of candidates) {
      const f = tryFile(path.join(c.dir, rel));
      if (f) return this.load(f, c);
    }
    return undefined;
  }

  compile(file) {
    let src = fs.readFileSync(file, 'utf8');
    if (src.charCodeAt(0) === 0xfeff) src = src.slice(1);
    if (src.startsWith('#!')) src = '//' + src;
    src = transform(src, {
      packages: this.rt.dw.packages,
      filename: file,
      resolveImportScript: (spec) => this.resolveImportScript(spec, file),
    });
    try {
      return vm.compileFunction(src, ['exports', 'require', 'module', '__filename', '__dirname'], { filename: file });
    } catch (e) {
      if (e instanceof SyntaxError) {
        let hint = '';
        if (/<\w+[^>]*>/.test(src) && /=\s*</.test(src)) hint = ' (E4X XML literals are not supported; use dw.io.XMLStreamReader or strings instead)';
        const err = new SyntaxError(`${e.message} in ${file}${hint}`);
        err.stack = `${err.message}\n${e.stack.split('\n').slice(1).join('\n')}`;
        throw err;
      }
      throw e;
    }
  }

  /** importScript("cartridge:path/to/script.ds") or importScript("path/to/script.ds") */
  resolveImportScript(spec, fromFile) {
    const rt = this.rt;
    let cartName = null; let rel = spec;
    if (spec.includes(':')) [cartName, rel] = spec.split(':');
    const candidates = [];
    if (cartName) { const c = rt.cartridge(cartName); if (c) candidates.push(path.join(c.dir, 'cartridge', 'scripts', rel)); }
    else {
      const own = rt.cartridgeOf(fromFile);
      if (own) candidates.push(path.join(own.dir, 'cartridge', 'scripts', rel));
      for (const c of rt.cartridgePath) candidates.push(path.join(c.dir, 'cartridge', 'scripts', rel));
    }
    for (const cand of candidates) {
      const f = tryFile(cand) || tryFile(cand + '.ds');
      if (f) return { filename: f, source: fs.readFileSync(f, 'utf8') };
    }
    throw new Error(`importScript: cannot find '${spec}' (from ${fromFile})`);
  }
}

const EXTS = ['', '.js', '.ds', '.json'];
function tryFile(p) {
  for (const ext of EXTS) {
    const f = p + ext;
    if (isFile(f)) return f;
  }
  if (isDir(p)) {
    const pkg = path.join(p, 'package.json');
    if (isFile(pkg)) {
      try {
        const main = JSON.parse(fs.readFileSync(pkg, 'utf8')).main;
        if (main) { const m = tryFile(path.join(p, main)); if (m) return m; }
      } catch (e) { /* ignore */ }
    }
    for (const ext of ['.js', '.ds', '.json']) { const f = path.join(p, 'index' + ext); if (isFile(f)) return f; }
  }
  return null;
}
function isFile(f) { try { return fs.statSync(f).isFile(); } catch (e) { return false; } }
function isDir(f) { try { return fs.statSync(f).isDirectory(); } catch (e) { return false; } }
function notFound(spec, from) { const e = new Error(`Cannot find module '${spec}'${from ? ` (required from ${from})` : ''}`); e.code = 'MODULE_NOT_FOUND'; return e; }

module.exports = { Loader, tryFile };
