'use strict';
var base = module.superModule;
var helper = Object.assign({}, base);
helper.label = 'custom>' + base.label;
module.exports = helper;
