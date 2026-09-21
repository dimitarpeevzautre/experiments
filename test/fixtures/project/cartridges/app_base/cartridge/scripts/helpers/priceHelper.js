'use strict';
var HookMgr = require('dw/system/HookMgr');
var Money = require('dw/value/Money');
module.exports = {
    label: 'base',
    format: function (money) { return HookMgr.hasHook('app.pricing.format') ? HookMgr.callHook('app.pricing.format', 'format', money) : money.toFormattedString(); },
    zero: function (currency) { return new Money(0, currency); }
};
