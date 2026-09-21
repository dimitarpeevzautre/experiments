'use strict';
const Status = require('./Status');
module.exports = {
  loginAgentUser() { return new Status(Status.ERROR, 'AGENT_USER_NOT_SUPPORTED'); },
  loginOnBehalfOfCustomer() { return new Status(Status.ERROR, 'AGENT_USER_NOT_SUPPORTED'); },
  logoutAgentUser() { return new Status(Status.OK); },
};
