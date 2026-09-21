'use strict';
/** Minimal ZIP (store/deflate) writer & reader – enough for File.zip/unzip. Not a dw class. */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
function crc32(buf) { let c; const table = crc32.table || (crc32.table = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })()); let crc = -1; for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]; return (crc ^ -1) >>> 0; }
function walk(dir, base, out) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, base, out); else out.push({ name: path.relative(base, p).replace(/\\/g, '/'), data: fs.readFileSync(p) }); } }
function zipPath(src, target) {
  const entries = [];
  if (fs.statSync(src).isDirectory()) walk(src, path.dirname(src), entries); else entries.push({ name: path.basename(src), data: fs.readFileSync(src) });
  const locals = []; const centrals = []; let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name); const comp = zlib.deflateRawSync(e.data); const crc = crc32(e.data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6); lh.writeUInt16LE(8, 8); lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0, 12); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(e.data.length, 22); lh.writeUInt16LE(name.length, 26); lh.writeUInt16LE(0, 28);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0, 8); ch.writeUInt16LE(8, 10); ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(e.data.length, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt16LE(0, 30); ch.writeUInt16LE(0, 32); ch.writeUInt16LE(0, 34); ch.writeUInt16LE(0, 36); ch.writeUInt32LE(0, 38); ch.writeUInt32LE(offset, 42);
    locals.push(lh, name, comp); centrals.push(ch, name); offset += lh.length + name.length + comp.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(0, 4); end.writeUInt16LE(0, 6); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16); end.writeUInt16LE(0, 20);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, Buffer.concat([...locals, cd, end]));
}
function unzipPath(src, targetDir) {
  const buf = fs.readFileSync(src);
  let eocd = buf.length - 22; while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('Not a zip file');
  const count = buf.readUInt16LE(eocd + 10); let off = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(off + 10); const compSize = buf.readUInt32LE(off + 20); const nameLen = buf.readUInt16LE(off + 28); const extraLen = buf.readUInt16LE(off + 30); const commentLen = buf.readUInt16LE(off + 32); const localOff = buf.readUInt32LE(off + 42);
    const name = buf.slice(off + 46, off + 46 + nameLen).toString();
    const lNameLen = buf.readUInt16LE(localOff + 26); const lExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const data = buf.slice(dataStart, dataStart + compSize);
    const out = path.join(targetDir, name);
    if (name.endsWith('/')) fs.mkdirSync(out, { recursive: true });
    else { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, method === 8 ? zlib.inflateRawSync(data) : data); }
    off += 46 + nameLen + extraLen + commentLen;
  }
}
module.exports = { zipPath, unzipPath };
