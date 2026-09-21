'use strict';
/**
 * Built-in pipelets for the pipeline interpreter. Each receives (ctx, config, io) where
 * `io.get(alias)` reads an input via key binding, `io.set(alias, value)` writes an output.
 * Return PIPELET_NEXT (1) or PIPELET_ERROR (0). Custom pipelets: runtime.pipelets[name] = fn.
 */
const fs = require('fs');
const path = require('path');

function evalExpr(rt, expr, dict) {
  const vm = require('vm');
  const keys = Object.keys(dict.toJSON ? dict.toJSON() : dict).filter((k) => /^[A-Za-z_$][\w$]*$/.test(k));
  const fn = vm.compileFunction(`return (${expr});`, ['pdict', 'dw', 'empty', 'request', 'session', 'customer', ...keys], { filename: '<pipeline-expr>' });
  return fn(dict, rt.dw.namespace, globalThis.empty, rt.context.request, rt.context.session, rt.context.customer, ...keys.map((k) => dict[k]));
}

const pipelets = {
  Script(ctx, cfg, io) {
    const rt = ctx.rt;
    const spec = cfg.ScriptFile;
    if (!spec) throw new Error('Script pipelet requires ScriptFile');
    let file = null;
    if (spec.includes(':')) { const [cart, rel] = spec.split(':'); const c = rt.cartridge(cart); if (c) file = path.join(c.dir, 'cartridge', 'scripts', rel); }
    else file = rt.findInCartridges(path.join('scripts', spec)) || (ctx.cartridge ? path.join(ctx.cartridge.dir, 'cartridge', 'scripts', spec) : null);
    if (!file || !fs.existsSync(file)) throw new Error(`Script not found: ${spec}`);
    const mod = rt.loader.load(file, rt.cartridgeOf(file));
    const fn = typeof mod === 'function' ? mod : mod.execute;
    if (typeof fn !== 'function') throw new Error(`Script ${spec} does not export execute()`);
    const view = io.view();
    const run = () => fn(view);
    const Transaction = rt.dw.get('system/Transaction');
    let result;
    try { result = String(cfg.Transactional) === 'true' ? Transaction.wrap(run) : run(); }
    catch (e) { if (String(cfg.OnError) === 'PIPELET_ERROR' || cfg.OnError === undefined) { rt.log('error', 'pipeline', `Script ${spec} failed: ${e.stack || e}`); io.writeBack(view); return 0; } throw e; }
    io.writeBack(view);
    return result === undefined ? 1 : result;
  },
  Assign(ctx, cfg, io) {
    for (let i = 0; i < 10; i++) {
      const fromKey = io.binding(`From_${i}`); const toKey = io.binding(`To_${i}`);
      if (!fromKey || !toKey) continue;
      let v;
      if (/^".*"$/.test(fromKey) || /^'.*'$/.test(fromKey)) v = fromKey.slice(1, -1);
      else if (/^-?\d+(\.\d+)?$/.test(fromKey)) v = Number(fromKey);
      else if (fromKey === 'true' || fromKey === 'false') v = fromKey === 'true';
      else if (fromKey === 'null') v = null;
      else if (/^[A-Za-z_$][\w$.]*$/.test(fromKey)) v = fromKey.split('.').reduce((o, k) => (o == null ? o : o[k]), ctx.dict);
      else v = evalExpr(ctx.rt, fromKey, ctx.dict);
      ctx.dict[toKey] = v;
    }
    return 1;
  },
  Eval(ctx, cfg, io) { const expr = cfg.Expression || io.binding('Expression'); const v = evalExpr(ctx.rt, expr, ctx.dict); io.set('Result', v); return 1; },
  GetBasket(ctx, cfg, io) { const B = ctx.rt.dw.get('order/BasketMgr'); const b = String(cfg.Create) === 'true' ? B.getCurrentOrNewBasket() : B.getCurrentBasket(); io.set('Basket', b); return b ? 1 : 0; },
  CreateBasket(ctx, cfg, io) { const B = ctx.rt.dw.get('order/BasketMgr'); io.set('Basket', B.getCurrentOrNewBasket()); return 1; },
  GetProduct(ctx, cfg, io) { const PM = ctx.rt.dw.get('catalog/ProductMgr'); const p = PM.getProduct(io.get('ProductID')); io.set('Product', p); return p ? 1 : 0; },
  GetCategory(ctx, cfg, io) { const CM = ctx.rt.dw.get('catalog/CatalogMgr'); const c = CM.getCategory(io.get('CategoryID')); io.set('Category', c); return c ? 1 : 0; },
  GetContent(ctx, cfg, io) { const CM = ctx.rt.dw.get('content/ContentMgr'); const c = CM.getContent(io.get('ContentID')); io.set('Content', c); return c ? 1 : 0; },
  GetCustomer(ctx, cfg, io) { const CM = ctx.rt.dw.get('customer/CustomerMgr'); const c = io.get('CustomerNo') ? CM.getCustomerByCustomerNumber(io.get('CustomerNo')) : CM.getCustomerByLogin(io.get('Login')); io.set('Customer', c); return c ? 1 : 0; },
  GetOrder(ctx, cfg, io) { const OM = ctx.rt.dw.get('order/OrderMgr'); const o = OM.getOrder(io.get('OrderNo')); io.set('Order', o); return o ? 1 : 0; },
  Redirect(ctx, cfg, io) { const loc = io.get('Location') || cfg.Location; ctx.rt.context.response.redirect(String(loc)); ctx.redirected = true; return 1; },
  SearchRedirectURL(ctx, cfg, io) { io.set('Location', null); return 0; },
  ClearFormElement(ctx, cfg, io) { const f = io.get('FormElement'); if (f) f.clearFormElement(); return 1; },
  InvalidateFormElement(ctx, cfg, io) { const f = io.get('FormElement'); if (f) f.invalidateFormElement(); return 1; },
  UpdateFormWithObject(ctx, cfg, io) { const f = io.get('Form'); const o = io.get('Object'); if (f && o) f.copyFrom(o); if (String(cfg.Clear) === 'true' && f) f.clearFormElement(); return 1; },
  UpdateObjectWithForm(ctx, cfg, io) { const f = io.get('Form'); const o = io.get('Object'); if (f && o) f.copyTo(o); return 1; },
  SetFormOptions(ctx, cfg, io) { const f = io.get('FormField'); const opts = io.get('Options'); if (f && opts) f.setOptions(opts && opts.iterator ? opts.iterator() : opts); return 1; },
  Pipelet(ctx, cfg, io) { return 1; },
  Join() { return 1; },
  LoginCustomer(ctx, cfg, io) { const CM = ctx.rt.dw.get('customer/CustomerMgr'); const c = CM.loginCustomer(io.get('Login'), io.get('Password'), String(io.get('RememberMe')) === 'true'); io.set('Customer', c); return c ? 1 : 0; },
  LogoutCustomer(ctx) { ctx.rt.dw.get('customer/CustomerMgr').logoutCustomer(false); return 1; },
  CreateCustomer(ctx, cfg, io) { const CM = ctx.rt.dw.get('customer/CustomerMgr'); try { io.set('Customer', CM.createCustomer(io.get('Login'), io.get('Password'), io.get('CustomerNo') || undefined)); return 1; } catch (e) { return 0; } },
  AddProductToBasket(ctx, cfg, io) { const b = io.get('Basket'); const p = io.get('Product'); if (!b || !p) return 0; const pli = b.createProductLineItem(p, io.get('ProductOptionModel') || undefined, io.get('Shipment') || undefined); const q = io.get('Quantity'); if (q) pli.setQuantityValue(Number(q.getValue ? q.getValue() : q)); io.set('ProductLineItem', pli); return 1; },
  RemoveProductLineItem(ctx, cfg, io) { const b = io.get('Basket'); const pli = io.get('ProductLineItem'); if (!b || !pli) return 0; b.removeProductLineItem(pli); return 1; },
  Calculate(ctx, cfg, io) { const b = io.get('Basket'); if (!b) return 0; ctx.rt.calculateBasket(b); return 1; },
  CalculateTax(ctx, cfg, io) { const b = io.get('Basket'); if (!b) return 0; ctx.rt.calculateBasket(b); return 1; },
  CreateOrder(ctx, cfg, io) { const OM = ctx.rt.dw.get('order/OrderMgr'); const b = io.get('Basket'); try { io.set('Order', OM.createOrder(b, io.get('OrderNo') || undefined)); return 1; } catch (e) { io.set('ErrorMessage', e.message); return 0; } },
  CreateOrder2: null,
  PlaceOrder(ctx, cfg, io) { const OM = ctx.rt.dw.get('order/OrderMgr'); const s = OM.placeOrder(io.get('Order')); return s.isError() ? 0 : 1; },
  FailOrder(ctx, cfg, io) { const OM = ctx.rt.dw.get('order/OrderMgr'); OM.failOrder(io.get('Order'), true); return 1; },
  Search(ctx, cfg, io) { const PSM = ctx.rt.dw.get('catalog/ProductSearchModel'); const m = PSM._fromParams(ctx.rt.context.request.getHttpParameterMap()); m.search(); io.set('ProductSearchResult', m); return 1; },
  Paging(ctx, cfg, io) { const PM = ctx.rt.dw.get('web/PagingModel'); const objs = io.get('Objects'); const pm = new PM(objs && objs.iterator ? objs.iterator() : objs, io.get('Count') || undefined); const sz = io.get('PageSize'); if (sz) pm.setPageSize(Number(sz)); const st = io.get('Start'); if (st) pm.setStart(Number(st)); io.set('PagingModel', pm); return 1; },
  SendMail(ctx, cfg, io) { const Mail = ctx.rt.dw.get('net/Mail'); const m = new Mail(); m.addTo(io.get('MailTo')); m.setFrom(io.get('MailFrom')); m.setSubject(io.get('MailSubject')); const tpl = io.get('MailTemplate'); if (tpl) m.setContent(ctx.rt.isml.renderTemplate(String(tpl), ctx.dict), 'text/html', 'UTF-8'); return m.send().isError() ? 0 : 1; },
  GetShippingMethods(ctx, cfg, io) { const SM = ctx.rt.dw.get('order/ShippingMgr'); io.set('ShippingMethods', SM.getAllShippingMethods()); return 1; },
  GetApplicablePaymentMethods(ctx, cfg, io) { const PM = ctx.rt.dw.get('order/PaymentMgr'); io.set('PaymentMethods', PM.getApplicablePaymentMethods(ctx.rt.context.customer, null, null)); return 1; },
};
delete pipelets.CreateOrder2;
module.exports = { pipelets, evalExpr };
