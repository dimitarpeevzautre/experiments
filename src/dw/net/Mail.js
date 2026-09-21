'use strict';
const fs = require('fs');
const path = require('path');
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const Status = require('../system/Status');
/** dw.net.Mail – messages are written to <logDir|dataDir>/mail/*.json and emitted as a 'mail' event. */
class Mail {
  constructor() { this._to = []; this._cc = []; this._bcc = []; this._from = null; this._subject = null; this._content = null; this._contentType = 'text/plain'; this._encoding = 'UTF-8'; }
  addTo(a) { this._to.push(String(a)); return this; } addCc(a) { this._cc.push(String(a)); return this; } addBcc(a) { this._bcc.push(String(a)); return this; }
  setTo(l) { this._to = Array.from(l).map(String); return this; } setCc(l) { this._cc = Array.from(l).map(String); return this; } setBcc(l) { this._bcc = Array.from(l).map(String); return this; }
  getTo() { return new ArrayList(this._to); } getCc() { return new ArrayList(this._cc); } getBcc() { return new ArrayList(this._bcc); }
  setFrom(f) { this._from = String(f); return this; } getFrom() { return this._from; }
  setSubject(s) { this._subject = String(s); return this; } getSubject() { return this._subject; }
  setContent(c, mimeType, encoding) {
    if (c && typeof c.getText === 'function') { this._content = c.getText(); this._contentType = c.getMimeType(); this._encoding = c.getEncoding(); }
    else { this._content = String(c); if (mimeType) this._contentType = mimeType; if (encoding) this._encoding = encoding; }
    return this;
  }
  getContent() { return this._content; }
  send() {
    const rt = require('../../runtime').current();
    if (!this._to.length || !this._from) return new Status(Status.ERROR, 'MAIL_INVALID', 'Mail requires from and to');
    const msg = { time: new Date().toISOString(), from: this._from, to: this._to, cc: this._cc, bcc: this._bcc, subject: this._subject, contentType: this._contentType, content: this._content };
    rt.emit('mail', msg);
    rt.mails = rt.mails || []; rt.mails.push(msg);
    const dir = rt.config.mailDir || (rt.config.logDir ? path.join(rt.config.logDir, 'mail') : null);
    if (dir) { try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, `${Date.now()}-${Math.random().toString(36).slice(2, 6)}.json`), JSON.stringify(msg, null, 2)); } catch (e) { /* ignore */ } }
    rt.log('info', 'mail', `Mail queued to ${this._to.join(', ')}: ${this._subject}`);
    return new Status(Status.OK);
  }
}
module.exports = bean(Mail);
