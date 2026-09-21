'use strict';
const { bean } = require('../../util/bean');
const F = { ERA: 0, YEAR: 1, MONTH: 2, WEEK_OF_YEAR: 3, WEEK_OF_MONTH: 4, DATE: 5, DAY_OF_MONTH: 5, DAY_OF_YEAR: 6, DAY_OF_WEEK: 7, DAY_OF_WEEK_IN_MONTH: 8, AM_PM: 9, HOUR: 10, HOUR_OF_DAY: 11, MINUTE: 12, SECOND: 13, MILLISECOND: 14, ZONE_OFFSET: 15, DST_OFFSET: 16 };
const DAYS = { SUNDAY: 1, MONDAY: 2, TUESDAY: 3, WEDNESDAY: 4, THURSDAY: 5, FRIDAY: 6, SATURDAY: 7 };
const MONTHS = { JANUARY: 0, FEBRUARY: 1, MARCH: 2, APRIL: 3, MAY: 4, JUNE: 5, JULY: 6, AUGUST: 7, SEPTEMBER: 8, OCTOBER: 9, NOVEMBER: 10, DECEMBER: 11 };
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

class Calendar {
  constructor(date) {
    this._d = date instanceof Date ? new Date(date.getTime()) : date instanceof Calendar ? new Date(date._d.getTime()) : date != null ? new Date(date) : new Date();
    this._tz = 'UTC';
    this._firstDayOfWeek = DAYS.SUNDAY;
  }
  getTime() { return new Date(this._d.getTime()); }
  setTime(d) { this._d = new Date(d instanceof Date ? d.getTime() : d); }
  getTimeZone() { return this._tz; }
  setTimeZone(tz) { this._tz = tz; }
  getFirstDayOfWeek() { return this._firstDayOfWeek; }
  setFirstDayOfWeek(d) { this._firstDayOfWeek = d; }
  _parts() { return dateParts(this._d, this._tz); }
  get(field) {
    const p = this._parts();
    switch (field) {
      case F.YEAR: return p.year;
      case F.MONTH: return p.month;
      case F.DAY_OF_MONTH: return p.day;
      case F.DAY_OF_WEEK: return p.weekday + 1;
      case F.HOUR_OF_DAY: return p.hour;
      case F.HOUR: return p.hour % 12;
      case F.AM_PM: return p.hour >= 12 ? 1 : 0;
      case F.MINUTE: return p.minute;
      case F.SECOND: return p.second;
      case F.MILLISECOND: return this._d.getUTCMilliseconds();
      case F.DAY_OF_YEAR: return Math.floor((Date.UTC(p.year, p.month, p.day) - Date.UTC(p.year, 0, 1)) / 86400000) + 1;
      case F.WEEK_OF_YEAR: { const doy = this.get(F.DAY_OF_YEAR); const jan1 = new Date(Date.UTC(p.year, 0, 1)).getUTCDay(); return Math.floor((doy + jan1 - 1) / 7) + 1; }
      case F.WEEK_OF_MONTH: { const first = new Date(Date.UTC(p.year, p.month, 1)).getUTCDay(); return Math.floor((p.day + first - 1) / 7) + 1; }
      case F.DAY_OF_WEEK_IN_MONTH: return Math.floor((p.day - 1) / 7) + 1;
      case F.ERA: return 1;
      case F.ZONE_OFFSET: return tzOffsetMs(this._d, this._tz);
      case F.DST_OFFSET: return 0;
      default: throw new Error(`Unsupported calendar field ${field}`);
    }
  }
  set(field, value, ...rest) {
    if (rest.length >= 1 && typeof field === 'number' && typeof value === 'number' && (rest.length === 1 || rest.length === 3 || rest.length === 4)) {
      // set(year, month, date[, hour, minute[, second]])
      const [date, hour = 0, minute = 0, second = 0] = rest;
      const p = this._parts();
      this._fromParts({ ...p, year: field, month: value, day: date, hour: rest.length > 1 ? hour : p.hour, minute: rest.length > 1 ? minute : p.minute, second: rest.length > 3 ? second : p.second });
      return;
    }
    const p = this._parts();
    switch (field) {
      case F.YEAR: p.year = value; break;
      case F.MONTH: p.month = value; break;
      case F.DAY_OF_MONTH: p.day = value; break;
      case F.HOUR_OF_DAY: p.hour = value; break;
      case F.HOUR: p.hour = (p.hour >= 12 ? 12 : 0) + value; break;
      case F.MINUTE: p.minute = value; break;
      case F.SECOND: p.second = value; break;
      case F.MILLISECOND: this._d.setUTCMilliseconds(value); return;
      case F.DAY_OF_WEEK: p.day += value - 1 - p.weekday; break;
      case F.DAY_OF_YEAR: p.month = 0; p.day = value; break;
      case F.AM_PM: p.hour = (p.hour % 12) + (value ? 12 : 0); break;
      default: throw new Error(`Unsupported calendar field ${field}`);
    }
    this._fromParts(p);
  }
  _fromParts(p) {
    const ms = this._d.getUTCMilliseconds();
    const utc = Date.UTC(p.year, p.month, p.day, p.hour, p.minute, p.second, ms);
    // adjust for timezone offset at that instant
    let d = new Date(utc);
    const off = tzOffsetMs(d, this._tz);
    d = new Date(utc - off);
    const off2 = tzOffsetMs(d, this._tz);
    if (off2 !== off) d = new Date(utc - off2);
    this._d = d;
  }
  add(field, amount) {
    switch (field) {
      case F.YEAR: this.set(F.YEAR, this.get(F.YEAR) + amount); return;
      case F.MONTH: { const p = this._parts(); p.month += amount; this._fromParts(p); return; }
      case F.DAY_OF_MONTH: case F.DAY_OF_YEAR: case F.DAY_OF_WEEK: case F.DATE: { const p = this._parts(); p.day += amount; this._fromParts(p); return; }
      case F.WEEK_OF_YEAR: case F.WEEK_OF_MONTH: { const p = this._parts(); p.day += amount * 7; this._fromParts(p); return; }
      case F.HOUR: case F.HOUR_OF_DAY: this._d = new Date(this._d.getTime() + amount * 3600000); return;
      case F.MINUTE: this._d = new Date(this._d.getTime() + amount * 60000); return;
      case F.SECOND: this._d = new Date(this._d.getTime() + amount * 1000); return;
      case F.MILLISECOND: this._d = new Date(this._d.getTime() + amount); return;
      default: throw new Error(`Unsupported calendar field ${field}`);
    }
  }
  roll(field, amount) { this.add(field, typeof amount === 'boolean' ? (amount ? 1 : -1) : amount); }
  before(o) { return this._d.getTime() < o._d.getTime(); }
  after(o) { return this._d.getTime() > o._d.getTime(); }
  compareTo(o) { return this._d.getTime() - o._d.getTime(); }
  equals(o) { return o instanceof Calendar && o._d.getTime() === this._d.getTime(); }
  hashCode() { return String(this._d.getTime()); }
  isSameDay(o) { const a = this._parts(); const b = dateParts(o._d, this._tz); return a.year === b.year && a.month === b.month && a.day === b.day; }
  isSameDayByTimestamp(o) { return this.isSameDay(o); }
  isLeapYear(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  getActualMaximum(field) { const p = this._parts(); if (field === F.DAY_OF_MONTH) return new Date(Date.UTC(p.year, p.month + 1, 0)).getUTCDate(); if (field === F.DAY_OF_YEAR) return this.isLeapYear(p.year) ? 366 : 365; if (field === F.MONTH) return 11; if (field === F.HOUR_OF_DAY) return 23; if (field === F.MINUTE || field === F.SECOND) return 59; return 0; }
  getActualMinimum(field) { return field === F.DAY_OF_MONTH || field === F.DAY_OF_YEAR ? 1 : 0; }
  getMaxDate() { return new Date(8640000000000000); }
  clear() { this._d = new Date(0); }
  parseByFormat(str, pattern) { this._d = Calendar.parse(str, pattern, this._tz); }
  parseByLocale(str, locale, style) { this._d = new Date(str); }
  toString() { return Calendar.format(this._d, "yyyy-MM-dd'T'HH:mm:ss.SSSZ", this._tz); }
  toJSON() { return this._d.toISOString(); }
  valueOf() { return this._d.getTime(); }

  static format(date, pattern, tz = 'UTC', locale) {
    if (!(date instanceof Date)) date = new Date(date);
    if (!pattern) return date.toISOString();
    const p = dateParts(date, tz);
    const pad = (n, w = 2) => String(n).padStart(w, '0');
    const off = tzOffsetMs(date, tz) / 60000;
    const offStr = (sep) => `${off < 0 ? '-' : '+'}${pad(Math.floor(Math.abs(off) / 60))}${sep}${pad(Math.abs(off) % 60)}`;
    let out = ''; let i = 0;
    while (i < pattern.length) {
      const c = pattern[i];
      if (c === "'") {
        const e = pattern.indexOf("'", i + 1);
        if (e === i + 1) { out += "'"; i += 2; continue; }
        out += pattern.slice(i + 1, e === -1 ? undefined : e); i = e === -1 ? pattern.length : e + 1; continue;
      }
      if (!/[a-zA-Z]/.test(c)) { out += c; i++; continue; }
      let j = i; while (pattern[j] === c) j++;
      const n = j - i;
      switch (c) {
        case 'y': out += n === 2 ? pad(p.year % 100) : pad(p.year, n); break;
        case 'M': out += n >= 4 ? MONTH_NAMES[p.month] : n === 3 ? MONTH_NAMES[p.month].slice(0, 3) : pad(p.month + 1, n); break;
        case 'd': out += pad(p.day, n); break;
        case 'H': out += pad(p.hour, n); break;
        case 'h': out += pad(p.hour % 12 || 12, n); break;
        case 'k': out += pad(p.hour || 24, n); break;
        case 'K': out += pad(p.hour % 12, n); break;
        case 'm': out += pad(p.minute, n); break;
        case 's': out += pad(p.second, n); break;
        case 'S': out += pad(date.getUTCMilliseconds(), 3).slice(0, Math.max(n, 3)).padEnd(n, '0'); break;
        case 'E': out += n >= 4 ? DAY_NAMES[p.weekday] : DAY_NAMES[p.weekday].slice(0, 3); break;
        case 'a': out += p.hour >= 12 ? 'PM' : 'AM'; break;
        case 'z': out += tz === 'UTC' ? 'UTC' : tz; break;
        case 'Z': out += offStr(''); break;
        case 'X': out += off === 0 ? 'Z' : offStr(n >= 3 ? ':' : ''); break;
        case 'D': out += pad(new Calendar(date).get(F.DAY_OF_YEAR), n); break;
        case 'u': out += String(p.weekday === 0 ? 7 : p.weekday); break;
        case 'w': { const cal = new Calendar(date); cal.setTimeZone(tz); out += pad(cal.get(F.WEEK_OF_YEAR), n); break; }
        case 'G': out += 'AD'; break;
        default: out += pattern.slice(i, j);
      }
      i = j;
    }
    return out;
  }
  static parse(str, pattern, tz = 'UTC') {
    if (!pattern) return new Date(str);
    let y = 1970, mo = 0, d = 1, h = 0, mi = 0, s = 0, ms = 0, pm = null, offset = null;
    let si = 0; let i = 0;
    while (i < pattern.length && si <= str.length) {
      const c = pattern[i];
      if (c === "'") { const e = pattern.indexOf("'", i + 1); const lit = pattern.slice(i + 1, e); si += lit.length; i = e + 1; continue; }
      if (!/[a-zA-Z]/.test(c)) { si++; i++; continue; }
      let j = i; while (pattern[j] === c) j++;
      const n = j - i;
      const takeNum = (maxLen) => { const m = str.slice(si).match(new RegExp(`^\\d{1,${maxLen}}`)); if (!m) throw new Error(`Cannot parse '${str}' with '${pattern}'`); si += m[0].length; return parseInt(m[0], 10); };
      switch (c) {
        case 'y': y = takeNum(4); if (n === 2 && y < 100) y += 2000; break;
        case 'M': if (n >= 3) { const name = str.slice(si).match(/^[A-Za-z]+/)[0]; mo = MONTH_NAMES.findIndex((mn) => mn.toLowerCase().startsWith(name.toLowerCase())); si += name.length; } else mo = takeNum(2) - 1; break;
        case 'd': d = takeNum(2); break;
        case 'H': case 'k': h = takeNum(2); break;
        case 'h': case 'K': h = takeNum(2); break;
        case 'm': mi = takeNum(2); break;
        case 's': s = takeNum(2); break;
        case 'S': ms = takeNum(3); break;
        case 'a': { const t = str.slice(si, si + 2).toUpperCase(); pm = t === 'PM'; si += 2; break; }
        case 'E': { const name = str.slice(si).match(/^[A-Za-z]+/)[0]; si += name.length; break; }
        case 'Z': case 'X': { const m = str.slice(si).match(/^(Z|[+-]\d{2}:?\d{2})/); if (m) { si += m[0].length; offset = m[0] === 'Z' ? 0 : (parseInt(m[0].slice(1, 3), 10) * 60 + parseInt(m[0].slice(-2), 10)) * (m[0][0] === '-' ? -1 : 1); } break; }
        case 'z': { const m = str.slice(si).match(/^[A-Za-z_/]+/); if (m) si += m[0].length; break; }
        default: si += n;
      }
      i = j;
    }
    if (pm !== null) { if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }
    const utc = Date.UTC(y, mo, d, h, mi, s, ms);
    if (offset !== null) return new Date(utc - offset * 60000);
    const dt = new Date(utc);
    return new Date(utc - tzOffsetMs(dt, tz));
  }
}
Object.assign(Calendar, F, DAYS, MONTHS, { SHORT_DATE_PATTERN: 0, LONG_DATE_PATTERN: 1, TIME_PATTERN: 2, INPUT_DATE_PATTERN: 3, INPUT_TIME_PATTERN: 4, INPUT_DATE_TIME_PATTERN: 5, SHORT_DATE_TIME_PATTERN: 7, LONG_DATE_TIME_PATTERN: 8 });

const dtfCache = new Map();
function dateParts(date, tz) {
  if (!tz || tz === 'UTC' || tz === 'GMT') {
    return { year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDate(), hour: date.getUTCHours(), minute: date.getUTCMinutes(), second: date.getUTCSeconds(), weekday: date.getUTCDay() };
  }
  let dtf = dtfCache.get(tz);
  if (!dtf) {
    try { dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' }); }
    catch (e) { return dateParts(date, 'UTC'); }
    dtfCache.set(tz, dtf);
  }
  const parts = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  return { year: +parts.year, month: +parts.month - 1, day: +parts.day, hour: +parts.hour % 24, minute: +parts.minute, second: +parts.second, weekday: DAY_NAMES.findIndex((d) => d.startsWith(parts.weekday)) };
}
function tzOffsetMs(date, tz) {
  if (!tz || tz === 'UTC' || tz === 'GMT') return 0;
  const p = dateParts(date, tz);
  const asUTC = Date.UTC(p.year, p.month, p.day, p.hour, p.minute, p.second, date.getUTCMilliseconds());
  return asUTC - date.getTime();
}
Calendar.dateParts = dateParts;
module.exports = bean(Calendar);
