'use strict';
const { bean } = require('../../util/bean');
class CustomerPasswordConstraints {
  constructor(c = {}) { this._c = c; }
  getMinLength() { return this._c.minLength || 8; }
  getMinLetters() { return this._c.minLetters || 0; }
  getMinNumbers() { return this._c.minNumbers || 0; }
  getMinSpecialChars() { return this._c.minSpecialChars || 0; }
  isForceLetters() { return this.getMinLetters() > 0; }
  isForceNumbers() { return this.getMinNumbers() > 0; }
  isForceMixedCase() { return !!this._c.forceMixedCase; }
}
module.exports = bean(CustomerPasswordConstraints);
