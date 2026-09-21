'use strict';
function Response(response) {
  this.view = null; this.viewData = {}; this.redirectUrl = null; this.redirectStatus = null; this.messageLog = []; this.base = response; this.cachePeriod = null; this.cachePeriodUnit = null; this.personalized = false; this.renderings = []; this.isJson = false; this.isXml = false; this.statusCode = 200; this.contentType = null;
}
Response.prototype = {
  render(name, data) { this.view = name; this.setViewData(data); this.renderings.push({ type: 'render', subType: 'isml', view: name }); },
  json(data) { this.isJson = true; this.setViewData(data); this.renderings.push({ type: 'render', subType: 'json' }); },
  xml(xmlString) { this.isXml = true; this.setViewData({ xml: xmlString }); this.renderings.push({ type: 'render', subType: 'xml' }); },
  page(page, data, aspectAttributes) { this.renderings.push({ type: 'render', subType: 'page', page, aspectAttributes }); this.setViewData(data); },
  redirect(url, status) { this.redirectUrl = String(url); if (status) this.redirectStatus = status; },
  print(message) { this.renderings.push({ type: 'print', message }); },
  setViewData(data) { if (data) Object.assign(this.viewData, data); },
  getViewData() { return this.viewData; },
  setStatusCode(code) { this.statusCode = code; this.base.setStatus(code); },
  setContentType(t) { this.contentType = t; this.base.setContentType(t); },
  setHttpHeader(n, v) { this.base.setHttpHeader(n, v); },
  log(...args) { this.messageLog.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')); },
  cachePeriod: null,
};
module.exports = Response;
