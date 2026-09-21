'use strict';
var server = require('server');
var ProductMgr = require('dw/catalog/ProductMgr');
var URLUtils = require('dw/web/URLUtils');

server.get('Show', function (req, res, next) {
    var product = ProductMgr.getProduct(req.querystring.pid);
    if (!product) { res.setStatusCode(404); res.render('error/notFound', { pid: req.querystring.pid }); return next(); }
    var vm = product.variationModel;
    if (req.querystring.variables) {
        Object.keys(req.querystring.variables).forEach(function (attr) { vm.setSelectedAttributeValue(attr, req.querystring.variables[attr].value); });
    }
    var selected = vm.selectedVariant;
    var shown = selected || product;
    res.render('product/productDetails', {
        product: product,
        shown: shown,
        price: shown.priceModel.price,
        priceRange: product.priceModel.isPriceRange(),
        minPrice: product.priceModel.minPrice,
        available: shown.availabilityModel.orderable,
        attributes: vm.productVariationAttributes.toArray().map(function (a) {
            return { id: a.ID, values: vm.getAllValues(a).toArray().map(function (v) { return { id: v.ID, display: v.displayValue, selected: vm.isSelectedAttributeValue(a, v), orderable: vm.hasOrderableVariants(a, v), url: vm.urlSelectVariationValue('Product-Show', a, v).toString() }; }) };
        }),
        images: shown.getImages('large').toArray().map(function (i) { return i.URL.toString(); })
    });
    next();
});

module.exports = server.exports();
