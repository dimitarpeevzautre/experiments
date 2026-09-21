'use strict';
/**
 * Small dependency-free XML parser producing a simple tree:
 *   { name, attrs: {}, children: [node|string], parent }
 * Good enough for form definitions, pipelines, job definitions and impex files.
 */
const ENTITIES = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };

function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|\w+);/g, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e] !== undefined ? ENTITIES[e] : m;
  });
}

function encodeEntities(s) {
  return String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
}

class XmlNode {
  constructor(name, attrs, parent) {
    this.name = name;
    this.attrs = attrs || {};
    this.children = [];
    this.parent = parent || null;
  }
  get localName() { return this.name.includes(':') ? this.name.split(':').pop() : this.name; }
  get elements() { return this.children.filter((c) => c instanceof XmlNode); }
  get text() {
    return this.children.map((c) => (typeof c === 'string' ? c : c.text)).join('');
  }
  attr(name, def) { return this.attrs[name] !== undefined ? this.attrs[name] : def; }
  child(name) { return this.elements.find((e) => e.name === name || e.localName === name) || null; }
  childText(name) { const c = this.child(name); return c ? c.text : null; }
  childrenNamed(name) { return this.elements.filter((e) => e.name === name || e.localName === name); }
  find(pred) {
    for (const e of this.elements) {
      if (pred(e)) return e;
      const r = e.find(pred);
      if (r) return r;
    }
    return null;
  }
  findAll(pred, out = []) {
    for (const e of this.elements) {
      if (pred(e)) out.push(e);
      e.findAll(pred, out);
    }
    return out;
  }
  toString(indent = '') {
    const a = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${encodeEntities(v)}"`).join('');
    if (!this.children.length) return `${indent}<${this.name}${a}/>`;
    if (this.children.every((c) => typeof c === 'string')) return `${indent}<${this.name}${a}>${encodeEntities(this.text)}</${this.name}>`;
    const inner = this.children.map((c) => (typeof c === 'string' ? (c.trim() ? indent + '  ' + encodeEntities(c.trim()) : '') : c.toString(indent + '  '))).filter(Boolean).join('\n');
    return `${indent}<${this.name}${a}>\n${inner}\n${indent}</${this.name}>`;
  }
}

function parse(xml, { keepWhitespace = false } = {}) {
  const root = new XmlNode('#document', {}, null);
  let cur = root;
  let i = 0;
  const n = xml.length;
  while (i < n) {
    const lt = xml.indexOf('<', i);
    if (lt === -1) { pushText(cur, xml.slice(i), keepWhitespace); break; }
    if (lt > i) pushText(cur, xml.slice(i, lt), keepWhitespace);
    if (xml.startsWith('<!--', lt)) {
      const end = xml.indexOf('-->', lt + 4);
      i = end === -1 ? n : end + 3;
      continue;
    }
    if (xml.startsWith('<![CDATA[', lt)) {
      const end = xml.indexOf(']]>', lt + 9);
      cur.children.push(xml.slice(lt + 9, end === -1 ? n : end));
      i = end === -1 ? n : end + 3;
      continue;
    }
    if (xml.startsWith('<?', lt)) {
      const end = xml.indexOf('?>', lt + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (xml.startsWith('<!', lt)) { // DOCTYPE etc.
      let depth = 0; let j = lt;
      for (; j < n; j++) {
        if (xml[j] === '[') depth++;
        else if (xml[j] === ']') depth--;
        else if (xml[j] === '>' && depth <= 0) break;
      }
      i = j + 1;
      continue;
    }
    if (xml[lt + 1] === '/') {
      const end = xml.indexOf('>', lt);
      const name = xml.slice(lt + 2, end).trim();
      // pop to matching element
      let p = cur;
      while (p && p !== root && p.name !== name) p = p.parent;
      cur = p && p !== root ? p.parent : cur;
      i = end + 1;
      continue;
    }
    // start tag
    let j = lt + 1;
    while (j < n && !/[\s/>]/.test(xml[j])) j++;
    const name = xml.slice(lt + 1, j);
    const attrs = {};
    let selfClosing = false;
    while (j < n) {
      while (j < n && /\s/.test(xml[j])) j++;
      if (xml[j] === '>') { j++; break; }
      if (xml[j] === '/' && xml[j + 1] === '>') { selfClosing = true; j += 2; break; }
      let k = j;
      while (k < n && !/[\s=/>]/.test(xml[k])) k++;
      const an = xml.slice(j, k);
      j = k;
      while (j < n && /\s/.test(xml[j])) j++;
      if (xml[j] === '=') {
        j++;
        while (j < n && /\s/.test(xml[j])) j++;
        const q = xml[j];
        if (q === '"' || q === "'") {
          const e = xml.indexOf(q, j + 1);
          attrs[an] = decodeEntities(xml.slice(j + 1, e === -1 ? n : e));
          j = e === -1 ? n : e + 1;
        } else {
          let e = j;
          while (e < n && !/[\s>]/.test(xml[e])) e++;
          attrs[an] = decodeEntities(xml.slice(j, e));
          j = e;
        }
      } else if (an) {
        attrs[an] = an;
      } else {
        j++;
      }
    }
    const node = new XmlNode(name, attrs, cur);
    cur.children.push(node);
    if (!selfClosing) cur = node;
    i = j;
  }
  return root;
}

function pushText(node, text, keepWhitespace) {
  if (!keepWhitespace && !text.trim()) return;
  node.children.push(decodeEntities(text));
}

module.exports = { parse, XmlNode, decodeEntities, encodeEntities };
