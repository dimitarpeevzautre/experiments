'use strict';
const rtRef = require('../../runtime');
const Calendar = require('../util/Calendar');
const System = {
  DEVELOPMENT_SYSTEM: 0, STAGING_SYSTEM: 1, PRODUCTION_SYSTEM: 2,
  getInstanceType() { const t = rtRef.current().config.instanceType; return t === 'production' ? 2 : t === 'staging' ? 1 : 0; },
  getInstanceHostname() { return rtRef.current().config.hostname || 'localhost'; },
  getInstanceTimeZone() { return rtRef.current().config.timezone || 'UTC'; },
  getCalendar() { const c = new Calendar(); c.setTimeZone(System.getInstanceTimeZone()); return c; },
  getPreferences() { const OP = require('./OrganizationPreferences'); return OP._instance(); },
  getCompatibilityMode() { return rtRef.current().config.compatibilityMode || 2404; },
  getRealmID() { return 'local'; },
};
module.exports = System;
