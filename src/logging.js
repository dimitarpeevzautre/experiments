'use strict';
const fs = require('fs');
const path = require('path');
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, fatal: 50 };
class LogWriter {
  constructor(rt) {
    this.rt = rt;
    this.level = LEVELS[rt.config.logLevel] || LEVELS.info;
    this.dir = rt.config.logDir ? path.resolve(rt.config.logDir) : null;
    this.entries = [];
    this.quiet = !!rt.config.quiet;
  }
  write(level, category, message) {
    const entry = { time: new Date().toISOString(), level, category, message: String(message) };
    this.entries.push(entry);
    if (this.entries.length > 5000) this.entries.shift();
    this.rt.emit('log', entry);
    if ((LEVELS[level] || 20) < this.level) return;
    const line = `[${entry.time}] ${level.toUpperCase()} ${category ? `${category} ` : ''}${entry.message}`;
    if (!this.quiet) (level === 'error' || level === 'fatal' ? console.error : console.log)(line);
    if (this.dir) {
      try {
        fs.mkdirSync(this.dir, { recursive: true });
        const day = entry.time.slice(0, 10).replace(/-/g, '');
        fs.appendFileSync(path.join(this.dir, `${level === 'debug' ? 'debug' : level === 'warn' ? 'warn' : level === 'info' ? 'info' : 'error'}-${day}.log`), line + '\n');
      } catch (e) { /* ignore */ }
    }
  }
}
module.exports = { LogWriter, LEVELS };
