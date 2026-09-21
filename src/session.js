'use strict';
const crypto = require('crypto');
/** In-memory session manager keyed by the `dwsid` cookie. */
class SessionManager {
  constructor(rt) { this.rt = rt; this.sessions = new Map(); this.ttl = (rt.config.sessionTimeoutMinutes || 30) * 60000; }
  create() {
    const Session = this.rt.dw.get('system/Session');
    const id = crypto.randomBytes(24).toString('base64url');
    const s = new Session(id, this.rt);
    this.sessions.set(id, s);
    return s;
  }
  get(id) {
    const s = id && this.sessions.get(id);
    if (!s) return null;
    if (Date.now() - s._lastAccess > this.ttl) { this.sessions.delete(id); return null; }
    s._lastAccess = Date.now();
    return s;
  }
  getOrCreate(id) { return this.get(id) || this.create(); }
  destroy(id) { this.sessions.delete(id); }
}
module.exports = { SessionManager };
