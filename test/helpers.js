'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { createRuntime } = require('../src');
const FIXTURE = path.join(__dirname, 'fixtures', 'project');

/** Create a runtime over the fixture project with a fresh copy of the data directory. */
function makeRuntime(overrides = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sfcc-rt-'));
  fs.cpSync(path.join(FIXTURE, 'data'), tmp, { recursive: true });
  const rt = createRuntime(Object.assign({ roots: [FIXTURE], dataDir: tmp, site: 'RefArch', quiet: true, logLevel: 'error' }, overrides));
  rt._tmpData = tmp;
  return rt;
}
/** Dispatch helper keeping cookies across calls. */
function client(rt) {
  let cookies = [];
  return {
    get(url, opts = {}) { return this.request('GET', url, undefined, opts); },
    post(url, body, opts = {}) { return this.request('POST', url, body, opts); },
    request(method, url, body, opts = {}) {
      const headers = Object.assign({ cookie: cookies.map((c) => `${c.name}=${encodeURIComponent(c.value)}`).join('; ') }, body !== undefined && typeof body === 'object' ? { 'content-type': 'application/x-www-form-urlencoded' } : {}, opts.headers || {});
      const b = body !== undefined && typeof body === 'object' ? new URLSearchParams(body).toString() : body;
      const r = rt.dispatch({ method, url: url.startsWith('/') ? url : `/on/demandware.store/Sites-RefArch-Site/default/${url}`, body: b, headers });
      for (const c of r.cookies || []) { cookies = cookies.filter((x) => x.name !== c.getName()); cookies.push({ name: c.getName(), value: c.getValue() }); }
      r.text = Buffer.isBuffer(r.body) ? r.body.toString('utf8') : String(r.body || '');
      r.json = () => JSON.parse(r.text);
      return r;
    },
    cookies: () => cookies,
  };
}
module.exports = { makeRuntime, client, FIXTURE };
