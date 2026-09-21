'use strict';
const Route = require('./route');
const middleware = require('./middleware');
function Server() { this.routes = {}; }
Server.prototype = {
  use(name, ...args) {
    const middlewareChain = args.filter((a) => typeof a === 'function');
    if (this.routes[name]) throw new Error(`Route with this name already exists: ${name}`);
    const route = new Route(name, middlewareChain);
    this.routes[name] = route;
    return route;
  },
  get(name, ...args) { return this.use(name, middleware.get, ...args); },
  post(name, ...args) { return this.use(name, middleware.post, ...args); },
  exports() {
    const out = {};
    Object.keys(this.routes).forEach((key) => { out[key] = this.routes[key].getRouteFunction(); out[key].public = true; });
    out.__routes = this.routes;
    return out;
  },
  extend(server) {
    if (!server.__routes) throw new Error('Cannot extend non-valid server object');
    Object.keys(server.__routes).forEach((key) => { this.routes[key] = server.__routes[key]; });
  },
  prepend(name, ...args) { if (!this.routes[name]) throw new Error(`Route with this name does not exist: ${name}`); args.filter((a) => typeof a === 'function').reverse().forEach((s) => this.routes[name].prepend(s)); },
  append(name, ...args) { if (!this.routes[name]) throw new Error(`Route with this name does not exist: ${name}`); args.filter((a) => typeof a === 'function').forEach((s) => this.routes[name].append(s)); },
  replace(name, ...args) { if (!this.routes[name]) throw new Error(`Route with this name does not exist: ${name}`); delete this.routes[name]; this.use(name, ...args); },
  getRoute(name) { return this.routes[name]; },
  forms: require('./forms/forms')(session),
  middleware,
};
module.exports = new Server();
