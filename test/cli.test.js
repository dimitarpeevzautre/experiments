'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { FIXTURE } = require('./helpers');
const BIN = path.join(__dirname, '..', 'bin', 'sfcc-run.js');

function run(args, opts = {}) { return execFileSync(process.execPath, [BIN, ...args], Object.assign({ cwd: FIXTURE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }, opts)); }

test('cli: info, eval, request, render, step, pipeline', () => {
  assert.match(run(['info']), /Cartridge path:\s+app_custom:app_base/);
  assert.equal(run(['eval', 'new dw.value.Money(2, "USD").add(new dw.value.Money(1, "USD")).toString()']).trim(), '3.00 USD');
  assert.match(run(['request', 'Home-Json', '--param', 'q=cli']), /"q": "cli"/);
  assert.match(run(['request', 'Cart-AddProduct', '--method', 'POST', '--body', 'pid=P0002&quantity=1']), /"quantity": 1/);
  assert.match(run(['render', 'cart/miniCart', '--pdict', '{"quantity":7}']), /minicart">7/);
  assert.match(run(['step', 'custom.SayHello', '--param', 'Name=CLI']), /Hello CLI/);
  assert.match(run(['pipeline', 'Demo-Show']), /total=16/);
  assert.match(run(['--help']), /Usage: sfcc-run/);
});

test('cli: init scaffolds config and data; job runs from the scaffold', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfcc-init-'));
  const out = run(['init'], { cwd: dir });
  assert.match(out, /Created/);
  assert.equal(fs.existsSync(path.join(dir, 'sfcc-runtime.json')), true);
  assert.equal(fs.existsSync(path.join(dir, 'data', 'products.json')), true);
  const info = run(['info'], { cwd: dir }); assert.match(info, /Data directory:.*products/);
  assert.equal(run(['eval', 'dw.catalog.ProductMgr.getProduct("P0001-M").priceModel.price.value'], { cwd: dir }).trim(), '24.99');
});
