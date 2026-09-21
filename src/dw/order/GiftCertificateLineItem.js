'use strict';
const { bean } = require('../../util/bean');
const LineItem = require('./LineItem');
class GiftCertificateLineItem extends LineItem {
  constructor(data, ctnr) { super(data, ctnr); }
  getGiftCertificateID() { return this._data.giftCertificateID || null; } setGiftCertificateID(id) { this._data.giftCertificateID = id; this._markDirty(); }
  getRecipientEmail() { return this._data.recipientEmail || null; } setRecipientEmail(v) { this._data.recipientEmail = v; this._markDirty(); }
  getRecipientName() { return this._data.recipientName || null; } setRecipientName(v) { this._data.recipientName = v; this._markDirty(); }
  getSenderName() { return this._data.senderName || null; } setSenderName(v) { this._data.senderName = v; this._markDirty(); }
  getMessage() { return this._data.message || null; } setMessage(v) { this._data.message = v; this._markDirty(); }
  getProductListItem() { return null; }
  getShipment() { return this._ctnr.getShipments().toArray().find((s) => s.getUUID() === this._data.shipmentUUID) || this._ctnr.getDefaultShipment(); }
  setShipment(s) { this._data.shipmentUUID = s.getUUID(); this._markDirty(); }
  getLineItemText() { return this._data.lineItemText || 'Gift Certificate'; }
  getPriceAdjustments() { return new (require('../util/ArrayList'))(); }
  getAdjustedPrice() { return this.getPrice(); }
}
module.exports = bean(GiftCertificateLineItem);
