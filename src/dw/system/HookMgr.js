'use strict';
const rtRef = require('../../runtime');
module.exports = {
  hasHook(name) { return rtRef.current().hooks.has(name); },
  callHook(name, fn, ...args) {
    const rt = rtRef.current();
    if (!rt.hooks.has(name)) { rt.log('debug', 'hooks', `No hook registered for '${name}'`); return undefined; }
    return rt.hooks.call(name, fn, ...args);
  },
};
