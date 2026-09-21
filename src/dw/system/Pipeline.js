'use strict';
const rtRef = require('../../runtime');
module.exports = {
  /** Execute pipeline "Name-StartNode" with an optional argument object; returns the resulting dictionary. */
  execute(pipeline, args) { return rtRef.current().runPipeline(pipeline, args || {}).dictionary; },
};
