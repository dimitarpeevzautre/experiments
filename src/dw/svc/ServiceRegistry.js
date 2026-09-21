'use strict';
const ServiceDefinition = require('./ServiceDefinition');
const defs = new Map();
module.exports = {
  configure(id, cb) { const d = defs.get(id) || new ServiceDefinition(id); d.configure(cb); defs.set(id, d); return d; },
  get(id) { const d = defs.get(id); if (!d) throw new Error(`Service '${id}' has not been configured (ServiceRegistry.configure)`); return d.createService(); },
  isConfigured(id) { return defs.has(id); },
  getDefinition(id) { return defs.get(id) || null; },
};
