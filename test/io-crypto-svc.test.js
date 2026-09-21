'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { makeRuntime } = require('./helpers');

const rt = makeRuntime();
const dw = rt.dw.namespace;

test('dw.io: files, readers/writers, CSV, XML streams, zip', () => {
  const File = dw.io.File;
  const dir = new File(File.IMPEX + '/src/test'); assert.equal(dir.mkdirs(), true); assert.equal(dir.directory, true);
  const f = new File(dir, 'a.txt'); const w = new dw.io.FileWriter(f); w.writeLine('line1'); w.write('line2'); w.close();
  assert.equal(f.exists(), true); assert.equal(f.fullPath, '/IMPEX/src/test/a.txt'); assert.equal(f.name, 'a.txt'); assert.equal(f.length(), 11);
  const r = new dw.io.FileReader(f); assert.equal(r.readLine(), 'line1'); assert.equal(r.readLine(), 'line2'); assert.equal(r.readLine(), null); r.close();
  assert.deepEqual(new dw.io.FileReader(f).readLines().toArray(), ['line1', 'line2']);
  assert.deepEqual(dir.listFiles().toArray().map((x) => x.name), ['a.txt']);
  const csvFile = new File(dir, 'b.csv'); const cw = new dw.io.CSVStreamWriter(new dw.io.FileWriter(csvFile), ';', '"'); cw.writeNext(['a', 'b;c', 'd"e']); cw.writeNext(['1', '2', '3']); cw.close();
  const cr = new dw.io.CSVStreamReader(new dw.io.FileReader(csvFile), ';', '"'); assert.deepEqual(cr.readNext(), ['a', 'b;c', 'd"e']); assert.deepEqual(cr.readNext(), ['1', '2', '3']); assert.equal(cr.readNext(), null);
  const sw = new dw.io.StringWriter(); const xw = new dw.io.XMLStreamWriter(sw); xw.writeStartDocument(); xw.writeStartElement('root'); xw.writeAttribute('id', 'a&b'); xw.writeStartElement('item'); xw.writeCharacters('x<y'); xw.writeEndElement(); xw.writeEmptyElement('e'); xw.writeEndElement(); xw.writeEndDocument(); xw.close();
  assert.equal(sw.toString(), '<?xml version="1.0" encoding="UTF-8"?><root id="a&amp;b"><item>x&lt;y</item><e/></root>');
  const xr = new dw.io.XMLStreamReader(sw.toString()); const seen = [];
  while (xr.hasNext()) { const t = xr.next(); if (t === dw.io.XMLStreamConstants.START_ELEMENT) { seen.push(xr.localName); if (xr.localName === 'item') seen.push(xr.getElementText()); if (xr.localName === 'root') seen.push(xr.getAttributeValue(null, 'id')); } }
  assert.deepEqual(seen, ['root', 'a&b', 'item', 'x<y', 'e']);
  const xr2 = new dw.io.XMLStreamReader('<catalog><product product-id="p1"><name>N</name></product></catalog>'); while (xr2.hasNext()) { if (xr2.next() === 1 && xr2.localName === 'product') { const obj = xr2.readXMLObject(); assert.equal(obj['@product-id'], 'p1'); assert.equal(obj.name.text, 'N'); } }
  const zip = new File(dir, 'test.zip'); dir.zip(zip); assert.equal(zip.exists(), true); const out = new File(File.TEMP + '/unz'); zip.unzip(out); assert.equal(new File(out, 'test/a.txt').exists(), true);
  assert.equal(new File(File.IMPEX + '/nope').exists(), false); assert.throws(() => new File('/IMPEX/../../etc'), /escapes/);
  assert.equal(f.remove(), true); assert.equal(f.exists(), false);
});

test('dw.crypto: encoding, digests, HMAC, AES, RSA signatures, JWS', () => {
  const crypto = require('crypto');
  assert.equal(dw.crypto.Encoding.toBase64(new dw.util.Bytes('hi')), 'aGk='); assert.equal(dw.crypto.Encoding.fromBase64('aGk=').toString(), 'hi'); assert.equal(dw.crypto.Encoding.toHex(new dw.util.Bytes('A')), '41'); assert.equal(dw.crypto.Encoding.toURI('a b&c'), 'a+b%26c');
  assert.equal(new dw.crypto.MessageDigest(dw.crypto.MessageDigest.DIGEST_SHA_256).digest('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(dw.crypto.Encoding.toHex(new dw.crypto.Mac(dw.crypto.Mac.HMAC_SHA_256).digest('data', 'key')), crypto.createHmac('sha256', 'key').update('data').digest('hex'));
  const key = dw.crypto.Encoding.toBase64(new dw.util.Bytes('0123456789abcdef0123456789abcdef')); const iv = dw.crypto.Encoding.toBase64(new dw.util.Bytes('0123456789abcdef'));
  const c = new dw.crypto.Cipher(); const enc = c.encrypt('secret text', key, 'AES/CBC/PKCS5Padding', iv, 1); assert.notEqual(enc, 'secret text'); assert.equal(c.decrypt(enc, key, 'AES/CBC/PKCS5Padding', iv, 1), 'secret text');
  const gcm = c.encrypt('gcm', key, 'AES/GCM/NoPadding', iv, 1); assert.equal(c.decrypt(gcm, key, 'AES/GCM/NoPadding', iv, 1), 'gcm');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  rt.store.set('keys', { mykey: { privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }), publicKey: publicKey.export({ type: 'spki', format: 'pem' }) } });
  const sig = new dw.crypto.Signature(); const content = dw.crypto.Encoding.toBase64(new dw.util.Bytes('payload'));
  const s = sig.sign(content, new dw.crypto.KeyRef('mykey'), 'SHA256withRSA'); assert.equal(sig.verifySignature(s, content, new dw.crypto.CertificateRef('mykey'), 'SHA256withRSA'), true); assert.equal(sig.verifySignature(s, dw.crypto.Encoding.toBase64(new dw.util.Bytes('other')), new dw.crypto.CertificateRef('mykey'), 'SHA256withRSA'), false);
  const jws = new dw.crypto.JWS(new dw.crypto.JWSHeader({ alg: 'RS256' }), '{"sub":"1"}'); jws.sign(new dw.crypto.KeyRef('mykey')); const parsed = dw.crypto.JWS.parse(jws.serialize()); assert.equal(parsed.verify(new dw.crypto.CertificateRef('mykey')), true); assert.equal(parsed.payload, '{"sub":"1"}');
  const rsaEnc = c.encrypt('rsa', new dw.crypto.CertificateRef('mykey'), 'RSA/ECB/PKCS1Padding', null, 0); assert.equal(c.decrypt(rsaEnc, new dw.crypto.KeyRef('mykey'), 'RSA/ECB/PKCS1Padding', null, 0), 'rsa');
});

test('dw.svc: LocalServiceRegistry lifecycle, mock mode, HTTP transport override, errors, legacy ServiceRegistry', (t) => {
  t.after(() => { delete rt.config.httpTransport; });
  const calls = [];
  rt.config.httpTransport = (req) => { calls.push(req); if (req.url.includes('fail')) return { status: 500, statusText: 'Server Error', headers: {}, text: 'boom' }; if (req.url.includes('timeout')) return { status: 0, statusText: '', headers: {}, text: '', error: 'Read timed out' }; return { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json', 'x-echo': req.headers['X-Test'] || '' }, text: JSON.stringify({ method: req.method, body: req.body, url: req.url }) }; };
  const svc = dw.svc.LocalServiceRegistry.createService('test.http.echo', {
    createRequest(s, args) { s.setRequestMethod('POST'); s.addHeader('X-Test', 'yes'); s.addParam('q', '1'); s.setURL(s.configuration.credential.URL + (args.path || '')); return JSON.stringify(args); },
    parseResponse(s, client) { return JSON.parse(client.text); },
    getRequestLogMessage(r) { return 'REQ ' + r; }, getResponseLogMessage(r) { return 'RES'; }, filterLogMessage(m) { return m.replace('yes', '***'); },
  });
  assert.equal(svc.configuration.credential.URL, 'http://example.invalid/echo'); assert.equal(svc.configuration.profile.timeoutMillis, 2000); assert.equal(svc.configuration.credential.user, 'u');
  let res = svc.call({ a: 1 }); assert.equal(res.ok, true); assert.equal(res.status, 'OK'); assert.deepEqual(res.object, { method: 'POST', body: '{"a":1}', url: 'http://example.invalid/echo?q=1' }); assert.equal(svc.client.getResponseHeader('x-echo'), 'yes'); assert.match(calls[0].headers.Authorization, /^Basic /);
  res = svc.call({ path: '/fail' }); assert.equal(res.ok, false); assert.equal(res.status, 'ERROR'); assert.equal(res.error, 500); assert.equal(res.errorMessage, 'boom');
  res = svc.call({ path: '/timeout' }); assert.equal(res.status, 'SERVICE_UNAVAILABLE'); assert.equal(res.unavailableReason, 'TIMEOUT');
  svc.setThrowOnError(true); assert.throws(() => svc.call({ path: '/fail' }), /boom/); svc.setThrowOnError(false);
  const mock = dw.svc.LocalServiceRegistry.createService('test.mock', { createRequest: () => 'r', parseResponse: (s, r) => r.toUpperCase(), mockCall: () => 'mocked' });
  res = mock.call(); assert.equal(res.mockResult, true); assert.equal(res.object, 'MOCKED'); assert.equal(mock.mock, true);
  const bad = dw.svc.LocalServiceRegistry.createService('test.mock', { createRequest() { throw new Error('nope'); } }); res = bad.call(); assert.equal(res.ok, false); assert.equal(res.errorMessage, 'nope');
  const form = dw.svc.LocalServiceRegistry.createService('test.form', { createRequest: (s) => { s.setURL('http://example.invalid/form'); return { a: '1', b: 'x y' }; }, parseResponse: (s, c) => JSON.parse(c.text).body });
  rt.store.get('services')['test.form'] = { serviceType: 'HTTPForm' }; const fsvc = dw.svc.LocalServiceRegistry.createService('test.form', form._cb); assert.equal(fsvc.call().object, 'a=1&b=x%20y'); assert.equal(calls[calls.length - 1].headers['Content-Type'], 'application/x-www-form-urlencoded');
  dw.svc.ServiceRegistry.configure('legacy.svc', { createRequest: (s) => { s.setURL('http://example.invalid/legacy'); return 'x'; }, parseResponse: (s, c) => c.statusCode });
  assert.equal(dw.svc.ServiceRegistry.get('legacy.svc').call().object, 200);
  assert.equal(dw.svc.ServiceRegistry.isConfigured('legacy.svc'), true); assert.throws(() => dw.svc.ServiceRegistry.get('unknown'), /not been configured/);
  delete rt.config.httpTransport;
});

test('dw.net.Mail and HTTPClient against a real local server', async () => {
  const mails = []; rt.on('mail', (m) => mails.push(m));
  const mail = new dw.net.Mail(); mail.addTo('a@b.c').setFrom('shop@b.c').setSubject('Hi').setContent(new dw.value.MimeEncodedText('<b>x</b>', 'text/html', 'UTF-8'));
  assert.equal(mail.send().error, false); assert.equal(mails[0].subject, 'Hi'); assert.equal(mails[0].contentType, 'text/html');
  assert.equal(new dw.net.Mail().send().error, true);
  // The HTTP client blocks the calling process, so the test server must live in another process.
  const { spawn } = require('child_process');
  const server = spawn(process.execPath, ['-e', `
    const http = require('http');
    const s = http.createServer((req, res) => { let b = ''; req.on('data', (d) => { b += d; }); req.on('end', () => { res.setHeader('X-Got', req.headers['x-send'] || ''); res.statusCode = req.url.includes('404') ? 404 : 200; res.end(JSON.stringify({ m: req.method, b, u: req.url })); }); });
    s.listen(0, '127.0.0.1', () => process.stdout.write(String(s.address().port) + '\\n'));
  `], { stdio: ['ignore', 'pipe', 'inherit'] });
  const port = await new Promise((resolve) => server.stdout.once('data', (d) => resolve(Number(String(d).trim()))));
  const saved = {}; for (const k of Object.keys(process.env)) if (/proxy/i.test(k)) { saved[k] = process.env[k]; delete process.env[k]; }
  try {
    const client = new dw.net.HTTPClient(); client.open('POST', `http://127.0.0.1:${port}/x`); client.setRequestHeader('X-Send', 'v'); client.setTimeout(5000); client.send('payload');
    assert.equal(client.statusCode, 200); assert.deepEqual(JSON.parse(client.text), { m: 'POST', b: 'payload', u: '/x' }); assert.equal(client.getResponseHeader('x-got'), 'v'); assert.equal(client.errorText, null);
    client.open('GET', `http://127.0.0.1:${port}/404`); client.send(); assert.equal(client.statusCode, 404); assert.match(client.errorText, /404/);
    const f = new dw.io.File(dw.io.File.TEMP + '/dl.json'); client.open('GET', `http://127.0.0.1:${port}/file`); client.sendAndReceiveToFile(f); assert.equal(JSON.parse(fs.readFileSync(f._p, 'utf8')).u, '/file');
    client.open('GET', 'http://127.0.0.1:1/unreachable'); client.setTimeout(1000); client.send(); assert.equal(client.statusCode, 0); assert.ok(client.errorText);
  } finally { server.kill(); Object.assign(process.env, saved); }
});
