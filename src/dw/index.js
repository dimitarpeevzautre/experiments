'use strict';
const fs = require('fs');
const path = require('path');

/**
 * Registry of dw.* classes. Classes are loaded lazily from src/dw/<package>/<Class>.js.
 * Unknown classes resolve to a stub whose members throw a descriptive error, so code that merely
 * references an exotic class still loads. Custom implementations can be registered at runtime.
 */
class DwRegistry {
  constructor() {
    this.root = __dirname;
    this.packages = {};      // pkg -> [ClassName]
    this.cache = new Map();  // 'pkg/Class' -> impl
    this.overrides = new Map();
    for (const pkg of fs.readdirSync(this.root)) {
      const dir = path.join(this.root, pkg);
      if (!fs.statSync(dir).isDirectory()) continue;
      this.packages[pkg] = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3)).sort();
    }
    this.namespace = this._buildNamespace();
  }
  has(id) { const [pkg, cls] = split(id); return this.overrides.has(`${pkg}/${cls}`) || ((this.packages[pkg] || []).includes(cls)); }
  register(id, impl) { const [pkg, cls] = split(id); this.overrides.set(`${pkg}/${cls}`, impl); this.cache.delete(`${pkg}/${cls}`); if (!this.packages[pkg]) { this.packages[pkg] = []; this._addPackage(pkg); } if (!this.packages[pkg].includes(cls)) this.packages[pkg].push(cls); }
  get(id) {
    const [pkg, cls] = split(id);
    const key = `${pkg}/${cls}`;
    if (this.cache.has(key)) return this.cache.get(key);
    let impl;
    if (this.overrides.has(key)) impl = this.overrides.get(key);
    else if ((this.packages[pkg] || []).includes(cls)) impl = require(path.join(this.root, pkg, `${cls}.js`));
    else impl = makeStub(pkg, cls);
    this.cache.set(key, impl);
    return impl;
  }
  _buildNamespace() {
    const ns = {};
    for (const pkg of Object.keys(this.packages)) this._addPackage(pkg, ns);
    this.namespace = ns;
    return new Proxy(ns, {
      get: (t, k) => {
        if (typeof k === 'symbol' || k in t) return t[k];
        // unknown package: create lazily
        this.packages[k] = this.packages[k] || [];
        return this._addPackage(k, t);
      },
    });
  }
  _addPackage(pkg, ns = this.namespace) {
    const reg = this;
    const target = {};
    Object.defineProperty(target, '__package', { value: pkg });
    const pkgObj = new Proxy(target, {
      get(t, k) {
        if (typeof k === 'symbol' || k === 'toString' || k === 'valueOf' || k === 'toJSON' || k === 'inspect') return t[k] || (k === 'toString' ? () => `[dw.${pkg}]` : undefined);
        if (k === '__package') return pkg;
        if (k === 'then') return undefined;
        return reg.get(`${pkg}/${k}`);
      },
      has(t, k) { return reg.has(`${pkg}/${k}`); },
      ownKeys() { return reg.packages[pkg] || []; },
      getOwnPropertyDescriptor(t, k) { return { enumerable: true, configurable: true, value: reg.get(`${pkg}/${k}`) }; },
    });
    Object.defineProperty(ns, pkg, { value: pkgObj, enumerable: true, configurable: true });
    return pkgObj;
  }
}

function split(id) {
  const parts = String(id).replace(/^dw[/.]/, '').split(/[/.]/);
  if (parts.length < 2) throw new Error(`Invalid dw class id: ${id}`);
  return [parts[0], parts[parts.length - 1]];
}

class NotImplementedError extends Error {
  constructor(msg) { super(msg); this.name = 'NotImplementedError'; }
}

function makeStub(pkg, cls) {
  const full = `dw.${pkg}.${cls}`;
  const hint = `${full} is not implemented by sfcc-runtime. Register an implementation with runtime.registerClass('dw/${pkg}/${cls}', impl).`;
  const Stub = function StubClass() {
    throw new NotImplementedError(`Cannot instantiate ${full}: ${hint}`);
  };
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
