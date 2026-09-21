'use strict';
var server = require('server');
server.extend(module.superModule);
server.append('Show', function (req, res, next) {
    var viewData = res.getViewData();
    viewData.extended = true;
    viewData.greeting = viewData.greeting + '!';
    res.setViewData(viewData);
    next();
});
server.prepend('Json', function (req, res, next) {
    res.setViewData({ prepended: true });
    next();
});
server.get('Custom', function (req, res, next) {
    res.json({ custom: true, superModuleHadShow: typeof module.superModule.Show === 'function' });
    next();
});
module.exports = server.exports();
