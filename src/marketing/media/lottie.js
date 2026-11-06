// Médiathèque : animations Lottie (.json) et dotLottie (.lottie). CONTRÔLE DE CONTENU STRICT : le type est reconnu dans le contenu du fichier, jamais dans son nom.
//
// Une animation Lottie est un document de données, pas un programme, MAIS elle peut contenir : des expressions (JavaScript après-effets, clé « x » en texte), des adresses
// externes (images, polices : le visiteur ferait des requêtes vers un autre site), du HTML/SVG injecté dans un texte, ou une structure géante (bombe de décompression).
// On refuse donc tout ce qui n'est pas strictement une animation autonome :
//   - JSON : taille ≤ 2 Mo, profondeur ≤ 40, ≤ 400 000 valeurs ; champs obligatoires v, fr, ip, op, w, h, layers ; w, h ≤ 4096 ; ≤ 500 calques ;
//   - aucune expression (clé « x » de type texte), aucune adresse externe (http, https, //, ftp), aucun javascript:, aucune balise <script> / <svg> / <iframe>, aucun gestionnaire on…=,
//     aucun chemin de police, aucune clé __proto__ / constructor / prototype ;
//   - images : seulement intégrées (data:image/png|jpeg|webp|gif;base64) — ou, dans un .lottie, des fichiers images/ du conteneur, vérifiés par leur signature ;
//   - .lottie (ZIP) : ≤ 60 entrées, noms stricts (manifest.json, animations/<nom>.json, a/<nom>.json, images/<nom>, i/<nom>), pas de chiffrement, méthodes 0 et 8 seulement,
//     taille décompressée ≤ 8 Mo au total ET par entrée (la décompression est bornée : une bombe est arrêtée), manifest cohérent avec les animations présentes.
const zlib = require("zlib");

const MAX_JSON = 2 * 1024 * 1024, MAX_ZIP_TOTAL = 8 * 1024 * 1024, MAX_ENTRIES = 60, MAX_DEPTH = 40, MAX_VALUES = 400000, MAX_LAYERS = 500;
const DATA_IMAGE = /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+$/;
const BAD_TEXT = /javascript\s*:|vbscript\s*:|<\s*\/?\s*(?:script|svg|iframe|object|embed|img|link|style|html)\b|\bon[a-z]{3,20}\s*=|\bdata:(?!image\/)/i;
const EXTERNAL = /^\s*(?:https?:|ftp:|file:|\/\/|wss?:)/i;
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

class LottieError extends Error {}
const bad = (m) => { throw new LottieError(m); };

// Parcourt le document (itératif : pas de dépassement de pile) ; `images` = fichiers images/ du conteneur (dotLottie) ou null (JSON seul)
function checkDocument(doc, { images = null } = {}) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) bad("le fichier n'est pas un objet JSON d'animation Lottie.");
  if (typeof doc.v !== "string" || !doc.v) bad("champ « v » (version) manquant : ce n'est pas une animation Lottie.");
  for (const k of ["fr", "ip", "op", "w", "h"]) if (typeof doc[k] !== "number" || !Number.isFinite(doc[k])) bad(`champ « ${k} » manquant ou invalide : ce n'est pas une animation Lottie.`);
  if (!Array.isArray(doc.layers)) bad("champ « layers » (calques) manquant.");
  if (doc.layers.length > MAX_LAYERS) bad(`trop de calques (${MAX_LAYERS} au plus).`);
  if (!(doc.fr >= 1 && doc.fr <= 120)) bad("cadence (fr) hors limites (1 à 120 images par seconde).");
  if (!(doc.w >= 1 && doc.w <= 4096 && doc.h >= 1 && doc.h <= 4096)) bad("dimensions hors limites (1 à 4096 pixels).");
  if (!(doc.op > doc.ip) || doc.op - doc.ip > 36000) bad("durée invalide (op doit dépasser ip, 36 000 images au plus).");
  const stack = [[doc, 1]];
  let values = 0;
  while (stack.length) {
    const [node, depth] = stack.pop();
    if (depth > MAX_DEPTH) bad("structure trop imbriquée.");
    const isArr = Array.isArray(node);
    for (const key of isArr ? node.keys() : Object.keys(node)) {
      if (++values > MAX_VALUES) bad("animation trop complexe.");
      if (!isArr && FORBIDDEN_KEYS.has(key)) bad(`clé interdite (${key}).`);
      const v = node[key];
      if (typeof v === "string") {
        if (!isArr && key === "x") bad("expression (code) détectée : les expressions sont refusées.");
        if (DATA_IMAGE.test(v)) continue;
        if (EXTERNAL.test(v)) bad("adresse externe détectée : seules les animations autonomes sont acceptées.");
        if (BAD_TEXT.test(v)) bad("contenu actif détecté (script, balise ou gestionnaire d'événement).");
        if (v.length > 2000 && !DATA_IMAGE.test(v)) bad("texte anormalement long.");
        if (!isArr && key === "fPath" && v) bad("police externe détectée.");
      } else if (v && typeof v === "object") stack.push([v, depth + 1]);
    }
  }
  // Images : intégrées, ou présentes dans le conteneur dotLottie
  for (const a of Array.isArray(doc.assets) ? doc.assets : []) {
    if (!a || typeof a !== "object" || typeof a.p !== "string" || !a.p || a.layers) continue;
    if (DATA_IMAGE.test(a.p)) continue;
    if (!images) bad("image non intégrée : l'animation doit contenir ses images (pas de fichier ou d'adresse à côté).");
    const name = String(a.u || "").replace(/^\/+/, "") + a.p;
    const base = name.split("/").pop();
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,100}$/.test(base) || ![...images].some((n) => n === base)) bad(`image « ${String(a.p).slice(0, 40)} » absente du fichier .lottie.`);
  }
  return true;
}

function parseJson(buffer) {
  if (buffer.length > MAX_JSON) bad(`fichier trop lourd (${Math.round(MAX_JSON / 1048576)} Mo au plus pour une animation Lottie).`);
  let text = buffer.toString("utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  if (text.includes("\u0000")) bad("contenu binaire.");
  try { return JSON.parse(text); } catch { bad("JSON illisible."); }
}
// Reconnaît un JSON Lottie : renvoie { ok: true } ou { ok: false, reason } (reason null = ne ressemble pas à du JSON)
function checkJson(buffer) {
  let i = 0;
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) i = 3; // BOM UTF-8
  while (i < buffer.length && (buffer[i] === 0x20 || buffer[i] === 0x0a || buffer[i] === 0x0d || buffer[i] === 0x09)) i++;
  if (buffer[i] !== 0x7b) return { ok: false, reason: null };
  try { checkDocument(parseJson(buffer)); return { ok: true }; } catch (e) { if (e instanceof LottieError) return { ok: false, reason: e.message }; throw e; }
}

// ---------- ZIP (dotLottie) ----------
function readZip(buf) {
  if (buf.length < 22) bad("archive illisible.");
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) bad("archive illisible (fin introuvable).");
  const count = buf.readUInt16LE(eocd + 10), cdSize = buf.readUInt32LE(eocd + 12), cdOffset = buf.readUInt32LE(eocd + 16);
  if (count > MAX_ENTRIES) bad(`trop de fichiers dans l'archive (${MAX_ENTRIES} au plus).`);
  if (cdOffset + cdSize > buf.length) bad("archive corrompue.");
  const entries = [];
  let p = cdOffset;
  for (let n = 0; n < count; n++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) bad("archive corrompue.");
    const flags = buf.readUInt16LE(p + 8), method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32), local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    if (flags & 1) bad("archive chiffrée refusée.");
    if (method !== 0 && method !== 8) bad("méthode de compression non prise en charge.");
    entries.push({ name, method, csize, usize, local });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}
function extract(buf, e) {
  if (e.local + 30 > buf.length || buf.readUInt32LE(e.local) !== 0x04034b50) bad("archive corrompue.");
  const start = e.local + 30 + buf.readUInt16LE(e.local + 26) + buf.readUInt16LE(e.local + 28);
  if (start + e.csize > buf.length) bad("archive corrompue.");
  const raw = buf.subarray(start, start + e.csize);
  if (e.usize > MAX_ZIP_TOTAL) bad("contenu décompressé trop volumineux.");
  if (e.method === 0) return raw;
  try { return zlib.inflateRawSync(raw, { maxOutputLength: Math.min(e.usize + 1, MAX_ZIP_TOTAL) }); } catch { bad("décompression refusée (archive corrompue ou trop volumineuse)."); }
}
const NAME = /^(?:manifest\.json|(?:animations|a)\/[A-Za-z0-9][A-Za-z0-9_.-]{0,80}\.json|(?:images|i)\/[A-Za-z0-9][A-Za-z0-9_.-]{0,80}\.(?:png|jpe?g|webp|gif))$/;
const imageKind = (b) => (b.length > 12 && b[0] === 0x89 && b.toString("latin1", 1, 4) === "PNG") || (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) || (b.length > 10 && b.toString("latin1", 0, 3) === "GIF") || (b.length > 12 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP");

// Reconnaît un dotLottie : { ok: true, animations: n } ou { ok: false, reason }
function checkLottieZip(buffer) {
  try {
    if (buffer.length > MAX_ZIP_TOTAL) bad("fichier trop lourd.");
    const entries = readZip(buffer);
    let total = 0;
    const files = new Map();
    for (const e of entries) {
      if (e.name.endsWith("/")) continue; // dossier
      if (!NAME.test(e.name)) bad(`fichier non autorisé dans l'archive (${e.name.slice(0, 60)}).`);
      if (files.has(e.name)) bad("fichier en double dans l'archive.");
      total += e.usize; if (total > MAX_ZIP_TOTAL) bad("contenu décompressé trop volumineux.");
      files.set(e.name, e);
    }
    if (!files.has("manifest.json")) bad("manifest.json manquant : ce n'est pas un fichier dotLottie.");
    const manifest = parseJson(extract(buffer, files.get("manifest.json")));
    if (!manifest || !Array.isArray(manifest.animations) || !manifest.animations.length || manifest.animations.length > 10) bad("manifest.json invalide (liste d'animations).");
    const images = new Set();
    for (const [name, e] of files) if (/^(?:images|i)\//.test(name)) { if (!imageKind(extract(buffer, e))) bad(`image invalide (${name.slice(0, 60)}).`); images.add(name.split("/").pop()); }
    let n = 0;
    for (const a of manifest.animations) {
      if (!a || typeof a.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,80}$/.test(a.id)) bad("manifest.json : identifiant d'animation invalide.");
      const e = files.get(`animations/${a.id}.json`) || files.get(`a/${a.id}.json`);
      if (!e) bad(`animation « ${a.id.slice(0, 40)} » absente de l'archive.`);
      checkDocument(parseJson(extract(buffer, e)), { images }); n++;
    }
    return { ok: true, animations: n };
  } catch (e) { if (e instanceof LottieError) return { ok: false, reason: e.message }; throw e; }
}

module.exports = { checkJson, checkLottieZip, checkDocument, readZip, MAX_JSON, MAX_ZIP_TOTAL, LottieError };
