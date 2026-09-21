'use strict';
var server = require('server');
server.get('Start', function (req, res, next) {
    res.setStatusCode(500);
    res.render('error/error', { message: request.custom.errorMessage || 'error' });
    next();
});
server.get('ErrorCode', function (req, res, next) {
    res.setStatusCode(404);
    res.render('error/notFound', { pid: null });
    next();
});
module.exports = server.exports();
