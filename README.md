# sfcc-runtime

A local runtime that executes Salesforce Commerce Cloud (SFCC, formerly Demandware) cartridge
code outside the platform. It emulates the server-side JavaScript environment closely enough that
unmodified cartridges run: SFRA and SiteGenesis controllers, `dw.*` API calls, ISML templates,
forms, hooks, job steps, legacy pipelines with `.ds` scripts, services, Page Designer components.

No network access, sandbox instance or Salesforce account is required. Everything runs on Node.js
(18 or newer) with no third-party dependencies, backed by a JSON data directory that plays the role
of the database.

```
npm install
npx sfcc-run info                 # discovered cartridges, cartridge path, data
npx sfcc-run serve                # storefront on http://localhost:3000/
npx sfcc-run request Home-Show    # dispatch one controller request and print the response
npm test                          # 46 tests covering every subsystem against a fixture project
```

## What runs

| Area | Support |
| --- | --- |
| Module system | `require('dw/...')`, `require('*/cartridge/...')`, `require('~/cartridge/...')`, `require('<cartridge>/cartridge/...')`, `require('server')` from a root `modules/` folder, relative paths, JSON, `module.superModule`, request-scoped module cache (one evaluation per request, as on the platform) |
| Rhino syntax | Type annotations (`function f(a : String) : Number`), `for each (x in coll)`, `importPackage`, `importClass`, `importScript`, `.ds` script files, `String.equals`/`equalsIgnoreCase` |
| Globals | `dw`, `empty()`, `request`, `response`, `session`, `customer`, `PIPELET_NEXT`, `PIPELET_ERROR` |
| Java bean access | `product.ID`, `basket.totalGrossPrice`, `session.custom`, `pi.creditCardNumber = ...` all map to `getX()` / `isX()` / `setX()` |
| `dw.system` | Site, Logger, Transaction, Status, HookMgr, CacheMgr, System, Request, Response, Session, Pipeline, PipelineDictionary, RemoteInclude, preferences |
| `dw.util` | ArrayList, HashMap, HashSet, Linked*, Sorted*, FilteringCollection, SeekableIterator, PropertyComparator, StringUtils, Calendar (time zones, Java patterns), Decimal, BigInteger, Bytes, Locale, Currency, UUIDUtils, SecureRandom, Template (Velocity), MappingMgr, Geolocation |
| `dw.value` | Money (currency-aware rounding, NOT_AVAILABLE), Quantity, EnumValue, MimeEncodedText |
| `dw.web` | URLUtils/URL/URLAction/URLParameter, Resource bundles with locale fallback, Forms (XML definitions, binding, validation, `dwfrm_` population, copyFrom/copyTo), HttpParameterMap, Cookies, ClickStream, PagingModel, CSRFProtection, PageMetaData, URLRedirectMgr |
| `dw.catalog` | ProductMgr, CatalogMgr, Product/Variant/VariationGroup, Category, ProductVariationModel, ProductPriceModel (price books, tiers, parent books, currencies), ProductAvailabilityModel + inventory lists, ProductOptionModel, ProductAttributeModel, ProductSearchModel with hits, refinements (category, price, attributes), sorting rules, SuggestModel, StoreMgr with geo search, PriceBookMgr |
| `dw.order` | BasketMgr, Basket, OrderMgr, Order (statuses, export XML), Shipment, ProductLineItem (bundles, options, bonus items), ShippingLineItem, PriceAdjustment, CouponLineItem, GiftCertificate*, PaymentInstrument/PaymentTransaction, PaymentMgr/PaymentMethod/PaymentCard (Luhn + expiry verification), ShippingMgr with cost tiers and applicability, TaxMgr with jurisdictions, totals with net/gross policy, `updateTotals`, order-level adjustment tax proration |
| `dw.campaign` | PromotionMgr (product/order/shipping classes, rank, exclusivity, customer groups, coupons, thresholds), Promotion, Campaign, Coupon/CouponMgr (single, multi and system codes, redemption limits), DiscountPlan, ApproachingDiscount, bonus products, slots (`<isslot>`) |
| `dw.customer` | CustomerMgr (create, authenticate, lockout, login/logout, search), Customer, Profile, Credentials (scrypt hashes), AddressBook, Wallet, CustomerGroup (static and rule-based), ProductList/ProductListMgr, OrderHistory, ExternalProfile |
| `dw.object` | CustomObjectMgr (query language, sorting), SystemObjectMgr, describe(), ObjectTypeDefinition |
| `dw.content` | ContentMgr, Content, Folder, Library, MarkupText, MediaFile, ContentSearchModel |
| `dw.io` | File (IMPEX/TEMP/... roots), FileReader/Writer, StringWriter, CSVStream*, XMLStreamReader/Writer, XMLIndentingStreamWriter, zip/gzip |
| `dw.net` | HTTPClient (synchronous, like the platform), Mail (captured to events/files), WebDAVClient over HTTP, FTP/SFTP via a pluggable transport |
| `dw.svc` | LocalServiceRegistry with the full createRequest/parseResponse/mockCall/filterLogMessage lifecycle, HTTP/HTTPForm/FTP/SOAP/Generic services, Result, service configuration from data, legacy ServiceRegistry |
| `dw.crypto` | Encoding, MessageDigest, Mac, Cipher (AES CBC/GCM/ECB, 3DES, RSA), Signature, KeyRef/CertificateRef from data, JWS/JWSHeader |
| `dw.template` | ISML.renderTemplate, Velocity |
| `dw.experience` | PageMgr.renderPage/renderRegion, Page, Region, Component, render settings, script contexts |
| ISML | isset, isif/iselseif/iselse, isloop (status, begin/end/step), isbreak/iscontinue, isprint (styles, formatters, time zones, encoding), isinclude (template and remote URL), isdecorate/isreplace, isscript, iscontent, iscomment, iscache, isredirect, isstatus, iscookie, isslot, ismodule custom tags, `${}` expressions, locale fallback |
| Controllers | SFRA (`server.get/post/append/prepend/replace/extend`, remote includes, `res.render/json/redirect`) and SiteGenesis (`exports.Show.public = true`, `ISML.renderTemplate`) |
| Pipelines | XML pipelines: start/end/jump/call/decision/loop/join nodes, Script/Assign/Eval and common pipelets, interaction nodes, branches, transitions, custom pipelets |
| Jobs | `steptypes.json` step types, script-module steps, chunk-oriented steps, job definitions from `data/jobs.json` or `jobs.xml` |
| HTTP | Storefront URLs (`/on/demandware.store/Sites-X-Site/locale/Controller-Action`, `/s/X/...`, `/Controller-Action`), sessions via `dwsid`, form/JSON/multipart bodies, static assets, error controller routing |

Anything not implemented resolves to a stub that throws a `NotImplementedError` naming the class and
method, so code that merely references an exotic class still loads. Register your own implementation
with `runtime.registerClass('dw/extensions/payments/SalesforcePaymentsMgr', impl)`.

## Project layout

Point the runtime at a directory containing your cartridges. It discovers every folder that has a
`cartridge/` sub-folder, plus a `modules/` folder next to the cartridges (where SFRA keeps `server`).

```
my-store/
  cartridges/app_custom/cartridge/{controllers,templates,scripts,forms,static}
  cartridges/app_storefront_base/...
  modules/server/
  data/                       <- runtime data (see below)
  sfcc-runtime.json           <- optional configuration
```

`sfcc-runtime.json`:

```json
{
  "roots": ["."],
  "cartridgePath": "app_custom:app_storefront_base",
  "site": "RefArch",
  "locale": "default",
  "dataDir": "data",
  "persist": false,
  "port": 3000,
  "logLevel": "info"
}
```

If `cartridgePath` is omitted the site's `cartridgePath` from `data/sites.json` is used, then every
discovered cartridge. A `dw.json` (`cartridgesPath`) from the SFCC developer tools is honoured too.

## Data directory

Every `data/<name>.json` file is a collection. Missing files are treated as empty. `sfcc-run init`
creates a starter set. Collections and their shapes:

| File | Content |
| --- | --- |
| `sites.json` | `{ "RefArch": { name, defaultLocale, allowedLocales, currencyCode, allowedCurrencies, httpHostName, timezone, catalog, priceBooks: [ids], inventoryList, cartridgePath, preferences: { custom: {...} } } }` |
| `categories.json` | `{ "root": { displayName }, "mens": { displayName, parent: "root", online, position, template, refinements: [...] } }` |
| `products.json` | `{ "P1": { name, shortDescription, longDescription, brand, online, searchable, categories: [ids], primaryCategory, master, variants: [ids], variationAttributes: [{ ID, displayName, values: [{ value, displayValue }] }], images: { large: [{ path, alt }] }, custom: {}, taxClassID, bundledProducts: [{ ID, quantity }], productSetProducts: [ids], options: [{ ID, displayName, values: [{ ID, displayValue, price, default }] }] }, "P1-S": { masterID: "P1", variationValues: { size: "S" } } }` |
| `pricebooks.json` | `{ "usd-list": { currencyCode, parent, online, prices: { "P1": 20, "P2": [{ quantity: 1, price: 15 }, { quantity: 3, price: 12 }] } } }` |
| `inventory.json` | `{ "inventory_m": { default: true, records: { "P1": { ATS, allocation, perpetual, preorderable, backorderable, preorderBackorderAllocation, inStockDate } } } }` |
| `customers.json` | `{ "00000001": { customerNo, credentials: { login, password or passwordHash+salt, enabled }, profile: { firstName, lastName, email, custom }, addresses: [...], paymentInstruments: [...], customerGroups: [ids] } }` |
| `customer-groups.json` | `{ "VIP": { description }, "BigSpenders": { ruleBased: true, rule: "profile.custom.spent > 1000" } }` |
| `promotions.json` | `{ "id": { name, promotionClass: "product" \| "order" \| "shipping", enabled, rank, exclusivity, startDate, endDate, customerGroups, coupons, minAmount, minQuantity, products, categories, all, excludedProducts, qualifyingProducts, shippingMethods, discount: { type: "percentage" \| "amount" \| "fixed_price" \| "free_shipping" \| "bonus" \| "bonus_choice" \| "price_book_price", value, bonusProductIDs, maxBonusItems } } }` |
| `coupons.json` | `{ "SAVE10": { type: "single_code" \| "multiple_codes" \| "system_codes", codes: [...], codePrefix, enabled, redemptionLimitPerCode, redemptionLimitPerCustomer } }` |
| `campaigns.json` | `{ "id": { enabled, startDate, endDate, customerGroups, coupons } }` |
| `shipping-methods.json` | `{ "001": { displayName, default, online, taxClassID, currencyCode, cost: 5.99 or [{ threshold, cost }], countries, excludedProducts, productSurcharges } }` |
| `tax.json` | `{ policy: "net" \| "gross", defaultTaxClassID, defaultJurisdictionID, jurisdictions: { "US-NY": { countries, states, postalCodes } }, rates: { "US-NY": { standard: 0.08875 } } }` |
| `payment-methods.json` | `{ "CREDIT_CARD": { name, active, paymentProcessor, cards: { Visa: { securityCodeLength, numberLengths } }, countries, minAmount, maxAmount, customerGroups } }` |
| `payment-processors.json` | `{ "BASIC_CREDIT": { preferences: {} } }` |
| `custom-objects.json` | `{ "TypeID": { "key": { custom: { ... } } } }` |
| `object-types.json` | `{ "TypeID": { key: "ID", attributes: { name: { valueTypeCode, displayName, refinable, values } }, groups: [{ id, displayName, attributes }] } }` — also used for `Product`, `Profile`, `Order` |
| `content.json` | `{ assets: { "id": { name, online, searchable, folders, custom: { body } } }, folders: { "id": { displayName, parent } } }` |
| `services.json` | `{ "my.service": { serviceType: "HTTP" \| "HTTPForm" \| "FTP" \| "SOAP" \| "GENERIC", enabled, mockMode, credential: { URL, user, password }, profile: { timeoutMillis } } }` |
| `service-credentials.json` | named credentials for `setCredentialID` |
| `pages.json` | Page Designer pages: `{ "landing": { typeID, data, regions: { main: { components: [{ id, typeID, data, regions, visible }] } } } }` |
| `slots.json` | `{ "slot-id": { template, contentType: "products" \| "categories" \| "content_assets" \| "html", content: [...], calloutMsg } }` |
| `stores.json`, `store-groups.json`, `postal-codes.json` | store locator data |
| `sorting-rules.json`, `sorting-options.json`, `search-redirects.json`, `url-redirects.json` | search configuration |
| `gift-certificates.json`, `orders.json`, `baskets.json`, `coupon-redemptions.json`, `product-lists.json`, `sequences.json` | created at runtime |
| `jobs.json` or `jobs.xml` | `{ "JobID": { steps: [{ id, type, parameters }] } }` |
| `keys.json` | `{ "alias": { privateKey: pem, certificate: pem } }` for `KeyRef`/`CertificateRef` |
| `mappings.json`, `organization.json`, `password-constraints.json`, `ab-tests.json`, `popular-searches.json` | miscellaneous |

`data/files/` is the root for `dw.io.File` (`/IMPEX`, `/TEMP`, ...). Static library images are served
from `data/files/CATALOGS/<catalog>/default/...` or `data/images/...`.

With `"persist": true` every committed transaction writes the touched collections back to disk.

## CLI

```
sfcc-run serve [--port 3000]                    storefront server
sfcc-run request Cart-AddProduct --method POST --body "pid=P0001&quantity=1"
sfcc-run request Home-Show --param q=shirt      GET with query parameters
sfcc-run run cartridges/app/cartridge/scripts/x.js
sfcc-run eval "dw.catalog.ProductMgr.getProduct('P0001').priceModel.price.toString()"
sfcc-run render product/productDetails --pdict '{"product": ...}'
sfcc-run step custom.ExportProducts --param FileName=out.csv
sfcc-run job DemoJob
sfcc-run pipeline Cart-Show
sfcc-run info | init | help
```

Common options: `--root <dir>`, `--cartridge-path a:b`, `--site`, `--locale`, `--data <dir>`,
`--persist`, `--log-level debug|info|warn|error`.

## Programmatic API

```js
const { createRuntime, loadConfig } = require('sfcc-runtime');
const rt = createRuntime(loadConfig('/path/to/my-store'));

rt.require('*/cartridge/scripts/helpers/priceHelper');   // SFCC-style require
rt.dw.namespace.catalog.ProductMgr.getProduct('P0001');  // the dw API from Node
rt.eval('session.custom.x = 1; dw.system.Site.current.ID');

const result = rt.dispatch({ method: 'POST', url: '/Cart-AddProduct', body: 'pid=P0001&quantity=2', headers: { cookie: 'dwsid=...' } });
// { status, headers, body, cookies, contentType, redirect, session }

rt.renderTemplate('product/productDetails', { product });
rt.runJobStep('custom.ExportProducts', { FileName: 'x.csv' });
rt.runJob('DemoJob');
rt.runPipeline('Cart-Show', { ProductID: 'P0001' });
rt.calculateBasket(basket);                 // dw.order.calculate hook or built-in calculation
rt.hooks.register('app.payment.processor.default', { Authorize: () => ({ authorized: true }) });
rt.pipelets.MyPipelet = (ctx, config, io) => { io.set('Out', 1); return 1; };
rt.registerClass('dw/foo/Bar', MyBar);
rt.config.httpTransport = (req) => ({ status: 200, headers: {}, text: '{}' });   // intercept outbound HTTP
rt.on('mail', (m) => console.log(m.subject));   // events: log, request, mail, service, http, login, logout, orderCreated, orderPlaced, commit
```

Every `dispatch` evaluates modules in a fresh request scope, exactly as the platform does, so the
SFRA `server` singleton and any per-request module state behave as they would on an instance.

## Writing a hook, step or pipelet locally

Hooks come from each cartridge's `package.json` `"hooks"` entry (a `hooks.json`), step types from a
cartridge-root `steptypes.json`, pipelines from `cartridge/pipelines/*.xml`, forms from
`cartridge/forms/<locale>/*.xml`, resources from `cartridge/templates/resources/*.properties`, static
files from `cartridge/static/<locale>/`, Page Designer types from `cartridge/experience/{pages,components}`.
The fixture project under `test/fixtures/project` demonstrates all of them, including a mini
SFRA-compatible `modules/server`.

## Limitations

- E4X XML literals (`var x = <a/>;`) are not supported by V8. Use `dw.io.XMLStreamReader` (its
  `readXMLObject()` returns an E4X-like object) or strings instead.
- WSDL web references (`webreferences2`) are not available; use an HTTP service.
- `dw.catalog.ProductSearchModel` is a straightforward in-memory search, not a Lucene index.
  Relevance is by search rank, phrase matching is substring based.
- FTP/SFTP need a transport supplied via `config.ftpTransport`.
- Sessions live in memory; restarting the server clears them.

## Development

```
npm test          # node:test suite over the fixture project
```

The runtime has no runtime dependencies. Source lives in `src/`: `loader.js` (module system),
`util/transform.js` (Rhino syntax), `isml/` (template engine), `http/` (dispatcher and server),
`pipelines/`, `jobs/`, `forms/` and one file per `dw.*` class under `src/dw/<package>/`.
