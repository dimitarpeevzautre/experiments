'use strict';
const fs = require('fs');
const path = require('path');
const { parse } = require('../util/xml');

/**
 * Job framework: step types from each cartridge's steptypes.json, job definitions from
 * data/jobs.json or an impex jobs.xml. Supports script-module steps (execute) and
 * chunk-oriented steps (before-step/read/process/write/after-step/total-count).
 */
function loadStepTypes(rt) {
  const types = {};
  for (const cart of rt.cartridgePath.slice().reverse()) {
    for (const f of ['steptypes.json', 'steps-types.json']) {
      const file = path.join(cart.dir, f);
      if (!fs.existsSync(file)) continue;
      let def; try { def = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { rt.log('warn', 'jobs', `Cannot parse ${file}: ${e.message}`); continue; }
      const st = def['step-types'] || def;
      for (const s of st['script-module-step'] || []) types[s['@type-id']] = Object.assign({ kind: 'script', cartridge: cart }, s);
      for (const s of st['chunk-script-module-step'] || []) types[s['@type-id']] = Object.assign({ kind: 'chunk', cartridge: cart }, s);
    }
  }
  return types;
}

class StepExecution {
  constructor(job, step, params) { this._job = job; this._step = step; this._params = params; this._exitStatus = null; }
  getJobExecution() { return this._job; }
  getStepTypeID() { return this._step.type; }
  getID() { return this._step.id; }
  getParameterValue(name) { const v = this._params[name]; return v === undefined ? null : v; }
  getExitStatus() { return this._exitStatus; }
  getStatus() { return this._status || null; }
  getStartTime() { return this._start || null; }
  getEndTime() { return this._end || null; }
}
class JobExecution {
  constructor(id, context) { this._id = id; this._ctx = context || {}; this._start = new Date(); }
  getJobID() { return this._id; }
  getID() { return `${this._id}-${this._start.getTime()}`; }
  getContext() { return this._ctx; }
  getStartTime() { return this._start; }
  getEndTime() { return this._end || null; }
  getStatus() { return this._status || 'RUNNING'; }
  getExitStatus() { return this._exit || null; }
  getExecutionMode() { return 'MANUAL'; }
}

function resolveModule(rt, type, moduleSpec) {
  if (!moduleSpec) throw new Error(`Step type ${type ? type['@type-id'] : '?'} has no module`);
  const cart = type && type.cartridge;
  const candidates = [];
  if (cart) { candidates.push(path.join(cart.dir, moduleSpec)); const m = moduleSpec.replace(/^(\.\/)?cartridge\//, ''); candidates.push(path.join(cart.dir, 'cartridge', m)); }
  for (const c of rt.cartridgePath) { candidates.push(path.join(c.dir, moduleSpec), path.join(c.dir, 'cartridge', moduleSpec.replace(/^(\.\/)?cartridge\//, ''))); }
  candidates.push(path.resolve(moduleSpec));
  const { tryFile } = require('../loader');
  for (const c of candidates) { const f = tryFile(c); if (f) return rt.loader.load(f, rt.cartridgeOf(f)); }
  // bare module path like "app/cartridge/scripts/steps/x" or "*/cartridge/..."
  return rt.require(moduleSpec);
}

/** Run one step: `spec` is a step-type id, a module path, or { type, module, function, parameters }. */
function runStep(rt, spec, params = {}, opts = {}) {
  const Status = rt.dw.get('system/Status');
  const types = loadStepTypes(rt);
  let type = null; let moduleSpec; let fnName = 'execute'; let stepDef;
  if (typeof spec === 'object') { stepDef = spec; type = types[spec.type] || null; moduleSpec = spec.module || (type && type.module); fnName = spec.function || (type && type.function) || 'execute'; params = Object.assign({}, type && defaults(type), spec.parameters || {}, params); }
  else if (types[spec]) { type = types[spec]; moduleSpec = type.module; fnName = type.function || 'execute'; params = Object.assign({}, defaults(type), params); stepDef = { id: spec, type: spec }; }
  else { moduleSpec = spec; stepDef = { id: path.basename(String(spec)), type: 'custom.inline' }; }
  const mod = resolveModule(rt, type, moduleSpec);
  const job = opts.jobExecution || new JobExecution(opts.jobID || 'manual', opts.context || {});
  const se = new StepExecution(job, stepDef, params);
  se._start = new Date();
  const Transaction = rt.dw.get('system/Transaction');
  let status;
  const ctx = rt.createScriptContext();
  rt.withContext(ctx, () => {
    try {
      if ((type && type.kind === 'chunk') || (typeof mod[fnName] !== 'function' && typeof mod.read === 'function')) status = runChunk(rt, mod, type || {}, params, se, Status, opts);
      else {
        if (typeof mod[fnName] !== 'function') throw new Error(`Step module has no function '${fnName}'`);
        const r = Transaction.wrap(() => mod[fnName](params, se));
        status = r instanceof Status ? r : new Status(Status.OK, r == null ? 'OK' : String(r));
      }
    } catch (e) {
      rt.log('error', 'jobs', `Step ${stepDef.id} failed: ${e.stack || e}`);
      status = new Status(Status.ERROR, 'ERROR', e.message || String(e));
    }
  });
  rt.store.flush();
  se._end = new Date(); se._exitStatus = status; se._status = status.isError() ? 'ERROR' : 'OK';
  return status;
}
function defaults(type) { const out = {}; const p = type.parameters && type.parameters.parameter; for (const d of p || []) if (d['@name'] && d['default-value'] !== undefined) out[d['@name']] = d['default-value']; return out; }

function runChunk(rt, mod, type, params, se, Status, opts) {
  const Transaction = rt.dw.get('system/Transaction');
  const fn = (key, dflt) => { const n = type[key] || dflt; return typeof mod[n] === 'function' ? mod[n].bind(mod) : null; };
  const before = fn('before-step-function', 'beforeStep'); const read = fn('read-function', 'read'); const process = fn('process-function', 'process'); const write = fn('write-function', 'write'); const after = fn('after-step-function', 'afterStep'); const total = fn('total-count-function', 'getTotalCount'); const beforeChunk = fn('before-chunk-function', 'beforeChunk'); const afterChunk = fn('after-chunk-function', 'afterChunk');
  const size = Number((params && params.chunkSize) || type['chunk-size'] || opts.chunkSize || 100);
  if (!read || !process || !write) throw new Error('Chunk step requires read, process and write functions');
  if (before) before(params, se);
  if (total) se._total = total(params, se);
  let success = true; let processed = 0;
  try {
    for (;;) {
      const chunk = [];
      if (beforeChunk) beforeChunk(params, se);
      let item;
      while (chunk.length < size && (item = read(params, se)) != null) { const out = process(item, params, se); if (out != null) chunk.push(out); }
      const done = item == null;
      if (chunk.length) { const List = rt.dw.get('util/ArrayList'); Transaction.wrap(() => write(new List(chunk), params, se)); processed += chunk.length; }
      if (afterChunk) afterChunk(params, se);
      if (done) break;
    }
  } catch (e) { success = false; if (after) after(false, params, se); throw e; }
  if (after) after(success, params, se);
  return new Status(Status.OK, 'OK', `${processed} items processed`);
}

/** Load job definitions: data/jobs.json { id: { steps: [...] } } and/or dataDir/jobs.xml */
function loadJobs(rt) {
  const jobs = Object.assign({}, rt.store.get('jobs', {}));
  const dd = rt.store.dataDir;
  if (dd) for (const f of ['jobs.xml', path.join('impex', 'jobs.xml')]) {
    const file = path.join(dd, f);
    if (!fs.existsSync(file)) continue;
    const doc = parse(fs.readFileSync(file, 'utf8'));
    for (const j of doc.findAll((e) => e.localName === 'job')) {
      const steps = j.findAll((e) => e.localName === 'step').map((s) => { const params = {}; for (const p of s.findAll((e) => e.localName === 'parameter')) params[p.attr('name')] = p.text; return { id: s.attr('step-id'), type: s.attr('type'), parameters: params, enforceRestart: s.attr('enforce-restart') === 'true' }; });
      jobs[j.attr('job-id')] = { steps, description: j.childText('description') };
    }
  }
  return jobs;
}

function runJob(rt, jobID, opts = {}) {
  const Status = rt.dw.get('system/Status');
  const jobs = loadJobs(rt);
  const job = jobs[jobID];
  if (!job) throw new Error(`Job '${jobID}' not found (define it in data/jobs.json or jobs.xml)`);
  const exec = new JobExecution(jobID, opts.context || {});
  const results = [];
  for (const step of job.steps || []) {
    rt.log('info', 'jobs', `Job ${jobID}: running step ${step.id} (${step.type})`);
    const st = runStep(rt, step, Object.assign({}, step.parameters, opts.parameters || {}), { jobExecution: exec, jobID });
    results.push({ step: step.id, status: st });
    rt.log(st.isError() ? 'error' : 'info', 'jobs', `Job ${jobID}: step ${step.id} -> ${st}`);
    if (st.isError() && !opts.continueOnError) break;
  }
  exec._end = new Date(); exec._status = results.some((r) => r.status.isError()) ? 'ERROR' : 'OK';
  return { jobID, status: exec._status, steps: results, execution: exec };
}

module.exports = { runStep, runJob, loadStepTypes, loadJobs, StepExecution, JobExecution };
