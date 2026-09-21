'use strict';
const HTTPService = require('./HTTPService');
class HTTPFormService extends HTTPService {
  constructor(...a) { super(...a); this._headers['Content-Type'] = 'application/x-www-form-urlencoded'; }
  _bodyFor(request) {
    if (request && typeof request === 'object' && !(request instanceof String)) {
      const entries = request instanceof Map || (request && typeof request.entries === 'function' && typeof request.put === 'function') ? Array.from(request.entries()) : Object.entries(request);
      return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v == null ? '' : v)}`).join('&');
    }
    return request;
  }
}
module.exports = HTTPFormService;
