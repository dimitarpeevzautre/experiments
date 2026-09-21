'use strict';
/** Java .properties parser (as used by SFCC resource bundles). */
function parseProperties(text) {
  const out = {};
  const lines = text.split(/\r?\n/);
  let pending = '';
  for (let raw of lines) {
    let line = pending !== '' ? pending + raw.replace(/^\s+/, '') : raw;
    pending = '';
    const trimmed = line.replace(/^\s+/, '');
    if (!trimmed || trimmed[0] === '#' || trimmed[0] === '!') continue;
    // continuation
    let bs = 0;
    for (let i = line.length - 1; i >= 0 && line[i] === '\\'; i--) bs++;
    if (bs % 2 === 1) { pending = line.slice(0, -1) || ' '; if (pending === ' ') pending = line.slice(0, -1); continue; }
    let i = 0; let key = '';
    const s = trimmed;
    while (i < s.length) {
      const c = s[i];
      if (c === '\\') { key += unescapeChar(s, i); i += s[i + 1] === 'u' ? 6 : 2; continue; }
      if (c === '=' || c === ':' || /\s/.test(c)) break;
      key += c; i++;
    }
    while (i < s.length && /\s/.test(s[i])) i++;
    if (s[i] === '=' || s[i] === ':') i++;
    while (i < s.length && /\s/.test(s[i])) i++;
    let val = '';
    while (i < s.length) {
      const c = s[i];
      if (c === '\\') { val += unescapeChar(s, i); i += s[i + 1] === 'u' ? 6 : 2; continue; }
      val += c; i++;
    }
    out[key] = val;
  }
  return out;
}
function unescapeChar(s, i) {
  const c = s[i + 1];
  switch (c) {
    case 'n': return '\n';
    case 't': return '\t';
    case 'r': return '\r';
    case 'f': return '\f';
    case 'u': return String.fromCharCode(parseInt(s.slice(i + 2, i + 6), 16));
    case undefined: return '';
    default: return c;
  }
}
module.exports = { parseProperties };
