'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { makeRuntime, FIXTURE } = require('./helpers');
const { transform } = require('../src/util/transform');

test('discovers cartridges and applies the site cartridge path', () => {
  const rt = makeRuntime();
  assert.deepEqual(Object.keys(rt.cartridges).sort(), ['app_base', 'app_custom']);
  assert.deepEqual(rt.cartridgePath.map((c) => c.name), ['app_custom', 'app_base']);
  assert.ok(rt.moduleRoots.some((m) => m.endsWith(path.join('project', 'modules'))));
});

test('require resolves dw/*, */cartridge, ~/cartridge, cartridge-name and bare module specs', () => {
  const rt = makeRuntime();
  assert.equal(rt.require('dw/value/Money'), rt.dw.get('value/Money'));
  const helper = rt.require('*/cartridge/scripts/helpers/priceHelper');
  assert.equal(helper.label, 'custom>base');
  const base = rt.require('app_base/cartridge/scripts/helpers/priceHelper');
  assert.equal(base.label, 'base');
  const server = rt.require('server');
  assert.equal(typeof server.get, 'function');
  const guard = rt.require('app_base/cartridge/scripts/helpers/guard');
  assert.equal(typeof guard.ensure, 'function');
  assert.throws(() => rt.require('*/cartridge/scripts/nope'), /Cannot find module/);
});

test('module.superModule points at the next cartridge on the path', () => {
  const rt = makeRuntime();
  const file = path.join(FIXTURE, 'cartridges', 'app_custom', 'cartridge', 'scripts', 'helpers', 'priceHelper.js');
  rt.loader.load(file, rt.cartridge('app_custom'));
  const mod = rt.loader.cache.get(file);
  assert.equal(mod.superModule.label, 'base');
  const baseFile = path.join(FIXTURE, 'cartridges', 'app_base', 'cartridge', 'scripts', 'helpers', 'priceHelper.js');
  assert.equal(rt.loader.cache.get(baseFile).superModule, undefined);
});

test('loads legacy .ds scripts with type annotations, importPackage, importScript and for each', () => {
  const rt = makeRuntime();
  const script = rt.require('app_base/cartridge/scripts/helpers/legacyMath.ds');
  const PipelineDictionary = rt.dw.get('system/PipelineDictionary');
  const dict = PipelineDictionary({});
  assert.equal(script.execute(dict), 1);
  assert.equal(dict.Total, 16);
  dict.Fail = 'yes';
  assert.equal(script.execute(dict), 0);
});

test('rhino transform keeps regular JavaScript intact', () => {
  const src = 'var o = { a: 1, b: c ? d : e }; label: for (var k in o) { if (k) continue label; } var s = "x : y"; var r = /a:b/; function f(a, b) { return a + b; }';
  assert.equal(transform(src), src);
  const es6 = 'const f = (x) => ({ y: x }); class A { get v() { return 1; } }';
  assert.equal(transform(es6), es6);
});

test('unknown dw classes resolve to descriptive stubs', () => {
  const rt = makeRuntime();
  const Stub = rt.require('dw/extensions/payments/SalesforcePaymentsMgr');
  assert.throws(() => Stub.getPaymentIntent(), /not implemented by sfcc-runtime/);
  rt.registerClass('dw/extensions/payments/SalesforcePaymentsMgr', { getPaymentIntent: () => 'pi_1' });
  assert.equal(rt.require('dw/extensions/payments/SalesforcePaymentsMgr').getPaymentIntent(), 'pi_1');
  assert.equal(rt.dw.namespace.extensions.payments.SalesforcePaymentsMgr.getPaymentIntent(), 'pi_1');
});

test('globals: empty(), dw namespace, request/session/customer', () => {
  const rt = makeRuntime();
  assert.equal(rt.eval('empty(null) && empty("") && empty([]) && empty(new dw.util.ArrayList()) && !empty(0) && !empty("a")'), true);
  assert.equal(rt.eval('typeof session.custom'), 'object');
  assert.equal(rt.eval('customer.anonymous'), true);
  assert.equal(rt.eval('"abc".equalsIgnoreCase("ABC")'), true);
  assert.equal(rt.eval('PIPELET_NEXT + PIPELET_ERROR'), 1);
});
