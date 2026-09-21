'use strict';
const rtRef = require('../../runtime');
const Content = require('./Content');
const Folder = require('./Folder');
const Library = require('./Library');
/** data/content.json: { assets: { id: {...} }, folders: { id: {...} } } */
const wrappers = new WeakMap();
function data(rt) { const d = rt.store.get('content', { assets: {}, folders: {} }); d.assets = d.assets || {}; d.folders = d.folders || {}; return d; }
function wrapContent(rt, d) { if (!d) return null; let c = wrappers.get(d); if (!c) { c = new Content(d, rt); wrappers.set(d, c); } return c; }
const ContentMgr = {
  _all() { const rt = rtRef.current(); return Object.entries(data(rt).assets).map(([id, d]) => { d.ID = d.ID || id; return wrapContent(rt, d); }); },
  _folders() { const rt = rtRef.current(); return Object.entries(data(rt).folders).map(([id, d]) => { d.ID = d.ID || id; return d; }); },
  getContent(a, b) { const rt = rtRef.current(); const id = b !== undefined ? b : a; const d = data(rt).assets[id]; if (d) d.ID = d.ID || id; return wrapContent(rt, d); },
  getFolder(a, b) { const rt = rtRef.current(); const id = b !== undefined ? b : a; if (id === 'root' && !data(rt).folders.root) return new Folder({ ID: 'root', displayName: 'Root', custom: {} }, rt); const d = data(rt).folders[id]; if (!d) return null; d.ID = d.ID || id; return new Folder(d, rt); },
  getSiteLibrary() { const rt = rtRef.current(); const Site = rt.dw.get('system/Site'); return new Library(rt.siteData() && rt.siteData().library || Site.getCurrent().getID()); },
  getLibrary(id) { return new Library(id); },
  PRIVATE_LIBRARY: 'PRIVATE_LIBRARY',
};
module.exports = ContentMgr;
