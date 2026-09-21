'use strict';
const rtRef = require('../../runtime');
module.exports = {
  /** Render template with pdict; writes into the current response. */
  renderTemplate(template, args) {
    const rt = rtRef.current();
    const pdict = Object.assign({ CurrentRequest: rt.context.request, CurrentSession: rt.context.session, CurrentCustomer: rt.context.customer, CurrentHttpParameterMap: rt.context.request ? rt.context.request.getHttpParameterMap() : null, CurrentForms: rt.context.session ? rt.context.session.getForms() : null, CurrentPageMetaData: rt.context.request ? rt.context.request.getPageMetaData() : null }, args && typeof args.toJSON === 'function' && !(args instanceof Map) ? args : args || {});
    const html = rt.isml.renderTemplate(template, pdict);
    if (rt.context.response) rt.context.response.getWriter().print(html);
    return html;
  },
};
