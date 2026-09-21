'use strict';
const { bean } = require('../../util/bean');
const ExtensibleObject = require('../object/ExtensibleObject');
const ArrayList = require('../util/ArrayList');
const Money = require('../value/Money');
const EnumValue = require('../value/EnumValue');
const ProductLineItem = require('./ProductLineItem');
const GiftCertificateLineItem = require('./GiftCertificateLineItem');
const CouponLineItem = require('./CouponLineItem');
const PriceAdjustment = require('./PriceAdjustment');
const BonusDiscountLineItem = require('./BonusDiscountLineItem');
const OrderPaymentInstrument = require('./OrderPaymentInstrument');
const OrderAddress = require('./OrderAddress');
const Shipment = require('./Shipment');
const LineItem = require('./LineItem');
const sum = (arr) => LineItem.round(arr.reduce((s, v) => s + (v || 0), 0));

/** Base of Basket and Order. All monetary data is stored in plain JSON on `_data`. */
class LineItemCtnr extends ExtensibleObject {
  constructor(data, rt, collection) {
    super(data);
    this._rt = rt; this._collection = collection; this._store = rt.store;
    for (const k of ['productLineItems', 'giftCertificateLineItems', 'couponLineItems', 'priceAdjustments', 'bonusDiscountLineItems', 'paymentInstruments', 'shipments', 'notes']) if (!Array.isArray(data[k])) data[k] = [];
    if (!data.currencyCode) data.currencyCode = rt.context.session ? rt.context.session.getCurrency().getCurrencyCode() : 'USD';
    if (!data.shipments.length) data.shipments.push({ ID: 'me', default: true, custom: {}, shippingLineItems: [], priceAdjustments: [] });
    this._pliCache = new WeakMap();
  }
  _markDirty() { this._data.lastModified = new Date().toISOString(); this._rt.store.touch(this._collection); }
  _wrap(d, Cls) { let w = this._pliCache.get(d); if (!w) { w = new Cls(d, this); this._pliCache.set(d, w); } return w; }
  _cur() { return this._data.currencyCode; }
  _m(v) { return new Money(v || 0, this._cur()); }
  getCurrencyCode() { return this._data.currencyCode; }
  getCustomer() { const CM = require('../customer/CustomerMgr'); return this._data.customerNo ? CM.getCustomerByCustomerNumber(this._data.customerNo) : (this._customer || this._rt.context.customer); }
  getCustomerNo() { return this._data.customerNo || null; }
  getCustomerEmail() { return this._data.customerEmail || null; } setCustomerEmail(e) { this._data.customerEmail = e; this._markDirty(); }
  getCustomerName() { return this._data.customerName || null; } setCustomerName(n) { this._data.customerName = n; this._markDirty(); }
  getChannelType() { return new EnumValue(this._data.channelType == null ? LineItemCtnr.CHANNEL_TYPE_STOREFRONT : this._data.channelType); }
  setChannelType(t) { this._data.channelType = t instanceof EnumValue ? t.getValue() : t; this._markDirty(); }
  getBusinessType() { return new EnumValue(this._data.businessType == null ? LineItemCtnr.BUSINESS_TYPE_B2C : this._data.businessType); }
  setBusinessType(t) { this._data.businessType = t instanceof EnumValue ? t.getValue() : t; }
  getEtag() { return String(new Date(this._data.lastModified).getTime()); }
  getNotes() { const Note = require('../object/Note'); return new ArrayList(this._data.notes.map((n) => new Note(n))); }
  addNote(subject, text) { const Note = require('../object/Note'); const n = { subject, text, creationDate: new Date().toISOString() }; this._data.notes.push(n); this._markDirty(); return new Note(n); }
  removeNote(note) { this._data.notes = this._data.notes.filter((n) => n.creationDate !== note.getCreationDate().toISOString() || n.text !== note.getText()); }
  // ---- shipments
  getShipments() { return new ArrayList(this._data.shipments.map((s) => this._wrap(s, Shipment))); }
  getDefaultShipment() { return this._wrap(this._data.shipments.find((s) => s.default) || this._data.shipments[0], Shipment); }
  getShipment(id) { const s = this._data.shipments.find((x) => x.ID === id); return s ? this._wrap(s, Shipment) : null; }
  createShipment(id) { if (this._data.shipments.some((s) => s.ID === id)) throw new Error(`Shipment '${id}' already exists`); const d = { ID: id, default: false, custom: {}, shippingLineItems: [], priceAdjustments: [] }; this._data.shipments.push(d); this._markDirty(); return this._wrap(d, Shipment); }
  removeShipment(sh) { if (sh.isDefault()) throw new Error('Cannot remove the default shipment'); const def = this.getDefaultShipment(); for (const p of sh.getProductLineItems().toArray()) p.setShipment(def); this._data.shipments = this._data.shipments.filter((s) => s.UUID !== sh.getUUID()); this._markDirty(); }
  // ---- product line items
  getAllProductLineItems(productID) { let items = this._data.productLineItems.map((p) => this._wrap(p, ProductLineItem)); if (productID !== undefined) items = items.filter((p) => p.getProductID() === productID); return new ArrayList(items); }
  getProductLineItems(productID) { return new ArrayList(this.getAllProductLineItems(productID).toArray().filter((p) => !p.isBundledProductLineItem() && !p.isOptionProductLineItem())); }
  getBonusLineItems() { return new ArrayList(this.getAllProductLineItems().toArray().filter((p) => p.isBonusProductLineItem())); }
  getProductQuantityTotal() { return this.getProductLineItems().toArray().reduce((s, p) => s + p.getQuantityValue(), 0); }
  getProductQuantities(includeBonus) { const HashMap = require('../util/HashMap'); const m = new HashMap(); for (const p of this.getAllProductLineItems().toArray()) { if (!includeBonus && p.isBonusProductLineItem()) continue; const prod = p.getProduct(); if (!prod) continue; const cur = m.get(prod); m.put(prod, cur ? cur.add(p.getQuantity()) : p.getQuantity()); } return m; }
  createProductLineItem(a, b, c) {
    // (product|productID, shipment) | (product, optionModel, shipment) | (productListItem, shipment)
    const PM = require('../catalog/ProductMgr');
    let product = null; let productID; let optionModel = null; let shipment = null;
    if (typeof a === 'string') { productID = a; product = PM.getProduct(a); shipment = b; }
    else if (a && typeof a.getProductID === 'function' && typeof a.getList === 'function') { product = a.getProduct(); productID = a.getProductID(); shipment = b; }
    else { product = a; productID = a.getID(); if (b && typeof b.getOptions === 'function') { optionModel = b; shipment = c; } else shipment = b; }
    shipment = shipment || this.getDefaultShipment();
    const d = { productID, productName: product ? product.getName() : null, quantity: product ? product.getMinOrderQuantity().getValue() : 1, shipmentUUID: shipment.getUUID(), position: this._data.productLineItems.length + 1, custom: {}, priceAdjustments: [] };
    this._data.productLineItems.push(d);
    const pli = this._wrap(d, ProductLineItem);
    if (product && optionModel) for (const opt of optionModel.getOptions().toArray()) { const v = optionModel.getSelectedOptionValue(opt); if (v) { const od = { productID: `${productID}-${opt.getID()}`, productName: `${opt.getDisplayName()}: ${v.getDisplayValue()}`, quantity: d.quantity, shipmentUUID: shipment.getUUID(), parentUUID: d.UUID, optionID: opt.getID(), optionValueID: v.getID(), custom: {}, priceAdjustments: [] }; this._data.productLineItems.push(od); this._wrap(od, ProductLineItem)._updatePriceFromProduct(); } }
    if (product && product.isBundle()) for (const bp of product.getBundledProducts().toArray()) { const bq = product.getBundledProductQuantity(bp).getValue(); const bd = { productID: bp.getID(), productName: bp.getName(), quantity: d.quantity * bq, bundleQty: bq, shipmentUUID: shipment.getUUID(), parentUUID: d.UUID, custom: {}, priceAdjustments: [] }; this._data.productLineItems.push(bd); this._wrap(bd, ProductLineItem)._updatePriceFromProduct(); }
    pli._updatePriceFromProduct();
    this._markDirty();
    return pli;
  }
  createBonusProductLineItem(bonusDiscountLineItem, product, optionModel, shipment) { const pli = this.createProductLineItem(product, optionModel || undefined, shipment); pli._data.bonus = true; pli._data.bonusDiscountLineItemUUID = bonusDiscountLineItem.getUUID(); pli._updatePriceFromProduct(); return pli; }
  removeProductLineItem(pli) { const uuid = pli.getUUID(); this._data.productLineItems = this._data.productLineItems.filter((p) => p.UUID !== uuid && p.parentUUID !== uuid); this._markDirty(); }
  removeAllProductLineItems() { this._data.productLineItems = []; this._markDirty(); }
  // ---- gift certificates
  getGiftCertificateLineItems(id) { let items = this._data.giftCertificateLineItems.map((g) => this._wrap(g, GiftCertificateLineItem)); if (id !== undefined) items = items.filter((g) => g.getGiftCertificateID() === id); return new ArrayList(items); }
  createGiftCertificateLineItem(amount, recipientEmail) { const d = { price: Number(amount), basePrice: Number(amount), netPrice: Number(amount), grossPrice: Number(amount), tax: 0, recipientEmail, shipmentUUID: this.getDefaultShipment().getUUID(), custom: {} }; this._data.giftCertificateLineItems.push(d); this._markDirty(); return this._wrap(d, GiftCertificateLineItem); }
  removeGiftCertificateLineItem(g) { this._data.giftCertificateLineItems = this._data.giftCertificateLineItems.filter((x) => x.UUID !== g.getUUID()); this._markDirty(); }
  getAllLineItems() { return new ArrayList([...this.getAllProductLineItems().toArray(), ...this.getGiftCertificateLineItems().toArray(), ...this.getShipments().toArray().flatMap((s) => s.getShippingLineItems().toArray()), ...this._allAdjustments()]); }
  // ---- coupons
  getCouponLineItems() { return new ArrayList(this._data.couponLineItems.map((c) => this._wrap(c, CouponLineItem))); }
  getCouponLineItem(code) { return this.getCouponLineItems().toArray().find((c) => c.getCouponCode().toLowerCase() === String(code).toLowerCase()) || null; }
  createCouponLineItem(code, campaignBased) {
    const CouponMgr = require('../campaign/CouponMgr'); const Codes = require('../campaign/CouponStatusCodes');
    if (this.getCouponLineItem(code)) { const e = new Error(Codes.COUPON_CODE_ALREADY_IN_BASKET); e.errorCode = Codes.COUPON_CODE_ALREADY_IN_BASKET; throw e; }
    const coupon = CouponMgr.getCouponByCode(code);
    if (campaignBased) {
      if (!coupon) { const e = new Error(Codes.COUPON_CODE_UNKNOWN); e.errorCode = Codes.COUPON_CODE_UNKNOWN; throw e; }
      if (!coupon.isEnabled()) { const e = new Error(Codes.COUPON_DISABLED); e.errorCode = Codes.COUPON_DISABLED; throw e; }
      if (!coupon.getPromotions().toArray().some((p) => p.isActive())) { const e = new Error(Codes.NO_ACTIVE_PROMOTION); e.errorCode = Codes.NO_ACTIVE_PROMOTION; throw e; }
      if (coupon.getPromotions().toArray().some((p) => p._groups().length) && !coupon.getPromotions().toArray().some((p) => p._qualifiesGroups(this))) { const e = new Error(Codes.NO_APPLICABLE_PROMOTION); e.errorCode = Codes.NO_APPLICABLE_PROMOTION; throw e; }
      if (this.getCouponLineItems().toArray().some((c) => c._couponID() === coupon.getID())) { const e = new Error(Codes.COUPON_ALREADY_IN_BASKET); e.errorCode = Codes.COUPON_ALREADY_IN_BASKET; throw e; }
      const lim = coupon.getRedemptionLimitPerCode(); if (lim && CouponMgr.getRedemptionCount(coupon.getID(), code) >= lim) { const e = new Error(Codes.REDEMPTION_LIMIT_EXCEEDED); e.errorCode = Codes.REDEMPTION_LIMIT_EXCEEDED; throw e; }
      const climit = coupon.getRedemptionLimitPerCustomer(); if (climit && this._data.customerEmail && CouponMgr.getRedemptionCountForCustomer(coupon.getID(), code, this._data.customerEmail) >= climit) { const e = new Error(Codes.CUSTOMER_REDEMPTION_LIMIT_EXCEEDED); e.errorCode = Codes.CUSTOMER_REDEMPTION_LIMIT_EXCEEDED; throw e; }
    }
    const d = { couponCode: code, custom: {} };
    this._data.couponLineItems.push(d); this._markDirty();
    return this._wrap(d, CouponLineItem);
  }
  removeCouponLineItem(c) { this._data.couponLineItems = this._data.couponLineItems.filter((x) => x.UUID !== c.getUUID()); this._markDirty(); }
  // ---- price adjustments (order level)
  getPriceAdjustments() { return new ArrayList(this._data.priceAdjustments.map((a) => this._wrap(a, PriceAdjustment))); }
  getPriceAdjustmentByPromotionID(id) { return this.getPriceAdjustments().toArray().find((a) => a.getPromotionID() === id) || null; }
  createPriceAdjustment(promotionID, discount) { const d = { promotionID, manual: !discount || !discount._promo, price: 0, basePrice: 0, custom: {} }; if (discount) { d.discount = discount._d; d.price = -discount._amountFor(this.getAdjustedMerchandizeTotalPrice(false), 1).getValue(); d.basePrice = d.price; } this._data.priceAdjustments.push(d); this._markDirty(); return this._wrap(d, PriceAdjustment); }
  _createPromotionAdjustment(promotion, amount, discount) { const d = { promotionID: promotion.getID(), price: amount.getValue(), basePrice: amount.getValue(), discount: discount ? discount._d : null, custom: {}, lineItemText: promotion.getCalloutMsg().getMarkup() }; this._data.priceAdjustments.push(d); this._markDirty(); return this._wrap(d, PriceAdjustment); }
  removePriceAdjustment(pa) { this._data.priceAdjustments = this._data.priceAdjustments.filter((a) => a.UUID !== pa.getUUID()); this._markDirty(); }
  removeAllPriceAdjustments() { this._data.priceAdjustments = []; this._markDirty(); }
  getAllShippingPriceAdjustments() { return new ArrayList(this.getShipments().toArray().flatMap((s) => s.getAllShippingPriceAdjustments().toArray())); }
  createShippingPriceAdjustment(promotionID) { return this.getDefaultShipment().createShippingPriceAdjustment(promotionID); }
  removeShippingPriceAdjustment(pa) { for (const s of this.getShipments().toArray()) s.removeShippingPriceAdjustment(pa); }
  _allAdjustments() { return [...this.getPriceAdjustments().toArray(), ...this.getAllProductLineItems().toArray().flatMap((p) => p.getPriceAdjustments().toArray()), ...this.getAllShippingPriceAdjustments().toArray()]; }
  _clearPromotionAdjustments() { this._data.priceAdjustments = this._data.priceAdjustments.filter((a) => a.manual); for (const p of this.getAllProductLineItems().toArray()) p._clearPromotionAdjustments(); for (const s of this.getShipments().toArray()) s._clearPromotionAdjustments(); this._data.bonusDiscountLineItems = []; this._data.productLineItems = this._data.productLineItems.filter((p) => !p.bonus); this._markDirty(); }
  _orderAdjTotal() { return sum(this._data.priceAdjustments.map((a) => a.price)); }
  // ---- bonus discount line items
  getBonusDiscountLineItems() { return new ArrayList(this._data.bonusDiscountLineItems.map((b) => this._wrap(b, BonusDiscountLineItem))); }
  _createBonusDiscountLineItem(promotion, discount) { const d = { promotionID: promotion.getID(), bonusProductIDs: discount._d.bonusProductIDs || discount._d.productIDs || [], maxBonusItems: discount._d.maxBonusItems || 1, ruleBased: discount._d.type === 'bonus_choice' && !discount._d.bonusProductIDs, custom: {} }; this._data.bonusDiscountLineItems.push(d); this._markDirty(); return this._wrap(d, BonusDiscountLineItem); }
  removeBonusDiscountLineItem(b) { this._data.bonusDiscountLineItems = this._data.bonusDiscountLineItems.filter((x) => x.UUID !== b.getUUID()); this._markDirty(); }
  // ---- payment
  getPaymentInstruments(method) { return new ArrayList(this._data.paymentInstruments.filter((p) => method === undefined || p.paymentMethod === method).map((p) => this._wrap(p, OrderPaymentInstrument))); }
  getPaymentInstrument() { const l = this.getPaymentInstruments(); return l.size() ? l.get(0) : null; }
  getGiftCertificatePaymentInstruments(code) { return new ArrayList(this.getPaymentInstruments('GIFT_CERTIFICATE').toArray().filter((p) => code === undefined || p.getGiftCertificateCode() === code)); }
  createPaymentInstrument(method, amount) { const d = { paymentMethod: method, custom: {}, paymentTransaction: { custom: {}, amount: amount instanceof Money ? { value: amount.getValue(), currencyCode: amount.getCurrencyCode() } : null } }; this._data.paymentInstruments.push(d); this._markDirty(); return this._wrap(d, OrderPaymentInstrument); }
  createPaymentInstrumentFromWallet(walletPI, amount) { const pi = this.createPaymentInstrument(walletPI.getPaymentMethod(), amount); for (const k of ['creditCardNumber', 'creditCardHolder', 'creditCardType', 'creditCardExpirationMonth', 'creditCardExpirationYear', 'creditCardToken', 'bankAccountNumber', 'bankAccountHolder', 'bankRoutingNumber', 'giftCertificateCode', 'giftCertificateID']) if (walletPI._data[k] !== undefined) pi._data[k] = walletPI._data[k]; Object.assign(pi._custom, walletPI._data.custom || {}); return pi; }
  createGiftCertificatePaymentInstrument(code, amount) { const pi = this.createPaymentInstrument('GIFT_CERTIFICATE', amount); pi.setGiftCertificateCode(code); const GCM = require('./GiftCertificateMgr'); const gc = GCM.getGiftCertificateByCode(code); if (gc) pi.setGiftCertificateID(gc.getGiftCertificateCode()); return pi; }
  removePaymentInstrument(pi) { this._data.paymentInstruments = this._data.paymentInstruments.filter((p) => p.UUID !== pi.getUUID()); this._markDirty(); }
  removeAllPaymentInstruments(method) { this._data.paymentInstruments = method === undefined ? [] : this._data.paymentInstruments.filter((p) => p.paymentMethod !== method); this._markDirty(); }
  getPaymentInstrumentsCount() { return this._data.paymentInstruments.length; }
  // ---- addresses
  getBillingAddress() { return this._data.billingAddress ? new OrderAddress(this._data.billingAddress, this) : null; }
  createBillingAddress() { this._data.billingAddress = { custom: {} }; this._markDirty(); return this.getBillingAddress(); }
  removeBillingAddress() { this._data.billingAddress = null; this._markDirty(); }
  // ---- totals
  getMerchandizeTotalPrice() { return this._m(sum(this.getProductLineItems().toArray().map((p) => (p._data.price || 0) + p.getOptionProductLineItems().toArray().reduce((s, o) => s + (o._data.price || 0), 0)))); }
  getAdjustedMerchandizeTotalPrice(withOrder) { const base = sum(this.getAllProductLineItems().toArray().map((p) => p.getAdjustedPrice(false).getValue())); return this._m(withOrder === undefined || withOrder ? base + this._orderAdjTotal() : base); }
  getMerchandizeTotalTax() { return this._m(sum(this.getAllProductLineItems().toArray().map((p) => p._data.tax))); }
  getAdjustedMerchandizeTotalTax() { return this._m(sum(this.getAllProductLineItems().toArray().map((p) => p.getAdjustedTax().getValue())) + sum(this._data.priceAdjustments.map((a) => a.tax))); }
  getMerchandizeTotalNetPrice() { return this._m(sum(this.getAllProductLineItems().toArray().map((p) => p._data.netPrice))); }
  getMerchandizeTotalGrossPrice() { return this._m(sum(this.getAllProductLineItems().toArray().map((p) => p._data.grossPrice))); }
  getAdjustedMerchandizeTotalNetPrice() { return this._taxGross() ? this.getAdjustedMerchandizeTotalPrice(true).subtract(this.getAdjustedMerchandizeTotalTax()) : this.getAdjustedMerchandizeTotalPrice(true); }
  getAdjustedMerchandizeTotalGrossPrice() { return this._taxGross() ? this.getAdjustedMerchandizeTotalPrice(true) : this.getAdjustedMerchandizeTotalPrice(true).add(this.getAdjustedMerchandizeTotalTax()); }
  getShippingTotalPrice() { return this._m(sum(this.getShipments().toArray().map((s) => s.getShippingTotalPrice().getValue()))); }
  getAdjustedShippingTotalPrice() { return this._m(sum(this.getShipments().toArray().map((s) => s.getAdjustedShippingTotalPrice().getValue()))); }
  getShippingTotalTax() { return this._m(sum(this.getShipments().toArray().map((s) => s.getShippingTotalTax().getValue()))); }
  getAdjustedShippingTotalTax() { return this._m(sum(this.getShipments().toArray().map((s) => s.getAdjustedShippingTotalTax().getValue()))); }
  getShippingTotalNetPrice() { return this._m(sum(this.getShipments().toArray().map((s) => s.getShippingTotalNetPrice().getValue()))); }
  getShippingTotalGrossPrice() { return this._m(sum(this.getShipments().toArray().map((s) => s.getShippingTotalGrossPrice().getValue()))); }
  getAdjustedShippingTotalNetPrice() { return this._m(sum(this.getShipments().toArray().map((s) => s.getAdjustedShippingTotalNetPrice().getValue()))); }
  getAdjustedShippingTotalGrossPrice() { return this._m(sum(this.getShipments().toArray().map((s) => s.getAdjustedShippingTotalGrossPrice().getValue()))); }
  getGiftCertificateTotalPrice() { return this._m(sum(this._data.giftCertificateLineItems.map((g) => g.price))); }
  getGiftCertificateTotalTax() { return this._m(0); } getGiftCertificateTotalNetPrice() { return this.getGiftCertificateTotalPrice(); } getGiftCertificateTotalGrossPrice() { return this.getGiftCertificateTotalPrice(); }
  getTotalTax() { return this._data.totals ? this._m(this._data.totals.tax) : this.getAdjustedMerchandizeTotalTax().add(this.getAdjustedShippingTotalTax()); }
  getTotalNetPrice() { return this._data.totals ? this._m(this._data.totals.net) : this.getAdjustedMerchandizeTotalNetPrice().add(this.getAdjustedShippingTotalNetPrice()).add(this.getGiftCertificateTotalPrice()); }
  getTotalGrossPrice() { return this._data.totals ? this._m(this._data.totals.gross) : this.getAdjustedMerchandizeTotalGrossPrice().add(this.getAdjustedShippingTotalGrossPrice()).add(this.getGiftCertificateTotalPrice()); }
  getGiftCertificatePaymentTotal() { return this._m(sum(this.getGiftCertificatePaymentInstruments().toArray().map((p) => p.getPaymentTransaction().getAmount().isAvailable() ? p.getPaymentTransaction().getAmount().getValue() : 0))); }
  _taxGross() { const TaxMgr = require('./TaxMgr'); return TaxMgr.getTaxationPolicy() === TaxMgr.TAX_POLICY_GROSS; }
  isTaxRoundedAtGroup() { return false; }
  isExternallyTaxed() { return this._data.taxMode === 'external'; }
  getTaxRoundedAtGroup() { return false; }
  /** Recompute totals from line items (platform semantics of updateTotals). */
  updateTotals() {
    delete this._data.totals;
    for (const p of this.getAllProductLineItems().toArray()) p._recalc();
    const totals = { tax: this.getTotalTax().getValue(), net: this.getTotalNetPrice().getValue(), gross: this.getTotalGrossPrice().getValue() };
    this._data.totals = totals;
    this._markDirty();
  }
  updateOrderLevelPriceAdjustmentTax() {
    const base = this.getAdjustedMerchandizeTotalPrice(false).getValue();
    const plis = this.getAllProductLineItems().toArray();
    for (const a of this._data.priceAdjustments) {
      // prorate adjustment across items weighted by adjusted price, tax at each item's rate
      let tax = 0;
      for (const p of plis) { const share = base ? (p.getAdjustedPrice(false).getValue() / base) : 0; tax += (a.price || 0) * share * (p._data.taxRate || 0); }
      a.tax = LineItem.round(tax); a.taxRate = base ? tax / (a.price || 1) : 0;
    }
    this.updateTotals();
  }
  updateTotalsAndTaxes() { this.updateTotals(); }
  getAllGiftCertificateLineItems() { return this.getGiftCertificateLineItems(); }
  getAdjustedMerchandizeTotalPriceWithoutOrderAdjustments() { return this.getAdjustedMerchandizeTotalPrice(false); }
  verifyPriceAdjustmentLimits() { const Status = require('../system/Status'); return new Status(Status.OK); }
  toString() { return `[${this.constructor.name} ${this._data.UUID}]`; }
}
Object.assign(LineItemCtnr, { CHANNEL_TYPE_STOREFRONT: 0, CHANNEL_TYPE_CALLCENTER: 1, CHANNEL_TYPE_MARKETPLACE: 2, CHANNEL_TYPE_DSS: 3, CHANNEL_TYPE_STORE: 4, CHANNEL_TYPE_PINTEREST: 5, CHANNEL_TYPE_TWITTER: 6, CHANNEL_TYPE_FACEBOOKADS: 7, CHANNEL_TYPE_SUBSCRIPTIONS: 8, CHANNEL_TYPE_ONLINERESERVATION: 9, CHANNEL_TYPE_CUSTOMERSERVICECENTER: 10, CHANNEL_TYPE_INSTAGRAMCOMMERCE: 11, CHANNEL_TYPE_GOOGLE: 12, CHANNEL_TYPE_YOUTUBE: 13, CHANNEL_TYPE_TIKTOK: 14, CHANNEL_TYPE_SNAPCHAT: 15, CHANNEL_TYPE_WHATSAPP: 16, BUSINESS_TYPE_B2C: 1, BUSINESS_TYPE_B2B: 2 });
// Promotion helper for customer-group check only
require('../campaign/Promotion').prototype._qualifiesGroups = function (ctnr) { const groups = this._groups(); if (!groups.length) return true; const c = ctnr.getCustomer(); return !!c && groups.some((g) => c.isMemberOfCustomerGroup(g)); };
module.exports = bean(LineItemCtnr);
