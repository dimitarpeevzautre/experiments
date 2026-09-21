'use strict';
const { bean } = require('../../util/bean');
const Variant = require('./Variant');
class VariationGroup extends Variant { isVariant() { return false; } isVariationGroup() { return true; } }
module.exports = bean(VariationGroup);
