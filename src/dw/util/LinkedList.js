'use strict';
const List = require('./List');
class LinkedList extends List {
  addFirst(v) { this._a.unshift(v); }
  addLast(v) { this._a.push(v); }
  getFirst() { return this._a[0]; }
  getLast() { return this._a[this._a.length - 1]; }
  removeFirst() { return this._a.shift(); }
  removeLast() { return this._a.pop(); }
}
module.exports = require('../../util/bean').bean(LinkedList);
