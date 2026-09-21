'use strict';
const crypto = require('crypto');
module.exports = { getCertificate(ref) { return new crypto.X509Certificate(ref._pem); } };
