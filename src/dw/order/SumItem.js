'use strict';
const { bean } = require('../../util/bean');
const Money = require('../value/Money');
class SumItem { constructor(net, gross, tax) { this._n = net; this._g = gross; this._t = tax; } getNetPrice() { return this._n; } getGrossPrice() { return this._g; } getTax() { return this._t; } getTaxBasis() { return this._n; } getTaxRate() { return this._n.getValue() ? this._t.getValue() / this._n.getValue() : 0; } }
module.exports = bean(SumItem);
