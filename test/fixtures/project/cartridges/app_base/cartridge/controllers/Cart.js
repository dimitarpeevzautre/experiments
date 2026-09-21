'use strict';
var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var HookMgr = require('dw/system/HookMgr');
var Resource = require('dw/web/Resource');

function calculate(basket) {
    if (HookMgr.hasHook('dw.order.calculate')) HookMgr.callHook('dw.order.calculate', 'calculate', basket);
    else __sfccRuntime.calculateBasket(basket);
}
function summary(basket) {
    return {
        items: basket.productLineItems.toArray().map(function (p) { return { pid: p.productID, qty: p.quantityValue, price: p.price.value, adjusted: p.adjustedPrice.value, adjustments: p.priceAdjustments.toArray().map(function (a) { return { promo: a.promotionID, price: a.price.value }; }) }; }),
        coupons: basket.couponLineItems.toArray().map(function (c) { return { code: c.couponCode, applied: c.applied, valid: c.valid, status: c.statusCode }; }),
        orderAdjustments: basket.priceAdjustments.toArray().map(function (a) { return { promo: a.promotionID, price: a.price.value }; }),
        merchandizeTotal: basket.adjustedMerchandizeTotalPrice.value,
        shipping: basket.adjustedShippingTotalPrice.value,
        tax: basket.totalTax.value,
        total: basket.totalGrossPrice.value,
        quantity: basket.productQuantityTotal,
        shippingMethod: basket.defaultShipment.shippingMethodID
    };
}

server.post('AddProduct', function (req, res, next) {
    var product = ProductMgr.getProduct(req.form.pid);
    var qty = parseInt(req.form.quantity || '1', 10);
    if (!product || !product.availabilityModel.isOrderable(qty)) { res.setStatusCode(400); res.json({ error: true, message: Resource.msg('error.notavailable', 'cart', 'not available') }); return next(); }
    var basket = BasketMgr.getCurrentOrNewBasket();
    Transaction.wrap(function () {
        var existing = basket.getProductLineItems(product.ID).toArray()[0];
        if (existing) existing.setQuantityValue(existing.quantityValue + qty);
        else { var pli = basket.createProductLineItem(product, basket.defaultShipment); pli.setQuantityValue(qty); }
        if (!basket.defaultShipment.shippingMethod) basket.defaultShipment.setShippingMethod(require('dw/order/ShippingMgr').getDefaultShippingMethod());
        calculate(basket);
    });
    res.json(summary(basket));
    next();
});

server.post('AddCoupon', function (req, res, next) {
    var basket = BasketMgr.getCurrentBasket();
    if (!basket) { res.setStatusCode(400); res.json({ error: true }); return next(); }
    var error = null;
    Transaction.wrap(function () {
        try { basket.createCouponLineItem(req.form.couponCode, true); } catch (e) { error = e.errorCode || e.message; }
        calculate(basket);
    });
    var out = summary(basket); out.error = error;
    res.json(out);
    next();
});

server.get('Show', function (req, res, next) {
    var basket = BasketMgr.getCurrentBasket();
    res.render('cart/cart', { basket: basket, summary: basket ? summary(basket) : null });
    next();
});

server.get('MiniCart', server.middleware.include, function (req, res, next) {
    var basket = BasketMgr.getCurrentBasket();
    res.render('cart/miniCart', { quantity: basket ? basket.productQuantityTotal : 0 });
    next();
});

module.exports = server.exports();
