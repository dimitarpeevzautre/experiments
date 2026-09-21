'use strict';
const { bean } = require('../../util/bean');
const LineItemCtnr = require('./LineItemCtnr');
const EnumValue = require('../value/EnumValue');
const Money = require('../value/Money');
const ArrayList = require('../util/ArrayList');
const STATUS_NAMES = { 0: 'CREATED', 3: 'NEW', 4: 'OPEN', 5: 'COMPLETED', 6: 'CANCELLED', 7: 'REPLACED', 8: 'FAILED' };
class Order extends LineItemCtnr {
  constructor(data, rt) { super(data, rt, 'orders'); }
  getOrderNo() { return this._data.orderNo; }
  getOrderToken() { return this._data.orderToken; }
  getStatus() { return new EnumValue(this._data.status == null ? Order.ORDER_STATUS_CREATED : this._data.status, STATUS_NAMES[this._data.status == null ? 0 : this._data.status]); }
  setStatus(s) { this._data.status = s instanceof EnumValue ? s.getValue() : s; this._markDirty(); }
  _enum(field, def, names) { const v = this._data[field] == null ? def : this._data[field]; return new EnumValue(v, names[v]); }
  getConfirmationStatus() { return this._enum('confirmationStatus', 0, { 0: 'NOTCONFIRMED', 2: 'CONFIRMED' }); } setConfirmationStatus(s) { this._data.confirmationStatus = s instanceof EnumValue ? s.getValue() : s; this._markDirty(); }
  getExportStatus() { return this._enum('exportStatus', 0, { 0: 'NOTEXPORTED', 1: 'EXPORTED', 2: 'READY', 3: 'FAILED' }); } setExportStatus(s) { this._data.exportStatus = s instanceof EnumValue ? s.getValue() : s; this._markDirty(); }
  getPaymentStatus() { return this._enum('paymentStatus', 0, { 0: 'NOTPAID', 1: 'PARTPAID', 2: 'PAID' }); } setPaymentStatus(s) { this._data.paymentStatus = s instanceof EnumValue ? s.getValue() : s; this._markDirty(); }
  getShippingStatus() { return this._enum('shippingStatus', 0, { 0: 'NOTSHIPPED', 1: 'PARTSHIPPED', 2: 'SHIPPED' }); } setShippingStatus(s) { this._data.shippingStatus = s instanceof EnumValue ? s.getValue() : s; this._markDirty(); }
  getCustomerNo() { return this._data.customerNo || null; } setCustomerNo(no) { this._data.customerNo = no; this._markDirty(); }
  getCustomerLocaleID() { return this._data.customerLocaleID || this._rt.config.locale; }
  getCustomerOrderReference() { return this._data.customerOrderReference || null; } setCustomerOrderReference(r) { this._data.customerOrderReference = r; this._markDirty(); }
  getInvoiceNo() { return this._data.invoiceNo || null; } setInvoiceNo(n) { this._data.invoiceNo = n; this._markDirty(); }
  getExternalOrderNo() { return this._data.externalOrderNo || null; } setExternalOrderNo(n) { this._data.externalOrderNo = n; this._markDirty(); }
  getExternalOrderStatus() { return this._data.externalOrderStatus || null; } setExternalOrderStatus(s) { this._data.externalOrderStatus = s; }
  getExternalOrderText() { return this._data.externalOrderText || null; } setExternalOrderText(s) { this._data.externalOrderText = s; }
  getRemoteHost() { return this._data.remoteHost || '127.0.0.1'; }
  getSourceCodeGroup() { return null; } getSourceCodeGroupID() { return this._data.sourceCodeGroupID || null; }
  getAffiliatePartnerID() { return this._data.affiliatePartnerID || null; } setAffiliatePartnerID(v) { this._data.affiliatePartnerID = v; }
  getAffiliatePartnerName() { return this._data.affiliatePartnerName || null; } setAffiliatePartnerName(v) { this._data.affiliatePartnerName = v; }
  getCreatedBy() { return this._data.createdBy || 'Customer'; }
  getCapturedAmount() { return this._m(this.getPaymentInstruments().toArray().reduce((s, p) => s + (p._data.capturedAmount || 0), 0)); }
  getRefundedAmount() { return this._m(this.getPaymentInstruments().toArray().reduce((s, p) => s + (p._data.refundedAmount || 0), 0)); }
  getOriginalOrder() { const OrderMgr = require('./OrderMgr'); return this._data.originalOrderNo ? OrderMgr.getOrder(this._data.originalOrderNo) : this; }
  getOriginalOrderNo() { return this._data.originalOrderNo || this._data.orderNo; }
  getReplacedOrder() { const OrderMgr = require('./OrderMgr'); return this._data.replacedOrderNo ? OrderMgr.getOrder(this._data.replacedOrderNo) : null; }
  getReplacedOrderNo() { return this._data.replacedOrderNo || null; }
  getReplacementOrder() { const OrderMgr = require('./OrderMgr'); return this._data.replacementOrderNo ? OrderMgr.getOrder(this._data.replacementOrderNo) : null; }
  getReplacementOrderNo() { return this._data.replacementOrderNo || null; }
  getCancelCode() { return this._data.cancelCode ? new EnumValue(this._data.cancelCode) : null; } setCancelCode(c) { this._data.cancelCode = c; }
  getCancelDescription() { return this._data.cancelDescription || null; } setCancelDescription(d) { this._data.cancelDescription = d; }
  isImported() { return !!this._data.imported; }
  getOrderExportXML(encryptionAlgorithm, encryptionKey) { return `<order order-no="${this._data.orderNo}"><status>${this.getStatus().getDisplayValue()}</status><customer-email>${this._data.customerEmail || ''}</customer-email><total>${this.getTotalGrossPrice().getValue()}</total></order>`; }
  getOrderItems() { return new ArrayList(); }
  getOrderItem() { return null; }
  getInvoices() { return new ArrayList(); } getInvoice() { return null; }
  getShippingOrders() { return new ArrayList(); } getShippingOrder() { return null; }
  getReturnCases() { return new ArrayList(); } getReturnCase() { return null; } createReturnCase() { throw new Error('Return cases are not supported'); }
  getReturns() { return new ArrayList(); }
  getAppeasements() { return new ArrayList(); } createAppeasement() { throw new Error('Appeasements are not supported'); }
  getGlobalPartyID() { return null; }
  reauthorize() { const Status = require('../system/Status'); return new Status(Status.OK); }
  trackOrderChange(text) { this.addNote('Order change', text); }
  getOrderNoForHistory() { return this._data.orderNo; }
  getPaymentTransaction() { const p = this.getPaymentInstrument(); return p ? p.getPaymentTransaction() : null; }
  getCurrentOrder() { return this; }
  getCurrentOrderNo() { return this._data.orderNo; }
  setOrderStatus(s) { this.setStatus(s); }
  getCreationDate() { return new Date(this._data.creationDate); }
  toString() { return `[Order ${this._data.orderNo}]`; }
}
Object.assign(Order, {
  ORDER_STATUS_CREATED: 0, ORDER_STATUS_NEW: 3, ORDER_STATUS_OPEN: 4, ORDER_STATUS_COMPLETED: 5, ORDER_STATUS_CANCELLED: 6, ORDER_STATUS_REPLACED: 7, ORDER_STATUS_FAILED: 8,
  CONFIRMATION_STATUS_NOTCONFIRMED: 0, CONFIRMATION_STATUS_CONFIRMED: 2,
  EXPORT_STATUS_NOTEXPORTED: 0, EXPORT_STATUS_EXPORTED: 1, EXPORT_STATUS_READY: 2, EXPORT_STATUS_FAILED: 3,
  PAYMENT_STATUS_NOTPAID: 0, PAYMENT_STATUS_PARTPAID: 1, PAYMENT_STATUS_PAID: 2,
  SHIPPING_STATUS_NOTSHIPPED: 0, SHIPPING_STATUS_PARTSHIPPED: 1, SHIPPING_STATUS_SHIPPED: 2,
  ENCRYPTION_ALGORITHM_RSA_ECB_PKCS1PADDING: 'RSA/ECB/PKCS1Padding', ENCRYPTION_ALGORITHM_RSA_ECB_OAEPWITHSHA56ANDMGF1PADDING: 'RSA/ECB/OAEPWithSHA-256AndMGF1Padding',
});
module.exports = bean(Order);
