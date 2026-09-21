'use strict';
const fs = require('fs');
const path = require('path');

/**
 * Registry of dw.* classes. Classes load lazily from src/dw/<package>[/<sub>]/<Class>.js.
 * Package names start with a lowercase letter, class names with an uppercase letter, which is how
 * `dw.extensions.payments.SalesforcePaymentsMgr` is told apart from `dw.system.Site`.
 * Unknown classes resolve to a stub whose members throw a descriptive NotImplementedError, so code
 * that merely references an exotic class still loads. Implementations can be registered at runtime.
 */
class DwRegistry {
  constructor() {
    this.root = __dirname;
    this.packages = {};      // 'system' | 'extensions/payments' -> [ClassName]
    this.cache = new Map();  // 'pkg/Class' -> impl
    this.overrides = new Map();
    const scan = (dir, prefix) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) { const pkg = prefix ? `${prefix}/${e.name}` : e.name; this.packages[pkg] = this.packages[pkg] || []; scan(path.join(dir, e.name), pkg); }
        else if (prefix && e.name.endsWith('.js') && !e.name.startsWith('_')) this.packages[prefix].push(e.name.slice(0, -3));
      }
    };
    scan(this.root, '');
    for (const k of Object.keys(this.packages)) this.packages[k].sort();
    this.namespace = this._packageProxy('');
  }
  has(id) { const [pkg, cls] = split(id); return this.overrides.has(`${pkg}/${cls}`) || ((this.packages[pkg] || []).includes(cls)); }
  register(id, impl) { const [pkg, cls] = split(id); this.overrides.set(`${pkg}/${cls}`, impl); this.cache.delete(`${pkg}/${cls}`); this.packages[pkg] = this.packages[pkg] || []; if (!this.packages[pkg].includes(cls)) this.packages[pkg].push(cls); }
  get(id) {
    const [pkg, cls] = split(id);
    const key = `${pkg}/${cls}`;
    if (this.cache.has(key)) return this.cache.get(key);
    let impl;
    if (this.overrides.has(key)) impl = this.overrides.get(key);
    else if ((this.packages[pkg] || []).includes(cls)) impl = require(path.join(this.root, ...pkg.split('/'), `${cls}.js`));
    else impl = makeStub(pkg, cls);
    this.cache.set(key, impl);
    return impl;
  }
  _packageProxy(pkg) {
    const reg = this;
    const target = {};
    return new Proxy(target, {
      get(t, k) {
        if (typeof k === 'symbol') return t[k];
        if (k === '__package') return pkg;
        if (k === 'toString') return () => `[dw${pkg ? '.' + pkg.replace(/\//g, '.') : ''}]`;
        if (k === 'valueOf' || k === 'toJSON' || k === 'inspect' || k === 'then' || k === 'constructor') return undefined;
        const full = pkg ? `${pkg}/${k}` : k;
        if (/^[A-Z]/.test(k) && pkg) return reg.get(full);
        if (!t[k]) t[k] = reg._packageProxy(full);
        return t[k];
      },
      has(t, k) { return typeof k === 'string' && (Object.keys(reg.packages).some((p) => p === (pkg ? `${pkg}/${k}` : k)) || reg.has(`${pkg}/${k}`)); },
      ownKeys(t) { const subs = Object.keys(reg.packages).filter((p) => (pkg ? p.startsWith(pkg + '/') && !p.slice(pkg.length + 1).includes('/') : !p.includes('/'))).map((p) => p.split('/').pop()); const all = new Set(subs.concat(pkg ? reg.packages[pkg] || [] : [], Object.keys(t))); return Array.from(all); },
      getOwnPropertyDescriptor(t, k) { return { enumerable: true, configurable: true, writable: true, value: this.get(t, k) }; },
    });
  }
}

function split(id) {
  const parts = String(id).replace(/^dw[/.]/, '').split(/[/.]/).filter(Boolean);
  if (parts.length < 2) throw new Error(`Invalid dw class id: ${id}`);
  return [parts.slice(0, -1).join('/'), parts[parts.length - 1]];
}

class NotImplementedError extends Error {
  constructor(msg) { super(msg); this.name = 'NotImplementedError'; }
}

function makeStub(pkg, cls) {
  const full = `dw.${pkg.replace(/\//g, '.')}.${cls}`;
  const hint = `${full} is not implemented by sfcc-runtime. Register an implementation with runtime.registerClass('dw/${pkg}/${cls}', impl).`;
  const Stub = function StubClass() { throw new NotImplementedError(`Cannot instantiate ${full}: ${hint}`); };
  Object.defineProperty(Stub, 'name', { value: cls });
  Stub.__stub = true;
  Stub.toString = () => `[stub ${full}]`;
  return new Proxy(Stub, {
    get(t, k) {
      if (k in t || typeof k === 'symbol') return t[k];
      if (k === 'then' || k === 'toJSON' || k === 'valueOf' || k === 'inspect' || k === 'constructor') return undefined;
      if (/^[A-Z][A-Z0-9_]*$/.test(k)) return k; // constants -> their own name
      return function stubMethod() { throw new NotImplementedError(`${full}.${k}() called: ${hint}`); };
    },
  });
}

module.exports = { DwRegistry, NotImplementedError, makeStub };
