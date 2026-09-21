'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { makeRuntime, client } = require('./helpers');

test('pipelines: pipelet nodes, .ds scripts, decisions, branches, call/end nodes and interaction nodes', () => {
  const rt = makeRuntime();
  const r = rt.runPipeline('Demo-Show');
  assert.equal(r.endName, 'interaction'); assert.equal(r.rendered.trim(), '<h1>Pipelines</h1><p>total=16 doubled=32</p>');
  assert.equal(r.dictionary.Total, 16); assert.equal(r.dictionary.Doubled, 32);
  const failed = rt.withContext(rt.createScriptContext({ request: { params: { fail: 'yes' } } }), () => rt.runPipeline('Demo-Show'));
  assert.equal(failed.rendered.trim(), '<p class="error">pipeline failed</p>');
  assert.throws(() => rt.runPipeline('Nope-Show'), /Pipeline not found/);
  assert.throws(() => rt.runPipeline('Demo-Missing'), /Start node/);
  rt.pipelets.MyPipelet = (ctx, cfg, io) => { io.set('Out', cfg.Value + '!'); return 1; };
  fs.writeFileSync(path.join(rt.cartridge('app_base').dir, 'cartridge', 'pipelines', 'Custom.xml'), `<pipeline><branch basename="Start"><segment><node><start-node name="Start"/></node><simple-transition/><node><pipelet-node pipelet-name="MyPipelet"><config-property key="Value" value="hi"/><key-binding alias="Out" key="Result"/></pipelet-node></node><simple-transition/><node><decision-node condition-key="Result" condition-operator="str_empty"/><branch basename="b" source-connector="no"><segment><node><end-node name="filled"/></node></segment></branch></node><simple-transition/><node><end-node name="blank"/></node></segment></branch></pipeline>`);
  try { const c = rt.runPipeline('Custom-Start'); assert.equal(c.endName, 'filled'); assert.equal(c.dictionary.Result, 'hi!'); }
  finally { fs.rmSync(path.join(rt.cartridge('app_base').dir, 'cartridge', 'pipelines', 'Custom.xml')); }
  const dict = rt.dw.namespace.system.Pipeline.execute('Demo-Sub', { Total: 4 }); assert.equal(dict.Doubled, 8);
});

test('jobs: script-module and chunk steps, step types, job definitions, parameters, failures', () => {
  const rt = makeRuntime();
  const st = rt.runJobStep('custom.SayHello', { Name: 'Tester' });
  assert.equal(st.error, false); assert.equal(st.message, 'Hello Tester from manual');
  assert.equal(rt.dw.namespace.object.CustomObjectMgr.getCustomObject('JobLog', 'hello').custom.message, 'Hello Tester from manual');
  assert.equal(rt.runJobStep('custom.SayHello').message, 'Hello World from manual'); // default parameter
  const fail = rt.runJobStep('custom.SayHello', { Fail: 'true' }); assert.equal(fail.error, true); assert.equal(fail.code, 'FAILED');
  const direct = rt.runJobStep('app_base/cartridge/scripts/steps/hello.js', { Name: 'Direct' }); assert.equal(direct.message, 'Hello Direct from manual');
  const job = rt.runJob('DemoJob');
  assert.equal(job.status, 'OK'); assert.deepEqual(job.steps.map((s) => s.step), ['hello', 'export']); assert.equal(job.steps[1].status.message, '8 items processed');
  const csv = fs.readFileSync(path.join(rt._tmpData, 'files', 'IMPEX', 'src', 'export', 'out.csv'), 'utf8');
  assert.equal(csv.split('\n')[0], 'ID,Name,Online'); assert.equal(csv.trim().split('\n').length, 9); assert.doesNotMatch(csv, /P0003/);
  const failing = rt.runJob('DemoJob', { parameters: { Fail: 'true' } }); assert.equal(failing.status, 'ERROR'); assert.equal(failing.steps.length, 1);
  assert.throws(() => rt.runJob('NoSuchJob'), /not found/);
  const thrown = rt.runJobStep({ id: 'x', type: 'custom.Missing', module: 'app_base/cartridge/scripts/steps/hello.js', function: 'nope' }); assert.equal(thrown.error, true); assert.match(thrown.message, /no function/);
});

test('hooks: registry from hooks.json in cartridge order, HookMgr.callHook/hasHook, inline registration', () => {
  const rt = makeRuntime(); const HookMgr = rt.dw.namespace.system.HookMgr;
  assert.equal(HookMgr.hasHook('app.pricing.format'), true); assert.equal(HookMgr.hasHook('app.nope'), false); assert.equal(HookMgr.callHook('app.nope', 'x'), undefined);
  assert.equal(HookMgr.callHook('app.pricing.format', 'format', new rt.dw.namespace.value.Money(1, 'USD')), 'CUSTOM:$1.00');
  assert.deepEqual(rt.hooks.callAll('app.pricing.format', 'format', new rt.dw.namespace.value.Money(1, 'USD')), ['CUSTOM:$1.00', 'BASE:$1.00']);
  rt.hooks.register('dw.order.calculate', { calculate: (b) => { b._data.custom.calculated = true; return 'custom-calc'; } });
  const basket = rt.dw.namespace.order.BasketMgr.getCurrentOrNewBasket(); assert.equal(rt.calculateBasket(basket), 'custom-calc'); assert.equal(basket.custom.calculated, true);
  assert.throws(() => HookMgr.callHook('app.pricing.format', 'nope'), /no function 'nope'/);
});

test('session lifecycle, forms API and clickstream', () => {
  const rt = makeRuntime(); const c = client(rt);
  c.get('Home-Show'); c.get('Home-Json');
  const sid = c.cookies().find((k) => k.name === 'dwsid').value; const session = rt.sessions.get(sid);
  assert.equal(session.clickStream.clicks.length, 2); assert.equal(session.clickStream.last.pipelineName, 'Home-Json'); assert.equal(session.clickStream.first.path, '/on/demandware.store/Sites-RefArch-Site/default/Home-Show');
  const form = session.forms.profile; assert.equal(form.htmlName, 'dwfrm_profile'); assert.equal(form.customer.email.htmlName, 'dwfrm_profile_customer_email'); assert.equal(form.login.password.minLength, 8); assert.equal(form.confirm.constructor.name, 'FormAction');
  form.customer.email.setHtmlValue('x@y.com'); assert.equal(form.customer.email.value, 'x@y.com'); form.customer.email.validate(); assert.equal(form.customer.email.valid, true);
  form.customer.email.invalidateFormElement('Bad email'); assert.equal(form.valid, false); assert.equal(form.customer.email.error, 'Bad email'); form.clearFormElement(); assert.equal(form.valid, true); assert.equal(form.customer.email.htmlValue, '');
  const profile = rt.dw.namespace.customer.CustomerMgr.getCustomerByCustomerNumber('00000001').profile; form.customer.copyFrom(profile); assert.equal(form.customer.firstname.value, 'Jane'); assert.equal(form.customer.email.htmlValue, 'jane@example.com');
  assert.equal(session.forms.missing, null);
  assert.equal(rt.sessions.get('unknown'), null);
});
