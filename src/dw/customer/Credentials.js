'use strict';
const crypto = require('crypto');
const { bean } = require('../../util/bean');
function hash(pw, salt) { return crypto.scryptSync(String(pw), salt, 32).toString('hex'); }
class Credentials {
  constructor(customer) { this._customer = customer; const d = customer._data; if (!d.credentials) d.credentials = { enabled: true }; this._c = d.credentials; }
  getLogin() { return this._c.login || null; }
  setLogin(login, currentPassword) {
    if (currentPassword !== undefined && !this._verify(currentPassword)) return false;
    const rt = this._customer._rt;
    const taken = Object.values(rt.store.get('customers', {})).some((c) => c !== this._customer._data && c.credentials && c.credentials.login && c.credentials.login.toLowerCase() === String(login).toLowerCase());
    if (taken) return false;
    this._c.login = login; this._customer._markDirty(); return true;
  }
  isEnabled() { return this._c.enabled !== false; }
  setEnabledFlag(b) { this._c.enabled = !!b; this._customer._markDirty(); }
  isLocked() { return !!this._c.locked; }
  getRemainingLoginAttempts() { return this._c.locked ? 0 : 6 - (this._c.failedLogins || 0); }
  isPasswordSet() { return !!(this._c.passwordHash || this._c.password); }
  setPassword(pw, oldPassword, verifyOld) {
    if (verifyOld && !this._verify(oldPassword)) return this._status(false, 'ERROR_PASSWORD_MISMATCH');
    const CustomerMgr = require('./CustomerMgr');
    if (!CustomerMgr.isAcceptablePassword(pw)) return this._status(false, 'ERROR_UNKNOWN');
    const salt = crypto.randomBytes(8).toString('hex');
    this._c.salt = salt; this._c.passwordHash = hash(pw, salt); delete this._c.password; this._customer._markDirty();
    return this._status(true);
  }
  _status(ok, code) { const Status = require('../system/Status'); return new Status(ok ? Status.OK : Status.ERROR, code || null); }
  _verify(pw) {
    if (pw == null) return false;
    if (this._c.passwordHash) return hash(pw, this._c.salt || '') === this._c.passwordHash;
    if (this._c.password !== undefined) return String(this._c.password) === String(pw);
    return false;
  }
  _recordFailure() { this._c.failedLogins = (this._c.failedLogins || 0) + 1; if (this._c.failedLogins >= 6) this._c.locked = true; this._customer._markDirty(); }
  _recordSuccess() { this._c.failedLogins = 0; this._customer._markDirty(); }
  createResetPasswordToken() { const t = crypto.randomBytes(16).toString('hex'); this._c.resetToken = t; this._c.resetTokenExpiry = Date.now() + 3600000; this._customer._markDirty(); return t; }
  setPasswordWithToken(token, pw) { if (this._c.resetToken !== token || Date.now() > (this._c.resetTokenExpiry || 0)) return false; delete this._c.resetToken; return !this.setPassword(pw).isError(); }
  getPasswordQuestion() { return this._c.passwordQuestion || null; } setPasswordQuestion(q) { this._c.passwordQuestion = q; }
  getPasswordAnswer() { return this._c.passwordAnswer || null; } setPasswordAnswer(a) { this._c.passwordAnswer = a; }
  getEnabledFlag() { return this.isEnabled(); }
  isPasswordExpired() { return false; }
  getAuthenticationProviderID() { return this._c.authenticationProviderID || null; } setAuthenticationProviderID(v) { this._c.authenticationProviderID = v; }
  getExternalID() { return this._c.externalID || null; } setExternalID(v) { this._c.externalID = v; }
}
Credentials._hash = hash;
module.exports = bean(Credentials);
