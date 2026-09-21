'use strict';
const rtRef = require('../../runtime');
const GiftCertificate = require('./GiftCertificate');
const Status = require('../system/Status');
const Money = require('../value/Money');
function all(rt) { return rt.store.get('gift-certificates', {}); }
const GiftCertificateMgr = {
  getGiftCertificateByCode(code) { const rt = rtRef.current(); const d = all(rt)[code] || Object.values(all(rt)).find((g) => g.code === code); if (d) d.code = d.code || code; return d ? new GiftCertificate(d) : null; },
  getGiftCertificate(id) { return GiftCertificateMgr.getGiftCertificateByCode(id); },
  createGiftCertificate(amount, code) { const rt = rtRef.current(); const c = code || `GC${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`; const d = { code: c, amount: amount.getValue ? amount.getValue() : Number(amount), balance: amount.getValue ? amount.getValue() : Number(amount), currencyCode: amount.getCurrencyCode ? amount.getCurrencyCode() : rt.context.session.getCurrency().getCurrencyCode(), status: GiftCertificate.STATUS_ISSUED, enabled: true, custom: {} }; all(rt)[c] = d; rt.store.touch('gift-certificates'); return new GiftCertificate(d); },
  redeemGiftCertificate(paymentInstrument) {
    const gc = GiftCertificateMgr.getGiftCertificateByCode(paymentInstrument.getGiftCertificateCode());
    if (!gc) return new Status(Status.ERROR, GiftCertificateMgr.GC_ERROR_INVALID_CODE);
    if (!gc.isEnabled()) return new Status(Status.ERROR, GiftCertificateMgr.GC_ERROR_DISABLED);
    const amt = paymentInstrument.getPaymentTransaction().getAmount();
    if (!amt.isAvailable() || gc.getBalance().getValue() < amt.getValue()) return new Status(Status.ERROR, GiftCertificateMgr.GC_ERROR_INSUFFICIENT_BALANCE);
    gc._redeem(amt.getValue());
    return new Status(Status.OK);
  },
  GC_ERROR_INVALID_CODE: 'GC_ERROR_INVALID_CODE', GC_ERROR_DISABLED: 'GC_ERROR_DISABLED', GC_ERROR_INSUFFICIENT_BALANCE: 'GC_ERROR_INSUFFICIENT_BALANCE', GC_ERROR_INVALID_AMOUNT: 'GC_ERROR_INVALID_AMOUNT', GC_ERROR_PENDING: 'GC_ERROR_PENDING', GC_ERROR_REDEEMED: 'GC_ERROR_REDEEMED', GC_ERROR_CURRENCY_MISMATCH: 'GC_ERROR_CURRENCY_MISMATCH',
};
module.exports = GiftCertificateMgr;
