'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { makeRuntime, client } = require('./helpers');

test('SFRA-style controllers: render, extend/append/prepend, superModule, remote include, redirects', () => {
  const rt = makeRuntime(); const c = client(rt);
  let r = c.get('Home-Show');
  assert.equal(r.status, 200); assert.equal(r.contentType, 'text/html;charset=UTF-8');
  assert.match(r.text, /<h1 class="site">Fixture Store<\/h1>/);
  assert.match(r.text, /Welcome to the base store!/); // appended by app_custom
  assert.match(r.text, /CUSTOM:\$12\.50 \(custom&gt;base\)/); // hook + superModule override
  assert.match(r.text, /<span class="minicart">0<\/span>/); // remote include
  assert.match(r.text, /<footer class="custom">Custom footer<\/footer>/);
  assert.match(r.text, /Hello guest/);
  assert.equal(c.cookies().some((k) => k.name === 'dwsid'), true);
  r = c.get('Home-Json?q=hi'); assert.deepEqual(JSON.parse(r.text), { prepended: true, ok: true, q: 'hi', method: 'GET', sessionCounter: 0 }); assert.equal(r.contentType, 'application/json');
  c.get('Home-Counter'); r = c.get('Home-Counter'); assert.equal(r.json().counter, 2);
  r = c.get('Home-Json'); assert.equal(r.json().sessionCounter, 2);
  r = c.get('Home-Custom'); assert.deepEqual(r.json(), { custom: true, superModuleHadShow: true });
  r = c.get('Home-Redirect'); assert.equal(r.status, 302); assert.equal(r.redirect, '/on/demandware.store/Sites-RefArch-Site/default/Home-Show');
  r = c.get('Home-Include?who=me'); assert.equal(r.status, 500); // include middleware rejects direct calls
  r = c.get('/Home-Show'); assert.equal(r.status, 200);
  r = c.get('/s/RefArch/en_US/Home-Show'); assert.equal(r.status, 200); assert.match(r.text, /class="locale">en_US/);
  r = c.get('/'); assert.equal(r.status, 200);
});

test('errors and 404s go through the Error controller; non-public actions are hidden', () => {
  const rt = makeRuntime(); const c = client(rt);
  let r = c.get('Home-Boom'); assert.equal(r.status, 500); assert.match(r.text, /<h1 class="error">kaboom<\/h1>/);
  r = c.get('Nope-Show'); assert.equal(r.status, 404); assert.match(r.text, /notfound/);
  r = c.get('Legacy-Secret'); assert.equal(r.status, 404);
  r = c.get('Home-Missing'); assert.equal(r.status, 404);
  r = c.post('Home-Json', { a: 1 }); assert.equal(r.status, 405);
});

test('SiteGenesis-style controllers with guard, ISML.renderTemplate and .ds scripts', () => {
  const rt = makeRuntime(); const c = client(rt);
  let r = c.get('Legacy-Show?x=42'); assert.equal(r.text.trim(), '<h2>Legacy:42</h2>');
  r = c.get('Legacy-Ds'); assert.deepEqual(r.json(), { result: 1, total: 16 }); assert.equal(r.contentType, 'application/json');
  r = c.post('Legacy-Show', {}); assert.equal(r.status, 405);
});

test('product detail with variation selection', () => {
  const rt = makeRuntime(); const c = client(rt);
  let r = c.get('Product-Show?pid=P0001');
  assert.match(r.text, /<h1 class="name">Classic Shirt<\/h1>/); assert.match(r.text, /from \$20\.00/); assert.match(r.text, /large\/P0001\.jpg/); assert.match(r.text, /<div class="desc"><b>Soft<\/b> cotton<\/div>/);
  r = c.get('Product-Show?pid=P0001&dwvar_P0001_color=blue&dwvar_P0001_size=M');
  assert.match(r.text, /large\/P0001-blue\.jpg/); assert.match(r.text, /<li class="selected "><a href="[^"]*dwvar_P0001_color=blue/);
  r = c.get('Product-Show?pid=P0001&dwvar_P0001_color=red&dwvar_P0001_size=M'); assert.match(r.text, /Out of stock/);
  r = c.get('Product-Show?pid=NOPE'); assert.equal(r.status, 404);
});

test('cart: add, promotions, coupons, shipping, tax, minicart include, persistence across requests', () => {
  const rt = makeRuntime(); const c = client(rt);
  let r = c.post('Cart-AddProduct', { pid: 'P0001-RED-S', quantity: 2 }); let s = r.json();
  assert.equal(s.items[0].price, 40); assert.equal(s.items[0].adjusted, 36); assert.equal(s.items[0].adjustments[0].promo, '10off-shirts');
  assert.equal(s.shipping, 5.99); assert.equal(s.tax, 2.1); assert.equal(s.total, 44.09); assert.equal(s.shippingMethod, '001');
  r = c.post('Cart-AddProduct', { pid: 'P0002', quantity: 3 }); s = r.json();
  assert.equal(s.items[1].price, 36); // tiered price 12 x 3
  assert.deepEqual(s.orderAdjustments, [{ promo: 'order-5-over-50', price: -5 }]); assert.equal(s.merchandizeTotal, 67); assert.equal(s.quantity, 5);
  r = c.post('Cart-AddCoupon', { couponCode: 'FREESHIP' }); s = r.json();
  assert.equal(s.coupons[0].applied, true); assert.equal(s.coupons[0].status, 'APPLIED'); assert.equal(s.shipping, 0); assert.equal(s.total, 70.35);
  r = c.post('Cart-AddCoupon', { couponCode: 'BOGUS' }); assert.equal(r.json().error, 'COUPON_CODE_UNKNOWN');
  r = c.post('Cart-AddCoupon', { couponCode: 'FREESHIP' }); assert.equal(r.json().error, 'COUPON_CODE_ALREADY_IN_BASKET');
  r = c.post('Cart-AddCoupon', { couponCode: 'DISABLED' }); assert.equal(r.json().error, 'COUPON_DISABLED');
  r = c.post('Cart-AddProduct', { pid: 'P0001-RED-M', quantity: 1 }); assert.equal(r.status, 400);
  r = c.get('Cart-Show'); assert.match(r.text, /Classic Shirt x 2 = \$36\.00/); assert.match(r.text, /Plain Hat x 3 = \$36\.00/); assert.match(r.text, /<p class="total">\$70\.35/);
  r = c.get('Home-Show'); assert.match(r.text, /<span class="minicart">5<\/span>/);
  const other = client(rt); r = other.get('Cart-Show'); assert.match(r.text, /Your cart is empty/);
});

test('forms: registration, validation errors, login, logout, session customer, basket merge, customer groups', () => {
  const rt = makeRuntime(); const c = client(rt);
  let r = c.post('Account-SubmitRegistration', { dwfrm_profile_customer_firstname: 'Bob', dwfrm_profile_customer_lastname: 'Builder', dwfrm_profile_customer_email: 'bob@example.com', dwfrm_profile_login_username: 'bob', dwfrm_profile_login_password: 'Secret123!', dwfrm_profile_customer_addtoemaillist: 'true', dwfrm_profile_confirm: 'Register' });
  let j = r.json(); assert.equal(j.error, false); assert.equal(j.hook, 'hooked:bob@example.com'); assert.equal(j.welcomeSent, true); assert.match(j.customerNo, /^\d{8}$/);
  r = c.get('Account-Show'); j = r.json(); assert.equal(j.email, 'bob@example.com');
  const cust = rt.dw.get('customer/CustomerMgr').getCustomerByLogin('bob@example.com'); assert.equal(cust.profile.firstName, 'Bob'); assert.equal(cust.profile.custom.newsletter, true);
  r = c.post('Account-SubmitRegistration', { dwfrm_profile_customer_firstname: '', dwfrm_profile_customer_lastname: 'x', dwfrm_profile_customer_email: 'bad', dwfrm_profile_login_username: 'b', dwfrm_profile_login_password: 'x' });
  assert.equal(r.status, 400); assert.deepEqual(r.json().fields, { email: 'Please enter a valid email', firstname: 'First name is required' });
  r = c.get('Account-Register'); assert.match(r.text, /name="dwfrm_profile_customer_email" required="true" maxlength="50"/); assert.match(r.text, /name="csrf_token" value="[A-Za-z0-9_-]+"/);
  r = c.get('Account-Logout'); assert.equal(r.json().authenticated, false);
  r = c.get('Account-Show'); assert.equal(r.status, 302);
  r = c.post('Account-Login', { username: 'jane@example.com', password: 'wrong' }); assert.equal(r.status, 401); assert.equal(r.json().status, 'ERROR_PASSWORD_MISMATCH');
  c.post('Cart-AddProduct', { pid: 'P0002', quantity: 1 });
  r = c.post('Account-Login', { username: 'jane@example.com', password: 'Passw0rd!' }); j = r.json(); assert.equal(j.firstName, 'Jane'); assert.deepEqual(j.groups.sort(), ['BigSpenders', 'Everyone', 'Registered', 'VIP']);
  r = c.get('Account-Show'); assert.equal(r.json().addresses, 1);
  r = c.get('Cart-Show'); assert.match(r.text, /Plain Hat x 1/); // basket kept after login
  r = c.post('Cart-AddProduct', { pid: 'P0001-RED-S', quantity: 1 }); const s = r.json(); assert.equal(s.items.find((i) => i.pid === 'P0001-RED-S').adjustments[0].promo, 'vip-20'); // VIP exclusive promotion wins
});

test('search: phrase, category, refinements, price range, sorting and URLs', () => {
  const rt = makeRuntime(); const c = client(rt);
  let j = c.get('Search-Show?q=shirt').json();
  assert.equal(j.count, 1); assert.equal(j.hits[0].type, 'master'); assert.deepEqual(j.hits[0].represented, ['P0001-RED-S', 'P0001-RED-M', 'P0001-BLUE-M']); assert.equal(j.hits[0].min, 20); assert.equal(j.hits[0].max, 30);
  const color = j.refinements.find((r) => r.attr === 'color'); assert.deepEqual(color.values.map((v) => v.display), ['Blue', 'Red']);
  assert.match(j.refineUrl, /prefn1=color&prefv1=red/);
  j = c.get('Search-Show?cgid=mens').json(); assert.deepEqual(j.hits.map((h) => h.id).sort(), ['P0001', 'P0002']); assert.equal(j.category, 'Mens');
  j = c.get('Search-Show?cgid=mens&prefn1=material&prefv1=wool').json(); assert.deepEqual(j.hits.map((h) => h.id), ['P0002']);
  j = c.get('Search-Show?cgid=mens&prefn1=color&prefv1=blue').json(); assert.deepEqual(j.hits[0].represented, ['P0001-BLUE-M']);
  j = c.get('Search-Show?cgid=root&pmin=10&pmax=16').json(); assert.deepEqual(j.hits.map((h) => h.id).sort(), ['O0001', 'P0002']);
  j = c.get('Search-Show?cgid=root&srule=price-high-to-low').json(); assert.deepEqual(j.hits.map((h) => h.id), ['B0001', 'P0004', 'P0001', 'P0002', 'O0001']);
  j = c.get('Search-Show?q=zzzz').json(); assert.equal(j.count, 0);
});

test('static assets are served from cartridges', () => {
  const rt = makeRuntime(); const c = client(rt);
  let r = c.get('/on/demandware.static/Sites-RefArch-Site/-/default/v123/js/main.js'); assert.equal(r.status, 200); assert.equal(r.contentType, 'application/javascript'); assert.match(r.text, /console.log/);
  r = c.get('/on/demandware.static/Sites-RefArch-Site/-/de_DE/v1/js/main.js'); assert.equal(r.status, 200);
  r = c.get('/static/js/nope.js'); assert.equal(r.status, 404);
});

test('the HTTP server round-trips requests, cookies and JSON bodies', async () => {
  const rt = makeRuntime();
  const server = rt.createServer();
  const addr = await server.listenAsync(0, '127.0.0.1');
  try {
    const base = `http://127.0.0.1:${addr.port}`;
    let res = await fetch(`${base}/on/demandware.store/Sites-RefArch-Site/default/Home-Json?q=x`);
    assert.equal(res.status, 200); assert.equal((await res.json()).q, 'x');
    const cookie = res.headers.get('set-cookie'); assert.match(cookie, /dwsid=/);
    res = await fetch(`${base}/Cart-AddProduct`, { method: 'POST', headers: { cookie: cookie.split(';')[0], 'content-type': 'application/json' }, body: JSON.stringify({ pid: 'P0002', quantity: 2 }) });
    assert.equal((await res.json()).quantity, 2);
    res = await fetch(`${base}/Cart-Show`, { headers: { cookie: cookie.split(';')[0] } }); assert.match(await res.text(), /Plain Hat x 2/);
    res = await fetch(`${base}/Home-Redirect`, { redirect: 'manual' }); assert.equal(res.status, 302);
  } finally { server.close(); }
});
