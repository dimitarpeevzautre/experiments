'use strict';
const Service = require('./Service');
const FTPClient = require('../net/FTPClient');
class FTPService extends Service {
  constructor(id, cb, cfg) { super(id, cb, cfg); this._client = new FTPClient(); this._ops = []; this._autoDisconnect = true; }
  getClient() { return this._client; }
  setOperation(name, ...args) { this._ops.push({ name, args }); return this; }
  setAutoDisconnect(b) { this._autoDisconnect = !!b; return this; }
  isAutoDisconnect() { return this._autoDisconnect; }
  _execute() {
    const cred = this._config.getCredential();
    const m = /^s?ftp:\/\/([^:/]+)(?::(\d+))?/.exec(cred.getURL() || '');
    if (!this._client.connect(m ? m[1] : cred.getURL(), m && m[2] ? Number(m[2]) : 21, cred.getUser(), cred.getPassword())) { this._httpError = { status: 0, message: 'FTP connect failed: ' + this._client.getReplyMessage() }; return null; }
    let last = null;
    for (const op of this._ops) last = this._client[op.name](...op.args);
    if (this._autoDisconnect) this._client.disconnect();
    return last;
  }
}
module.exports = FTPService;
