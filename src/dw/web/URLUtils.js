'use strict';
const URL = require('./URL');
const URLAction = require('./URLAction');
const URLParameter = require('./URLParameter');
const rtRef = require('../../runtime');

function ctx() {
  const rt = rtRef.current();
  const Site = rt.dw.get('system/Site');
  const site = Site.getCurrent();
  const req = rt.context.request;
  const locale = (req && req.getLocale()) || rt.config.locale || 'default';
  return { rt, site, locale, req };
}
function build(action, params, opts = {}) {
  const c = ctx();
  let siteId = c.site.getID(); let locale = c.locale; let host = null;
  if (action instanceof URLAction) { siteId = action.getSiteName() || siteId; locale = action.getLocale() || locale; host = action.getHostName(); action = action.getAction(); }
  action = String(action);
  const style = c.rt.config.urlStyle || 'store';
  let path = style === 'short' ? `/${action}` : `/on/demandware.store/Sites-${siteId}-Site/${locale}/${action}`;
  let url = new URL(path);
  const list = [];
  for (let i = 0; i < params.length; i++) {
    const p = params[i];
    if (p instanceof URLParameter) list.push([p.getName(), p.getValue()]);
    else if (p !== undefined && i + 1 < params.length && !(params[i + 1] instanceof URLParameter)) { list.push([p, params[i + 1]]); i++; }
  }
  for (const [k, v] of list) url = url.append(k, v);
  if (opts.abs) {
    const proto = opts.https ? 'https' : opts.http ? 'http' : (c.req && c.req.isHttpSecure() ? 'https' : 'http');
    const h = host || (proto === 'https' ? c.site.getHttpsHostName() : c.site.getHttpHostName());
    url = new URL(`${proto}://${h}${url.toString()}`);
  }
  return url;
}
function staticURL(rel, opts = {}) {
  const c = ctx();
  let r = String(rel);
  if (/^https?:\/\//.test(r) || r.startsWith('//')) return new URL(r);
  if (r.startsWith('/')) r = r.slice(1);
  const path = `/on/demandware.static/Sites-${c.site.getID()}-Site/-/${c.locale}/v1/${r}`;
  if (opts.abs) { const proto = opts.https ? 'https' : 'http'; return new URL(`${proto}://${c.site.getHttpHostName()}${path}`); }
  return new URL(path);
}
const URLUtils = {
  url(action, ...p) { return build(action, p); },
  http(action, ...p) { return build(action, p, { abs: true, http: true }); },
  https(action, ...p) { return build(action, p, { abs: true, https: true }); },
  abs(action, ...p) { return build(action, p, { abs: true }); },
  home() { return build('Home-Show', []); },
  httpHome() { return build('Home-Show', [], { abs: true, http: true }); },
  httpsHome() { return build('Home-Show', [], { abs: true, https: true }); },
  httpWebRoot() { return staticURL('', { abs: true, http: true }); },
  httpsWebRoot() { return staticURL('', { abs: true, https: true }); },
  webRoot() { return staticURL(''); },
  staticURL(rel) { return staticURL(rel); },
  httpStatic(rel) { return staticURL(rel, { abs: true, http: true }); },
  httpsStatic(rel) { return staticURL(rel, { abs: true, https: true }); },
  absStatic(rel) { return staticURL(rel, { abs: true }); },
  imageURL(rel) { return staticURL(rel); },
  absImage(rel) { return staticURL(rel, { abs: true }); },
  httpImage(rel) { return staticURL(rel, { abs: true, http: true }); },
  httpsImage(rel) { return staticURL(rel, { abs: true, https: true }); },
  continueURL() { const c = ctx(); const r = c.req; return new URL(r ? `${r.getHttpPath()}${r.getHttpQueryString() ? '?' + r.getHttpQueryString() : ''}` : '/'); },
  httpContinue() { return URLUtils.continueURL().http(); },
  httpsContinue() { return URLUtils.continueURL().https(); },
  sessionRedirect(host, url) { return new URL(String(url)); },
  sessionRedirectHttpOnly(host, url) { return new URL(String(url)); },
  urlWithParams(action, params) { return build(action, Object.entries(params || {}).flat()); },
  _parse(urlString) {
    // returns {controller, action, params} for a store URL built by this module
    const s = String(urlString);
    const m = s.match(/(?:\/on\/demandware\.store\/Sites-[^/]+-Site\/[^/]+)?\/([A-Za-z0-9_]+-[A-Za-z0-9_]+)(?:\?(.*))?$/);
    if (!m) return null;
    const [controller, action] = m[1].split('-');
    const params = {};
    if (m[2]) for (const kv of m[2].split('&')) { const [k, v = ''] = kv.split('='); params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); }
    return { controller, action, params };
  },
};
module.exports = URLUtils;
