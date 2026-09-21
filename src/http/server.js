'use strict';
const http = require('http');
const { dispatch } = require('./dispatcher');

/** Node HTTP server front-end for the dispatcher. */
function createServer(rt, opts = {}) {
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      let result;
      try {
        result = dispatch(rt, { method: req.method, url: req.url, headers: req.headers, body, remoteAddress: req.socket.remoteAddress, protocol: req.socket.encrypted ? 'https' : (rt.config.secure === false ? 'http' : undefined) });
      } catch (e) {
        rt.log('error', 'server', e.stack || String(e));
        result = { status: 500, headers: {}, body: 'Internal Server Error', contentType: 'text/plain', cookies: [] };
      }
      const headers = Object.assign({}, result.headers);
      headers['Content-Type'] = result.contentType || 'text/html;charset=UTF-8';
      if (result.cookies && result.cookies.length) headers['Set-Cookie'] = result.cookies.map((c) => c.toSetCookieHeader());
      if (result.redirect && !headers.Location) headers.Location = result.redirect;
      res.writeHead(result.status || 200, headers);
      res.end(result.body == null ? '' : result.body);
      rt.log(result.status >= 500 ? 'error' : 'info', 'http', `${req.method} ${req.url} -> ${result.status}`);
    });
  });
  server.listenAsync = (port, host) => new Promise((resolve, reject) => { server.once('error', reject); server.listen(port === undefined ? rt.config.port : port, host || '0.0.0.0', () => resolve(server.address())); });
  return server;
}
module.exports = { createServer };
