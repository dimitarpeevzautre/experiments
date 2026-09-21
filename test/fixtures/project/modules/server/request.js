'use strict';
const QueryString = require('./queryString');
const forms = require('./forms/forms');
function Request(request, customer, session) {
  this.httpMethod = request.httpMethod;
  this.host = request.httpHost;
  this.path = request.httpPath;
  this.httpHeaders = request.httpHeaders;
  this.https = request.isHttpSecure();
  this.includeRequest = request.includeRequest;
  this.setLocale = (l) => request.setLocale(l);
  this.locale = { id: request.locale, currency: { currencyCode: session.currency.currencyCode, symbol: session.currency.symbol } };
  this.querystring = new QueryString(request.httpQueryString);
  this.form = {};
  const pm = request.httpParameterMap;
  const names = pm.parameterNames.toArray();
  for (const n of names) { if (this.querystring[n] === undefined) this.form[n] = pm.get(n).stringValue; }
  this.body = request.httpParameterMap.requestBodyAsString;
  this.geolocation = { countryCode: request.geolocation.countryCode, latitude: request.geolocation.latitude, longitude: request.geolocation.longitude };
  this.currentCustomer = { raw: customer, profile: customer.registered && customer.profile ? { firstName: customer.profile.firstName, lastName: customer.profile.lastName, email: customer.profile.email, customerNo: customer.profile.customerNo } : null, credentials: customer.registered ? { username: customer.profile.credentials.login } : null, addressBook: customer.registered && customer.addressBook ? { addresses: customer.addressBook.addresses.toArray(), preferredAddress: customer.addressBook.preferredAddress } : null, wallet: customer.registered ? { paymentInstruments: customer.profile.wallet.paymentInstruments.toArray() } : null };
  this.session = { privacyCache: session.privacy, raw: session, currency: session.currency, clickStream: session.clickStream, setCurrency: (c) => session.setCurrency(c), forms: forms(session) };
  this.pageMetaData = request.pageMetaData;
  this.remoteAddress = request.httpRemoteAddress;
  this.referer = request.httpReferer;
  this.custom = request.custom;
  this.raw = request;
}
module.exports = Request;
