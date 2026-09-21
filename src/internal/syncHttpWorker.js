'use strict';
const fs = require('fs');
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { input += d; });
process.stdin.on('end', async () => {
  const req = JSON.parse(input);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), req.timeout || 30000);
  try {
    let body = req.body;
    if (req.bodyFile) body = fs.readFileSync(req.bodyFile);
    const res = await fetch(req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body, signal: ctrl.signal, redirect: 'follow' });
    const headers = {};
    res.headers.forEach((v, k) => { headers[k] = headers[k] ? `${headers[k]}, ${v}` : v; });
    let text = '';
    if (req.outFile) { const buf = Buffer.from(await res.arrayBuffer()); fs.writeFileSync(req.outFile, buf); text = ''; }
    else text = await res.text();
    process.stdout.write(JSON.stringify({ status: res.status, statusText: res.statusText, headers, text }));
  } catch (e) {
    process.stdout.write(JSON.stringify({ status: 0, statusText: '', headers: {}, text: '', error: e.name === 'AbortError' ? 'Read timed out' : e.message }));
  } finally { clearTimeout(t); }
});
