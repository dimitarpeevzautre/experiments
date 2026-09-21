'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const rtRef = require('../../runtime');
let inst = null;
class OrganizationPreferences extends ExtensibleObject {
  static _instance() {
    if (!inst) { const rt = rtRef.current(); const data = rt.store.get('organization', { custom: {} }); inst = new OrganizationPreferences(data); inst._collection = 'organization'; inst._store = rt.store; }
    return inst;
  }
}
module.exports = bean(OrganizationPreferences);
