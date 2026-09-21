'use strict';
const { bean } = require('../../util/bean');
const Collection = require('./Collection');
class Set extends Collection {
  _accept(v) { return !this.contains(v); }
}
module.exports = bean(Set);
