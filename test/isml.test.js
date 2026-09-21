'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { makeRuntime } = require('./helpers');

const rt = makeRuntime();
const render = (src, pdict = {}) => { const fn = rt.isml.compile(src, 'inline.isml'); const ctx = rt.isml._context(pdict, {}, 'inline.isml'); fn(ctx); return ctx.__out.join(''); };

test('expressions are HTML-encoded, isprint respects encoding=off and formatters', () => {
  assert.equal(render('${pdict.x}', { x: '<b>' }), '&lt;b&gt;');
  assert.equal(render('<isprint value="${pdict.x}" encoding="off"/>', { x: '<b>' }), '<b>');
  assert.equal(render('<isprint value="${pdict.m}"/>', { m: new rt.dw.namespace.value.Money(1234.5, 'USD') }), '$1,234.50');
  assert.equal(render('<isprint value="${pdict.n}" formatter="#,##0.0"/>', { n: 1234.56 }), '1,234.6');
  assert.equal(render('<isprint value="${pdict.d}" formatter="yyyy-MM-dd" timezone="UTC"/>', { d: new Date('2024-05-06T00:00:00Z') }), '2024-05-06');
  assert.equal(render('<isprint value="${pdict.d}" style="DATE_SHORT" timezone="UTC"/>', { d: new Date('2024-05-06T00:00:00Z') }), '5/6/24');
});

test('isif / iselseif / iselse with > and quotes inside conditions', () => {
  const t = '<isif condition="${pdict.n > 5 && pdict.s == \'x\'}">big<iselseif condition="${pdict.n > 1}"/>mid<iselse/>small</isif>';
  assert.equal(render(t, { n: 9, s: 'x' }), 'big');
  assert.equal(render(t, { n: 3, s: 'y' }), 'mid');
  assert.equal(render(t, { n: 0 }), 'small');
});

test('isloop with status, begin/end/step, break and continue over arrays, collections and iterators', () => {
  const AL = rt.dw.namespace.util.ArrayList;
  assert.equal(render('<isloop items="${pdict.items}" var="i" status="s">${s.count}:${i}${s.last ? "" : ","}</isloop>', { items: ['a', 'b', 'c'] }), '1:a,2:b,3:c');
  assert.equal(render('<isloop items="${pdict.items}" var="i">${i}</isloop>', { items: new AL([1, 2]) }), '12');
  assert.equal(render('<isloop items="${pdict.items}" var="i">${i}</isloop>', { items: new AL([1, 2]).iterator() }), '12');
  assert.equal(render('<isloop items="${pdict.items}" var="i" begin="1" end="3" step="2">${i}</isloop>', { items: [0, 1, 2, 3, 4] }), '13');
  assert.equal(render('<isloop items="${pdict.items}" var="i"><isif condition="${i == 2}"><iscontinue/></isif><isif condition="${i == 4}"><isbreak/></isif>${i}</isloop>', { items: [1, 2, 3, 4, 5] }), '13');
});

test('isset scopes, isscript, iscomment, isinclude, isdecorate/isreplace, iscontent', () => {
  assert.equal(render('<isset name="v" value="${1 + 1}" scope="page"/>${v}-${pdict.v}'), '2-2');
  assert.equal(render('<isset name="c" value="x" scope="session"/>${session.custom.c}'), 'x');
  assert.equal(render('<isscript>var a = 40; out.print(a + 2);</isscript>'), '42');
  assert.equal(render('a<iscomment>hidden ${boom}</iscomment>b'), 'ab');
  const out = rt.renderTemplate('home', { siteName: 'S', greeting: 'G', price: 'P', helperLabel: 'L', locale: 'en', productUrl: '#', currentCustomer: {} });
  assert.match(out, /<!DOCTYPE html>[\s\S]*<h1 class="site">S<\/h1>[\s\S]*<footer class="custom">Custom footer<\/footer>[\s\S]*<\/html>/);
  assert.equal(rt.context.response.getContentType(), 'text/html;charset=UTF-8');
});

test('template resolution follows cartridge path and locale fallback; resources too', () => {
  assert.match(rt.resolveTemplate('common/footer'), /app_custom/);
  assert.match(rt.resolveTemplate('home'), /app_base/);
  assert.equal(rt.resolveTemplate('nope'), null);
  const Resource = rt.dw.namespace.web.Resource;
  assert.equal(Resource.msg('home.greeting', 'home', null), 'Welcome to the base store');
  assert.equal(Resource.msg('global.footer', 'common', null), 'Custom footer');
  assert.equal(Resource.msg('missing.key', 'common', 'dflt'), 'dflt');
  assert.equal(Resource.msg('missing.key', 'common', null), 'missing.key');
  assert.equal(Resource.msgf('{0} items', 'x', null, 3), '3 items');
  rt.withContext(rt.createScriptContext({ request: { locale: 'de_DE' } }), () => { assert.equal(Resource.msg('home.greeting', 'home', null), 'Willkommen im Basisshop'); assert.equal(Resource.msg('global.footer', 'common', null), 'Custom footer'); });
});

test('custom tags via ismodule, isslot, isredirect and isstatus', () => {
  const fs = require('fs'); const path = require('path');
  const dir = path.join(rt.cartridge('app_base').dir, 'cartridge', 'templates', 'default', 'components');
  fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'badge.isml'), '<span class="badge">${pdict.label}|${label}</span>');
  try {
    assert.equal(render('<ismodule template="components/badge" name="badge" attribute="label"/><isbadge label="${\'New\'}"/>'), '<span class="badge">New|New</span>');
  } finally { fs.rmSync(dir, { recursive: true }); }
  assert.equal(render('<isslot id="home-banner" context="global" description="d"/>'), '<div class="slot">Plain Hat Hot</div>\n');
  render('<isredirect location="${\'/x\'}"/>'); assert.equal(rt.context.response.getRedirectLocation(), '/x');
  render('<isstatus value="404"/>'); assert.equal(rt.context.response.getStatus(), 404);
});

test('dw.template.ISML.renderTemplate writes into the response and dw.util.Template renders velocity', () => {
  const ctx = rt.createScriptContext();
  rt.withContext(ctx, () => {
    rt.dw.namespace.template.ISML.renderTemplate('cart/miniCart', { quantity: 3 });
    assert.equal(ctx.response._body().trim(), '<span class="minicart">3</span>');
  });
  const { renderVelocity } = require('../src/dw/util/Template');
  assert.equal(renderVelocity('Hi $name#if($vip) VIP#end #foreach($i in $items)[$i]#end', { name: 'A', vip: true, items: [1, 2] }), 'Hi A VIP [1][2]');
});
