'use strict';
const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');

/**
 * Maps an HTTP request onto a controller function, with SFCC request/response/session semantics.
 * Supported URL forms:
 *   /on/demandware.store/Sites-<site>-Site/<locale>/<Controller>-<Action>
 *   /s/<site>/[<locale>/]<Controller>-<Action>
 *   /<Controller>-<Action>
 *   /on/demandware.static/... and /static/...   (static assets from cartridges)
 */
function parseRoute(rt, urlPath) {
  const p = decodeURIComponent(urlPath.split('?')[0]);
  let m;
  if ((m = /^\/on\/demandware\.store\/Sites-([^/]+)-Site\/([^/]+)\/([A-Za-z0-9_]+)-([A-Za-z0-9_]+)\/?$/.exec(p))) return { site: m[1], locale: m[2], controller: m[3], action: m[4] };
  if ((m = /^\/on\/demandware\.store\/Sites-([^/]+)-Site\/([^/]+)\/?$/.exec(p))) return { site: m[1], locale: m[2], controller: 'Home', action: 'Show' };
  if ((m = /^\/s\/([^/]+)\/(?:([a-z]{2}(?:_[A-Z]{2})?|default)\/)?([A-Za-z0-9_]+)-([A-Za-z0-9_]+)\/?$/.exec(p))) return { site: m[1], locale: m[2] || null, controller: m[3], action: m[4] };
  if ((m = /^\/s\/([^/]+)\/?(?:([a-z]{2}(?:_[A-Z]{2})?|default)\/?)?$/.exec(p))) return { site: m[1], locale: m[2] || null, controller: 'Home', action: 'Show' };
  if ((m = /^\/(?:([a-z]{2}(?:_[A-Z]{2})?)\/)?([A-Za-z0-9_]+)-([A-Za-z0-9_]+)\/?$/.exec(p))) return { site: null, locale: m[1] || null, controller: m[2], action: m[3] };
  if (p === '/' || p === '') { const [c, a] = (rt.config.defaultRoute || 'Home-Show').split('-'); return { site: null, locale: null, controller: c, action: a }; }
  return null;
}

function parseCookies(header) {
  const out = [];
  if (!header) return out;
  for (const part of String(header).split(';')) { const i = part.indexOf('='); if (i === -1) continue; out.push({ name: part.slice(0, i).trim(), value: decodeURIComponent(part.slice(i + 1).trim()) }); }
  return out;
}

function parseBody(body, contentType) {
  if (body == null || body === '') return {};
  const ct = String(contentType || '').toLowerCase();
  const text = Buffer.isBuffer(body) ? body.toString('utf8') : String(body);
  if (ct.includes('application/json')) { try { const j = JSON.parse(text); return typeof j === 'object' && j ? flatten(j) : {}; } catch (e) { return {}; } }
  if (ct.includes('multipart/form-data')) {
    const m = /boundary=("?)([^";]+)\1/.exec(ct); if (!m) return {};
    const out = {};
    for (const part of text.split(`--${m[2]}`)) { const hm = /name="([^"]+)"/.exec(part); if (!hm) continue; const idx = part.indexOf('\r\n\r\n'); if (idx === -1) continue; addParam(out, hm[1], part.slice(idx + 4).replace(/\r\n$/, '')); }
    return out;
  }
  const out = {};
  for (const [k, v] of new URLSearchParams(text)) addParam(out, k, v);
  return out;
}
function flatten(obj, prefix = '', out = {}) { for (const [k, v] of Object.entries(obj)) { const key = prefix ? `${prefix}.${k}` : k; if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out); else out[key] = Array.isArray(v) ? v.map(String) : String(v); } return out; }
function addParam(out, k, v) { if (out[k] === undefined) out[k] = v; else out[k] = [].concat(out[k], v); }

function findController(rt, name) {
  return rt.findInCartridges(path.join('controllers', `${name}.js`)) || rt.findInCartridges(path.join('controllers', `${name}.ds`));
}

/** Core dispatch: returns { status, headers, body, cookies, contentType, redirect } */
function dispatch(rt, o = {}) {
  const method = (o.method || 'GET').toUpperCase();
  const rawUrl = o.url || o.path || '/';
  const [urlPath, qs = ''] = rawUrl.split('?');
  const headers = lower(o.headers || {});
  const query = {}; for (const [k, v] of new URLSearchParams(qs)) addParam(query, k, v);
  const bodyParams = ['POST', 'PUT', 'PATCH'].includes(method) ? parseBody(o.body, headers['content-type']) : {};
  const params = Object.assign({}, query, bodyParams, o.params || {});
  const cookies = parseCookies(headers.cookie).concat(o.cookies || []);

  // static assets
  const st = serveStatic(rt, urlPath);
  if (st) return st;

  const route = parseRoute(rt, urlPath);
  if (!route) return { status: 404, headers: {}, body: `Not found: ${urlPath}`, cookies: [], contentType: 'text/plain' };
  const siteId = route.site || rt.config.site;
  if (route.site && route.site !== rt.config.site && rt.siteData(route.site)) rt.config.site = route.site; // switch site if known
  const siteData = rt.siteData(siteId) || {};
  const locale = route.locale || (o.locale) || siteData.defaultLocale || rt.config.locale || 'default';

  const dwsid = cookies.find((c) => c.name === 'dwsid');
  const session = o.session || rt.sessions.getOrCreate(dwsid && dwsid.value);
  const Request = rt.dw.get('system/Request');
  const Response = rt.dw.get('system/Response');
  const request = new Request({ method, path: urlPath, query: qs, params, headers, cookies, body: o.body == null ? null : (Buffer.isBuffer(o.body) ? o.body.toString('utf8') : String(o.body)), locale, session, host: headers.host || `${rt.config.hostname}${rt.config.port && rt.config.port !== 80 ? ':' + rt.config.port : ''}`, protocol: o.protocol || (headers['x-forwarded-proto'] || 'http'), remoteAddress: o.remoteAddress, include: !!o.include, controller: route.controller, action: route.action });
  const response = new Response();
  const ctx = { request, response, session, get customer() { return session.getCustomer(); }, set customer(c) { session._setCustomer(c); } };

  // SFCC evaluates modules once per request: give every dispatch its own module scope
  const parentCache = rt.loader.cache;
  rt.loader.cache = new Map();
  try {
  return rt.withContext(ctx, () => {
    let result;
    try {
      if (!o.include) session.getClickStream()._add({ path: urlPath, query: qs, pipeline: `${route.controller}-${route.action}`, time: new Date(), referer: headers.referer, ua: headers['user-agent'], host: headers.host, locale });
      // form population from dwfrm_ parameters
      if (Object.keys(params).some((k) => k.startsWith('dwfrm_'))) { const triggered = session.getForms()._accept(params); if (triggered) { request._triggeredFormAction = triggered; request._triggeredForm = triggered._root(); } }
      rt.emit('request', { route, request });
      const file = findController(rt, route.controller);
      if (!file) { result = notFound(rt, ctx, route, `Controller ${route.controller} not found`); }
      else {
        const controller = rt.loader.load(file, rt.cartridgeOf(file));
        const fn = controller[route.action];
        if (typeof fn !== 'function' || (fn.public !== true && rt.config.requirePublic !== false)) result = notFound(rt, ctx, route, `Action ${route.controller}-${route.action} is not public`);
        else {
          const r = fn.call(controller, request, response);
          if (r && typeof r === 'object' && typeof r.then === 'function') throw new Error('Controllers must be synchronous (SFCC has no async runtime)');
          result = buildResult(rt, ctx);
        }
      }
    } catch (e) {
      rt.log('error', 'dispatcher', `${route.controller}-${route.action}: ${e.stack || e}`);
      result = errorPage(rt, ctx, route, e);
    }
    result.cookies = result.cookies || [];
    if (!o.include && !dwsid) { const Cookie = rt.dw.get('web/Cookie'); const c = new Cookie('dwsid', session.getSessionID()); c.setHttpOnly(true); result.cookies.unshift(c); }
    result.session = session; result.request = request; result.response = response;
    rt.store.flush();
    return result;
  });
  } finally { rt.loader.cache = parentCache; }
}

function buildResult(rt, ctx) {
  const resp = ctx.response;
  const headers = Object.assign({}, resp._headers);
  const body = resp._body();
  return { status: resp._status, headers, body, contentType: resp._contentType, cookies: resp._cookies.slice(), redirect: resp._redirect };
}

function notFound(rt, ctx, route, msg) {
  ctx.response.setStatus(404);
  const errFile = findController(rt, 'Error');
  if (errFile && route.controller !== 'Error') {
    try { const c = rt.loader.load(errFile, rt.cartridgeOf(errFile)); const fn = c.ErrorCode || c.Start; if (typeof fn === 'function') { ctx.request._params._set('err', '404'); ctx.request._params._set('ErrorCode', '404'); fn.call(c); const r = buildResult(rt, ctx); r.status = 404; return r; } } catch (e) { rt.log('warn', 'dispatcher', `Error controller failed: ${e.message}`); }
  }
  return { status: 404, headers: {}, body: msg, contentType: 'text/plain', cookies: [] };
}
function errorPage(rt, ctx, route, e) {
  ctx.response._reset(); ctx.response.setStatus(500);
  const errFile = findController(rt, 'Error');
  if (errFile && route.controller !== 'Error') {
    try { const c = rt.loader.load(errFile, rt.cartridgeOf(errFile)); if (typeof c.Start === 'function') { ctx.request._error = e; ctx.request.getCustom().errorMessage = e.message; c.Start.call(c); const r = buildResult(rt, ctx); r.status = 500; r.error = e; return r; } } catch (e2) { rt.log('warn', 'dispatcher', `Error controller failed: ${e2.message}`); }
  }
  const body = rt.config.debug === false ? 'Internal Server Error' : `<pre>${escapeHtml(e.stack || String(e))}</pre>`;
  return { status: 500, headers: {}, body, contentType: 'text/html;charset=UTF-8', cookies: [], error: e };
}
function escapeHtml(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function lower(h) { const o = {}; for (const [k, v] of Object.entries(h)) o[k.toLowerCase()] = v; return o; }

const MIME = { '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.json': 'application/json', '.html': 'text/html', '.txt': 'text/plain', '.map': 'application/json', '.webp': 'image/webp', '.pdf': 'application/pdf' };
function serveStatic(rt, urlPath) {
  let m; let candidates = [];
  const p = decodeURIComponent(urlPath);
  if ((m = /^\/on\/demandware\.static\/Sites-[^/]+-Site\/-\/([^/]+)\/v[^/]*\/(.+)$/.exec(p))) { for (const loc of rt.localeFallback(m[1])) candidates.push(...rt.findAllInCartridges(path.join('static', loc, m[2]))); }
  else if ((m = /^\/on\/demandware\.static\/-\/Sites-([^/]+)\/([^/]+)\/(.+)$/.exec(p))) { const dd = rt.store.dataDir; if (dd) candidates.push(path.join(dd, 'files', 'CATALOGS', m[1], m[2], m[3]), path.join(dd, 'files', 'LIBRARIES', m[1], m[2], m[3]), path.join(dd, 'images', m[3]), path.join(dd, 'static', m[3])); }
  else if ((m = /^\/static\/(.+)$/.exec(p))) { for (const loc of rt.localeFallback()) candidates.push(...rt.findAllInCartridges(path.join('static', loc, m[1]))); }
  else return null;
  const file = candidates.find((f) => { try { return fs.statSync(f).isFile(); } catch (e) { return false; } });
  if (!file) return { status: 404, headers: {}, body: 'Static resource not found', contentType: 'text/plain', cookies: [], static: true };
  return { status: 200, headers: { 'Cache-Control': 'public, max-age=3600' }, body: fs.readFileSync(file), contentType: MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', cookies: [], static: true };
}

/** Render a remote include (<isinclude url=...>) within the current session, synchronously. */
function renderInclude(rt, url) {
  const parent = rt.context;
  const u = String(url);
  let rel = u.replace(/^https?:\/\/[^/]+/, '');
  const r = dispatch(rt, { method: 'GET', url: rel, headers: parent.request ? Object.assign({}, parent.request._headers) : {}, session: parent.session, include: true, locale: parent.request ? parent.request.getLocale() : undefined });
  if (r.status >= 400) rt.log('warn', 'include', `Remote include ${u} returned ${r.status}`);
  return Buffer.isBuffer(r.body) ? r.body.toString('utf8') : String(r.body || '');
}

module.exports = { dispatch, parseRoute, renderInclude, parseBody, parseCookies, findController };
