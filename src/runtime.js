'use strict';
/** Holds the active Runtime instance so dw.* implementations can reach config, store and context. */
let current = null;
module.exports = {
  current() {
    if (!current) throw new Error('No SFCC runtime is active. Create one with require("sfcc-runtime").createRuntime(config).');
    return current;
  },
  set(rt) { current = rt; },
  has() { return !!current; },
};
