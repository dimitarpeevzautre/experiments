'use strict';
const crypto = require('crypto');
const Bytes = require('./Bytes');
class SecureRandom {
  nextBytes(n) { return new Bytes(crypto.randomBytes(n)); }
  generateBytes(n) { return this.nextBytes(n); }
  nextInt(bound) { return bound ? crypto.randomInt(bound) : crypto.randomInt(-2147483648, 2147483647); }
  nextNumber() { return crypto.randomInt(0, 2 ** 48) / 2 ** 48; }
  nextBoolean() { return crypto.randomInt(2) === 1; }
}
module.exports = SecureRandom;
