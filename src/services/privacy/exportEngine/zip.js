// Archive ZIP minimale (sans dépendance) : écriture (noms en UTF-8, compression deflate) ET relecture stricte pour vérifier une archive
// avant de la déclarer « prête » : signature, répertoire central, tailles et somme de contrôle (CRC-32) de chaque fichier.
const zlib = require("node:zlib");

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_END = 0x06054b50;
const UTF8_FLAG = 0x0800;
const MAX_ENTRIES = 200;
const MAX_ENTRY_BYTES = 200 * 1024 * 1024;

function crc32(buffer) {
  if (typeof zlib.crc32 === "function") return zlib.crc32(buffer) >>> 0;
  let c = ~0;
  for (let i = 0; i < buffer.length; i++) { c ^= buffer[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
  return ~c >>> 0;
}
const dosTime = (d) => ((d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | (d.getUTCSeconds() >> 1)) & 0xffff;
const dosDate = (d) => ((Math.max(0, d.getUTCFullYear() - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate()) & 0xffff;

// Nom d'entrée sûr : relatif, sans « .. », sans barre inverse ni octet nul (aucune écriture hors du dossier à l'extraction)
function safeName(name) {
  const clean = String(name).replace(/\\/g, "/");
  if (!clean || clean.startsWith("/") || clean.split("/").some((part) => part === ".." || part === "" || part === ".") || /[\u0000-\u001f]/.test(clean)) throw new Error(`Nom de fichier d'archive invalide : ${JSON.stringify(String(name).slice(0, 60))}`);
  return clean;
}

// files : [{ name, data: Buffer | string }] → Buffer
function create(files, { now = new Date() } = {}) {
  if (!Array.isArray(files) || !files.length) throw new Error("Archive vide : au moins un fichier est requis.");
  if (files.length > MAX_ENTRIES) throw new Error("Trop de fichiers dans l'archive.");
  const seen = new Set();
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = safeName(file.name);
    if (seen.has(name.toLowerCase())) throw new Error(`Fichier en double dans l'archive : ${name}`);
    seen.add(name.toLowerCase());
    const raw = Buffer.isBuffer(file.data) ? file.data : Buffer.from(String(file.data), "utf8");
    if (raw.length > MAX_ENTRY_BYTES) throw new Error(`Fichier trop volumineux : ${name}`);
    const packed = raw.length ? zlib.deflateRawSync(raw, { level: 9 }) : Buffer.alloc(0);
    const method = raw.length ? 8 : 0;
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(raw);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(SIG_LOCAL, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(UTF8_FLAG, 6); local.writeUInt16LE(method, 8);
    local.writeUInt16LE(dosTime(now), 10); local.writeUInt16LE(dosDate(now), 12); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18); local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(nameBuf.length, 26); local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, packed);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(SIG_CENTRAL, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(UTF8_FLAG, 8); central.writeUInt16LE(method, 10);
    central.writeUInt16LE(dosTime(now), 12); central.writeUInt16LE(dosDate(now), 14); central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(packed.length, 20); central.writeUInt32LE(raw.length, 24); central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + packed.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(SIG_END, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(centralBuf.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}

// Relecture stricte → [{ name, data }] ; lève une erreur au moindre défaut (archive tronquée, somme de contrôle fausse, nom dangereux…)
function read(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 22) throw new Error("Archive invalide : trop courte.");
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 22 - 65535); i--) if (buffer.readUInt32LE(i) === SIG_END) { end = i; break; }
  if (end < 0) throw new Error("Archive invalide : fin de répertoire introuvable.");
  const count = buffer.readUInt16LE(end + 10);
  const size = buffer.readUInt32LE(end + 12);
  const start = buffer.readUInt32LE(end + 16);
  if (!count || count > MAX_ENTRIES || start + size > end) throw new Error("Archive invalide : répertoire incohérent.");
  const out = [];
  let p = start;
  for (let n = 0; n < count; n++) {
    if (buffer.readUInt32LE(p) !== SIG_CENTRAL) throw new Error("Archive invalide : entrée illisible.");
    const method = buffer.readUInt16LE(p + 10); const crc = buffer.readUInt32LE(p + 16); const packedSize = buffer.readUInt32LE(p + 20); const rawSize = buffer.readUInt32LE(p + 24);
    const nameLen = buffer.readUInt16LE(p + 28); const extraLen = buffer.readUInt16LE(p + 30); const commentLen = buffer.readUInt16LE(p + 32); const localOffset = buffer.readUInt32LE(p + 42);
    const name = safeName(buffer.subarray(p + 46, p + 46 + nameLen).toString("utf8"));
    if (buffer.readUInt32LE(localOffset) !== SIG_LOCAL) throw new Error(`Archive invalide : en-tête de ${name} illisible.`);
    const dataStart = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
    if (dataStart + packedSize > start) throw new Error(`Archive invalide : ${name} est tronqué.`);
    const packed = buffer.subarray(dataStart, dataStart + packedSize);
    const data = method === 0 ? Buffer.from(packed) : method === 8 ? zlib.inflateRawSync(packed) : null;
    if (!data) throw new Error(`Archive invalide : méthode de compression inconnue pour ${name}.`);
    if (data.length !== rawSize || crc32(data) !== crc) throw new Error(`Archive invalide : ${name} est corrompu.`);
    out.push({ name, data });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

module.exports = { create, read, crc32, safeName };
