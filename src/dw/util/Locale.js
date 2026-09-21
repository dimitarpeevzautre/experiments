'use strict';
const { bean } = require('../../util/bean');
const LANGS = { en: 'English', de: 'German', fr: 'French', es: 'Spanish', it: 'Italian', ja: 'Japanese', zh: 'Chinese', nl: 'Dutch', pt: 'Portuguese', bg: 'Bulgarian', ru: 'Russian', pl: 'Polish', sv: 'Swedish', da: 'Danish', fi: 'Finnish', no: 'Norwegian', cs: 'Czech', tr: 'Turkish', ko: 'Korean', ar: 'Arabic', el: 'Greek', he: 'Hebrew', hu: 'Hungarian', ro: 'Romanian', th: 'Thai', uk: 'Ukrainian' };
class Locale {
  constructor(id) {
    const s = String(id || 'default');
    const parts = s.split(/[_-]/);
    this._id = s;
    this._lang = s === 'default' ? '' : parts[0];
    this._country = parts.length > 1 ? parts[1].toUpperCase() : '';
  }
  static getLocale(id) { return new Locale(id); }
  getID() { return this._id; }
  getLanguage() { return this._lang; }
  getCountry() { return this._country; }
  getVariant() { return ''; }
  getDisplayLanguage() { return LANGS[this._lang] || this._lang; }
  getDisplayCountry() { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(this._country) || this._country; } catch (e) { return this._country; } }
  getDisplayName() { return this._country ? `${this.getDisplayLanguage()} (${this.getDisplayCountry()})` : this.getDisplayLanguage(); }
  getISO3Country() { return this._country; }
  getISO3Language() { return this._lang; }
  toString() { return this._id; }
  equals(o) { return o instanceof Locale && o._id === this._id; }
}
module.exports = bean(Locale);
