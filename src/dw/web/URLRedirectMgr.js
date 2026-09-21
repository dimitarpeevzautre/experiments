'use strict';
const URLRedirect = require('./URLRedirect');
module.exports = { getRedirect() { const rt = require('../../runtime').current(); const path = rt.context.request ? rt.context.request.getHttpPath() : ''; const r = rt.store.get('url-redirects', {})[path]; return r ? new URLRedirect(r) : null; } };
