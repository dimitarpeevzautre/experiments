'use strict';
/**
 * Rhino/SFCC global scope: `dw`, `empty()`, `request`, `response`, `session`, `customer`,
 * PIPELET_NEXT / PIPELET_ERROR, importPackage/importClass fallbacks, `for each` iteration helper.
 * Installed on globalThis (this process is dedicated to running SFCC code).
 */
function install(rt) {
  const g = globalThis;
  const def = (name, get, set) => Object.defineProperty(g, name, { configurable: true, enumerable: false, get, set });
  const val = (name, value) => Object.defineProperty(g, name, { configurable: true, enumerable: false, writable: true, value });

  def('dw', () => rt.dw.namespace);
  def('request', () => rt.context.request, (v) => { rt.context.request = v; });
  def('response', () => rt.context.response, (v) => { rt.context.response = v; });
  def('session', () => rt.context.session, (v) => { rt.context.session = v; });
  def('customer', () => rt.context.customer, (v) => { rt.context.customer = v; });
  val('PIPELET_NEXT', 1);
  val('PIPELET_ERROR', 0);
  val('empty', empty);
  val('__sfccIter', iter);
  val('importPackage', () => {});
  val('importClass', () => {});
  val('importScript', (spec) => { throw new Error(`importScript('${spec}') must appear at the top level of a script so it can be inlined`); });
  val('trace', (...args) => rt.log('debug', 'trace', args.join(' ')));
  val('webreferences', stubNamespace('webreferences'));
  val('webreferences2', stubNamespace('webreferences2'));
  val('__sfccRuntime', rt);

  if (!String.prototype.equals) {
    Object.defineProperty(String.prototype, 'equals', { value(o) { return o != null && String(this) === String(o); }, writable: true, configurable: true });
    Object.defineProperty(String.prototype, 'equalsIgnoreCase', { value(o) { return o != null && String(this).toLowerCase() === String(o).toLowerCase(); }, writable: true, configurable: true });
    Object.defineProperty(String.prototype, 'isEmpty', { value() { return this.length === 0; }, writable: true, configurable: true });
    Object.defineProperty(String.prototype, 'contains', { value(s) { return this.includes(s); }, writable: true, configurable: true });
    Object.defineProperty(String.prototype, 'hashCode', { value() { let h = 0; for (let i = 0; i < this.length; i++) h = (h * 31 + this.charCodeAt(i)) | 0; return h; }, writable: true, configurable: true });
  }
}

function empty(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.length === 0;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') {
    if (typeof v.isEmpty === 'function') return !!v.isEmpty();
    if (typeof v.size === 'function') return v.size() === 0;
    if (typeof v.getLength === 'function') return v.getLength() === 0;
    if (typeof v.hasNext === 'function') return !v.hasNext();
    if (v instanceof Date) return false;
    if (typeof v.valueOf === 'function' && v.valueOf() !== v) return empty(v.valueOf());
  }
  return false;
}

function iter(v) {
  if (v == null) return [];
  if (Array.isArray(v) || typeof v === 'string') return v;
  if (typeof v[Symbol.iterator] === 'function') return v;
  if (typeof v.iterator === 'function') { const it = v.iterator(); return { [Symbol.iterator]: () => ({ next: () => (it.hasNext() ? { value: it.next(), done: false } : { value: undefined, done: true }) }) }; }
  if (typeof v.hasNext === 'function') return { [Symbol.iterator]: () => ({ next: () => (v.hasNext() ? { value: v.next(), done: false } : { value: undefined, done: true }) }) };
  if (typeof v === 'object') return Object.values(v);
  return [v];
}

function stubNamespace(name) {
  return new Proxy({}, { get(t, k) { if (typeof k === 'symbol' || k === 'then') return undefined; throw new Error(`${name}.${String(k)}: WSDL web references are not supported; use dw.svc.LocalServiceRegistry with an HTTP service instead`); } });
}

module.exports = { install, empty, iter };
