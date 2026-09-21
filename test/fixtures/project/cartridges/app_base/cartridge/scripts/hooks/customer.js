'use strict';
var Logger = require('dw/system/Logger');
exports.registered = function (customer) {
    Logger.getLogger('hooks').info('Customer registered: {0}', customer.profile.email);
    customer.profile.custom.welcomeSent = true;
    return 'hooked:' + customer.profile.email;
};
