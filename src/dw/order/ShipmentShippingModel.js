'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const Money = require('../value/Money');
class ShipmentShippingCost { constructor(m) { this._m = m; } getAmount() { return this._m; } }
bean(ShipmentShippingCost);
class ShipmentShippingModel {
  constructor(shipment) { this._sh = shipment; }
  getApplicableShippingMethods(address) { const ShippingMgr = require('./ShippingMgr'); const addr = address || this._sh.getShippingAddress(); const cur = this._sh._ctnr.getCurrencyCode(); return new ArrayList(ShippingMgr._all().filter((m) => m.isOnline() && (!m.getCurrencyCode() || m.getCurrencyCode() === cur) && m._applicable(addr) && !(m._data.excludedProducts || []).some((id) => this._sh.getProductLineItems().toArray().some((p) => p.getProductID() === id)))); }
  getInapplicableShippingMethods(address) { const ShippingMgr = require('./ShippingMgr'); const app = this.getApplicableShippingMethods(address).toArray(); return new ArrayList(ShippingMgr._all().filter((m) => !app.includes(m))); }
  getShippingCost(method) { const total = this._sh.getAdjustedMerchandizeTotalPrice(false).getValue(); const cur = this._sh._ctnr.getCurrencyCode(); return new ShipmentShippingCost(new Money(method._cost(total), cur)); }
}
ShipmentShippingModel.ShipmentShippingCost = ShipmentShippingCost;
module.exports = bean(ShipmentShippingModel);
