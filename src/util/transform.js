'use strict';
/**
 * Source transforms that make Rhino-only syntax used in SFCC scripts parse in V8:
 *
 *   for each (var x in coll) {}            -> for (var x of __sfccIter(coll)) {}
 *   function f(a : String) : Number {}     -> function f(a) {}
 *   var x : dw.util.ArrayList = ...        -> var x = ...
 *   importPackage(dw.system);              -> var Logger = dw.system.Logger, ...;
 *   importClass(dw.system.Logger);         -> var Logger = dw.system.Logger;
 *   importScript("cartridge:path/f.ds");   -> (contents of that script inlined)
 */

const PUNCT = ['>>>=', '...', '===', '!==', '>>>', '<<=', '>>=', '**=', '&&=', '||=', '??=', '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>', '**'];

function tokenize(src) {
  const tokens = [];
  let i = 0;
  const n = src.length;
  let lastSig = null; // last significant token (for regex detection)
  const templateStack = [];
  const push = (type, start, end) => {
    const t = { type, value: src.slice(start, end), start, end };
    tokens.push(t);
    if (type !== 'ws' && type !== 'comment') lastSig = t;
    return t;
  };
  while (i < n) {
    const c = src[i];
    if (c === '\n' || c === '\r' || c === ' ' || c === '\t' || c === '\f' || c === '\v' || c === ' ') {
      let j = i + 1;
      while (j < n && /\s/.test(src[j])) j++;
      push('ws', i, j); i = j; continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      let j = src.indexOf('\n', i); if (j === -1) j = n;
      push('comment', i, j); i = j; continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      let j = src.indexOf('*/', i + 2); j = j === -1 ? n : j + 2;
      push('comment', i, j); i = j; continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === '\\') j++; if (src[j] === '\n') break; j++; }
      push('string', i, j + 1); i = j + 1; continue;
    }
    if (c === '`' || (c === '}' && templateStack.length && templateStack[templateStack.length - 1] === 0)) {
      // template literal (or continuation after `${ ... }`)
      let j = i + 1;
      if (c === '}') templateStack.pop();
      let inExpr = false;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '`') { j++; break; }
        if (src[j] === '$' && src[j + 1] === '{') { j += 2; inExpr = true; templateStack.push(0); break; }
        j++;
      }
      push('template', i, j); i = j;
      if (inExpr) { /* the expression tokens follow; braces tracked below */ }
      continue;
    }
    if (templateStack.length && (c === '{' || c === '}')) {
      templateStack[templateStack.length - 1] += c === '{' ? 1 : -1;
      if (templateStack[templateStack.length - 1] < 0) { templateStack[templateStack.length - 1] = 0; continue; }
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1]))) {
      let j = i + 1;
      while (j < n && /[0-9a-zA-Z_.]/.test(src[j])) j++;
      push('number', i, j); i = j; continue;
    }
    if (/[A-Za-z_$À-￿]/.test(c) || c === '#' || c === '@') {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_$À-￿]/.test(src[j])) j++;
      push('ident', i, j); i = j; continue;
    }
    if (c === '/') {
      const prev = lastSig;
      const regexAllowed = !prev || (prev.type === 'punct' && !/^[)\]}]$/.test(prev.value)) || (prev.type === 'ident' && /^(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/.test(prev.value));
      if (regexAllowed) {
        let j = i + 1; let inClass = false;
        while (j < n) {
          if (src[j] === '\\') { j += 2; continue; }
          if (src[j] === '[') inClass = true;
          else if (src[j] === ']') inClass = false;
          else if (src[j] === '/' && !inClass) break;
          else if (src[j] === '\n') break;
          j++;
        }
        j++;
        while (j < n && /[a-z]/.test(src[j])) j++;
        push('regex', i, j); i = j; continue;
      }
    }
    let matched = false;
    for (const p of PUNCT) {
      if (src.startsWith(p, i)) { push('punct', i, i + p.length); i += p.length; matched = true; break; }
    }
    if (matched) continue;
    push('punct', i, i + 1); i++;
  }
  return tokens;
}

function sigIndex(tokens, from, dir) {
  let i = from + dir;
  while (i >= 0 && i < tokens.length && (tokens[i].type === 'ws' || tokens[i].type === 'comment')) i += dir;
  return i >= 0 && i < tokens.length ? i : -1;
}

/** Remove tokens [from, to] inclusive plus surrounding whitespace collapse. */
function blank(tokens, from, to) {
  for (let i = from; i <= to; i++) tokens[i] = { type: 'ws', value: '', start: tokens[i].start, end: tokens[i].end };
}

/** Consume a type reference starting at index i (ident (. ident)*). Returns last index. */
function typeEnd(tokens, i) {
  if (i < 0 || tokens[i].type !== 'ident') return -1;
  let last = i;
  for (;;) {
    const dot = sigIndex(tokens, last, 1);
    if (dot === -1 || tokens[dot].value !== '.') break;
    const id = sigIndex(tokens, dot, 1);
    if (id === -1 || tokens[id].type !== 'ident') break;
    last = id;
  }
  // optional array suffix `[]`
  const br = sigIndex(tokens, last, 1);
  if (br !== -1 && tokens[br].value === '[') {
    const cl = sigIndex(tokens, br, 1);
    if (cl !== -1 && tokens[cl].value === ']') last = cl;
  }
  return last;
}

function transform(src, options = {}) {
  const { packages = {}, resolveImportScript = null, filename = '<script>', _seen = new Set() } = options;
  if (!/\bfor\s+each\b|:\s*[A-Za-z_$]|\bimport(Package|Class|Script)\s*\(/.test(src)) return src; // fast path
  const tokens = tokenize(src);
  const stack = []; // paren/brace stack entries: { ch, params: bool }
  let declState = null; // { depth } while inside var/let/const declaration
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'ws' || t.type === 'comment') continue;

    // ---- for each
    if (t.type === 'ident' && t.value === 'for') {
      const e = sigIndex(tokens, i, 1);
      if (e !== -1 && tokens[e].type === 'ident' && tokens[e].value === 'each') {
        const open = sigIndex(tokens, e, 1);
        if (open !== -1 && tokens[open].value === '(') {
          blank(tokens, e, e);
          // find matching close and top-level `in`
          let depth = 0; let inIdx = -1; let close = -1;
          for (let j = open; j < tokens.length; j++) {
            const v = tokens[j];
            if (v.type === 'punct') {
              if (v.value === '(' || v.value === '[' || v.value === '{') depth++;
              else if (v.value === ')' || v.value === ']' || v.value === '}') { depth--; if (depth === 0) { close = j; break; } }
            } else if (v.type === 'ident' && v.value === 'in' && depth === 1 && inIdx === -1) inIdx = j;
          }
          if (inIdx !== -1 && close !== -1) {
            tokens[inIdx] = { ...tokens[inIdx], value: 'of __sfccIter(' };
            tokens[close] = { ...tokens[close], value: '))' };
          }
        }
      }
    }

    // ---- importPackage / importClass / importScript
    if (t.type === 'ident' && /^import(Package|Class|Script)$/.test(t.value)) {
      const open = sigIndex(tokens, i, 1);
      if (open !== -1 && tokens[open].value === '(') {
        let depth = 0; let close = -1;
        for (let j = open; j < tokens.length; j++) {
          if (tokens[j].value === '(') depth++;
          else if (tokens[j].value === ')') { depth--; if (depth === 0) { close = j; break; } }
        }
        if (close !== -1) {
          const argTokens = tokens.slice(open + 1, close).filter((x) => x.type !== 'ws' && x.type !== 'comment');
          const arg = argTokens.map((x) => x.value).join('');
          let replacement = '';
          if (t.value === 'importPackage') {
            const pkg = arg.replace(/^dw\./, '');
            const classes = packages[pkg] || [];
            replacement = classes.length ? `var ${classes.map((c) => `${c} = dw.${pkg}.${c}`).join(', ')}` : `/* importPackage(${arg}) */`;
          } else if (t.value === 'importClass') {
            const cls = arg.split('.').pop();
            replacement = `var ${cls} = ${arg}`;
          } else if (t.value === 'importScript') {
            const spec = arg.replace(/^['"]|['"]$/g, '');
            if (resolveImportScript) {
              const resolved = resolveImportScript(spec, filename);
              if (resolved && !_seen.has(resolved.filename)) {
                const seen = new Set(_seen); seen.add(resolved.filename); seen.add(filename);
                const inner = transform(resolved.source, { ...options, filename: resolved.filename, _seen: seen });
                replacement = `/* importScript(${spec}) */\n${inner}\n/* end importScript(${spec}) */`;
              } else {
                replacement = `/* importScript(${spec}) skipped */`;
              }
            } else replacement = `__sfccImportScript(${arg})`;
          }
          blank(tokens, i, close);
          // swallow a following `;` for import statements that we replace with declarations
          tokens[i] = { type: 'ident', value: replacement, start: t.start, end: t.end };
          i = close;
          continue;
        }
      }
    }

    if (t.type === 'punct') {
      if (t.value === '(' || t.value === '[' || t.value === '{') {
        let params = false;
        if (t.value === '(') {
          const p = sigIndex(tokens, i, -1);
          if (p !== -1 && tokens[p].type === 'ident') {
            if (tokens[p].value === 'function' || tokens[p].value === 'catch') params = true;
            else {
              const pp = sigIndex(tokens, p, -1);
              if (pp !== -1 && tokens[pp].type === 'ident' && tokens[pp].value === 'function') params = true;
              // method shorthand / class members are not typed in Rhino
            }
          }
        }
        stack.push({ ch: t.value, params, declSaved: declState });
        if (t.value !== '(' ) declState = null;
        continue;
      }
      if (t.value === ')' || t.value === ']' || t.value === '}') {
        const ctx = stack.pop();
        if (ctx) {
          declState = ctx.declSaved;
          if (ctx.params && t.value === ')') {
            // return type annotation
            const colon = sigIndex(tokens, i, 1);
            if (colon !== -1 && tokens[colon].value === ':') {
              const typeStart = sigIndex(tokens, colon, 1);
              const end = typeEnd(tokens, typeStart);
              if (end !== -1) blank(tokens, colon, end);
            }
          }
        }
        continue;
      }
      if (t.value === ';') { declState = null; continue; }
      if (t.value === ':') {
        const prev = sigIndex(tokens, i, -1);
        const prevPrev = prev !== -1 ? sigIndex(tokens, prev, -1) : -1;
        const top = stack[stack.length - 1];
        let strip = false;
        if (prev !== -1 && tokens[prev].type === 'ident') {
          const pv = prevPrev !== -1 ? tokens[prevPrev] : null;
          if (top && top.params && top.ch === '(' && (!pv || pv.value === '(' || pv.value === ',' || pv.value === '...')) strip = true;
          else if (pv && pv.type === 'ident' && /^(var|let|const)$/.test(pv.value)) strip = true;
          else if (pv && pv.value === ',' && declState && declState.depth === stack.length) strip = true;
        }
        if (strip) {
          const typeStart = sigIndex(tokens, i, 1);
          const end = typeEnd(tokens, typeStart);
          if (end !== -1) blank(tokens, i, end);
        }
        continue;
      }
    }
    if (t.type === 'ident' && /^(var|let|const)$/.test(t.value)) {
      declState = { depth: stack.length };
    }
  }
  return tokens.map((t) => t.value).join('');
}

module.exports = { transform, tokenize };
