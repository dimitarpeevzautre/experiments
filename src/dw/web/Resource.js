'use strict';
const fs = require('fs');
const path = require('path');
const rtRef = require('../../runtime');
const { parseProperties } = require('../../util/properties');
const StringUtils = require('../util/StringUtils');

const bundleCache = new Map();
function loadBundle(rt, bundle, locale) {
  const key = `${rt.cartridgePath.map((c) => c.name).join(':')}|${bundle}|${locale}`;
  if (bundleCache.has(key)) return bundleCache.get(key);
  const merged = {};
  const locales = rt.localeFallback(locale).reverse(); // default first so specific overrides
  for (const loc of locales) {
    const name = loc === 'default' ? `${bundle}.properties` : `${bundle}_${loc}.properties`;
    // later cartridges first so earlier ones override
    const files = rt.findAllInCartridges(path.join('templates', 'resources', name)).reverse();
    for (const f of files) Object.assign(merged, parseProperties(fs.readFileSync(f, 'utf8')));
  }
  bundleCache.set(key, merged);
  return merged;
}
const Resource = {
  msg(key, bundle, defaultValue) {
    const rt = rtRef.current();
    const locale = rt.context.request ? rt.context.request.getLocale() : rt.config.locale;
    const b = loadBundle(rt, bundle || 'default', locale);
    if (Object.prototype.hasOwnProperty.call(b, key)) return b[key];
    return defaultValue !== undefined && defaultValue !== null ? defaultValue : key;
  },
  msgf(key, bundle, defaultValue, ...args) { return StringUtils.format(Resource.msg(key, bundle, defaultValue), ...args); },
  _clearCache() { bundleCache.clear(); },
};
module.exports = Resource;
