// Écriture d'une archive ZIP (format standard, sans dépendance) : entrées « deflate » ou « stored », noms UTF-8, écrite fichier par fichier sur le disque
// (jamais l'archive entière en mémoire). Sert à l'export avec médias : export.json + media/… + manifeste.
// Sûreté : les noms d'entrée sont normalisés (« / » seulement, jamais « .. », jamais de chemin absolu) ; limites explicites ; création exclusive du fichier.
const fs = require("node:fs");
const zlib = require("node:zlib");

const crc32 = zlib.crc32 || ((buf) => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; });
const safeName = (name) => {
  const n = String(name).replace(/\\/g, "/").split("/").filter((s) => s && s !== "." && s !== "..").join("/");
  if (!n || n.length > 240) throw new Error("Nom d'entrée d'archive invalide.");
  return n;
};
const dosTime = (d) => ({ time: (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | (d.getUTCSeconds() >> 1), date: (((d.getUTCFullYear() - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate()) });

class ZipWriter {
  constructor(file) { this.fd = fs.openSync(file, "wx", 0o600); this.pos = 0; this.entries = []; this.file = file; this.closed = false; this.stamp = dosTime(new Date()); }
  write(buf) { fs.writeSync(this.fd, buf, 0, buf.length); this.pos += buf.length; }
  // Ajoute une entrée ; compress : « deflate » (texte) ou « store » (déjà compressé : images, vidéos)
  add(name, data, { compress = true } = {}) {
    const n = Buffer.from(safeName(name), "utf8");
    const crc = crc32(data);
    const body = compress ? zlib.deflateRawSync(data) : data;
    const method = compress && body.length < data.length ? 8 : 0;
    const stored = method === 8 ? body : data;
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x0800, 6); header.writeUInt16LE(method, 8);
    header.writeUInt16LE(this.stamp.time, 10); header.writeUInt16LE(this.stamp.date, 12); header.writeUInt32LE(crc >>> 0, 14);
    header.writeUInt32LE(stored.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(n.length, 26); header.writeUInt16LE(0, 28);
    const offset = this.pos;
    this.write(header); this.write(n); this.write(stored);
    this.entries.push({ n, crc: crc >>> 0, method, csize: stored.length, size: data.length, offset });
  }
  close() {
    if (this.closed) return this.pos;
    const start = this.pos;
    for (const e of this.entries) {
      const c = Buffer.alloc(46);
      c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(e.method, 10);
      c.writeUInt16LE(this.stamp.time, 12); c.writeUInt16LE(this.stamp.date, 14); c.writeUInt32LE(e.crc, 16); c.writeUInt32LE(e.csize, 20); c.writeUInt32LE(e.size, 24);
      c.writeUInt16LE(e.n.length, 28); c.writeUInt32LE(e.offset, 42);
      this.write(c); this.write(e.n);
    }
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(this.entries.length, 8); end.writeUInt16LE(this.entries.length, 10);
    end.writeUInt32LE(this.pos - start, 12); end.writeUInt32LE(start, 16);
    this.write(end);
    fs.closeSync(this.fd); this.closed = true;
    return this.pos;
  }
  abort() { try { if (!this.closed) fs.closeSync(this.fd); } catch { /* déjà fermé */ } try { fs.unlinkSync(this.file); } catch { /* absent */ } this.closed = true; }
}

// Relecture d'une archive (vérification de ce qui vient d'être écrit, et tests) : { name, data } par entrée ; refuse tout ce qui n'est pas bien formé
function readZip(buffer) {
  const eocd = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error("Archive illisible : fin de répertoire introuvable.");
  const count = buffer.readUInt16LE(eocd + 10), cdSize = buffer.readUInt32LE(eocd + 12), cdStart = buffer.readUInt32LE(eocd + 16);
  if (cdStart + cdSize > buffer.length) throw new Error("Archive tronquée.");
  const out = [];
  let p = cdStart;
  for (let i = 0; i < count; i++) {
    if (buffer.readUInt32LE(p) !== 0x02014b50) throw new Error("Répertoire central invalide.");
    const method = buffer.readUInt16LE(p + 10), crc = buffer.readUInt32LE(p + 16), csize = buffer.readUInt32LE(p + 20), size = buffer.readUInt32LE(p + 24);
    const nlen = buffer.readUInt16LE(p + 28), elen = buffer.readUInt16LE(p + 30), clen = buffer.readUInt16LE(p + 32), off = buffer.readUInt32LE(p + 42);
    const name = buffer.toString("utf8", p + 46, p + 46 + nlen);
    const lh = off; if (buffer.readUInt32LE(lh) !== 0x04034b50) throw new Error("En-tête local invalide.");
    const start = lh + 30 + buffer.readUInt16LE(lh + 26) + buffer.readUInt16LE(lh + 28);
    const raw = buffer.subarray(start, start + csize);
    const data = method === 8 ? zlib.inflateRawSync(raw) : raw;
    if (data.length !== size || (crc32(data) >>> 0) !== crc) throw new Error(`Entrée « ${name} » corrompue.`);
    out.push({ name, data });
    p += 46 + nlen + elen + clen;
  }
  return out;
}

module.exports = { ZipWriter, readZip, safeName, crc32 };
