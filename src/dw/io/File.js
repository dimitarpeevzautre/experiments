'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { bean } = require('../../util/bean');
const ArrayList = require('../util/ArrayList');
const rtRef = require('../../runtime');

/** dw.io.File – rooted at <dataDir>/files (IMPEX, TEMP, CATALOGS, LIBRARIES, STATIC, ...). */
class File {
  constructor(a, b) {
    if (a instanceof File) this._p = b !== undefined ? path.join(a._p, String(b)) : a._p;
    else this._p = File._resolve(String(a));
  }
  static _root() { const rt = rtRef.current(); return rt.config.fileRoot ? path.resolve(rt.config.fileRoot) : path.join(rt.store.dataDir || path.join(require('os').tmpdir(), 'sfcc-runtime'), 'files'); }
  static _resolve(p) {
    p = p.replace(/\\/g, '/');
    if (!p.startsWith('/')) p = '/' + p;
    const root = File._root();
    const abs = path.normalize(path.join(root, p));
    if (!abs.startsWith(root)) throw new Error(`Path escapes file root: ${p}`);
    return abs;
  }
  getName() { return path.basename(this._p); }
  getFullPath() { return '/' + path.relative(File._root(), this._p).replace(/\\/g, '/'); }
  getPath() { return this.getFullPath().replace(/^\/(IMPEX|TEMP|CATALOGS|LIBRARIES|STATIC|REALMDATA|CUSTOMERPI|CUSTOMER_SNAPSHOTS|DYNAMIC)\/?/, ''); }
  getRootDirectoryType() { const m = this.getFullPath().match(/^\/([A-Z_]+)/); return m ? m[1] : null; }
  exists() { return fs.existsSync(this._p); }
  isDirectory() { try { return fs.statSync(this._p).isDirectory(); } catch (e) { return false; } }
  isFile() { try { return fs.statSync(this._p).isFile(); } catch (e) { return false; } }
  length() { try { return fs.statSync(this._p).size; } catch (e) { return 0; } }
  lastModified() { try { return fs.statSync(this._p).mtimeMs; } catch (e) { return 0; } }
  mkdir() { try { fs.mkdirSync(this._p); return true; } catch (e) { return false; } }
  mkdirs() { try { fs.mkdirSync(this._p, { recursive: true }); return true; } catch (e) { return false; } }
  createNewFile() { if (this.exists()) return false; fs.mkdirSync(path.dirname(this._p), { recursive: true }); fs.writeFileSync(this._p, ''); return true; }
  remove() { try { fs.rmSync(this._p, { recursive: false }); return true; } catch (e) { return false; } }
  renameTo(other) { try { fs.renameSync(this._p, other._p); return true; } catch (e) { return false; } }
  copyTo(other) { fs.mkdirSync(path.dirname(other._p), { recursive: true }); fs.copyFileSync(this._p, other._p); return other; }
  list() { try { return fs.readdirSync(this._p); } catch (e) { return null; } }
  listFiles(filter) { const names = this.list(); if (!names) return null; let files = names.map((n) => new File(this, n)); if (typeof filter === 'function') files = files.filter((f) => filter(f)); return new ArrayList(files); }
  zip(target) { const AdmLike = require('./_zip'); AdmLike.zipPath(this._p, target._p); }
  unzip(targetDir) { const AdmLike = require('./_zip'); AdmLike.unzipPath(this._p, targetDir._p); }
  gzip(target) { fs.writeFileSync(target._p, zlib.gzipSync(fs.readFileSync(this._p))); }
  gunzip(targetDir) { const name = this.getName().replace(/\.gz$/, ''); fs.mkdirSync(targetDir._p, { recursive: true }); fs.writeFileSync(path.join(targetDir._p, name), zlib.gunzipSync(fs.readFileSync(this._p))); }
  md5() { return crypto.createHash('md5').update(fs.readFileSync(this._p)).digest('hex'); }
  toString() { return this.getFullPath(); }
  equals(o) { return o instanceof File && o._p === this._p; }
  static getRootDirectory(type) { return new File('/' + type); }
}
Object.assign(File, { IMPEX: 'IMPEX', TEMP: 'TEMP', CATALOGS: 'CATALOGS', LIBRARIES: 'LIBRARIES', STATIC: 'STATIC', REALMDATA: 'REALMDATA', CUSTOMERPI: 'CUSTOMERPI', CUSTOMER_SNAPSHOTS: 'CUSTOMER_SNAPSHOTS', DYNAMIC: 'DYNAMIC', SEPARATOR: '/' });
module.exports = bean(File);
