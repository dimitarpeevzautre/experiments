'use strict';
const rtRef = require('../../runtime');
const { renderVelocity } = require('../util/Template');
module.exports = {
  render(template, encoding, args) {
    const rt = rtRef.current();
    const out = renderVelocity(String(template), args && args.toJSON ? args.toJSON() : args || {});
    if (rt.context.response) rt.context.response.getWriter().print(out);
    return out;
  },
};
