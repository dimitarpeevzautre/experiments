'use strict';
const fs = require('fs');
const path = require('path');
/**
 * Hook registry: reads each cartridge's package.json `hooks` entry (a hooks.json file) and
 * registers `{ name, script }` pairs in cartridge-path order. `call` invokes the first registered
 * implementation (platform semantics for HookMgr.callHook); `callAll` invokes every one.
 * Inline implementations can be registered programmatically (useful for tests).
 */
class HookRegistry {
  constructor(rt) {
    this.rt = rt;
    this.hooks = {}; // name -> [{ cartridge, file, impl }]
    this.load();
  }
  load() {
    this.hooks = {};
    for (const cart of this.rt.cartridgePath) {
      const pkg = cart.packageJson || {};
      if (!pkg.hooks) continue;
      const hooksFile = path.resolve(cart.dir, pkg.hooks);
      let def;
      try { def = JSON.parse(fs.readFileSync(hooksFile, 'utf8')); } catch (e) { this.rt.log('warn', 'hooks', `Cannot read ${hooksFile}: ${e.message}`); continue; }
      for (const h of def.hooks || []) {
        const file = path.resolve(path.dirname(hooksFile), h.script);
        (this.hooks[h.name] = this.hooks[h.name] || []).push({ cartridge: cart, file, impl: null });
      }
    }
  }
  has(name) { return !!(this.hooks[name] && this.hooks[name].length); }
  _impl(h) { return h.impl || this.rt.loader.load(h.file, h.cartridge); }
  call(name, fn, ...args) {
    const list = this.hooks[name];
    if (!list || !list.length) return undefined;
    const impl = this._impl(list[0]);
    if (typeof impl[fn] !== 'function') throw new Error(`Hook '${name}' (${list[0].file}) has no function '${fn}'`);
    return impl[fn](...args);
  }
  callAll(name, fn, ...args) {
    const out = [];
    for (const h of this.hooks[name] || []) { const impl = this._impl(h); if (typeof impl[fn] === 'function') out.push(impl[fn](...args)); }
    return out;
  }
  /** Register an inline implementation object: register('app.foo', { bar() {} }) */
  register(name, impl) { (this.hooks[name] = this.hooks[name] || []).unshift({ cartridge: null, file: `<inline ${name}>`, impl }); }
  names() { return Object.keys(this.hooks); }
}
module.exports = { HookRegistry };
