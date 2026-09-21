'use strict';
function EventEmitter() { this._events = {}; }
EventEmitter.prototype.on = function (name, fn) { (this._events[name] = this._events[name] || []).push(fn); return this; };
EventEmitter.prototype.once = function (name, fn) { const self = this; const w = function (...a) { self.off(name, w); fn.apply(this, a); }; return this.on(name, w); };
EventEmitter.prototype.off = function (name, fn) { this._events[name] = (this._events[name] || []).filter((f) => f !== fn); };
EventEmitter.prototype.emit = function (name, ...args) { for (const fn of (this._events[name] || []).slice()) fn.apply(this, args); };
module.exports = EventEmitter;
