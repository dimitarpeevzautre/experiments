'use strict';
const ISML = require('dw/template/ISML');
const PageMgr = require('dw/experience/PageMgr');
function template(view, viewData, response) {
  if (response.contentType) response.base.setContentType(response.contentType);
  ISML.renderTemplate(view, viewData);
}
function json(data, response) { response.base.setContentType('application/json'); response.base.writer.print(JSON.stringify(data, null, 2)); }
function xml(viewData, response) { response.base.setContentType('application/xml'); response.base.writer.print(viewData.xml); }
function page(pageID, aspectAttributes, data, response) { response.base.writer.print(PageMgr.renderPage(pageID, JSON.stringify(data))); }
module.exports = {
  applyRenderings(res) {
    if (res.redirectUrl) { res.base.redirect(res.redirectUrl, res.redirectStatus || 302); return; }
    for (const r of res.renderings) {
      if (r.type === 'render') { if (r.subType === 'isml') template(r.view, res.viewData, res); else if (r.subType === 'json') json(res.viewData, res); else if (r.subType === 'xml') xml(res.viewData, res); else if (r.subType === 'page') page(r.page, r.aspectAttributes, res.viewData, res); }
      else if (r.type === 'print') res.base.writer.print(r.message);
    }
  },
};
