'use strict';
/**
 * Default basket calculation (what SFRA's dw.order.calculate hook does): line item prices from
 * price books, promotions, shipping costs, taxes, totals. Used when no cartridge registers the hook.
 */
function calculate(basket) {
  const rt = require('../runtime').current();
  const PromotionMgr = rt.dw.get('campaign/PromotionMgr');
  const ShippingMgr = rt.dw.get('order/ShippingMgr');
  const TaxMgr = rt.dw.get('order/TaxMgr');
  const ShippingLocation = rt.dw.get('order/ShippingLocation');
  for (const pli of basket.getAllProductLineItems().toArray()) pli._updatePriceFromProduct();
  PromotionMgr.applyDiscounts(basket);
  ShippingMgr.applyShippingCost(basket);
  for (const sh of basket.getShipments().toArray()) {
    const addr = sh.getShippingAddress();
    const jurisdiction = TaxMgr.getTaxJurisdictionID(new ShippingLocation(addr));
    for (const li of [...sh.getProductLineItems().toArray(), ...sh.getShippingLineItems().toArray()]) {
      const cls = li.getTaxClassID() || TaxMgr.getDefaultTaxClassID();
      li.updateTax(TaxMgr.getTaxRate(cls, jurisdiction));
    }
  }
  basket.updateOrderLevelPriceAdjustmentTax();
  basket.updateTotals();
  const Status = rt.dw.get('system/Status');
  return new Status(Status.OK);
}
module.exports = { calculate };
