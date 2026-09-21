'use strict';
/** Parses a query string into an object; handles SFCC variation (dwvar_) and option (dwopt_) params like SFRA. */
function QueryString(raw) {
  const q = String(raw || '').replace(/^\?/, '');
  if (!q) return;
  const vars = {}; const opts = {}; const prefs = {};
  for (const pair of q.split('&')) {
    if (!pair) continue;
    const [k, v = ''] = pair.split('=');
    const key = decodeURIComponent(k); const val = decodeURIComponent(v.replace(/\+/g, ' '));
    let m;
    if ((m = /^dwvar_([^_]+)_(.+)$/.exec(key))) { vars[m[2]] = { id: m[1], value: val }; continue; }
    if ((m = /^dwopt_([^_]+)_(.+)$/.exec(key))) { opts[m[2]] = { productId: m[1], optionId: m[2], selectedValueId: val }; continue; }
    if ((m = /^prefn(\d+)$/.exec(key))) { prefs[m[1]] = prefs[m[1]] || {}; prefs[m[1]].name = val; continue; }
    if ((m = /^prefv(\d+)$/.exec(key))) { prefs[m[1]] = prefs[m[1]] || {}; prefs[m[1]].value = val; continue; }
    this[key] = val;
  }
  if (Object.keys(vars).length) this.variables = vars;
  if (Object.keys(opts).length) this.options = Object.values(opts);
  if (Object.keys(prefs).length) this.preferences = Object.fromEntries(Object.values(prefs).map((p) => [p.name, p.value]));
}
QueryString.prototype.toString = function () { return Object.entries(this).filter(([k, v]) => typeof v !== 'object').map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'); };
module.exports = QueryString;
