'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const Money = require('../value/Money');
class ProductShippingCost { constructor(m, surcharge) { this._m = m; this._s = !!surcharge; } getAmount() { return this._m; } isSurcharge() { return this._s; } }
bean(ProductShippingCost);
class ProductShippingModel {
  constructor(product) { this._p = product; }
  getApplicableShippingMethods() { const ShippingMgr = require('./ShippingMgr'); return new ArrayList(ShippingMgr._all().filter((m) => m.isOnline() && !(m._data.excludedProducts || []).includes(this._p.getID()))); }
  getShippingCost(method) { const rt = require('../../runtime').current(); const cur = rt.context.session.getCurrency().getCurrencyCode(); const s = (method._data.productSurcharges || {})[this._p.getID()]; return s != null ? new ProductShippingCost(new Money(s, cur), true) : null; }
  getShippingCosts() { return new ArrayList(); }
}
ProductShippingModel.ProductShippingCost = ProductShippingCost;
module.exports = bean(ProductShippingModel);
