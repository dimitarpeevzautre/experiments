'use strict';
const rtRef = require('../../runtime');
/** data/tax.json: { policy: 'net'|'gross', defaultTaxClassID, defaultJurisdictionID, jurisdictions: { ID: { countries: [], states: [], postalCodes: [] } }, rates: { jurisdictionID: { taxClassID: rate } } } */
function cfg() { return rtRef.current().store.get('tax', {}); }
const TaxMgr = {
  TAX_POLICY_NET: 0, TAX_POLICY_GROSS: 1,
  getTaxationPolicy() { return (cfg().policy || 'net') === 'gross' ? 1 : 0; },
  getDefaultTaxClassID() { return cfg().defaultTaxClassID || 'standard'; },
  getDefaultTaxJurisdictionID() { return cfg().defaultJurisdictionID || 'default'; },
  getCustomRateTaxClassID() { return 'CUSTOM_RATE'; },
  getTaxExemptTaxClassID() { return 'TAX_EXEMPT'; },
  getTaxJurisdictionID(location) {
    const j = cfg().jurisdictions || {};
    const cc = location && location.getCountryCode ? String(location.getCountryCode() || '').toUpperCase() : '';
    const st = location && location.getStateCode ? String(location.getStateCode() || '').toUpperCase() : '';
    const pc = location && location.getPostalCode ? String(location.getPostalCode() || '') : '';
    let best = null; let score = -1;
    for (const [id, d] of Object.entries(j)) {
      let s = 0;
      if (d.countries && d.countries.length) { if (!d.countries.map((x) => x.toUpperCase()).includes(cc)) continue; s += 1; }
      if (d.states && d.states.length) { if (!d.states.map((x) => x.toUpperCase()).includes(st)) continue; s += 2; }
      if (d.postalCodes && d.postalCodes.length) { if (!d.postalCodes.some((p) => pc.startsWith(String(p)))) continue; s += 4; }
      if (s > score) { score = s; best = id; }
    }
    return best || TaxMgr.getDefaultTaxJurisdictionID();
  },
  getTaxRate(taxClassID, jurisdictionID) {
    const rates = cfg().rates || {};
    const jr = rates[jurisdictionID] || rates[TaxMgr.getDefaultTaxJurisdictionID()] || {};
    if (taxClassID === 'TAX_EXEMPT') return 0;
    const r = jr[taxClassID] !== undefined ? jr[taxClassID] : (jr[TaxMgr.getDefaultTaxClassID()] !== undefined ? jr[TaxClassDefault(jr)] : (jr['*'] !== undefined ? jr['*'] : null));
    return r == null ? (cfg().defaultRate || 0) : r;
  },
  applyExternalTaxation() {},
};
function TaxClassDefault(jr) { return TaxMgr.getDefaultTaxClassID() in jr ? TaxMgr.getDefaultTaxClassID() : '*'; }
module.exports = TaxMgr;
