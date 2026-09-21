'use strict';
const D = require('./_data');
const ArrayList = require('../util/ArrayList');
const PriceBook = require('./PriceBook');
function all() { const books = D.rt().store.get('pricebooks', {}); return Object.entries(books).map(([id, d]) => { d.ID = d.ID || id; return D.wrap(d, PriceBook); }); }
const PriceBookMgr = {
  getAllPriceBooks() { return new ArrayList(all()); },
  getPriceBook(id) { return all().find((b) => b.getID() === id) || null; },
  getSitePriceBooks() { const site = D.rt().siteData() || {}; const ids = site.priceBooks; const books = all(); return new ArrayList(ids ? books.filter((b) => ids.includes(b.getID())) : books); },
  getApplicablePriceBooks() {
    const rt = D.rt();
    const s = rt.context.session;
    if (s && s._applicablePriceBooks) return new ArrayList(s._applicablePriceBooks.map((id) => PriceBookMgr.getPriceBook(id)).filter(Boolean));
    const cur = s ? s.getCurrency().getCurrencyCode() : 'USD';
    return new ArrayList(PriceBookMgr.getSitePriceBooks().toArray().filter((b) => b.getCurrencyCode() === cur && b.isOnline()));
  },
  setApplicablePriceBooks(...books) { const rt = D.rt(); const list = books.flat().map((b) => (b && b.getID ? b.getID() : b)); rt.context.session._applicablePriceBooks = list.length ? list : null; },
  assignPriceBookToSite(pb) { const site = D.rt().siteData(); if (site) { site.priceBooks = site.priceBooks || []; if (!site.priceBooks.includes(pb.getID())) site.priceBooks.push(pb.getID()); } },
  unassignPriceBookFromSite(pb) { const site = D.rt().siteData(); if (site && site.priceBooks) site.priceBooks = site.priceBooks.filter((id) => id !== pb.getID()); },
};
module.exports = PriceBookMgr;
