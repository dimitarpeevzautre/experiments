'use strict';
/* SiteGenesis-style controller (no server module) */
var ISML = require('dw/template/ISML');
var guard = require('~/cartridge/scripts/helpers/guard');
function show() {
    var pdict = { Title: 'Legacy', Param: request.httpParameterMap.x.stringValue, Forms: session.forms };
    ISML.renderTemplate('legacy/show', pdict);
}
function ds() {
    var script = require('~/cartridge/scripts/helpers/legacyMath.ds');
    var dict = new dw.system.PipelineDictionary();
    var result = script.execute(dict);
    response.setContentType('application/json');
    response.writer.print(JSON.stringify({ result: result, total: dict.Total }));
}
exports.Show = guard.ensure(['get'], show);
exports.Ds = guard.ensure(['get'], ds);
exports.Secret = function () { response.writer.print('secret'); }; // not public
