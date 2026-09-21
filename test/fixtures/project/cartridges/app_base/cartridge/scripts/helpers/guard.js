'use strict';
exports.ensure = function (filters, action) {
    var fn = function () {
        if (filters.indexOf('get') !== -1 && request.httpMethod !== 'GET') { response.setStatus(405); return; }
        return action();
    };
    fn.public = true;
    return fn;
};
