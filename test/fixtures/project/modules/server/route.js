'use strict';
const EventEmitter = require('./eventEmitter');
const Request = require('./request');
const Response = require('./response');
const render = require('./render');
function Route(name, chain, req, res) { this.name = name; this.chain = chain; this.req = req; this.res = res; EventEmitter.call(this); }
Route.prototype = Object.create(EventEmitter.prototype);
Route.prototype.getRouteFunction = function () {
  const me = this;
  return function () {
    // Request/Response are built from the platform globals at execution time
    me.req = new Request(request, customer, session);
    me.res = new Response(response);
    let i = 0;
    const next = function (err) {
      if (err) { me.res.log(err.message); if (me.res.statusCode === 200) me.res.setStatusCode(500); me.res.print(err.message); me.done(); return; }
      if (me.res.redirectUrl) { me.emit('route:Redirect', me.req, me.res); me.done(); return; }
      const step = me.chain[i++];
      if (!step) { me.done(); return; }
      me.emit('route:Step', me.req, me.res);
      step.call(me, me.req, me.res, next);
    };
    me.emit('route:Start', me.req, me.res);
    next();
  };
};
Route.prototype.done = function () {
  this.emit('route:BeforeComplete', this.req, this.res);
  render.applyRenderings(this.res);
  this.emit('route:Complete', this.req, this.res);
};
Route.prototype.append = function (step) { this.chain.push(step); };
Route.prototype.prepend = function (step) { this.chain.unshift(step); };
module.exports = Route;
