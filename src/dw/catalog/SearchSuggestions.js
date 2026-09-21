'use strict';
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
class SuggestedTerm { constructor(t, o) { this._t = t; this._o = o; } getValue() { return this._t; } getOriginalValue() { return this._o; } isCompleted() { return this._t.startsWith(this._o); } isCorrected() { return !this._t.startsWith(this._o); } isExactMatch() { return this._t === this._o; } }
bean(SuggestedTerm);
class SuggestedTerms { constructor(terms, original) { this._terms = terms.map((t) => new SuggestedTerm(t, original)); this._o = original; } getTerms() { return new ArrayList(this._terms); } getFirstTerm() { return this._terms[0] || null; } getOriginalTerm() { return this._o; } isEmpty() { return !this._terms.length; } }
bean(SuggestedTerms);
class SuggestedPhrase { constructor(p, exact) { this._p = p; this._e = !!exact; } getPhrase() { return this._p; } isExactMatch() { return this._e; } }
bean(SuggestedPhrase);
class SearchSuggestions {
  constructor(phrases, terms, original) { this._phrases = phrases; this._terms = new SuggestedTerms(terms, original); }
  getSuggestedPhrases() { return new ArrayList(this._phrases.map((p) => new SuggestedPhrase(p))).iterator(); }
  getSuggestedTerms() { return new ArrayList([this._terms]).iterator(); }
  hasSuggestions() { return this._phrases.length > 0 || !this._terms.isEmpty(); }
  getSuggestions() { return this.hasSuggestions(); }
}
SearchSuggestions.SuggestedTerm = SuggestedTerm; SearchSuggestions.SuggestedTerms = SuggestedTerms; SearchSuggestions.SuggestedPhrase = SuggestedPhrase;
module.exports = bean(SearchSuggestions);
