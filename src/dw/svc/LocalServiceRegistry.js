'use strict';
const rtRef = require('../../runtime');
/**
 * data/services.json: { "my.service.id": { serviceType: "HTTP"|"HTTPForm"|"FTP"|"SOAP"|"GENERIC", enabled, mockMode,
 *   credential: { URL, user, password, custom }, profile: { timeoutMillis }, custom: {} } }
 */
module.exports = {
  createService(id, callbacks) {
    const rt = rtRef.current();
    const cfg = rt.store.get('services', {})[id];
    if (!cfg && !rt.config.allowUnconfiguredServices) rt.log('warn', 'svc', `Service '${id}' is not configured in data/services.json; using defaults`);
    const type = ((cfg && cfg.serviceType) || 'HTTP').toUpperCase();
    const Cls = type === 'HTTPFORM' ? require('./HTTPFormService') : type === 'FTP' || type === 'SFTP' ? require('./FTPService') : type === 'SOAP' ? require('./SOAPService') : type === 'GENERIC' ? require('./GenericService') : require('./HTTPService');
    return new Cls(id, callbacks || {}, cfg || {});
  },
};
