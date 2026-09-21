'use strict';
/**
 * SFCC HTTP calls are synchronous (httpClient.send() blocks). Node has no sync fetch, so the
 * request runs in a child Node process and the result comes back as JSON.
 */
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function request({ method = 'GET', url, headers = {}, body = null, timeout = 30000, bodyFile = null, outFile = null }) {
  const rt = require('../runtime').has() ? require('../runtime').current() : null;
  if (rt && typeof rt.config.httpTransport === 'function') return rt.config.httpTransport({ method, url, headers, body, timeout });
  const payload = JSON.stringify({ method, url, headers, body: body == null ? null : String(body), timeout, bodyFile, outFile });
  try {
    const out = execFileSync(process.execPath, [path.join(__dirname, 'syncHttpWorker.js')], { input: payload, encoding: 'utf8', timeout: timeout + 5000, maxBuffer: 256 * 1024 * 1024, env: process.env });
    return JSON.parse(out);
  } catch (e) {
    return { status: 0, statusText: '', headers: {}, text: '', error: e.stdout && String(e.stdout).trim() ? safeParse(e.stdout) : (e.message || String(e)) };
  }
}
function safeParse(s) { try { const j = JSON.parse(s); return j.error || s; } catch (er) { return String(s); } }
module.exports = { request };
