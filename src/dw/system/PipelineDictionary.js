'use strict';
/** Pipeline dictionary: plain object bag with Rhino-like null semantics. */
function PipelineDictionary(init = {}) {
  const data = Object.assign({}, init);
  return new Proxy(data, {
    get(t, k) { if (typeof k === 'symbol') return t[k]; if (k === 'toJSON') return () => Object.assign({}, t); if (k in t) return t[k]; return k in Object.prototype ? Object.prototype[k] : null; },
    set(t, k, v) { t[k] = v; return true; },
    has(t, k) { return k in t; },
  });
}
module.exports = PipelineDictionary;
