'use strict';
var PageMgr = require('dw/experience/PageMgr');
module.exports.render = function (context) {
    var page = context.page;
    return '<div class="page ' + page.ID + '"><h1>' + (context.content.get('headline') || '') + '</h1>' + PageMgr.renderRegion(page.getRegion('main')) + '</div>';
};
