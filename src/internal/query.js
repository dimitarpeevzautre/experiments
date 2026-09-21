'use strict';
/**
 * Evaluates SFCC object query strings such as
 *   "custom.status = {0} AND creationDate >= {1}"   (with positional args)
 *   "email ILIKE {0}", "ID != NULL", "x IN ({0})"
 * against JS objects (bean properties), plus sort strings like "creationDate desc, ID asc".
 * Also accepts an object literal query ({ field: value }) as used by queryCustomObjects in some code.
 */
function getPath(o, p) {
  return String(p).split('.').reduce((x, k) => {
    if (x == null) return undefined;
    const v = x[k];
    if (v === undefined && typeof x.get === 'function') { try { return x.get(k); } catch (e) { return undefined; } }
    return typeof v === 'function' ? v.call(x) : v;
  }, o);
}
function norm(v) {
  if (v == null) return null;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'object' && typeof v.getValue === 'function') return norm(v.getValue());
  if (typeof v === 'object' && typeof v.valueOf === 'function' && v.valueOf() !== v) return norm(v.valueOf());
  return v;
}
function cmp(a, b) { a = norm(a); b = norm(b); if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0; if (a == null || b == null) return a == null && b == null ? 0 : a == null ? -1 : 1; return a < b ? -1 : a > b ? 1 : 0; }
function like(v, pattern, ci) {
  if (v == null) return false;
  let s = String(v); let p = String(pattern);
  if (ci) { s = s.toLowerCase(); p = p.toLowerCase(); }
  const re = new RegExp('^' + p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/%/g, '.*').replace(/_/g, '.') + '$', 's');
  return re.test(s);
}

function tokenize(q) {
  const tokens = [];
  const re = /\s*(\(|\)|\{\d+\}|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|<=|>=|!=|=|<|>|[A-Za-z_][\w.]*|-?\d+(?:\.\d+)?|,)/gy;
  let m; let last = 0;
  while ((m = re.exec(q))) { tokens.push(m[1]); last = re.lastIndex; }
  if (q.slice(last).trim()) throw new Error(`Cannot parse query: ${q}`);
  return tokens;
}
function parse(tokens, args) {
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];
  const value = (t) => {
    if (/^\{\d+\}$/.test(t)) return args[Number(t.slice(1, -1))];
    if (/^['"]/.test(t)) return t.slice(1, -1).replace(/\\(.)/g, '$1');
    if (/^-?\d/.test(t)) return Number(t);
    if (/^null$/i.test(t)) return null;
    if (/^(true|false)$/i.test(t)) return t.toLowerCase() === 'true';
    return t;
  };
  function orExpr() { let l = andExpr(); while (peek() && /^or$/i.test(peek())) { next(); const r = andExpr(); const ll = l; l = (o) => ll(o) || r(o); } return l; }
  function andExpr() { let l = notExpr(); while (peek() && /^and$/i.test(peek())) { next(); const r = notExpr(); const ll = l; l = (o) => ll(o) && r(o); } return l; }
  function notExpr() { if (peek() && /^not$/i.test(peek())) { next(); const e = notExpr(); return (o) => !e(o); } return primary(); }
  function primary() {
    if (peek() === '(') { next(); const e = orExpr(); if (next() !== ')') throw new Error('Expected )'); return e; }
    const field = next();
    const op = next();
    if (!op) throw new Error(`Incomplete query near '${field}'`);
    const opU = op.toUpperCase();
    if (opU === 'IS') { const n = next(); if (/^not$/i.test(n)) { next(); return (o) => getPath(o, field) != null; } return (o) => getPath(o, field) == null; }
    if (opU === 'IN' || opU === 'NOT') {
      let negate = false; let t = op;
      if (opU === 'NOT') { negate = true; t = next(); }
      if (t.toUpperCase() === 'IN') {
        if (next() !== '(') throw new Error('Expected (');
        let vals = [];
        while (peek() !== ')') { const v = value(next()); vals = vals.concat(Array.isArray(v) ? v : (v && typeof v.toArray === 'function' ? v.toArray() : [v])); if (peek() === ',') next(); }
        next();
        return (o) => { const fv = norm(getPath(o, field)); const r = vals.some((v) => norm(v) === fv); return negate ? !r : r; };
      }
      if (t.toUpperCase() === 'LIKE' || t.toUpperCase() === 'ILIKE') { const v = value(next()); return (o) => !like(getPath(o, field), v, t.toUpperCase() === 'ILIKE'); }
      throw new Error(`Unsupported operator NOT ${t}`);
    }
    const rhs = value(next());
    switch (opU) {
      case '=': return (o) => { const fv = norm(getPath(o, field)); return rhs == null ? fv == null : (fv === norm(rhs) || (fv != null && rhs != null && String(fv) === String(norm(rhs)))); };
      case '!=': return (o) => { const fv = norm(getPath(o, field)); return rhs == null ? fv != null : !(fv === norm(rhs) || (fv != null && String(fv) === String(norm(rhs)))); };
      case '<': return (o) => getPath(o, field) != null && cmp(getPath(o, field), rhs) < 0;
      case '<=': return (o) => getPath(o, field) != null && cmp(getPath(o, field), rhs) <= 0;
      case '>': return (o) => getPath(o, field) != null && cmp(getPath(o, field), rhs) > 0;
      case '>=': return (o) => getPath(o, field) != null && cmp(getPath(o, field), rhs) >= 0;
      case 'LIKE': return (o) => like(getPath(o, field), rhs, false);
      case 'ILIKE': return (o) => like(getPath(o, field), rhs, true);
      default: throw new Error(`Unsupported operator ${op}`);
    }
  }
  const fn = orExpr();
  if (i < tokens.length) throw new Error(`Unexpected token '${tokens[i]}' in query`);
  return fn;
}

function compile(queryString, args = []) {
  if (queryString == null || String(queryString).trim() === '') return () => true;
  if (typeof queryString === 'object') { const entries = Object.entries(queryString); return (o) => entries.every(([k, v]) => { const fv = norm(getPath(o, k)); return v == null ? fv == null : String(fv) === String(norm(v)); }); }
  return parse(tokenize(String(queryString)), args);
}
function sorter(sortString) {
  if (!sortString) return null;
  const parts = String(sortString).split(',').map((s) => s.trim()).filter(Boolean).map((s) => { const [f, dir] = s.split(/\s+/); return [f, dir && dir.toLowerCase() === 'desc' ? -1 : 1]; });
  return (a, b) => { for (const [f, dir] of parts) { const r = cmp(getPath(a, f), getPath(b, f)); if (r) return r * dir; } return 0; };
}
function query(items, queryString, sortString, args = []) {
  const pred = compile(queryString, args);
  let out = items.filter((o) => { try { return pred(o); } catch (e) { return false; } });
  const s = sorter(sortString);
  if (s) out = out.slice().sort(s);
  return out;
}
module.exports = { query, compile, sorter, getPath, like };
