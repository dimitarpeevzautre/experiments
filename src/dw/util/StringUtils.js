'use strict';
const Money = require('../value/Money');

function fmtNumber(n, pattern, locale) {
  if (n && typeof n.getValue === 'function') n = n.getValue();
  n = Number(n);
  if (!pattern) return new Intl.NumberFormat(locale || 'en-US').format(n);
  // Java DecimalFormat subset: e.g. "#,##0.00", "0.0", "#.##"
  const [intPart, fracPart = ''] = pattern.replace(/[^#0,.]/g, '').split('.');
  const minFrac = (fracPart.match(/0/g) || []).length;
  const maxFrac = fracPart.length;
  const grouping = intPart.includes(',');
  const minInt = (intPart.match(/0/g) || []).length;
  let out = new Intl.NumberFormat(locale || 'en-US', { minimumFractionDigits: minFrac, maximumFractionDigits: Math.max(minFrac, maxFrac), useGrouping: grouping, minimumIntegerDigits: Math.max(1, minInt) }).format(n);
  const prefix = pattern.match(/^[^#0,.]*/)[0];
  const suffix = pattern.match(/[^#0,.]*$/)[0];
  return prefix + out + suffix;
}

const StringUtils = {
  trim(s) { return s == null ? null : String(s).trim(); },
  ltrim(s) { return s == null ? null : String(s).replace(/^\s+/, ''); },
  rtrim(s) { return s == null ? null : String(s).replace(/\s+$/, ''); },
  pad(s, width) {
    s = s == null ? '' : String(s);
    const w = Math.abs(width);
    if (s.length >= w) return s;
    return width < 0 ? s.padEnd(w) : s.padStart(w);
  },
  truncate(s, maxLength, mode, suffix) {
    if (s == null) return null;
    s = String(s);
    if (s.length <= maxLength) return s;
    suffix = suffix || '';
    if (mode === StringUtils.TRUNCATE_WORD) {
      let cut = s.slice(0, maxLength);
      const sp = cut.lastIndexOf(' ');
      if (sp > 0) cut = cut.slice(0, sp);
      return cut + suffix;
    }
    if (mode === StringUtils.TRUNCATE_SENTENCE) {
      const cut = s.slice(0, maxLength);
      const m = cut.match(/[.!?](?=[^.!?]*$)/);
      return (m ? cut.slice(0, m.index + 1) : cut) + suffix;
    }
    return s.slice(0, maxLength) + suffix;
  },
  format(pattern, ...args) {
    if (pattern == null) return '';
    return String(pattern).replace(/\{(\d+)(?:,[^}]*)?\}/g, (m, i) => { const v = args[Number(i)]; return v === undefined ? m : (v instanceof Money ? v.toFormattedString() : String(v)); });
  },
  formatNumber(n, pattern, locale) { return fmtNumber(n, pattern, locale); },
  formatInteger(n) { return new Intl.NumberFormat('en-US').format(Math.round(Number(n))); },
  formatMoney(m) { return m instanceof Money ? m.toFormattedString() : String(m); },
  formatDate(d, pattern) { const Calendar = require('./Calendar'); return Calendar.format(d instanceof Date ? d : (d && d.getTime ? d.getTime() : new Date(d)), pattern); },
  formatCalendar(c, pattern) { const Calendar = require('./Calendar'); return Calendar.format(c.getTime(), pattern); },
  encodeBase64(s) { return Buffer.from(String(s), 'utf8').toString('base64'); },
  decodeBase64(s) { return Buffer.from(String(s), 'base64').toString('utf8'); },
  encodeString(s, type) {
    if (s == null) return null;
    s = String(s);
    switch (type) {
      case StringUtils.ENCODE_TYPE_HTML: return StringUtils.stringToHtml(s);
      case StringUtils.ENCODE_TYPE_XML: return StringUtils.stringToXml(s);
      default: return s;
    }
  },
  stringToHtml(s) { return s == null ? null : String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
  stringToXml(s) { return s == null ? null : String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c])); },
  stringToJavaScript(s) { return s == null ? null : JSON.stringify(String(s)).slice(1, -1); },
  stringToUri(s) { return s == null ? null : encodeURIComponent(String(s)); },
  garble(s, char, n) { s = String(s); if (s.length <= n) return s; return char.repeat(s.length - n) + s.slice(-n); },
  capitalize(s) { return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : s; },
  TRUNCATE_CHAR: 'TRUNCATE_CHAR', TRUNCATE_WORD: 'TRUNCATE_WORD', TRUNCATE_SENTENCE: 'TRUNCATE_SENTENCE',
  ENCODE_TYPE_HTML: 'ENCODE_TYPE_HTML', ENCODE_TYPE_XML: 'ENCODE_TYPE_XML',
};
module.exports = StringUtils;
