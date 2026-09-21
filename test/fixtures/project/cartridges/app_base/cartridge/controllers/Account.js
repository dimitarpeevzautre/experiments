'use strict';
var server = require('server');
var CustomerMgr = require('dw/customer/CustomerMgr');
var Transaction = require('dw/system/Transaction');
var HookMgr = require('dw/system/HookMgr');
var URLUtils = require('dw/web/URLUtils');

server.get('Register', function (req, res, next) {
    var form = server.forms.getForm('profile');
    form.clear();
    res.render('account/register', { profileForm: form });
    next();
});

server.post('SubmitRegistration', function (req, res, next) {
    var form = server.forms.getForm('profile');
    if (!form.valid) { res.setStatusCode(400); res.json({ error: true, fields: { email: form.customer.email.error, firstname: form.customer.firstname.error } }); return next(); }
    var result = { error: false };
    Transaction.wrap(function () {
        try {
            var customer = CustomerMgr.createCustomer(form.customer.email.value, form.login.password.value);
            customer.profile.firstName = form.customer.firstname.value;
            customer.profile.lastName = form.customer.lastname.value;
            customer.profile.email = form.customer.email.value;
            form.copyTo(customer.profile);
            result.hook = HookMgr.callHook('app.customer.registered', 'registered', customer);
            var status = CustomerMgr.authenticateCustomer(form.customer.email.value, form.login.password.value);
            CustomerMgr.loginCustomer(status, false);
            result.customerNo = customer.profile.customerNo;
            result.welcomeSent = customer.profile.custom.welcomeSent;
        } catch (e) { result.error = true; result.message = e.message; }
    });
    res.json(result);
    next();
});

server.post('Login', function (req, res, next) {
    var status = CustomerMgr.authenticateCustomer(req.form.username, req.form.password);
    if (!status.authenticated) { res.setStatusCode(401); res.json({ error: true, status: status.status }); return next(); }
    var c = Transaction.wrap(function () { return CustomerMgr.loginCustomer(status, false); });
    res.json({ error: false, firstName: c.profile.firstName, groups: c.customerGroups.toArray().map(function (g) { return g.ID; }) });
    next();
});

server.get('Show', function (req, res, next) {
    if (!customer.authenticated) { res.redirect(URLUtils.url('Account-Login')); return next(); }
    res.json({ email: customer.profile.email, customerNo: customer.profile.customerNo, addresses: customer.addressBook.addresses.length });
    next();
});

server.get('Logout', function (req, res, next) {
    CustomerMgr.logoutCustomer(false);
    res.json({ authenticated: customer.authenticated });
    next();
});

module.exports = server.exports();
