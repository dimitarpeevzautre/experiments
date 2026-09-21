'use strict';
const { bean } = require('../../util/bean');
const StringUtils = require('../util/StringUtils');
class Log {
  constructor(category, rt) { this._cat = category || 'custom'; this._rt = rt; this._ndc = []; }
  _emit(level, msg, args) {
    let text = msg == null ? '' : String(msg);
    if (args.length) text = StringUtils.format(text, ...args.map((a) => (a instanceof Error ? (a.stack || a.message) : a)));
    if (this._ndc.length) text = `[${this._ndc.join('/')}] ${text}`;
    this._rt.log(level, this._cat, text);
  }
  debug(msg, ...args) { this._emit('debug', msg, args); }
  info(msg, ...args) { this._emit('info', msg, args); }
  warn(msg, ...args) { this._emit('warn', msg, args); }
  error(msg, ...args) { this._emit('error', msg, args); }
  fatal(msg, ...args) { this._emit('fatal', msg, args); }
  isDebugEnabled() { return this._rt.config.logLevel === 'debug'; }
  isInfoEnabled() { return ['debug', 'info'].includes(this._rt.config.logLevel); }
  isWarnEnabled() { return ['debug', 'info', 'warn'].includes(this._rt.config.logLevel); }
  isErrorEnabled() { return true; }
  getNDC() { return { push: (s) => this._ndc.push(s), pop: () => this._ndc.pop(), remove: () => { this._ndc.length = 0; }, peek: () => this._ndc[this._ndc.length - 1] }; }
}
module.exports = bean(Log);
