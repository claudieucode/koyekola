// Lecture et contrôle d'un fichier de police téléversé : le FORMAT RÉEL est déterminé par les octets du fichier (jamais par l'extension ni par le type
// MIME annoncé par le navigateur), la structure est vérifiée (tables présentes, bornes, taille décompressée plafonnée), puis la famille, la graisse
// et le style sont lus dans les tables « name » et « OS/2 » (WOFF2 : après décompression Brotli de son flux). Rien n'est exécuté ni interprété
// au-delà de ces lectures d'octets. Formats pris en charge : WOFF2, WOFF, TrueType (TTF) et OpenType (OTF). Les collections (.ttc) sont refusées.
const zlib = require("zlib");

const MAX_FILE = 5 * 1024 * 1024;          // plafond d'un fichier de police (octets)
const MAX_INFLATED = 24 * 1024 * 1024;      // plafond après décompression (protège contre les « bombes »)
const MAX_TABLES = 64;
const EXT = { woff2: ".woff2", woff: ".woff", ttf: ".ttf", otf: ".otf" };
const MIME = { woff2: "font/woff2", woff: "font/woff", ttf: "font/ttf", otf: "font/otf" };

class FontError extends Error {}
const bad = (m) => new FontError(m);

// Tags connus de la table des tables WOFF2 (indices 0 à 62)
const WOFF2_TAGS = ["cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar", "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat", "Gloc", "Feat", "Sill"];

function sniff(buf) {
  if (buf.length < 12) throw bad("Fichier trop court pour être une police.");
  const sig = buf.toString("latin1", 0, 4);
  if (sig === "wOF2") return "woff2";
  if (sig === "wOFF") return "woff";
  if (sig === "OTTO") return "otf";
  if (sig === "ttcf") throw bad("Les collections de polices (.ttc) ne sont pas prises en charge : importez chaque police séparément.");
  if (buf.readUInt32BE(0) === 0x00010000 || sig === "true") return "ttf";
  throw bad("Ce fichier n'est pas une police reconnue (WOFF2, WOFF, TTF ou OTF).");
}

// Table « name » : { 1: famille, 2: style, 4: nom complet, 16: famille typographique, 17: style typographique }
function readName(t) {
  if (!t || t.length < 6) return {};
  const count = t.readUInt16BE(2), strOff = t.readUInt16BE(4), out = {};
  for (let i = 0; i < count && 6 + i * 12 + 12 <= t.length; i++) {
    const o = 6 + i * 12, platform = t.readUInt16BE(o), id = t.readUInt16BE(o + 6), len = t.readUInt16BE(o + 8), off = t.readUInt16BE(o + 10);
    if (![1, 2, 4, 16, 17].includes(id) || strOff + off + len > t.length) continue;
    const raw = t.subarray(strOff + off, strOff + off + len);
    let s;
    if (platform === 3 || platform === 0) { const be = Buffer.from(raw); s = be.length % 2 ? "" : Buffer.from(be).swap16().toString("utf16le"); } else s = raw.toString("latin1");
    s = s.replace(/[\u0000-\u001f\u007f<>"'`;{}\\]/g, "").trim();
    if (s && (out[id] === undefined || platform === 3)) out[id] = s;
  }
  return out;
}

// Retourne { tag → Buffer } des tables utiles (name, OS/2, head, fvar) et la liste des tags présents
function tablesOf(buf, format) {
  const wanted = new Set(["name", "OS/2", "head", "fvar"]);
  const have = new Set(), got = {};
  if (format === "ttf" || format === "otf") {
    const n = buf.readUInt16BE(4);
    if (!n || n > MAX_TABLES || 12 + n * 16 > buf.length) throw bad("Structure de police invalide (table des tables).");
    for (let i = 0; i < n; i++) {
      const o = 12 + i * 16, tag = buf.toString("latin1", o, o + 4), off = buf.readUInt32BE(o + 8), len = buf.readUInt32BE(o + 12);
      if (off + len > buf.length || off < 12 + n * 16) throw bad("Structure de police invalide (table hors du fichier).");
      have.add(tag); if (wanted.has(tag)) got[tag] = buf.subarray(off, off + len);
    }
  } else if (format === "woff") {
    if (buf.length < 44) throw bad("En-tête WOFF incomplet.");
    const n = buf.readUInt16BE(12), total = buf.readUInt32BE(16);
    if (!n || n > MAX_TABLES || 44 + n * 20 > buf.length) throw bad("Structure WOFF invalide.");
    if (total > MAX_INFLATED) throw bad("Police trop volumineuse une fois décompressée.");
    for (let i = 0; i < n; i++) {
      const o = 44 + i * 20, tag = buf.toString("latin1", o, o + 4), off = buf.readUInt32BE(o + 4), comp = buf.readUInt32BE(o + 8), orig = buf.readUInt32BE(o + 12);
      if (off + comp > buf.length || comp > orig || orig > MAX_INFLATED) throw bad("Structure WOFF invalide (table hors du fichier).");
      have.add(tag);
      if (wanted.has(tag)) {
        const raw = buf.subarray(off, off + comp);
        try { got[tag] = comp < orig ? zlib.inflateSync(raw, { maxOutputLength: MAX_INFLATED }) : raw; } catch { throw bad("Table WOFF corrompue."); }
      }
    }
  } else { // woff2
    if (buf.length < 48) throw bad("En-tête WOFF2 incomplet.");
    const n = buf.readUInt16BE(12), compressed = buf.readUInt32BE(20);
    if (!n || n > MAX_TABLES) throw bad("Structure WOFF2 invalide.");
    let p = 48;
    const b128 = () => { let v = 0; for (let i = 0; i < 5; i++) { if (p >= buf.length) throw bad("Structure WOFF2 invalide."); const b = buf[p++]; v = v * 128 + (b & 127); if (!(b & 128)) return v; } throw bad("Structure WOFF2 invalide."); };
    const dir = [];
    for (let i = 0; i < n; i++) {
      if (p >= buf.length) throw bad("Structure WOFF2 invalide.");
      const flags = buf[p++], idx = flags & 63, version = flags >> 6;
      let tag;
      if (idx === 63) { if (p + 4 > buf.length) throw bad("Structure WOFF2 invalide."); tag = buf.toString("latin1", p, p + 4); p += 4; } else tag = WOFF2_TAGS[idx];
      const orig = b128();
      const transformed = tag === "glyf" || tag === "loca" ? version === 0 : version !== 0;
      dir.push({ tag, length: transformed ? b128() : orig });
      have.add(tag);
    }
    if (p + compressed > buf.length || compressed === 0) throw bad("Structure WOFF2 invalide (flux compressé hors du fichier).");
    let data;
    try { data = zlib.brotliDecompressSync(buf.subarray(p, p + compressed), { maxOutputLength: MAX_INFLATED }); } catch { throw bad("Flux WOFF2 corrompu ou trop volumineux une fois décompressé."); }
    let q = 0;
    for (const d of dir) { if (q + d.length > data.length) throw bad("Structure WOFF2 invalide (tables tronquées)."); if (wanted.has(d.tag)) got[d.tag] = data.subarray(q, q + d.length); q += d.length; }
  }
  return { got, have };
}

const WEIGHT_WORDS = [[/thin|hairline/i, 100], [/extra.?light|ultra.?light/i, 200], [/light/i, 300], [/medium/i, 500], [/semi.?bold|demi.?bold/i, 600], [/extra.?bold|ultra.?bold/i, 800], [/black|heavy/i, 900], [/bold/i, 700]];

// Analyse complète : { format, family, subfamily, weight, weightMax, style, variable } ; FontError si le fichier est refusé
function inspect(buf) {
  if (!Buffer.isBuffer(buf) || !buf.length) throw bad("Fichier vide.");
  if (buf.length > MAX_FILE) throw bad(`Fichier trop volumineux (maximum ${Math.round(MAX_FILE / 1048576)} Mo par police).`);
  const format = sniff(buf);
  let t;
  try { t = tablesOf(buf, format); } catch (e) { if (e instanceof FontError) throw e; throw bad("Fichier de police illisible ou tronqué."); }
  const { got, have } = t;
  if (!have.has("head") || !(have.has("glyf") || have.has("CFF ") || have.has("CFF2")) || !have.has("cmap")) throw bad("Police incomplète : tables obligatoires manquantes (head, cmap, glyf ou CFF).");
  const name = readName(got.name);
  const family = name[16] || name[1] || "";
  const sub = name[17] || name[2] || "";
  let weight = 400, italic = false;
  const os2 = got["OS/2"];
  if (os2 && os2.length >= 64) { const w = os2.readUInt16BE(4); if (w >= 1 && w <= 1000) weight = w; italic = Boolean(os2.readUInt16BE(62) & 1); }
  else { const hit = WEIGHT_WORDS.find(([re]) => re.test(sub)); if (hit) weight = hit[1]; }
  if (got.head && got.head.length >= 46 && (got.head.readUInt16BE(44) & 2)) italic = true;
  if (/italic|oblique/i.test(sub)) italic = true;
  let weightMax = null, variable = false;
  const fvar = got.fvar;
  if (fvar && fvar.length >= 16) {
    variable = true;
    const off = fvar.readUInt16BE(4), count = fvar.readUInt16BE(8), size = fvar.readUInt16BE(10);
    for (let i = 0; i < count && size >= 20 && off + (i + 1) * size <= fvar.length; i++) {
      const o = off + i * size;
      if (fvar.toString("latin1", o, o + 4) === "wght") {
        const lo = Math.round(fvar.readInt32BE(o + 4) / 65536), hi = Math.round(fvar.readInt32BE(o + 12) / 65536);
        if (lo >= 1 && hi <= 1000 && hi > lo) { weight = lo; weightMax = hi; }
      }
    }
  }
  return { format, family, subfamily: sub, weight, weightMax, style: italic ? "italic" : "normal", variable };
}

module.exports = { inspect, sniff, FontError, MAX_FILE, EXT, MIME };
