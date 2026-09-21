'use strict';
const { bean } = require('../../util/bean');
const URLUtils = require('../web/URLUtils');
const URL = require('../web/URL');
const HashMap = require('../util/HashMap');
class SearchModel {
  constructor() { this._phrase = null; this._refinements = {}; this._sortRule = null; this._start = 0; this._pageSize = 12; this._executed = false; this._promo = null; }
  getSearchPhrase() { return this._phrase; }
  setSearchPhrase(p) { this._phrase = p == null ? null : String(p).trim(); }
  isEmptyQuery() { return !this._phrase && !Object.keys(this._refinements).length; }
  getEmptyQuery() { return this.isEmptyQuery(); }
  isRefinedSearch() { return Object.keys(this._refinements).length > 0; }
  isRefinedByAttribute(id) { return !!(this._refinements[id] && this._refinements[id].length); }
  isRefinedByAttributeValue(id, v) { return !!(this._refinements[id] && this._refinements[id].map(String).includes(String(v))); }
  getRefinementValues(id) { return this._refinements[id] || []; }
  getRefinementValue(id) { return this._refinements[id] ? this._refinements[id][0] : null; }
  addRefinementValues(id, values) { const arr = typeof values === 'string' ? values.split('|') : Array.from(values || []); this._refinements[id] = (this._refinements[id] || []).concat(arr.map(String)); }
  setRefinementValues(id, values) { this._refinements[id] = (typeof values === 'string' ? values.split('|') : Array.from(values || [])).map(String); if (!this._refinements[id].length) delete this._refinements[id]; }
  removeRefinementValues(id, values) { if (!this._refinements[id]) return; const rm = (typeof values === 'string' ? values.split('|') : Array.from(values || [])).map(String); this._refinements[id] = this._refinements[id].filter((v) => !rm.includes(v)); if (!this._refinements[id].length) delete this._refinements[id]; }
  removeRefinementValue(id, value) { this.removeRefinementValues(id, [value]); }
  getRefinementParameters() { const m = new HashMap(); let i = 1; for (const [k, v] of Object.entries(this._refinements)) { m.put(`prefn${i}`, k); m.put(`prefv${i}`, v.join('|')); i++; } return m; }
  getRefinementMaxValue(id) { return this._refinements[id] ? Math.max(...this._refinements[id].map(Number)) : null; }
  getRefinementMinValue(id) { return this._refinements[id] ? Math.min(...this._refinements[id].map(Number)) : null; }
  setRefinementValueRange(id, min, max) { this._refinements[id] = [String(min), String(max)]; }
  _baseParams() { const p = []; if (this._phrase) p.push('q', this._phrase); return p; }
  _refParams(refs) { const p = []; let i = 1; for (const [k, v] of Object.entries(refs)) { p.push(`prefn${i}`, k, `prefv${i}`, v.join('|')); i++; } return p; }
  url(action) { return URLUtils.url(action, ...this._baseParams(), ...this._refParams(this._refinements), ...this._extraParams()); }
  _extraParams() { return []; }
  urlRefineAttribute(action, id, value) { const refs = Object.assign({}, this._refinements, { [id]: [String(value)] }); return URLUtils.url(action, ...this._baseParams(), ...this._refParams(refs), ...this._extraParams()); }
  urlRefineAttributeValue(action, id, value) { const refs = Object.assign({}, this._refinements); refs[id] = (refs[id] || []).concat([String(value)]).filter((v, i, a) => a.indexOf(v) === i); return URLUtils.url(action, ...this._baseParams(), ...this._refParams(refs), ...this._extraParams()); }
  urlRelaxAttribute(action, id) { const refs = Object.assign({}, this._refinements); delete refs[id]; return URLUtils.url(action, ...this._baseParams(), ...this._refParams(refs), ...this._extraParams()); }
  urlRelaxAttributeValue(action, id, value) { const refs = Object.assign({}, this._refinements); refs[id] = (refs[id] || []).filter((v) => v !== String(value)); if (!refs[id].length) delete refs[id]; return URLUtils.url(action, ...this._baseParams(), ...this._refParams(refs), ...this._extraParams()); }
  urlRefineAttributeValueRange(action, id, min, max) { return this.urlRefineAttribute(action, id, `${min}|${max}`); }
  setSortingRule(r) { this._sortRule = r; }
  getSortingRule() { return this._sortRule; }
  static urlForRefine(action, name, value) { return URLUtils.url(action, name, value); }
  static urlRefineAttribute(action, id, value) { return URLUtils.url(action, 'prefn1', id, 'prefv1', value); }
  static urlRefineAttributeValue(action, id, value) { return URLUtils.url(action, 'prefn1', id, 'prefv1', value); }
  static _parse(paramMap, model) {
    // populate from request parameters (q, cgid, prefn1/prefv1.., pmin, pmax, srule, start, sz)
    const get = (k) => { const p = paramMap.get ? paramMap.get(k) : null; return p && p.isSubmitted && p.isSubmitted() ? p.getStringValue() : (paramMap[k] !== undefined && typeof paramMap[k] !== 'object' ? paramMap[k] : null); };
    if (get('q')) model.setSearchPhrase(get('q'));
    for (let i = 1; i <= 20; i++) { const n = get(`prefn${i}`); const v = get(`prefv${i}`); if (n && v != null) model.addRefinementValues(n, v); }
    return model;
  }
}
Object.assign(SearchModel, { SEARCH_PHRASE_PARAMETER: 'q', REFINE_NAME_PARAMETER_PREFIX: 'prefn', REFINE_VALUE_PARAMETER_PREFIX: 'prefv', MIN_MAX_PARAMETER_PREFIX: 'pmin', MAX_MAX_PARAMETER_PREFIX: 'pmax', SORT_BY_PARAMETER_PREFIX: 'psortb', SORT_DIRECTION_PARAMETER_PREFIX: 'psortd' });
module.exports = bean(SearchModel);
