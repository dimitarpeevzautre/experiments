'use strict';
var server = require('server');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var CatalogMgr = require('dw/catalog/CatalogMgr');

server.get('Show', function (req, res, next) {
    var psm = new ProductSearchModel();
    if (req.querystring.q) psm.setSearchPhrase(req.querystring.q);
    if (req.querystring.cgid) psm.setCategoryID(req.querystring.cgid);
    if (req.querystring.preferences) Object.keys(req.querystring.preferences).forEach(function (k) { psm.addRefinementValues(k, req.querystring.preferences[k]); });
    if (req.querystring.pmin) psm.setPriceMin(parseFloat(req.querystring.pmin));
    if (req.querystring.pmax) psm.setPriceMax(parseFloat(req.querystring.pmax));
    if (req.querystring.srule) psm.setSortingRule(CatalogMgr.getSortingRule(req.querystring.srule));
    psm.search();
    var hits = []; var it = psm.productSearchHits;
    while (it.hasNext()) { var h = it.next(); hits.push({ id: h.productID, type: h.hitType, min: h.minPrice.value, max: h.maxPrice.value, represented: h.representedProductIDs.toArray() }); }
    var refinements = psm.refinements.refinementDefinitions.toArray().map(function (d) {
        return { name: d.displayName, attr: d.attributeID, values: psm.refinements.getRefinementValues(d).toArray().map(function (v) { return { value: v.value, display: v.displayValue, count: v.hitCount }; }) };
    });
    res.json({ count: psm.count, hits: hits, refinements: refinements, category: psm.category ? psm.category.displayName : null, refineUrl: psm.urlRefineAttributeValue('Search-Show', 'color', 'red').toString() });
    next();
});

module.exports = server.exports();
