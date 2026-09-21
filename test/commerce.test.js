'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { makeRuntime } = require('./helpers');

test('catalog: products, variants, categories, prices, availability, options, bundles', () => {
  const rt = makeRuntime(); const dw = rt.dw.namespace;
  const p = dw.catalog.ProductMgr.getProduct('P0001');
  assert.equal(p.master, true); assert.equal(p.name, 'Classic Shirt'); assert.equal(p.shortDescription.markup, 'A classic shirt'); assert.equal(p.custom.material, 'cotton'); assert.equal(p.custom.nope, null);
  assert.deepEqual(p.variants.toArray().map((v) => v.ID), ['P0001-RED-S', 'P0001-RED-M', 'P0001-BLUE-M']);
  assert.equal(p.primaryCategory.ID, 'mens-shirts'); assert.deepEqual(p.allCategories.toArray().map((c) => c.ID).sort(), ['mens', 'mens-shirts', 'root']);
  const v = dw.catalog.ProductMgr.getProduct('P0001-RED-M');
  assert.equal(v.variant, true); assert.equal(v.name, 'Classic Shirt'); assert.equal(v.masterProduct.ID, 'P0001'); assert.equal(v.priceModel.price.value, 22); assert.equal(v.priceModel.basePrice.value, 25); assert.equal(v.priceModel.priceInfo.priceBook.ID, 'usd-sale'); assert.equal(v.priceModel.priceInfo.percentage, 12);
  assert.equal(v.availabilityModel.orderable, false); assert.equal(v.availabilityModel.availabilityStatus, 'NOT_AVAILABLE'); assert.equal(dw.catalog.ProductMgr.getProduct('P0001-RED-S').availabilityModel.isOrderable(10), true); assert.equal(dw.catalog.ProductMgr.getProduct('P0001-RED-S').availabilityModel.isOrderable(11), false);
  assert.equal(p.priceModel.minPrice.value, 20); assert.equal(p.priceModel.maxPrice.value, 30); assert.equal(p.priceModel.isPriceRange(), true); assert.equal(p.availabilityModel.inStock, true);
  const vm = p.variationModel; const color = vm.getProductVariationAttribute('color');
  assert.deepEqual(vm.getAllValues(color).toArray().map((x) => x.displayValue), ['Red', 'Blue']);
  vm.setSelectedAttributeValue('color', 'red'); assert.equal(vm.selectedVariant, null); assert.deepEqual(vm.getFilteredValues(vm.getProductVariationAttribute('size')).toArray().map((x) => x.value), ['S', 'M']);
  vm.setSelectedAttributeValue('size', 'S'); assert.equal(vm.selectedVariant.ID, 'P0001-RED-S'); assert.equal(vm.hasOrderableVariants(vm.getProductVariationAttribute('size'), 'M'), false);
  assert.match(vm.urlSelectVariationValue('Product-Show', color, 'blue').toString(), /dwvar_P0001_color=blue/);
  const hat = dw.catalog.ProductMgr.getProduct('P0002'); const table = hat.priceModel.priceTable;
  assert.equal(table.getPrice(1).value, 15); assert.equal(table.getPrice(3).value, 12); assert.equal(hat.priceModel.getPrice(new dw.value.Quantity(5, '')).value, 12); assert.equal(table.getNextQuantity(1).value, 3);
  rt.context.session.setCurrency('EUR'); assert.equal(hat.priceModel.price.value, 14); assert.equal(hat.priceModel.price.currencyCode, 'EUR'); assert.equal(p.priceModel.price.available, false); rt.context.session.setCurrency('USD');
  const mug = dw.catalog.ProductMgr.getProduct('O0001'); const om = mug.optionModel; const opt = om.getOption('engraving'); assert.equal(om.getSelectedOptionValue(opt).ID, 'none'); om.setSelectedOptionValue(opt, om.getOptionValue(opt, 'yes')); assert.equal(mug.getPriceModel(om).price.value, 17);
  const bundle = dw.catalog.ProductMgr.getProduct('B0001'); assert.equal(bundle.bundle, true); assert.equal(bundle.getBundledProductQuantity(dw.catalog.ProductMgr.getProduct('P0004')).value, 2); assert.equal(bundle.availabilityModel.orderable, true);
  const cat = dw.catalog.CatalogMgr.getCategory('mens'); assert.equal(cat.parent.root, true); assert.deepEqual(cat.onlineSubCategories.toArray().map((c) => c.ID), ['mens-shirts']); assert.equal(dw.catalog.CatalogMgr.getSiteCatalog().root.ID, 'root'); assert.deepEqual(dw.catalog.CatalogMgr.getCategory('root').onlineSubCategories.toArray().map((c) => c.ID), ['mens', 'womens']);
  assert.equal(dw.catalog.ProductMgr.getProduct('P0003').online, false); assert.equal(dw.catalog.ProductMgr.getProduct('zzz'), null);
  assert.equal(p.attributeModel.visibleAttributeGroups.toArray()[0].ID, 'details'); assert.equal(p.attributeModel.getDisplayValue(p.attributeModel.getAttributeDefinition('material')), 'Cotton');
  const inv = dw.catalog.ProductInventoryMgr.getInventoryList(); assert.equal(inv.ID, 'inventory_m'); assert.equal(inv.getRecord('P0004').perpetual, true); assert.equal(inv.getRecord('P0002').ATS.value, 100);
});

test('basket to order: totals, payments, gift certificates, inventory consumption, order search, statuses', () => {
  const rt = makeRuntime(); const dw = rt.dw.namespace;
  const Money = dw.value.Money; const Tx = dw.system.Transaction;
  const basket = dw.order.BasketMgr.getCurrentOrNewBasket();
  assert.equal(dw.order.BasketMgr.getCurrentBasket(), basket);
  Tx.wrap(() => {
    const pli = basket.createProductLineItem('P0002', basket.defaultShipment); pli.setQuantityValue(4);
    const bundle = basket.createProductLineItem(dw.catalog.ProductMgr.getProduct('B0001'), basket.defaultShipment);
    assert.equal(bundle.bundledProductLineItems.length, 2); assert.equal(basket.productLineItems.length, 2); assert.equal(basket.allProductLineItems.length, 4);
    const mug = dw.catalog.ProductMgr.getProduct('O0001'); const om = mug.optionModel; om.setSelectedOptionValue(om.getOption('engraving'), om.getOptionValue(om.getOption('engraving'), 'yes'));
    const mpli = basket.createProductLineItem(mug, om, basket.defaultShipment); assert.equal(mpli.optionProductLineItems.length, 1); assert.equal(mpli.optionProductLineItems[0] === undefined, true); assert.equal(mpli.optionProductLineItems.get(0).price.value, 5);
    const ship = basket.defaultShipment; ship.setShippingMethod(dw.order.ShippingMgr.getDefaultShippingMethod());
    const addr = ship.createShippingAddress(); addr.firstName = 'Jane'; addr.lastName = 'Doe'; addr.address1 = '1 Main'; addr.city = 'NYC'; addr.postalCode = '10001'; addr.stateCode = 'NY'; addr.setCountryCode('US');
    const bill = basket.createBillingAddress(); bill.firstName = 'Jane'; bill.lastName = 'Doe'; bill.countryCode = 'US';
    basket.setCustomerEmail('jane@example.com');
    rt.calculateBasket(basket);
  });
  assert.equal(basket.productQuantityTotal, 6);
  assert.equal(basket.merchandizeTotalPrice.value, 48 + 80 + 17); // tiered hat 12x4, bundle 80, mug 12 + option 5
  assert.deepEqual(basket.priceAdjustments.toArray().map((a) => a.promotionID), ['order-5-over-50']);
  assert.equal(basket.adjustedMerchandizeTotalPrice.value, 140); assert.equal(basket.shippingTotalPrice.value, 0); // free over 100
  assert.equal(basket.totalTax.value, 12.43); // NY jurisdiction 8.875% of 140
  assert.equal(basket.totalGrossPrice.value, 152.43); assert.equal(basket.totalNetPrice.value, 140);
  assert.equal(basket.getShipments().length, 1); assert.equal(basket.defaultShipment.shippingAddress.countryCode.value, 'US'); assert.equal(basket.defaultShipment.shippingAddress.fullName, 'Jane Doe');
  const model = dw.order.ShippingMgr.getShipmentShippingModel(basket.defaultShipment); assert.deepEqual(model.applicableShippingMethods.toArray().map((m) => m.ID), ['001', '002']); assert.equal(model.getShippingCost(dw.order.ShippingMgr._method('002')).amount.value, 15);
  Tx.wrap(() => {
    const gc = dw.order.GiftCertificateMgr.createGiftCertificate(new Money(50, 'USD'), 'GC123');
    const gcpi = basket.createGiftCertificatePaymentInstrument('GC123', new Money(50, 'USD')); assert.equal(gcpi.giftCertificateID, 'GC123');
    const pi = basket.createPaymentInstrument(dw.order.PaymentInstrument.METHOD_CREDIT_CARD, basket.totalGrossPrice.subtract(new Money(50, 'USD')));
    pi.setCreditCardNumber('4111111111111111'); pi.setCreditCardType('Visa'); pi.setCreditCardExpirationMonth(12); pi.setCreditCardExpirationYear(new Date().getFullYear() + 1); pi.setCreditCardHolder('Jane Doe');
    pi.paymentTransaction.setTransactionID('tx1'); pi.paymentTransaction.setPaymentProcessor(dw.order.PaymentMgr.getPaymentMethod('CREDIT_CARD').paymentProcessor);
    assert.equal(pi.maskedCreditCardNumber, '************1111'); assert.equal(pi.creditCardNumberLastDigits, '1111');
    const card = dw.order.PaymentMgr.getPaymentCard('Visa'); assert.equal(card.verify(12, new Date().getFullYear() + 1, '4111111111111111', '123').error, false); assert.equal(card.verify(1, 2000, '4111111111111112', '12').items.length, 3);
    assert.equal(gc.balance.value, 50);
  });
  assert.equal(basket.paymentInstruments.length, 2); assert.equal(basket.giftCertificatePaymentTotal.value, 50);
  let order;
  Tx.wrap(() => {
    order = dw.order.OrderMgr.createOrder(basket);
    assert.equal(order.status.value, dw.order.Order.ORDER_STATUS_CREATED); assert.match(order.orderNo, /^\d{8}$/); assert.equal(order.totalGrossPrice.value, 152.43); assert.equal(order.customerEmail, 'jane@example.com'); assert.equal(order.customerName, 'Jane Doe');
    assert.equal(dw.order.BasketMgr.getCurrentBasket(), null);
    assert.equal(dw.order.GiftCertificateMgr.redeemGiftCertificate(order.getGiftCertificatePaymentInstruments().get(0)).error, false);
    const status = dw.order.OrderMgr.placeOrder(order); assert.equal(status.error, false);
    order.setConfirmationStatus(dw.order.Order.CONFIRMATION_STATUS_CONFIRMED); order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID); order.custom.source = 'test';
  });
  assert.equal(order.status.value, dw.order.Order.ORDER_STATUS_NEW); assert.equal(order.status.displayValue, 'NEW'); assert.equal(order.confirmationStatus.value, 2); assert.equal(order.exportStatus.displayValue, 'READY');
  assert.equal(dw.catalog.ProductInventoryMgr.getInventoryList().getRecord('P0002').ATS.value, 95); assert.equal(dw.catalog.ProductInventoryMgr.getInventoryList().getRecord('O0001').ATS.value, 6);
  assert.equal(dw.order.GiftCertificateMgr.getGiftCertificateByCode('GC123').balance.value, 0);
  const found = dw.order.OrderMgr.getOrder(order.orderNo); assert.equal(found.UUID, order.UUID); assert.equal(dw.order.OrderMgr.getOrder(order.orderNo, 'bad-token'), null);
  const it = dw.order.OrderMgr.searchOrders('customerEmail = {0} AND status = {1}', 'creationDate desc', 'jane@example.com', dw.order.Order.ORDER_STATUS_NEW); assert.equal(it.count, 1); assert.equal(it.next().custom.source, 'test');
  assert.equal(dw.order.OrderMgr.searchOrders('custom.source = {0}', null, 'test').count, 1);
  assert.equal(dw.order.OrderMgr.cancelOrder(order).error, false); assert.equal(order.status.value, dw.order.Order.ORDER_STATUS_CANCELLED); assert.equal(dw.catalog.ProductInventoryMgr.getInventoryList().getRecord('P0002').ATS.value, 100);
  assert.throws(() => dw.order.OrderMgr.createOrder(dw.order.BasketMgr.getCurrentOrNewBasket()), /Basket is empty/);
  assert.match(order.getOrderExportXML(), /<order order-no=/);
});

test('customers: create, authenticate, lock out, addresses, wallet, groups, product lists, profile search', () => {
  const rt = makeRuntime(); const dw = rt.dw.namespace; const CM = dw.customer.CustomerMgr; const Tx = dw.system.Transaction;
  assert.equal(CM.isAcceptablePassword('short'), false);
  const c = Tx.wrap(() => CM.createCustomer('new@example.com', 'LongEnough1'));
  assert.equal(c.registered, true); assert.equal(c.profile.credentials.login, 'new@example.com'); assert.equal(CM.getCustomerByLogin('NEW@example.com').customerNo, c.customerNo);
  assert.throws(() => CM.createCustomer('new@example.com', 'LongEnough1'), /already in use/);
  assert.equal(CM.authenticateCustomer('new@example.com', 'LongEnough1').authenticated, true);
  for (let i = 0; i < 6; i++) CM.authenticateCustomer('new@example.com', 'bad'); assert.equal(CM.authenticateCustomer('new@example.com', 'LongEnough1').status, 'ERROR_CUSTOMER_LOCKED');
  Tx.wrap(() => { c.profile.email = 'new@example.com'; c.profile.firstName = 'Neo'; c.profile.setBirthday(new Date('1990-05-05')); c.profile.gender = 1; c.profile.custom.tier = 'gold'; });
  assert.equal(c.profile.male, true); assert.equal(c.profile.birthday.getFullYear(), 1990);
  Tx.wrap(() => { const a = c.addressBook.createAddress('home'); a.address1 = '2 Side St'; a.city = 'Boston'; a.setCountryCode('US'); c.addressBook.setPreferredAddress(a); });
  assert.equal(c.addressBook.preferredAddress.city, 'Boston'); assert.equal(c.addressBook.createAddress('home'), null); assert.equal(c.addressBook.getAddress('home').countryCode.displayValue, 'United States');
  Tx.wrap(() => { const pi = c.profile.wallet.createPaymentInstrument('CREDIT_CARD'); pi.setCreditCardNumber('4111111111111111'); pi.setCreditCardToken('tok'); });
  assert.equal(c.profile.wallet.getPaymentInstruments('CREDIT_CARD').length, 1); assert.equal(c.profile.wallet.paymentInstruments.get(0).creditCardToken, 'tok');
  const vip = CM.getCustomerGroup('VIP'); Tx.wrap(() => vip.assignCustomer(c)); assert.equal(c.isMemberOfCustomerGroup('VIP'), true); assert.equal(c.isMemberOfCustomerGroup(CM.getCustomerGroup('BigSpenders')), false);
  const jane = CM.getCustomerByCustomerNumber('00000001'); assert.equal(jane.isMemberOfCustomerGroup('BigSpenders'), true); assert.equal(jane.profile.custom.spent, 2000);
  const list = Tx.wrap(() => { const l = dw.customer.ProductListMgr.createProductList(c, dw.customer.ProductList.TYPE_WISH_LIST); l.createProductItem(dw.catalog.ProductMgr.getProduct('P0002')).setQuantityValue(2); return l; });
  assert.equal(dw.customer.ProductListMgr.getProductLists(c, dw.customer.ProductList.TYPE_WISH_LIST).length, 1); assert.equal(list.items.get(0).product.name, 'Plain Hat'); assert.equal(list.owner.customerNo, c.customerNo);
  const profiles = CM.searchProfiles('firstName = {0}', 'customerNo', 'Neo'); assert.equal(profiles.count, 1); assert.equal(CM.queryProfile('custom.tier = {0}', 'gold').firstName, 'Neo'); assert.equal(CM.searchProfiles('email ILIKE {0}', null, '*example.com').count, 2);
  assert.equal(dw.object.SystemObjectMgr.querySystemObjects('Profile', 'lastName = {0}', null, 'Doe').count, 1);
  CM.loginCustomer(CM.authenticateCustomer('jane@example.com', 'Passw0rd!'), true); assert.equal(rt.context.customer.authenticated, true); assert.equal(rt.context.session.customerAuthenticated, true); assert.equal(rt.context.customer.profile.lastLoginTime instanceof Date, true);
  CM.logoutCustomer(false); assert.equal(rt.context.customer.anonymous, true);
});

test('custom objects: CRUD, queries, describe, transaction persistence to disk', () => {
  const rt = makeRuntime({ persist: true }); const dw = rt.dw.namespace; const COM = dw.object.CustomObjectMgr; const Tx = dw.system.Transaction;
  const co = COM.getCustomObject('Settings', 'featureFlag'); assert.equal(co.custom.enabled, true); assert.equal(co.custom.threshold, 3); assert.equal(co.type, 'Settings');
  assert.equal(COM.getAllCustomObjects('Settings').count, 2);
  assert.equal(COM.queryCustomObjects('Settings', 'custom.enabled = {0}', 'custom.threshold desc', true).count, 1);
  assert.equal(COM.queryCustomObject('Settings', 'custom.threshold > {0}', 5).custom.ID, 'other');
  Tx.wrap(() => { const n = COM.createCustomObject('Settings', 'third'); n.custom.enabled = true; n.custom.threshold = 1; assert.equal(n.custom.ID, 'third'); });
  assert.throws(() => COM.createCustomObject('Settings', 'third'), /already exists/);
  const onDisk = JSON.parse(fs.readFileSync(path.join(rt._tmpData, 'custom-objects.json'), 'utf8')); assert.equal(onDisk.Settings.third.custom.threshold, 1);
  Tx.begin(); COM.remove(COM.getCustomObject('Settings', 'other')); Tx.commit(); assert.equal(COM.getCustomObject('Settings', 'other'), null);
  assert.equal(JSON.parse(fs.readFileSync(path.join(rt._tmpData, 'custom-objects.json'), 'utf8')).Settings.other, undefined);
  Tx.begin(); COM.createCustomObject('Settings', 'rolledback'); Tx.rollback(); assert.equal(JSON.parse(fs.readFileSync(path.join(rt._tmpData, 'custom-objects.json'), 'utf8')).Settings.rolledback, undefined);
  const def = COM.describe('Settings'); assert.deepEqual(def.attributeDefinitions.toArray().map((a) => a.ID), ['ID', 'enabled', 'threshold']); assert.equal(def.getCustomAttributeDefinition('enabled').valueTypeCode, 8);
  const strictRt = makeRuntime(); const p = strictRt.dw.namespace.catalog.ProductMgr.getProduct('P0002'); p.custom.anything = 1; assert.equal(p.custom.anything, 1);
});

test('promotions engine: classes, exclusivity, coupons, approaching discounts, promotional price, bonus products', () => {
  const rt = makeRuntime(); const dw = rt.dw.namespace; const PM = dw.campaign.PromotionMgr; const Tx = dw.system.Transaction;
  assert.equal(PM.getActivePromotions().promotions.length, 4); assert.equal(PM.getActiveCustomerPromotions().promotions.length, 2); // vip & coupon excluded for anonymous
  const shirt = dw.catalog.ProductMgr.getProduct('P0001-RED-S'); const promo = PM.getPromotion('10off-shirts');
  assert.equal(promo.getPromotionalPrice(shirt).value, 18); assert.equal(promo.getPromotionalPrice(dw.catalog.ProductMgr.getProduct('P0002')).available, false); assert.equal(promo.calloutMsg.markup, 'Save 10% on shirts'); assert.equal(promo.promotionClass, 'PRODUCT');
  assert.equal(PM.getActiveCustomerPromotions().getProductPromotions(shirt).length, 1);
  const basket = dw.order.BasketMgr.getCurrentOrNewBasket();
  Tx.wrap(() => { basket.createProductLineItem('P0002', basket.defaultShipment).setQuantityValue(2); basket.defaultShipment.setShippingMethod(dw.order.ShippingMgr.getDefaultShippingMethod()); rt.calculateBasket(basket); });
  const plan = PM.getDiscounts(basket); assert.equal(plan.orderDiscounts.length, 0);
  const approaching = plan.approachingOrderDiscounts; assert.equal(approaching.length, 1); assert.equal(approaching.get(0).distanceFromConditionThreshold.value, 20); assert.equal(approaching.get(0).conditionThreshold.value, 50);
  Tx.wrap(() => { basket.createCouponLineItem('FREESHIP', true); rt.calculateBasket(basket); });
  assert.equal(basket.couponLineItems.get(0).applied, true); assert.equal(basket.defaultShipment.adjustedShippingTotalPrice.value, 0); assert.equal(basket.getAllShippingPriceAdjustments().get(0).promotionID, 'free-ship-coupon'); assert.equal(basket.couponLineItems.get(0).priceAdjustments.length, 1);
  Tx.wrap(() => { basket.removeCouponLineItem(basket.couponLineItems.get(0)); rt.calculateBasket(basket); }); assert.equal(basket.adjustedShippingTotalPrice.value, 5.99);
  // manual adjustment survives recalculation
  Tx.wrap(() => { const pa = basket.productLineItems.get(0).createPriceAdjustment('manual-1'); pa.setPriceValue(-3); pa.setReasonCode('PRICE_MATCH'); rt.calculateBasket(basket); });
  assert.equal(basket.productLineItems.get(0).adjustedPrice.value, 27); assert.equal(basket.productLineItems.get(0).priceAdjustments.get(0).manual, true);
  // bonus promotion
  rt.store.get('promotions').bonus = { promotionClass: 'product', enabled: true, qualifyingProducts: ['P0002'], discount: { type: 'bonus', bonusProductIDs: ['P0004'], maxBonusItems: 1 } };
  Tx.wrap(() => rt.calculateBasket(basket));
  const bd = basket.bonusDiscountLineItems.get(0); assert.equal(bd.promotionID, 'bonus'); assert.equal(bd.bonusProducts.get(0).ID, 'P0004');
  Tx.wrap(() => { const bp = basket.createBonusProductLineItem(bd, dw.catalog.ProductMgr.getProduct('P0004'), null, basket.defaultShipment); assert.equal(bp.bonusProductLineItem, true); assert.equal(bp.price.value, 0); });
  assert.equal(bd.bonusProductLineItems.length, 1); assert.equal(bd.remainingBonusItems, 0);
  const coupon = dw.campaign.CouponMgr.getCouponByCode('SYS-ABC'); assert.equal(coupon.ID, 'SYS'); assert.match(coupon.getNextCouponCode(), /^SYS-/);
});

test('content, folders, content search, page designer, stores, site preferences persistence', () => {
  const rt = makeRuntime(); const dw = rt.dw.namespace;
  const c = dw.content.ContentMgr.getContent('about-us'); assert.equal(c.name, 'About Us'); assert.equal(c.custom.body.markup, '<p>We sell things</p>'); assert.equal(c.classificationFolder.displayName, 'About'); assert.equal(c.classificationFolder.parent.root, true);
  const csm = new dw.content.ContentSearchModel(); csm.setSearchPhrase('sell'); csm.search(); assert.equal(csm.count, 1); csm.setSearchPhrase('nothing'); csm.search(); assert.equal(csm.count, 0);
  assert.equal(dw.experience.PageMgr.renderPage('landing', '{}'), '<div class="page landing"><h1>Welcome</h1><div class="experience-region experience-main"><div class="experience-component experience-text"><p>Hello PD</p></div></div></div>');
  assert.equal(dw.experience.PageMgr.getPage('landing').getRegion('main').visibleComponents.length, 1);
  rt.store.get('stores', {}).s1 = { name: 'Downtown', latitude: 40.71, longitude: -74.0, postalCode: '10001', countryCode: 'US', city: 'NYC' }; rt.store.get('stores').s2 = { name: 'Uptown', latitude: 40.8, longitude: -73.95, postalCode: '10025', countryCode: 'US' };
  const res = dw.catalog.StoreMgr.searchStoresByCoordinates(40.7, -74.0, 'mi', 20); assert.deepEqual(res.keySet().toArray().map((s) => s.ID), ['s1', 's2']); assert.ok(res.get(dw.catalog.StoreMgr.getStore('s2')) > 5);
  assert.equal(dw.catalog.StoreMgr.searchStoresByPostalCode('US', '10025', 'mi', 10).size(), 1);
  const persisted = makeRuntime({ persist: true }); dw.system.Site._clearCache();
  const Site = persisted.dw.namespace.system.Site; persisted.dw.namespace.system.Transaction.wrap(() => { Site.current.setCustomPreferenceValue('maxItems', 9); });
  assert.equal(JSON.parse(fs.readFileSync(path.join(persisted._tmpData, 'sites.json'), 'utf8')).RefArch.preferences.custom.maxItems, 9);
  dw.system.Site._clearCache();
});
