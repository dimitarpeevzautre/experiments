'use strict';
const Writer = require('./Writer');
class StringWriter extends Writer { getString() { return this.toString(); } }
module.exports = StringWriter;
