'use strict';
var ProductMgr = require('dw/catalog/ProductMgr');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var iterator, writer, csv, count = 0;
exports.beforeStep = function (params) {
    iterator = ProductMgr.queryAllSiteProducts();
    var dir = new File(File.IMPEX + '/src/export'); dir.mkdirs();
    writer = new FileWriter(new File(dir, params.FileName || 'products.csv'));
    csv = new CSVStreamWriter(writer);
    csv.writeNext(['ID', 'Name', 'Online']);
};
exports.getTotalCount = function () { return iterator.count; };
exports.read = function () { return iterator.hasNext() ? iterator.next() : null; };
exports.process = function (product) { if (!product.online) return null; return [product.ID, product.name, String(product.online)]; };
exports.write = function (lines) { for each (var line in lines) { csv.writeNext(line); count++; } };
exports.afterStep = function (success) { csv.close(); writer.close(); iterator.close(); require('dw/system/Logger').info('exported {0} products, success={1}', count, success); };
