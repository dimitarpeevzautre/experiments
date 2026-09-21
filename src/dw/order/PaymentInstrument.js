'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const PaymentTransaction = require('./PaymentTransaction');

class PaymentInstrument extends ExtensibleObject {
  constructor(data = {}, ctnr) {
    super(data);
    this._ctnr = ctnr || null;
    if (!data.paymentTransaction) data.paymentTransaction = { custom: {} };
    this._tx = new PaymentTransaction(data.paymentTransaction, this);
  }
  _currency() { return this._ctnr && this._ctnr.getCurrencyCode ? this._ctnr.getCurrencyCode() : null; }
  getPaymentMethod() { return this._data.paymentMethod || null; }
  getPaymentTransaction() { return this._tx; }
  getCreditCardNumber() { return this._data.creditCardNumber || null; }
  setCreditCardNumber(n) { this._data.creditCardNumber = n == null ? null : String(n).replace(/\s+/g, ''); this._markDirty(); }
  getCreditCardNumberLastDigits(count = 4) { const n = this._data.creditCardNumber || ''; return n.slice(-count); }
  getMaskedCreditCardNumber(ignore = 4) { const n = this._data.creditCardNumber || ''; return n ? '*'.repeat(Math.max(0, n.length - ignore)) + n.slice(-ignore) : null; }
  getCreditCardHolder() { return this._data.creditCardHolder || null; } setCreditCardHolder(v) { this._data.creditCardHolder = v; this._markDirty(); }
  getCreditCardType() { return this._data.creditCardType || null; } setCreditCardType(v) { this._data.creditCardType = v; this._markDirty(); }
  getCreditCardExpirationMonth() { return this._data.creditCardExpirationMonth == null ? 0 : Number(this._data.creditCardExpirationMonth); } setCreditCardExpirationMonth(v) { this._data.creditCardExpirationMonth = Number(v); this._markDirty(); }
  getCreditCardExpirationYear() { return this._data.creditCardExpirationYear == null ? 0 : Number(this._data.creditCardExpirationYear); } setCreditCardExpirationYear(v) { this._data.creditCardExpirationYear = Number(v); this._markDirty(); }
  getCreditCardToken() { return this._data.creditCardToken || null; } setCreditCardToken(v) { this._data.creditCardToken = v; this._markDirty(); }
  getCreditCardIssueNumber() { return this._data.creditCardIssueNumber || null; } setCreditCardIssueNumber(v) { this._data.creditCardIssueNumber = v; }
  getCreditCardValidFromMonth() { return this._data.creditCardValidFromMonth || 0; } setCreditCardValidFromMonth(v) { this._data.creditCardValidFromMonth = v; }
  getCreditCardValidFromYear() { return this._data.creditCardValidFromYear || 0; } setCreditCardValidFromYear(v) { this._data.creditCardValidFromYear = v; }
  isCreditCardExpired() { const y = this.getCreditCardExpirationYear(); const m = this.getCreditCardExpirationMonth(); if (!y || !m) return false; const now = new Date(); return y < now.getFullYear() || (y === now.getFullYear() && m < now.getMonth() + 1); }
  isPermanentlyMasked() { return !!this._data.permanentlyMasked; }
  getGiftCertificateCode() { return this._data.giftCertificateCode || null; } setGiftCertificateCode(v) { this._data.giftCertificateCode = v; this._markDirty(); }
  getGiftCertificateID() { return this._data.giftCertificateID || null; } setGiftCertificateID(v) { this._data.giftCertificateID = v; this._markDirty(); }
  getMaskedGiftCertificateCode(ignore = 4) { const n = this._data.giftCertificateCode || ''; return n ? '*'.repeat(Math.max(0, n.length - ignore)) + n.slice(-ignore) : null; }
  getBankAccountNumber() { return this._data.bankAccountNumber || null; } setBankAccountNumber(v) { this._data.bankAccountNumber = v; this._markDirty(); }
  getBankAccountNumberLastDigits(c = 4) { return (this._data.bankAccountNumber || '').slice(-c); }
  getMaskedBankAccountNumber(ignore = 4) { const n = this._data.bankAccountNumber || ''; return n ? '*'.repeat(Math.max(0, n.length - ignore)) + n.slice(-ignore) : null; }
  getBankAccountHolder() { return this._data.bankAccountHolder || null; } setBankAccountHolder(v) { this._data.bankAccountHolder = v; }
  getBankAccountDriversLicense() { return this._data.bankAccountDriversLicense || null; } setBankAccountDriversLicense(v) { this._data.bankAccountDriversLicense = v; }
  getBankAccountDriversLicenseStateCode() { return this._data.bankAccountDriversLicenseStateCode || null; } setBankAccountDriversLicenseStateCode(v) { this._data.bankAccountDriversLicenseStateCode = v; }
  getBankRoutingNumber() { return this._data.bankRoutingNumber || null; } setBankRoutingNumber(v) { this._data.bankRoutingNumber = v; }
  getMaskedBankAccountDriversLicense() { return this.getBankAccountDriversLicense(); }
  getBankAccountDriversLicenseLastDigits() { return (this._data.bankAccountDriversLicense || '').slice(-4); }
  getEncryptedCreditCardNumber() { return this._data.creditCardNumber ? Buffer.from(this._data.creditCardNumber).toString('base64') : null; }
  getEncryptedBankAccountNumber() { return this._data.bankAccountNumber ? Buffer.from(this._data.bankAccountNumber).toString('base64') : null; }
}
Object.assign(PaymentInstrument, { METHOD_CREDIT_CARD: 'CREDIT_CARD', METHOD_GIFT_CERTIFICATE: 'GIFT_CERTIFICATE', METHOD_BANK_TRANSFER: 'BANK_TRANSFER', METHOD_BML: 'BML', METHOD_DW_ANDROID_PAY: 'DW_ANDROID_PAY', METHOD_DW_APPLE_PAY: 'DW_APPLE_PAY', METHOD_DW_GOOGLE_PAY: 'DW_GOOGLE_PAY' });
module.exports = bean(PaymentInstrument);
