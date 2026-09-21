'use strict';
const crypto = require('crypto');
const rtRef = require('../../runtime');
const NAME = 'csrf_token';
module.exports = {
  getTokenName() { return NAME; },
  generateToken() {
    const rt = rtRef.current();
    const session = rt.context.session;
    const token = crypto.randomBytes(24).toString('base64url');
    session._csrf = session._csrf || new Set();
    session._csrf.add(token);
    return token;
  },
  validateRequest() {
    const rt = rtRef.current();
    const session = rt.context.session;
    const req = rt.context.request;
    const t = req.getHttpParameterMap().get(NAME).getStringValue() || req.getHttpHeader('x-csrf-token');
    return !!(t && session._csrf && session._csrf.has(t));
  },
};
