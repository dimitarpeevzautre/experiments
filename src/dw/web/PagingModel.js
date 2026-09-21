'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const URL = require('./URL');
class PagingModel {
  constructor(iteratorOrCollection, count) {
    if (count === undefined) { const arr = toArray(iteratorOrCollection); this._items = arr; this._count = arr.length; }
    else { this._it = iteratorOrCollection; this._items = null; this._count = count; }
    this._start = 0; this._pageSize = 10;
  }
  _all() { if (!this._items) this._items = toArray(this._it); return this._items; }
  getCount() { return this._count; }
  getStart() { return this._start; }
  setStart(s) { this._start = Math.max(0, s); }
  getPageSize() { return this._pageSize; }
  setPageSize(p) { this._pageSize = Math.max(1, p); }
  getEnd() { return Math.min(this._count, this._start + this._pageSize) - 1; }
  getPageCount() { return Math.ceil(this._count / this._pageSize); }
  getCurrentPage() { return Math.floor(this._start / this._pageSize); }
  getMaxPage() { return Math.max(0, this.getPageCount() - 1); }
  isEmpty() { return this._count === 0; }
  getEmpty() { return this.isEmpty(); }
  getPageElements() { const all = this._all(); const slice = this._it ? all.slice(0, this._pageSize) : all.slice(this._start, this._start + this._pageSize); return new ArrayList(slice).iterator(); }
  appendPaging(url, position) { let u = url instanceof URL ? url : new URL(String(url)); u = u.append(PagingModel.PAGING_SIZE_PARAMETER, this._pageSize); return u.append(PagingModel.PAGING_START_PARAMETER, position === undefined ? this._start : position); }
  appendPageSize(url, size) { return (url instanceof URL ? url : new URL(String(url))).append(PagingModel.PAGING_SIZE_PARAMETER, size); }
  static appendPaging(url, position) { return (url instanceof URL ? url : new URL(String(url))).append(PagingModel.PAGING_START_PARAMETER, position); }
}
function toArray(x) { if (!x) return []; if (Array.isArray(x)) return x; if (typeof x.toArray === 'function' && !x.hasNext) return x.toArray(); if (typeof x.hasNext === 'function') { const out = []; while (x.hasNext()) out.push(x.next()); return out; } return Array.from(x); }
PagingModel.PAGING_SIZE_PARAMETER = 'sz';
PagingModel.PAGING_START_PARAMETER = 'start';
PagingModel.DEFAULT_PAGE_SIZE = 10;
PagingModel.MAX_PAGE_SIZE = 2000;
module.exports = bean(PagingModel);
