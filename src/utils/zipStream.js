// Archive ZIP écrite en flux, sans bibliothèque : méthode « stockée » (pas de compression : images et vidéos le sont déjà), noms en UTF-8, taille et CRC écrits après les données
// (descripteur de données) : aucun fichier n'est chargé en entier en mémoire. Limites : 4 Go au total (pas de ZIP64), noms uniques (les doublons reçoivent « (2) »).
const fs = require("fs");
const zlib = require("zlib");
const MAX_TOTAL = 1024 * 1024 * 1024; // 1 Go par archive : au-delà, télécharger en plusieurs fois

const dosTime = (d) => ({ time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate() });
function safeName(name) { return String(name || "fichier").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").replace(/^\.+/, "_").slice(0, 150) || "fichier"; }
function uniqueNames(entries) {
  const seen = new Set();
  return entries.map((e) => {
    let name = safeName(e.name), n = 2;
    const dot = name.lastIndexOf("."), base = dot > 0 ? name.slice(0, dot) : name, ext = dot > 0 ? name.slice(dot) : "";
    while (seen.has(name.toLowerCase())) name = `${base} (${n++})${ext}`;
    seen.add(name.toLowerCase());
    return { ...e, name };
  });
}

// entries : [{ name, absolute, mtime? }] ; out : flux d'écriture (la réponse HTTP). Retourne une promesse résolue à la fin ; rejetée si un fichier est illisible (l'archive est alors tronquée : la connexion est coupée).
async function writeZip(entries, out) {
  const list = uniqueNames(entries), central = [];
  let offset = 0;
  const write = (buf) => new Promise((resolve, reject) => { offset += buf.length; if (out.write(buf)) resolve(); else { out.once("drain", resolve); out.once("error", reject); } });
  for (const e of list) {
    const name = Buffer.from(e.name, "utf8"), { time, date } = dosTime(e.mtime || new Date());
    const header = Buffer.alloc(30 + name.length);
    header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x0808, 6); header.writeUInt16LE(0, 8); header.writeUInt16LE(time, 10); header.writeUInt16LE(date, 12);
    header.writeUInt16LE(name.length, 26); name.copy(header, 30);
    const start = offset;
    await write(header);
    let crc = 0, size = 0;
    await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(e.absolute);
      stream.on("data", (chunk) => { crc = zlib.crc32(chunk, crc); size += chunk.length; if (!out.write(chunk)) { stream.pause(); out.once("drain", () => stream.resume()); } offset += chunk.length; });
      stream.on("end", resolve); stream.on("error", reject);
    });
    const desc = Buffer.alloc(16);
    desc.writeUInt32LE(0x08074b50, 0); desc.writeUInt32LE(crc >>> 0, 4); desc.writeUInt32LE(size, 8); desc.writeUInt32LE(size, 12);
    await write(desc);
    central.push({ name, crc: crc >>> 0, size, start, time, date });
  }
  const centralStart = offset;
  for (const c of central) {
    const h = Buffer.alloc(46 + c.name.length);
    h.writeUInt32LE(0x02014b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(20, 6); h.writeUInt16LE(0x0808, 8); h.writeUInt16LE(0, 10); h.writeUInt16LE(c.time, 12); h.writeUInt16LE(c.date, 14);
    h.writeUInt32LE(c.crc, 16); h.writeUInt32LE(c.size, 20); h.writeUInt32LE(c.size, 24); h.writeUInt16LE(c.name.length, 28); h.writeUInt32LE(c.start, 42); c.name.copy(h, 46);
    await write(h);
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length, 8); end.writeUInt16LE(central.length, 10); end.writeUInt32LE(offset - centralStart, 12); end.writeUInt32LE(centralStart, 16);
  await write(end);
  out.end();
}
module.exports = { writeZip, MAX_TOTAL, safeName };
