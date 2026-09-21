'use strict';
const Writer = require('./Writer');
class PrintWriter extends Writer {
  print(...s) { this.write(s.map((x) => (x == null ? '' : String(x))).join('')); }
  println(...s) { this.print(...s); this.write('\n'); }
}
module.exports = PrintWriter;
