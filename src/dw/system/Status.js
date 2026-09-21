'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const StringUtils = require('../util/StringUtils');

class StatusItem {
  constructor(status = 0, code = null, message = null, params = []) { this._s = status; this._c = code; this._m = message; this._p = params; this._details = {}; }
  getStatus() { return this._s; }
  setStatus(s) { this._s = s; }
  getCode() { return this._c; }
  setCode(c) { this._c = c; }
  getMessage() { return this._m == null ? null : StringUtils.format(this._m, ...this._p); }
  setMessage(m) { this._m = m; }
  getParameters() { return new ArrayList(this._p); }
  isError() { return this._s === Status.ERROR; }
  getError() { return this.isError(); }
  getDetails() { const HashMap = require('../util/HashMap'); return new HashMap(this._details); }
  getDetail(k) { return this._details[k] === undefined ? null : this._details[k]; }
  addDetail(k, v) { this._details[k] = v; }
}
bean(StatusItem);

class Status {
  constructor(status, code, message, ...params) {
    this._items = [];
    if (status !== undefined) this.addItem(new StatusItem(status, code === undefined ? null : code, message === undefined ? null : message, params));
  }
  addItem(item) { this._items.push(item); }
  getItems() { return new ArrayList(this._items); }
  getStatus() { return this._items.some((i) => i.isError()) ? Status.ERROR : Status.OK; }
  isError() { return this.getStatus() === Status.ERROR; }
  getError() { return this.isError(); }
  getCode() { return this._items.length ? this._items[0].getCode() : null; }
  getMessage() { return this._items.length ? this._items[0].getMessage() : null; }
  getParameters() { return this._items.length ? this._items[0].getParameters() : new ArrayList(); }
  getDetails() { return this._items.length ? this._items[0].getDetails() : new (require('../util/HashMap'))(); }
  getDetail(k) { return this._items.length ? this._items[0].getDetail(k) : null; }
  addDetail(k, v) { if (!this._items.length) this.addItem(new StatusItem(Status.OK)); this._items[0].addDetail(k, v); }
  toString() { return `Status(${this.isError() ? 'ERROR' : 'OK'}${this.getCode() ? ' ' + this.getCode() : ''}${this.getMessage() ? ': ' + this.getMessage() : ''})`; }
}
Status.OK = 0;
Status.ERROR = 1;
Status.StatusItem = StatusItem;
module.exports = bean(Status);
