'use strict';
const { bean } = require('../../util/bean');
const FormGroup = require('./FormGroup');
/** session.forms – lazily instantiates each named form definition; `forms.profile` etc. */
class Forms {
  constructor(session) {
    this._session = session;
    this._forms = {};
    return new Proxy(this, {
      get(t, k) { if (typeof k === 'symbol' || k in t) return t[k]; return t.getForm(k); },
      has(t, k) { return k in t || !!t.getForm(k); },
    });
  }
  getForm(name) {
    if (this._forms[name] !== undefined) return this._forms[name];
    const rt = require('../../runtime').current();
    const locale = rt.context.request ? rt.context.request.getLocale() : null;
    const def = rt.forms.get(name, locale);
    if (!def) { this._forms[name] = null; return null; }
    const g = new FormGroup(def, null, name);
    this._forms[name] = g;
    return g;
  }
  clearFormElement(name) { const f = this.getForm(name); if (f) f.clearFormElement(); }
  _reset() { this._forms = {}; }
  /** Populate all forms from request params (platform does this before the controller runs). */
  _accept(params) {
    const names = new Set();
    for (const k of Object.keys(params)) { const m = /^dwfrm_([A-Za-z0-9]+)_/.exec(k); if (m) names.add(m[1]); }
    let triggered = null;
    for (const n of names) { const f = this.getForm(n); if (f) { const t = f._accept(params); if (t) triggered = t; } }
    return triggered;
  }
}
module.exports = bean(Forms);
