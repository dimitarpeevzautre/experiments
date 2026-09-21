'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { makeRuntime } = require('./helpers');
const { parse } = require('../src/util/xml');
const { parseProperties } = require('../src/util/properties');
const { query } = require('../src/internal/query');

const rt = makeRuntime();
const dw = rt.dw.namespace;

test('collections behave like the Java-backed SFCC classes', () => {
  const l = new dw.util.ArrayList([3, 1, 2]);
  assert.equal(l.length, 3); assert.equal(l.size(), 3); assert.equal(l.empty, false);
  l.sort(); assert.deepEqual(l.toArray(), [1, 2, 3]);
  l.add(4, 5); assert.equal(l.get(4), 5); assert.equal(l.indexOf(4), 3);
  assert.deepEqual([...l], [1, 2, 3, 4, 5]);
  const it = l.iterator(); assert.equal(it.hasNext(), true); assert.equal(it.next(), 1);
  const set = new dw.util.HashSet([1, 1, 2]); assert.equal(set.size(), 2);
  const map = new dw.util.HashMap(); map.put('a', 1); assert.equal(map.get('a'), 1); assert.equal(map.get('zz'), null); assert.equal(map.containsKey('a'), true); assert.deepEqual(map.keySet().toArray(), ['a']);
  const sorted = new dw.util.SortedSet(); sorted.add('b'); sorted.add('a'); assert.deepEqual(sorted.toArray(), ['a', 'b']);
  const pc = new dw.util.PropertyComparator('n', false); const pl = new dw.util.ArrayList([{ n: 1 }, { n: 3 }, { n: 2 }]); pl.sort(pc); assert.deepEqual(pl.toArray().map((x) => x.n), [3, 2, 1]);
  const fc = new dw.util.FilteringCollection([1, 2, 3, 4], { EVEN: (x) => x % 2 === 0 }); assert.deepEqual(fc.select('EVEN').toArray(), [2, 4]);
});

test('Money, Quantity, Decimal and EnumValue', () => {
  const Money = dw.value.Money;
  const a = new Money(10.005, 'USD'); assert.equal(a.value, 10.01); assert.equal(a.add(new Money(0.99, 'USD')).value, 11);
  assert.equal(a.multiply(3).toFormattedString(), '$30.02');
  assert.equal(Money.NOT_AVAILABLE.available, false); assert.equal(a.add(Money.NOT_AVAILABLE).available, false);
  assert.throws(() => a.add(new Money(1, 'EUR')), /Currency mismatch/);
  assert.equal(a.compareTo(new Money(5, 'USD')), 1); assert.equal(new Money(1, 'JPY').toNumberString(), '1');
  assert.deepEqual(Money.prorate(new Money(10, 'USD'), new Money(1, 'USD'), new Money(3, 'USD')).map((m) => m.value), [2.5, 7.5]);
  const q = new dw.value.Quantity(2, 'pcs'); assert.equal(q.add(new dw.value.Quantity(1, 'pcs')).value, 3);
  assert.equal(new dw.util.Decimal('1.005').round(2).get(), 1.01);
  const e = new dw.value.EnumValue(1, 'Male'); assert.equal(e.value, 1); assert.equal(e.displayValue, 'Male'); assert.equal(e == 1, true);
});

test('Calendar arithmetic, fields, formatting and parsing with time zones', () => {
  const Calendar = dw.util.Calendar;
  const c = new Calendar(new Date('2024-01-31T23:30:00Z'));
  c.add(Calendar.MONTH, 1); assert.equal(Calendar.format(c.time, 'yyyy-MM-dd'), '2024-02-29');
  c.setTimeZone('America/New_York'); assert.equal(c.get(Calendar.HOUR_OF_DAY), 18); assert.equal(c.get(Calendar.DAY_OF_MONTH), 29);
  c.set(Calendar.HOUR_OF_DAY, 0); assert.equal(c.time.toISOString(), '2024-02-29T05:30:00.000Z'); c.set(Calendar.MINUTE, 0); assert.equal(c.time.toISOString(), '2024-02-29T05:00:00.000Z');
  assert.equal(Calendar.format(new Date('2024-07-04T15:05:09Z'), "EEE, MMM d yyyy h:mm a 'UTC'"), 'Thu, Jul 4 2024 3:05 PM UTC');
  assert.equal(Calendar.parse('2024-03-05 10:20', 'yyyy-MM-dd HH:mm').toISOString(), '2024-03-05T10:20:00.000Z');
  const d = new Calendar(); d.parseByFormat('05.03.2024', 'dd.MM.yyyy'); assert.equal(d.get(Calendar.MONTH), 2);
  assert.equal(new Calendar(new Date('2024-01-01')).isSameDay(new Calendar(new Date('2024-01-01T23:00:00Z'))), true);
});

test('StringUtils formatting helpers', () => {
  const S = dw.util.StringUtils;
  assert.equal(S.formatNumber(1234.567, '#,##0.00'), '1,234.57');
  assert.equal(S.formatNumber(5, '000'), '005');
  assert.equal(S.format('{0} and {1}', 'a', 'b'), 'a and b');
  assert.equal(S.pad('7', 3), '  7'); assert.equal(S.pad('7', -3), '7  ');
  assert.equal(S.truncate('one two three', 9, S.TRUNCATE_WORD, '…'), 'one two…');
  assert.equal(S.stringToHtml('<a & "b">'), '&lt;a &amp; &quot;b&quot;&gt;');
  assert.equal(S.decodeBase64(S.encodeBase64('héllo')), 'héllo');
  assert.equal(S.formatMoney(new dw.value.Money(3, 'EUR')), '€3.00');
});

test('query language and sorting', () => {
  const items = [{ a: 1, s: 'Foo', d: new Date('2020-01-01') }, { a: 2, s: 'bar', d: new Date('2021-01-01') }, { a: 3, s: null }];
  assert.equal(query(items, 'a > {0} AND s ILIKE {1}', null, [0, 'FOO']).length, 1);
  assert.deepEqual(query(items, 's != NULL', 'a desc').map((x) => x.a), [2, 1]);
  assert.equal(query(items, 'd >= {0}', null, [new Date('2020-06-01')]).length, 1);
  assert.equal(query(items, 'a IN ({0}) OR s = {1}', null, [[2, 3], 'Foo']).length, 3);
  assert.equal(query(items, "NOT (a = 1) AND s LIKE 'b*'").length, 1);
  assert.equal(query(items, { a: 2 }).length, 1);
});

test('XML and .properties parsers', () => {
  const doc = parse('<?xml version="1.0"?><!-- c --><root a="1" b=\'x &amp; y\'><child>text</child><child/><![CDATA[<raw>]]></root>');
  const root = doc.elements[0];
  assert.equal(root.attr('a'), '1'); assert.equal(root.attr('b'), 'x & y'); assert.equal(root.childrenNamed('child').length, 2); assert.equal(root.child('child').text, 'text');
  assert.ok(root.text.includes('<raw>'));
  const props = parseProperties('# comment\nkey.one = value one\nkey.two:two\nmulti = a \\\n  b\nunicode=\\u0041\nempty=');
  assert.deepEqual(props, { 'key.one': 'value one', 'key.two': 'two', multi: 'a b', unicode: 'A', empty: '' });
});

test('Site, preferences, Logger, Status, Transaction, CacheMgr', () => {
  const Site = dw.system.Site;
  assert.equal(Site.getCurrent().ID, 'RefArch'); assert.equal(Site.current.getCustomPreferenceValue('maxItems'), 5); assert.equal(Site.current.preferences.custom.enableFeatureX, true);
  assert.equal(Site.getCurrent().getCustomPreferenceValue('missing'), null);
  assert.equal(Site.current.defaultCurrency, 'USD'); assert.equal(Site.current.timezone, 'America/New_York');
  const Status = dw.system.Status; const st = new Status(Status.ERROR, 'X', 'bad {0}', 7); assert.equal(st.error, true); assert.equal(st.message, 'bad 7'); assert.equal(st.code, 'X');
  const logs = []; rt.on('log', (e) => logs.push(e));
  dw.system.Logger.getLogger('t', 'sub').warn('hello {0}', 'w'); assert.equal(logs.pop().message, 'hello w');
  const Tx = dw.system.Transaction; assert.equal(Tx.wrap(() => 5), 5); assert.throws(() => Tx.commit(), /without begin/);
  const cache = dw.system.CacheMgr.getCache('c'); assert.equal(cache.get('k', () => 42), 42); assert.equal(cache.get('k'), 42); cache.invalidate('k'); assert.equal(cache.get('k'), null);
  assert.equal(dw.system.System.getInstanceType(), dw.system.System.DEVELOPMENT_SYSTEM);
});
