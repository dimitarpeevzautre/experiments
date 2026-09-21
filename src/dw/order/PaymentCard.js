'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const Status = require('../system/Status');
class PaymentCard extends ExtensibleObject {
  constructor(d) { super(d); }
  getCardType() { return this._data.cardType || this._data.ID; }
  getName() { return this._data.name || this.getCardType(); }
  getDescription() { return this._data.description || null; }
  isActive() { return this._data.active !== false; }
  getImage() { const MediaFile = require('../content/MediaFile'); return this._data.image ? new MediaFile(this._data.image) : null; }
  getSecurityCodeLength() { return this._data.securityCodeLength || 3; }
  getNumberLengths() { return new (require('../util/ArrayList'))(this._data.numberLengths || [16]); }
  isApplicable(customer, countryCode, amount) { return this.isActive(); }
  verify(expMonth, expYear, number, csc) {
    const s = new Status();
    const n = String(number || '').replace(/\s|-/g, '');
    if (!/^\d+$/.test(n) || !luhn(n)) s.addItem(new Status.StatusItem(Status.ERROR, PaymentCard.CREDITCARD_NUMBER_INVALID));
    else if (!(this._data.numberLengths || [13, 14, 15, 16, 17, 18, 19]).includes(n.length)) s.addItem(new Status.StatusItem(Status.ERROR, PaymentCard.CREDITCARD_NUMBER_INVALID));
    const now = new Date(); const y = Number(expYear); const m = Number(expMonth);
    if (!m || m < 1 || m > 12 || !y || y < now.getFullYear() || (y === now.getFullYear() && m < now.getMonth() + 1)) s.addItem(new Status.StatusItem(Status.ERROR, PaymentCard.CREDITCARD_EXPIRATION_INVALID));
    if (csc !== undefined && csc !== null && csc !== '' && String(csc).length !== this.getSecurityCodeLength()) s.addItem(new Status.StatusItem(Status.ERROR, PaymentCard.CREDITCARD_SECURITY_CODE_INVALID));
    if (!s.getItems().size()) s.addItem(new Status.StatusItem(Status.OK));
    return s;
  }
}
function luhn(n) { let sum = 0; let alt = false; for (let i = n.length - 1; i >= 0; i--) { let d = Number(n[i]); if (alt) { d *= 2; if (d > 9) d -= 9; } sum += d; alt = !alt; } return sum % 10 === 0; }
Object.assign(PaymentCard, { CREDITCARD_NUMBER_INVALID: 'CREDITCARD_NUMBER_INVALID', CREDITCARD_EXPIRATION_INVALID: 'CREDITCARD_EXPIRATION_INVALID', CREDITCARD_SECURITY_CODE_INVALID: 'CREDITCARD_SECURITY_CODE_INVALID', CREDITCARD_ISSUE_NUMBER_INVALID: 'CREDITCARD_ISSUE_NUMBER_INVALID', CREDITCARD_INVALID: 'CREDITCARD_INVALID' });
module.exports = bean(PaymentCard);
