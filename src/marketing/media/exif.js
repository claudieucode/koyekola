// Informations EXIF d'une photo JPEG (appareil, date de prise de vue, réglages). Lecture seule, bornée (les 128 premiers Ko), jamais d'exécution ni de dépendance : un fichier
// illisible ou sans EXIF donne simplement `null`. La POSITION GPS n'est jamais affichée : seule sa présence est signalée (vie privée : elle part avec le fichier quand on le partage).
const fs = require("fs");

const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
function read(file) {
  let fd;
  try { fd = fs.openSync(file, "r"); const buf = Buffer.alloc(131072); const n = fs.readSync(fd, buf, 0, buf.length, 0); return buf.subarray(0, n); } catch { return null; } finally { if (fd !== undefined) try { fs.closeSync(fd); } catch { /* ignoré */ } }
}
function parse(buf) {
  if (!buf || buf.length < 12 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let p = 2, tiff = -1;
  while (p + 4 < buf.length) {
    if (buf[p] !== 0xff) break;
    const marker = buf[p + 1], len = buf.readUInt16BE(p + 2);
    if (marker === 0xe1 && buf.toString("latin1", p + 4, p + 10) === "Exif\0\0") { tiff = p + 10; break; }
    if (marker === 0xda || len < 2) break;
    p += 2 + len;
  }
  if (tiff < 0 || tiff + 8 > buf.length) return null;
  const le = buf.toString("latin1", tiff, tiff + 2) === "II";
  if (!le && buf.toString("latin1", tiff, tiff + 2) !== "MM") return null;
  const u16 = (o) => (o + 2 <= buf.length ? (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o)) : 0);
  const u32 = (o) => (o + 4 <= buf.length ? (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o)) : 0);
  const value = (type, count, valueOffset) => {
    const size = (TYPE_SIZE[type] || 1) * count, at = size <= 4 ? valueOffset : tiff + u32(valueOffset);
    if (at < 0 || at + size > buf.length) return null;
    if (type === 2) return buf.toString("latin1", at, at + count).replace(/\0.*$/, "").trim();
    if (type === 3) return u16(at);
    if (type === 4) return u32(at);
    if (type === 5 || type === 10) { const d = u32(at + 4); return d ? u32(at) / d : null; }
    return null;
  };
  const ifd = (offset) => {
    const out = {}; if (offset <= 0 || tiff + offset + 2 > buf.length) return out;
    const base = tiff + offset, n = Math.min(u16(base), 80);
    for (let i = 0; i < n; i++) { const e = base + 2 + i * 12; if (e + 12 > buf.length) break; out[u16(e)] = { type: u16(e + 2), count: u32(e + 4), at: e + 8 }; }
    return out;
  };
  const get = (tbl, tag) => (tbl[tag] ? value(tbl[tag].type, tbl[tag].count, tbl[tag].at) : null);
  const main = ifd(u32(tiff + 4));
  const exifPtr = main[0x8769] ? u32(main[0x8769].at) : 0, gpsPtr = main[0x8825] ? u32(main[0x8825].at) : 0;
  const ex = ifd(exifPtr);
  const taken = get(ex, 0x9003) || get(main, 0x0132);
  const out = {
    make: get(main, 0x010f) || null, model: get(main, 0x0110) || null, software: get(main, 0x0131) || null, orientation: get(main, 0x0112) || null,
    takenAt: typeof taken === "string" && /^\d{4}:\d\d:\d\d \d\d:\d\d:\d\d$/.test(taken) ? taken.replace(/^(\d{4}):(\d\d):(\d\d) /, "$1-$2-$3 ") : null,
    exposure: get(ex, 0x829a), fNumber: get(ex, 0x829d), iso: get(ex, 0x8827), focalLength: get(ex, 0x920a), lens: get(ex, 0xa434) || null,
    hasGps: gpsPtr > 0 && Object.keys(ifd(gpsPtr)).length > 0,
  };
  return Object.values(out).some((v) => v !== null && v !== false) ? out : null;
}
const exifOf = (absolute) => parse(read(absolute));
module.exports = { exifOf, parse };
