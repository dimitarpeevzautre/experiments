'use strict';
const rtRef = require('../../runtime');
module.exports = {
  /** Render a remote include (controller URL) synchronously and return its output. */
  render(url) { const { renderInclude } = require('../../http/dispatcher'); return renderInclude(rtRef.current(), String(url)); },
};
