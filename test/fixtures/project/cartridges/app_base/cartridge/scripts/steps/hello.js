'use strict';
var Status = require('dw/system/Status');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
exports.execute = function (params, stepExecution) {
    var co = CustomObjectMgr.getCustomObject('JobLog', 'hello') || CustomObjectMgr.createCustomObject('JobLog', 'hello');
    co.custom.message = 'Hello ' + params.Name + ' from ' + stepExecution.getJobExecution().getJobID();
    if (params.Fail === 'true') return new Status(Status.ERROR, 'FAILED', 'asked to fail');
    return new Status(Status.OK, 'OK', co.custom.message);
};
