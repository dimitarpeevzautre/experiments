'use strict';
const { bean } = require('../../util/bean');
const { Iterator } = require('./Collection');
class SeekableIterator extends Iterator {
  constructor(items, total) { super(items); this._total = total !== undefined ? total : this._items.length; }
  getCount() { return this._total; }
  first() { this._i = 0; return this._items.length ? this._items[0] : null; }
  forward(n, size) { this._i = Math.min(this._items.length, this._i + n); if (size !== undefined) this._items = this._items.slice(0, this._i + size); }
  close() { this._items = []; }
}
module.exports = bean(SeekableIterator);
