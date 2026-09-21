'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const Money = require('../value/Money');
const EnumValue = require('../value/EnumValue');
class GiftCertificate extends ExtensibleObject {
  constructor(d) { super(d); this._collection = 'gift-certificates'; this._store = require('../../runtime').current().store; }
  getGiftCertificateCode() { return this._data.code; } getMaskedGiftCertificateCode(ignore = 4) { const c = this._data.code || ''; return '*'.repeat(Math.max(0, c.length - ignore)) + c.slice(-ignore); }
  getID() { return this._data.code; }
  getAmount() { return new Money(this._data.amount || 0, this._data.currencyCode || 'USD'); } setAmount(m) { this._data.amount = m.getValue(); this._data.currencyCode = m.getCurrencyCode(); this._markDirty(); }
  getBalance() { return new Money(this._data.balance == null ? this._data.amount || 0 : this._data.balance, this._data.currencyCode || 'USD'); }
  getStatus() { return new EnumValue(this._data.status == null ? GiftCertificate.STATUS_ISSUED : this._data.status); } setStatus(s) { this._data.status = s instanceof EnumValue ? s.getValue() : s; this._markDirty(); }
  isEnabled() { return this._data.enabled !== false; } setEnabled(b) { this._data.enabled = !!b; this._markDirty(); }
  getRecipientEmail() { return this._data.recipientEmail || null; } setRecipientEmail(v) { this._data.recipientEmail = v; this._markDirty(); }
  getRecipientName() { return this._data.recipientName || null; } setRecipientName(v) { this._data.recipientName = v; this._markDirty(); }
  getSenderName() { return this._data.senderName || null; } setSenderName(v) { this._data.senderName = v; this._markDirty(); }
  getMessage() { return this._data.message || null; } setMessage(v) { this._data.message = v; this._markDirty(); }
  getDescription() { return this._data.description || null; } setDescription(v) { this._data.description = v; this._markDirty(); }
  getOrderNo() { return this._data.orderNo || null; } setOrderNo(v) { this._data.orderNo = v; this._markDirty(); }
  getMerchantID() { return this._data.merchantID || null; }
  _redeem(amount) { const b = this.getBalance().getValue(); const used = Math.min(b, amount); this._data.balance = b - used; if (this._data.balance <= 0) this._data.status = GiftCertificate.STATUS_REDEEMED; else this._data.status = GiftCertificate.STATUS_PARTIALLY_REDEEMED; this._markDirty(); return used; }
}
Object.assign(GiftCertificate, { STATUS_PENDING: 0, STATUS_ISSUED: 1, STATUS_PARTIALLY_REDEEMED: 2, STATUS_REDEEMED: 3 });
module.exports = bean(GiftCertificate);
