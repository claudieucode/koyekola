// Image SEO : existence réelle du fichier et dimensions lues dans son en-tête (PNG, JPEG, GIF, WebP), sans dépendance.
// Utilisé pour og:image:width / og:image:height, ImageObject et l'audit des images. Résultat mis en cache (chemin + date + taille).
const fs = require("fs");
const path = require("path");
const { uploadsRoot } = require("../config/paths");

const cache = new Map();

// /uploads/thumbnails/x.webp → chemin sur le disque (null si l'adresse n'est pas une image publique du site)
function fileOf(publicPath) {
  const m = /^\/uploads\/(thumbnails|blog)\/([A-Za-z0-9_.-]{1,200})$/.exec(String(publicPath || ""));
  if (m) return path.join(uploadsRoot, m[1], m[2]);
  // Médiathèque du CMS : /uploads/marketing/<organisation>/<fichier>
  const cms = /^\/uploads\/marketing\/(\d{1,9})\/([A-Za-z0-9_.-]{1,200})$/.exec(String(publicPath || ""));
  return cms ? path.join(uploadsRoot, "marketing", cms[1], cms[2]) : null;
}

function readDimensions(buf) {
  if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47) return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), format: "png" };
  if (buf.length >= 10 && buf.toString("ascii", 0, 3) === "GIF") return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8), format: "gif" };
  if (buf.length >= 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3), format: "webp" };
    if (chunk === "VP8L") { const b = buf.readUInt32LE(21); return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1, format: "webp" }; }
    if (chunk === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff, format: "webp" };
  }
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if ((marker >= 0xc0 && marker <= 0xcf) && ![0xc4, 0xc8, 0xcc].includes(marker)) return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5), format: "jpeg" };
      i += 2 + len;
    }
  }
  return null;
}

// { exists, width, height, bytes, format } — exists:false si le fichier est absent
function probe(publicPath) {
  const file = fileOf(publicPath);
  if (!file) return { exists: false, external: /^https?:\/\//i.test(String(publicPath || "")) };
  let stat;
  try { stat = fs.statSync(file); } catch { return { exists: false }; }
  const key = `${file}|${stat.mtimeMs}|${stat.size}`;
  if (cache.has(key)) return cache.get(key);
  let dims = null;
  try {
    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(Math.min(stat.size, 256 * 1024));
    fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    dims = readDimensions(buf);
  } catch { dims = null; }
  const out = { exists: true, bytes: stat.size, width: dims ? dims.width : null, height: dims ? dims.height : null, format: dims ? dims.format : path.extname(file).slice(1).toLowerCase() };
  if (cache.size > 2000) cache.clear();
  cache.set(key, out);
  return out;
}

module.exports = { probe, readDimensions, fileOf };
