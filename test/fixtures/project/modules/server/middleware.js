'use strict';
module.exports = {
  get(req, res, next) { if (req.httpMethod === 'GET') next(); else { res.setStatusCode(405); next(new Error('Params do not match route')); } },
  post(req, res, next) { if (req.httpMethod === 'POST') next(); else { res.setStatusCode(405); next(new Error('Params do not match route')); } },
  https(req, res, next) { next(); },
  http(req, res, next) { next(); },
  include(req, res, next) { if (req.includeRequest) next(); else { res.setStatusCode(500); next(new Error('Remote include required')); } },
};
