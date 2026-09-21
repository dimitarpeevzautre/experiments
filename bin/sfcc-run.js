#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs');
const { createRuntime, loadConfig } = require('../src');

const HELP = `sfcc-run – run Salesforce Commerce Cloud cartridge code locally

Usage: sfcc-run <command> [options]

Commands:
  serve                         Start the storefront HTTP server
  request <Controller-Action>   Dispatch a single request and print the response
  run <file.js|file.ds>         Execute a script module and print its exports
  eval "<code>"                 Evaluate JavaScript with SFCC globals (dw, session, ...)
  render <template> [--pdict json]   Render an ISML template
  step <stepType|module> [--param k=v ...]   Run a job step
  job <jobID>                   Run a job definition (data/jobs.json or jobs.xml)
  pipeline <Name-Start>         Execute a legacy pipeline
  info                          Show discovered cartridges, cartridge path and data
  init                          Create sfcc-runtime.json and a data/ directory with samples

Options:
  --root <dir>            Project root(s) to scan for cartridges (repeatable)
  --cartridge-path a:b:c  Cartridge path (first wins)
  --site <id>             Site ID (default RefArch)
  --locale <id>           Locale (default from site)
  --data <dir>            Data directory with *.json files
  --port <n>              HTTP port (serve)
  --persist               Write data changes back to the data directory
  --log-level <lvl>       debug|info|warn|error
  --method POST --body "a=1&b=2"   Request method/body (request)
  --param k=v             Request/step parameter (repeatable)
`;

function parseArgs(argv) {
  const args = { _: [], params: {}, roots: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--param') { const [k, ...v] = argv[++i].split('='); args.params[k] = v.join('='); }
    else if (a === '--root') args.roots.push(argv[++i]);
    else if (a.startsWith('--')) { const k = a.slice(2); const next = argv[i + 1]; if (next === undefined || next.startsWith('--')) args[k] = true; else args[k] = argv[++i]; }
    else args._.push(a);
  }
  return args;
}

function makeRuntime(args, extra = {}) {
  const dir = process.cwd();
  const overrides = Object.assign({}, extra);
  if (args.roots.length) overrides.roots = args.roots.map((r) => path.resolve(r));
  if (args['cartridge-path']) overrides.cartridgePath = args['cartridge-path'];
  if (args.site) overrides.site = args.site;
  if (args.locale) overrides.locale = args.locale;
  if (args.data) overrides.dataDir = path.resolve(args.data);
  if (args.port) overrides.port = Number(args.port);
  if (args.persist) overrides.persist = true;
  if (args['log-level']) overrides.logLevel = args['log-level'];
  const cfg = loadConfig(args.config ? path.dirname(path.resolve(args.config)) : dir, overrides);
  return createRuntime(cfg);
}

function print(v) { if (v === undefined) return; if (typeof v === 'string') console.log(v); else console.log(JSON.stringify(v, (k, x) => (x && typeof x === 'object' && typeof x.toJSON === 'function' ? x.toJSON() : x), 2)); }

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  if (!cmd || cmd === 'help' || args.help) { console.log(HELP); return; }
  if (cmd === 'init') return init(args);
  const rt = makeRuntime(args, cmd === 'serve' ? {} : { quiet: !args.verbose });
  switch (cmd) {
    case 'info': {
      console.log(`Cartridges found: ${Object.keys(rt.cartridges).join(', ') || '(none)'}`);
      console.log(`Cartridge path:   ${rt.cartridgePath.map((c) => c.name).join(':') || '(empty)'}`);
      console.log(`Module roots:     ${rt.moduleRoots.join(', ') || '(none)'}`);
      console.log(`Site / locale:    ${rt.config.site} / ${rt.config.locale}`);
      console.log(`Data directory:   ${rt.store.dataDir || '(none)'} -> ${Object.keys(rt.store.data).join(', ') || 'no collections'}`);
      console.log(`Hooks:            ${rt.hooks.names().join(', ') || '(none)'}`);
      console.log(`dw packages:      ${Object.keys(rt.dw.packages).join(', ')}`);
      break;
    }
    case 'serve': {
      const server = rt.createServer();
      const addr = await server.listenAsync(rt.config.port, args.host);
      console.log(`SFCC runtime listening on http://localhost:${addr.port}/  (site ${rt.config.site}, cartridge path ${rt.cartridgePath.map((c) => c.name).join(':')})`);
      console.log(`Try http://localhost:${addr.port}/on/demandware.store/Sites-${rt.config.site}-Site/${rt.config.locale}/Home-Show`);
      break;
    }
    case 'request': {
      const target = args._[1];
      if (!target) throw new Error('request requires Controller-Action');
      const url = target.startsWith('/') ? target : `/on/demandware.store/Sites-${rt.config.site}-Site/${rt.config.locale}/${target}`;
      const qs = Object.entries(args.params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
      const r = rt.dispatch({ method: args.method || 'GET', url: qs && !args.body ? `${url}?${qs}` : url, body: args.body, headers: { 'content-type': args['content-type'] || 'application/x-www-form-urlencoded' } });
      console.error(`HTTP ${r.status} ${r.contentType}${r.redirect ? ' -> ' + r.redirect : ''}`);
      print(Buffer.isBuffer(r.body) ? r.body.toString('utf8') : r.body);
      break;
    }
    case 'run': { const exp = rt.runScript(args._[1]); print(exp); break; }
    case 'eval': { print(rt.eval(args._.slice(1).join(' '))); break; }
    case 'render': { const pdict = args.pdict ? JSON.parse(args.pdict) : {}; print(rt.renderTemplate(args._[1], pdict)); break; }
    case 'step': { const st = rt.runJobStep(args._[1], args.params); console.log(String(st)); process.exitCode = st.isError() ? 1 : 0; break; }
    case 'job': { const r = rt.runJob(args._[1], { parameters: args.params }); for (const s of r.steps) console.log(`${s.step}: ${s.status}`); console.log(`Job ${r.jobID}: ${r.status}`); process.exitCode = r.status === 'OK' ? 0 : 1; break; }
    case 'pipeline': { const r = rt.runPipeline(args._[1], args.params); if (r.rendered) print(r.rendered); console.error(`end: ${r.endName}`); break; }
    default: console.log(HELP); process.exitCode = 1;
  }
}

function init(args) {
  const dir = process.cwd();
  const cfgFile = path.join(dir, 'sfcc-runtime.json');
  if (!fs.existsSync(cfgFile)) fs.writeFileSync(cfgFile, JSON.stringify({ roots: ['.'], cartridgePath: null, site: 'RefArch', locale: 'default', dataDir: 'data', persist: false, port: 3000 }, null, 2));
  const data = path.join(dir, 'data');
  fs.mkdirSync(data, { recursive: true });
  const samples = {
    'sites.json': { RefArch: { name: 'Reference Architecture', defaultLocale: 'default', allowedLocales: ['default', 'en_US'], currencyCode: 'USD', allowedCurrencies: ['USD'], httpHostName: 'localhost:3000', timezone: 'UTC', catalog: 'storefront-catalog', priceBooks: ['usd-list', 'usd-sale'], preferences: { custom: {} } } },
    'categories.json': { root: { displayName: 'Storefront' }, mens: { displayName: 'Mens', parent: 'root' } },
    'products.json': { P0001: { name: 'Sample Shirt', shortDescription: 'A shirt', online: true, categories: ['mens'], master: true, variants: ['P0001-S', 'P0001-M'], variationAttributes: [{ ID: 'size', displayName: 'Size', values: [{ value: 'S', displayValue: 'Small' }, { value: 'M', displayValue: 'Medium' }] }] }, 'P0001-S': { masterID: 'P0001', variationValues: { size: 'S' } }, 'P0001-M': { masterID: 'P0001', variationValues: { size: 'M' } } },
    'pricebooks.json': { 'usd-list': { currencyCode: 'USD', prices: { 'P0001-S': 29.99, 'P0001-M': 29.99 } }, 'usd-sale': { currencyCode: 'USD', parent: 'usd-list', prices: { 'P0001-M': 24.99 } } },
    'inventory.json': { inventory_m: { default: true, records: { 'P0001-S': { ATS: 10, allocation: 10 }, 'P0001-M': { ATS: 5, allocation: 5 } } } },
    'shipping-methods.json': { '001': { displayName: 'Ground', default: true, cost: [{ threshold: 0, cost: 5.99 }, { threshold: 50, cost: 0 }] } },
    'tax.json': { policy: 'net', defaultTaxClassID: 'standard', defaultJurisdictionID: 'default', rates: { default: { standard: 0.07 } } },
    'customers.json': {},
    'custom-objects.json': {},
  };
  for (const [f, v] of Object.entries(samples)) { const p = path.join(data, f); if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(v, null, 2)); }
  console.log(`Created ${cfgFile} and sample data in ${data}`);
}

main().catch((e) => { console.error(e.stack || String(e)); process.exit(1); });
