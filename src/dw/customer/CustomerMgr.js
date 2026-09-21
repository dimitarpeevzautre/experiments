'use strict';
const rtRef = require('../../runtime');
const Customer = require('./Customer');
const CustomerGroup = require('./CustomerGroup');
const AuthenticationStatus = require('./AuthenticationStatus');
const CustomerPasswordConstraints = require('./CustomerPasswordConstraints');
const ArrayList = require('../util/ArrayList');
const SeekableIterator = require('../util/SeekableIterator');
const { query } = require('../../internal/query');

const wrappers = new WeakMap();
function wrap(rt, data) {
  if (!data) return null;
  let c = wrappers.get(data);
  if (!c) { c = new Customer(data, rt); wrappers.set(data, c); }
  return c;
}
function all(rt) { return rt.store.get('customers', {}); }

const CustomerMgr = {
  _wrap(data) { return wrap(rtRef.current(), data); },
  getCustomerByCustomerNumber(no) { const rt = rtRef.current(); const d = all(rt)[no] || Object.values(all(rt)).find((c) => c.customerNo === no); return wrap(rt, d); },
  getCustomerByLogin(login) { const rt = rtRef.current(); if (!login) return null; const d = Object.values(all(rt)).find((c) => c.credentials && c.credentials.login && c.credentials.login.toLowerCase() === String(login).toLowerCase()); return wrap(rt, d); },
  getCustomerByToken(token) { const rt = rtRef.current(); const d = Object.values(all(rt)).find((c) => c.credentials && c.credentials.resetToken === token); return wrap(rt, d); },
  getExternallyAuthenticatedCustomerProfile(providerID, externalID) { const rt = rtRef.current(); const d = Object.values(all(rt)).find((c) => (c.externalProfiles || []).some((p) => p.authenticationProviderID === providerID && p.externalID === externalID)); const c = wrap(rt, d); return c ? c.getProfile() : null; },
  getProfile(customerNo) { const c = CustomerMgr.getCustomerByCustomerNumber(customerNo); return c ? c.getProfile() : null; },
  authenticateCustomer(login, password) {
    const c = CustomerMgr.getCustomerByLogin(login);
    if (!c) return new AuthenticationStatus(AuthenticationStatus.ERROR_CUSTOMER_NOT_FOUND);
    const cred = c.getCredentials();
    if (!cred.isEnabled()) return new AuthenticationStatus(AuthenticationStatus.ERROR_CUSTOMER_DISABLED, c);
    if (cred.isLocked()) return new AuthenticationStatus(AuthenticationStatus.ERROR_CUSTOMER_LOCKED, c);
    if (!cred._verify(password)) { cred._recordFailure(); return new AuthenticationStatus(cred.isLocked() ? AuthenticationStatus.ERROR_CUSTOMER_LOCKED : AuthenticationStatus.ERROR_PASSWORD_MISMATCH, c); }
    cred._recordSuccess();
    return new AuthenticationStatus(AuthenticationStatus.AUTH_OK, c);
  },
  loginCustomer(statusOrLogin, passwordOrRemember, rememberMe) {
    const rt = rtRef.current();
    let customer;
    if (statusOrLogin instanceof AuthenticationStatus) { if (!statusOrLogin.isAuthenticated()) throw new Error('Cannot login customer with failed authentication status'); customer = statusOrLogin.getCustomer(); }
    else { const st = CustomerMgr.authenticateCustomer(statusOrLogin, passwordOrRemember); if (!st.isAuthenticated()) return null; customer = st.getCustomer(); }
    customer._authenticated = true;
    customer._data.previousLoginTime = customer._data.lastLoginTime; customer._data.lastLoginTime = new Date().toISOString(); customer._markDirty();
    const session = rt.context.session;
    if (session) { session._setCustomer(customer); session._rememberMe = !!(rememberMe !== undefined ? rememberMe : passwordOrRemember); }
    rt.emit('login', customer);
    return customer;
  },
  loginExternallyAuthenticatedCustomer(providerID, externalID, rememberMe) {
    const rt = rtRef.current();
    const p = CustomerMgr.getExternallyAuthenticatedCustomerProfile(providerID, externalID);
    if (!p) return null;
    const c = p.getCustomer(); c._authenticated = true; c._external = true;
    rt.context.session._setCustomer(c);
    return c;
  },
  logoutCustomer(rememberMe) {
    const rt = rtRef.current();
    const s = rt.context.session;
    const prev = s.getCustomer();
    if (prev) prev._authenticated = false;
    s._reset();
    s._setCustomer(Customer._anonymous(rt));
    rt.emit('logout', prev);
    return s.getCustomer();
  },
  createCustomer(login, password, customerNo) {
    const rt = rtRef.current();
    if (CustomerMgr.getCustomerByLogin(login)) throw new Error(`Login '${login}' already in use`);
    if (!CustomerMgr.isAcceptablePassword(password)) throw new Error('Password does not meet constraints');
    const customers = all(rt);
    if (!customerNo) { let n = 1; while (customers[String(n).padStart(8, '0')]) n++; customerNo = String(n).padStart(8, '0'); }
    const data = { ID: require('../object/PersistentObject').newUUID(), customerNo, creationDate: new Date().toISOString(), credentials: { login, enabled: true }, profile: { custom: {} }, addresses: [], paymentInstruments: [], customerGroups: [] };
    customers[customerNo] = data;
    rt.store.touch('customers');
    const c = wrap(rt, data);
    c.getCredentials().setPassword(password);
    return c;
  },
  createExternallyAuthenticatedCustomer(providerID, externalID) {
    const rt = rtRef.current();
    const customers = all(rt);
    let n = 1; while (customers[String(n).padStart(8, '0')]) n++;
    const customerNo = String(n).padStart(8, '0');
    const data = { ID: require('../object/PersistentObject').newUUID(), customerNo, creationDate: new Date().toISOString(), credentials: { enabled: true, authenticationProviderID: providerID, externalID }, profile: { custom: {} }, addresses: [], paymentInstruments: [], customerGroups: [], externalProfiles: [{ authenticationProviderID: providerID, externalID, custom: {} }] };
    customers[customerNo] = data; rt.store.touch('customers');
    return wrap(rt, data);
  },
  removeCustomer(customer) { const rt = rtRef.current(); const customers = all(rt); for (const [k, v] of Object.entries(customers)) if (v === customer._data || v.customerNo === customer.getCustomerNo()) delete customers[k]; rt.store.touch('customers'); },
  getPasswordConstraints() { return new CustomerPasswordConstraints(rtRef.current().store.get('password-constraints', {})); },
  isAcceptablePassword(pw) {
    if (pw == null) return false;
    const c = CustomerMgr.getPasswordConstraints();
    const s = String(pw);
    if (s.length < c.getMinLength()) return false;
    if ((s.match(/[A-Za-z]/g) || []).length < c.getMinLetters()) return false;
    if ((s.match(/[0-9]/g) || []).length < c.getMinNumbers()) return false;
    if ((s.match(/[^A-Za-z0-9]/g) || []).length < c.getMinSpecialChars()) return false;
    if (c.isForceMixedCase() && !(/[a-z]/.test(s) && /[A-Z]/.test(s))) return false;
    return true;
  },
  getCustomerGroup(id) { const rt = rtRef.current(); const defs = rt.store.get('customer-groups', {}); if (['Everyone', 'Registered', 'Unregistered'].includes(id) || defs[id]) return new CustomerGroup(Object.assign({ ID: id, custom: {} }, defs[id] || {}), rt); return null; },
  getCustomerGroups() { const rt = rtRef.current(); const defs = rt.store.get('customer-groups', {}); const ids = new Set(['Everyone', 'Registered', 'Unregistered', ...Object.keys(defs)]); return new ArrayList(Array.from(ids).map((id) => new CustomerGroup(Object.assign({ ID: id, custom: {} }, defs[id] || {}), rt))); },
  getSiteCustomerList() { const CustomerList = require('./CustomerList'); return new CustomerList(rtRef.current().config.site); },
  getCustomerList(id) { const CustomerList = require('./CustomerList'); return new CustomerList(id); },
  getRegisteredCustomerCount() { return Object.keys(all(rtRef.current())).length; },
  describeProfileType() { const OTD = require('../object/ObjectTypeDefinition'); const rt = rtRef.current(); return new OTD('Profile', rt.store.get('object-types', {}).Profile || { attributes: {} }); },
  searchProfiles(queryObjOrString, sortString, ...args) {
    const rt = rtRef.current();
    const profiles = Object.values(all(rt)).map((d) => wrap(rt, d).getProfile());
    return new SeekableIterator(query(profiles, queryObjOrString, sortString, args));
  },
  searchProfile(q, ...args) { const it = CustomerMgr.searchProfiles(q, null, ...args); return it.hasNext() ? it.next() : null; },
  queryProfiles(q, sort, ...args) { return CustomerMgr.searchProfiles(q, sort, ...args); },
  queryProfile(q, ...args) { return CustomerMgr.searchProfile(q, ...args); },
  processProfiles(fn, q, ...args) { const it = CustomerMgr.searchProfiles(q, null, ...args); while (it.hasNext()) fn(it.next()); },
  getRegisteredCustomers() { const rt = rtRef.current(); return new SeekableIterator(Object.values(all(rt)).map((d) => wrap(rt, d))); },
};
module.exports = CustomerMgr;
