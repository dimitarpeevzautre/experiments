'use strict';
/**
 * Rhino exposes Java beans so that `obj.foo` calls `getFoo()` / `isFoo()` and
 * `obj.foo = x` calls `setFoo(x)`. SFCC code relies on this constantly
 * (`product.ID`, `basket.totalGrossPrice`, `session.custom`, ...).
 *
 * `bean(Class)` walks the prototype and synthesises accessor properties for
 * every getX / isX / setX method that does not already have a property.
 */
function propName(method, prefix) {
  const rest = method.slice(prefix.length);
  if (!rest) return null;
  // getID -> ID, getUUID -> UUID, getHttpHost -> httpHost, getATS -> ATS
  if (rest.length > 1 && rest[1] === rest[1].toUpperCase() && /[A-Z]/.test(rest[1])) return rest;
  return rest[0].toLowerCase() + rest.slice(1);
}

function bean(Class) {
  const proto = Class.prototype;
  const names = Object.getOwnPropertyNames(proto);
  const getters = new Map();
  const setters = new Map();
  for (const name of names) {
    if (name === 'constructor') continue;
    const desc = Object.getOwnPropertyDescriptor(proto, name);
    if (typeof desc.value !== 'function') continue;
    if (/^get[A-Z]/.test(name) && desc.value.length === 0) getters.set(propName(name, 'get'), name);
    else if (/^is[A-Z]/.test(name) && desc.value.length === 0) {
      const p = propName(name, 'is');
      if (!getters.has(p)) getters.set(p, name);
    } else if (/^set[A-Z]/.test(name) && desc.value.length === 1) setters.set(propName(name, 'set'), name);
  }
  const all = new Set([...getters.keys(), ...setters.keys()]);
  for (const prop of all) {
    if (hasOwnInChain(proto, prop)) continue;
    const g = getters.get(prop);
    const s = setters.get(prop);
    Object.defineProperty(proto, prop, {
      configurable: true,
      enumerable: false,
      get: g ? function () { return this[g](); } : undefined,
      set: s ? function (v) { this[s](v); } : (g ? function (v) {
        // Allow overriding a read-only bean property with an own value
        // (Rhino silently ignores; we store the value so tests/mocks can set it).
        Object.defineProperty(this, prop, { value: v, writable: true, configurable: true, enumerable: true });
      } : undefined),
    });
  }
  // Static constants: keep as they are.
  Object.defineProperty(Class, '__sfccBean', { value: true });
  return Class;
}

function hasOwnInChain(proto, prop) {
  let p = proto;
  while (p && p !== Object.prototype) {
    if (Object.prototype.hasOwnProperty.call(p, prop)) return true;
    p = Object.getPrototypeOf(p);
  }
  return false;
}

module.exports = { bean, propName };
