'use strict';
/**
 * `obj.custom` — attribute bag. Reading an undefined attribute yields null (as on the
 * platform). Setting is allowed for any name unless a schema is attached and the runtime
 * runs in strict mode, in which case unknown attributes throw like SFCC does.
 */
function createCustomAttributes(initial = {}, owner = null, schema = null) {
  const data = Object.assign({}, initial);
  const proxy = new Proxy(data, {
    get(t, k) {
      if (typeof k === 'symbol') return t[k];
      if (k === 'toJSON') return () => Object.assign({}, t);
      if (k === 'toString') return () => '[CustomAttributes]';
      if (k === 'hasOwnProperty') return (n) => Object.prototype.hasOwnProperty.call(t, n);
      if (k in t) return t[k];
      return null;
    },
    set(t, k, v) {
      if (schema && schema.strict && !(k in schema.attributes)) {
        throw new Error(`Attribute '${k}' is not defined for object type '${schema.type}'`);
      }
      t[k] = v;
      if (owner && typeof owner._markDirty === 'function') owner._markDirty();
      return true;
    },
    has(t, k) { return k in t; },
    deleteProperty(t, k) { delete t[k]; if (owner && owner._markDirty) owner._markDirty(); return true; },
    ownKeys(t) { return Reflect.ownKeys(t); },
    getOwnPropertyDescriptor(t, k) { return Reflect.getOwnPropertyDescriptor(t, k); },
  });
  return proxy;
}
module.exports = { createCustomAttributes };
