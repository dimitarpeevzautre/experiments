'use strict';
const Log = require('./Log');
const rtRef = require('../../runtime');
const cache = new Map();
const Logger = {
  getLogger(category, subcategory) {
    const cat = subcategory ? `${category}.${subcategory}` : (category || 'custom');
    if (!cache.has(cat)) cache.set(cat, new Log(cat, rtRef.current()));
    return cache.get(cat);
  },
  getRootLogger() { return Logger.getLogger('root'); },
  debug(msg, ...a) { Logger.getRootLogger().debug(msg, ...a); },
  info(msg, ...a) { Logger.getRootLogger().info(msg, ...a); },
  warn(msg, ...a) { Logger.getRootLogger().warn(msg, ...a); },
  error(msg, ...a) { Logger.getRootLogger().error(msg, ...a); },
  fatal(msg, ...a) { Logger.getRootLogger().fatal(msg, ...a); },
  isDebugEnabled() { return Logger.getRootLogger().isDebugEnabled(); },
  isInfoEnabled() { return Logger.getRootLogger().isInfoEnabled(); },
  isWarnEnabled() { return Logger.getRootLogger().isWarnEnabled(); },
  isErrorEnabled() { return true; },
  getNDC() { return Logger.getRootLogger().getNDC(); },
};
module.exports = Logger;
