'use strict';
const { bean } = require('../../util/bean');
const C = require('./XMLStreamConstants');
const { parse, XmlNode } = require('../../util/xml');
/** StAX-like pull reader built on the tree parser (documents fit in memory). */
class XMLStreamReader {
  constructor(reader) {
    const text = typeof reader === 'string' ? reader : reader.readString();
    this._events = [];
    this._events.push({ type: C.START_DOCUMENT });
    const doc = parse(text, { keepWhitespace: true });
    const walk = (n) => { for (const c of n.children) { if (typeof c === 'string') this._events.push({ type: c.trim() ? C.CHARACTERS : C.SPACE, text: c }); else { this._events.push({ type: C.START_ELEMENT, node: c }); walk(c); this._events.push({ type: C.END_ELEMENT, node: c }); } } };
    walk(doc);
    this._events.push({ type: C.END_DOCUMENT });
    this._i = 0;
  }
  _cur() { return this._events[this._i] || { type: C.END_DOCUMENT }; }
  hasNext() { return this._i < this._events.length - 1; }
  next() { if (!this.hasNext()) throw new Error('XMLStreamException: no more events'); this._i++; return this._cur().type; }
  nextTag() { while (this.hasNext()) { const t = this.next(); if (t === C.START_ELEMENT || t === C.END_ELEMENT) return t; } throw new Error('XMLStreamException: no tag'); }
  getEventType() { return this._cur().type; }
  isStartElement() { return this._cur().type === C.START_ELEMENT; }
  isEndElement() { return this._cur().type === C.END_ELEMENT; }
  isCharacters() { return this._cur().type === C.CHARACTERS; }
  isWhiteSpace() { return this._cur().type === C.SPACE; }
  hasName() { return !!this._cur().node; }
  hasText() { return this._cur().text !== undefined; }
  getLocalName() { const n = this._cur().node; if (!n) throw new Error('Not an element event'); return n.localName; }
  getName() { const n = this._cur().node; return n ? n.name : null; }
  getPrefix() { const n = this._cur().node; return n && n.name.includes(':') ? n.name.split(':')[0] : ''; }
  getNamespaceURI() { const n = this._cur().node; if (!n) return null; const pfx = this.getPrefix(); let p = n; while (p) { const v = p.attrs[pfx ? `xmlns:${pfx}` : 'xmlns']; if (v) return v; p = p.parent; } return null; }
  getText() { return this._cur().text || ''; }
  getTextCharacters() { return this.getText(); }
  getAttributeCount() { const n = this._cur().node; return n ? Object.keys(n.attrs).length : 0; }
  getAttributeLocalName(i) { const k = Object.keys(this._cur().node.attrs)[i]; return k.includes(':') ? k.split(':').pop() : k; }
  getAttributeName(i) { return Object.keys(this._cur().node.attrs)[i]; }
  getAttributeValue(a, b) { const n = this._cur().node; if (!n) return null; if (typeof a === 'number') return Object.values(n.attrs)[a]; const name = b !== undefined ? b : a; if (n.attrs[name] !== undefined) return n.attrs[name]; const k = Object.keys(n.attrs).find((x) => x.split(':').pop() === name); return k !== undefined ? n.attrs[k] : null; }
  getAttributePrefix() { return ''; }
  getElementText() {
    if (!this.isStartElement()) throw new Error('XMLStreamException: getElementText requires START_ELEMENT');
    const node = this._cur().node; let text = '';
    while (this.hasNext()) { const t = this.next(); const e = this._cur(); if (t === C.END_ELEMENT && e.node === node) break; if (t === C.CHARACTERS || t === C.SPACE || t === C.CDATA) text += e.text; else if (t === C.START_ELEMENT) throw new Error('XMLStreamException: element text contains child elements'); }
    return text;
  }
  /** Returns the current element as an XmlNode (in place of E4X XML) and moves to its END_ELEMENT. */
  getXMLObjectByStreamReader() { return this.readXMLObject(); }
  readXMLObject() { if (!this.isStartElement()) throw new Error('readXMLObject requires START_ELEMENT'); const node = this._cur().node; while (this.hasNext()) { this.next(); const e = this._cur(); if (e.type === C.END_ELEMENT && e.node === node) break; } return xmlObject(node); }
  getXMLObject() { return this.readXMLObject(); }
  close() { this._i = this._events.length - 1; }
  getEncoding() { return 'UTF-8'; }
  getVersion() { return '1.0'; }
  standaloneSet() { return false; }
  isStandalone() { return false; }
  getCharacterEncodingScheme() { return 'UTF-8'; }
  getNamespaceCount() { return 0; }
  getNamespacePrefix() { return null; }
  getPITarget() { return null; } getPIData() { return null; }
  require(type, ns, name) { if (this.getEventType() !== type) throw new Error('XMLStreamException: unexpected event'); }
}
/** Lightweight E4X-ish view: xml.child, xml.@attr via attribute(), xml.toString() */
function xmlObject(node) {
  const obj = new Proxy(node, {
    get(t, k) {
      if (typeof k === 'symbol') return t[k];
      if (k.startsWith('@')) return t.attrs[k.slice(1)];
      const kidsFirst = t.childrenNamed(k);
      if (kidsFirst.length === 1) return xmlObject(kidsFirst[0]);
      if (kidsFirst.length > 1) return kidsFirst.map(xmlObject);
      if (k in t) { const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; }
      if (k === 'attribute') return (n) => t.attrs[n];
      if (k === 'children') return () => t.elements.map(xmlObject);
      if (k === 'child') return (n) => t.childrenNamed(n).map(xmlObject);
      if (k === 'length') return () => 1;
      if (k === 'toXMLString') return () => t.toString();
      if (k.startsWith('@')) return t.attrs[k.slice(1)];
      const kids = t.childrenNamed(k);
      if (kids.length === 1) return xmlObject(kids[0]);
      if (kids.length > 1) return kids.map(xmlObject);
      return undefined;
    },
  });
  return obj;
}
XMLStreamReader.xmlObject = xmlObject;
module.exports = bean(XMLStreamReader);
