'use strict';
const { bean } = require('../../util/bean');
/** FTP is not available in the local runtime. Supply `config.ftpTransport` to emulate it, otherwise connect() returns false. */
class FTPClient {
  constructor() { this._connected = false; this._timeout = 30000; this._error = 'FTP not supported by sfcc-runtime'; }
  connect(host, port, user, password) { const rt = require('../../runtime').current(); if (rt.config.ftpTransport) { this._t = rt.config.ftpTransport; this._connected = !!this._t.connect(host, port, user, password); return this._connected; } return false; }
  disconnect() { this._connected = false; }
  isConnected() { return this._connected; }
  getConnected() { return this._connected; }
  setTimeout(ms) { this._timeout = ms; } getTimeout() { return this._timeout; }
  getReplyMessage() { return this._error; } getReplyCode() { return 0; }
  cd(p) { return this._t ? this._t.cd(p) : false; }
  list(p) { return this._t ? this._t.list(p) : []; }
  get(p, a, b) { return this._t ? this._t.get(p, a, b) : null; }
  put(p, a, b) { return this._t ? this._t.put(p, a, b) : false; }
  del(p) { return this._t ? this._t.del(p) : false; }
  mkdir(p) { return this._t ? this._t.mkdir(p) : false; }
  rename(a, b) { return this._t ? this._t.rename(a, b) : false; }
  removeDirectory(p) { return this._t ? this._t.removeDirectory(p) : false; }
  getBinary(p, f) { return this.get(p, f); } putBinary(p, f) { return this.put(p, f); }
  setPassive() {} setEncoding() {}
}
module.exports = bean(FTPClient);
