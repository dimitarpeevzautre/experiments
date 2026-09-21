'use strict';
var server = require('server');
var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var priceHelper = require('*/cartridge/scripts/helpers/priceHelper');
var Money = require('dw/value/Money');

server.get('Show', server.middleware.https, function (req, res, next) {
    res.render('home', {
        siteName: Site.getCurrent().getName(),
        greeting: Resource.msg('home.greeting', 'home', null),
        locale: req.locale.id,
        price: priceHelper.format(new Money(12.5, 'USD')),
        helperLabel: priceHelper.label,
        currentCustomer: req.currentCustomer,
        productUrl: URLUtils.url('Product-Show', 'pid', 'P0001').toString()
    });
    next();
});

server.get('Json', function (req, res, next) {
    res.json({ ok: true, q: req.querystring.q || null, method: req.httpMethod, sessionCounter: session.custom.counter || 0 });
    next();
});

server.get('Counter', function (req, res, next) {
    session.custom.counter = (session.custom.counter || 0) + 1;
    res.json({ counter: session.custom.counter });
    next();
});

server.get('Redirect', function (req, res, next) {
    res.redirect(URLUtils.url('Home-Show'));
    next();
});

server.get('Boom', function (req, res, next) {
    throw new Error('kaboom');
});

server.get('Include', server.middleware.include, function (req, res, next) {
    res.render('common/includeContent', { who: req.querystring.who });
    next();
});

module.exports = server.exports();
