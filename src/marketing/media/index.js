// Médiathèque de KOLAKISA (marketing + CMS) : images, vidéos, fichiers audio et documents, une par organisation.
// Le TYPE est lu dans le contenu du fichier (signature), jamais dans le nom ni dans le type déclaré par le navigateur ;
// l'extension enregistrée en découle (liste blanche, voir sniff). SVG, HTML, scripts et exécutables sont refusés (ils
// peuvent contenir du code). Les dimensions sont lues dans l'en-tête de l'image. Le fichier est conservé dans le dossier
// des fichiers envoyés (UPLOADS_DIR : survit aux déploiements) sous un nom aléatoire (jamais le nom d'origine : aucun
// chemin n'est choisi par l'utilisateur) et servi à une adresse publique permanente : c'est la référence stable utilisée
// par les pages et les e-mails. Corbeille : suppression douce ; le fichier n'est effacé qu'à la suppression définitive,
// refusée tant qu'un contenu l'utilise.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { uploadsRoot } = require("../../config/paths");
const { checkCtx, audit, MarketingError } = require("../audience/shared");
const { removeUploadedFile } = require("../../utils/uploads");

const MAX_IMAGE = 5 * 1024 * 1024; // une image d'e-mail au-delà de 5 Mo n'a pas de sens (chargement, filtres)
const MAX_DOCUMENT = 10 * 1024 * 1024;
const MAX_AUDIO = 25 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024; // le fichier passe en mémoire pendant l'envoi : au-delà, passer par YouTube / Vimeo / Bunny
const MAX_UPLOAD = MAX_VIDEO;
const PUBLIC_BASE = "/uploads/marketing";
const TYPES = ["image", "video", "audio", "pdf", "document"];
const TYPE_LABELS = { image: "Images", video: "Vidéos", audio: "Audio", pdf: "PDF", document: "Documents" };
const LIMITS = { image: MAX_IMAGE, pdf: MAX_DOCUMENT, document: MAX_DOCUMENT, audio: MAX_AUDIO, video: MAX_VIDEO };
const LIMIT_WORDS = { image: "une image", pdf: "un PDF", document: "un document", audio: "un fichier audio", video: "une vidéo" };

// ---------- Type réel du fichier (signature) ----------
const OFFICE = {
  docx: { marker: "word/document.xml", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  xlsx: { marker: "xl/workbook.xml", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  pptx: { marker: "ppt/presentation.xml", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
};
const LEGACY_OFFICE = { doc: "application/msword", xls: "application/vnd.ms-excel", ppt: "application/vnd.ms-powerpoint" };
const extOf = (name) => path.extname(String(name || "")).toLowerCase().replace(".", "");

// `name` sert uniquement à départager les documents Office (même conteneur) : il ne décide jamais du type.
function sniff(buf, name = "") {
  const b = buf;
  const image = (mime, ext, size) => ({ kind: "image", type: "image", mime, ext, ...size });
  if (b.length >= 24 && b[0] === 0x89 && b.toString("latin1", 1, 4) === "PNG") return image("image/png", ".png", { width: b.readUInt32BE(16), height: b.readUInt32BE(20) });
  if (b.length >= 10 && b.toString("latin1", 0, 3) === "GIF") return image("image/gif", ".gif", { width: b.readUInt16LE(6), height: b.readUInt16LE(8) });
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return image("image/jpeg", ".jpg", jpegSize(b));
  if (b.length >= 30 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP") return image("image/webp", ".webp", webpSize(b));
  if (b.length >= 12 && b.toString("latin1", 4, 8) === "ftyp") {
    const brand = b.toString("latin1", 8, 12);
    if (brand === "avif" || brand === "avis") return image("image/avif", ".avif", { width: null, height: null });
    if (brand === "M4A ") return { kind: "document", type: "audio", mime: "audio/mp4", ext: ".m4a" };
    if (/^(heic|heix|hevc|mif1|msf1|qt {2}|3gp|3g2)/.test(brand)) return null; // photos HEIC, QuickTime, 3GP : pas pris en charge
    return { kind: "document", type: "video", mime: "video/mp4", ext: ".mp4" };
  }
  if (b.length >= 5 && b.toString("latin1", 0, 5) === "%PDF-") return { kind: "document", type: "pdf", mime: "application/pdf", ext: ".pdf" };
  // WebM (EBML) : le type de document doit être « webm » (un fichier Matroska .mkv est refusé)
  if (b.length >= 32 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 && b.subarray(0, 64).includes(Buffer.from("webm"))) return { kind: "document", type: "video", mime: "video/webm", ext: ".webm" };
  if (b.length >= 12 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WAVE") return { kind: "document", type: "audio", mime: "audio/wav", ext: ".wav" };
  if (b.length >= 4 && b.toString("latin1", 0, 4) === "OggS") return { kind: "document", type: "audio", mime: "audio/ogg", ext: ".ogg" };
  if (b.length >= 10 && (b.toString("latin1", 0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0))) return { kind: "document", type: "audio", mime: "audio/mpeg", ext: ".mp3" };
  // Documents Office : conteneur ZIP dont le contenu correspond à l'extension annoncée (le nom ne fait que départager)
  if (b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) {
    const ext = extOf(name);
    const def = OFFICE[ext];
    if (def && b.includes(Buffer.from(def.marker))) return { kind: "document", type: "document", mime: def.mime, ext: `.${ext}` };
    return null;
  }
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) {
    const ext = extOf(name);
    if (LEGACY_OFFICE[ext]) return { kind: "document", type: "document", mime: LEGACY_OFFICE[ext], ext: `.${ext}` };
    return null;
  }
  return null;
}
function jpegSize(b) {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  return { width: null, height: null };
}
function webpSize(b) {
  const chunk = b.toString("latin1", 12, 16);
  if (chunk === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  if (chunk === "VP8L") { const bits = b.readUInt32LE(21); return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }; }
  if (chunk === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  return { width: null, height: null };
}

const FORMATS = "images (JPEG, PNG, GIF, WebP, AVIF), vidéos (MP4, WebM), audio (MP3, WAV, OGG, M4A) et documents (PDF, Word, Excel, PowerPoint)";
// Explication claire pour un fichier refusé (jamais d'acceptation silencieuse)
function refuse(originalName, declared) {
  const ext = extOf(originalName);
  if (ext === "svg" || declared === "image/svg+xml") return "Les images SVG ne sont pas acceptées : elles peuvent contenir du code et la plupart des messageries ne les affichent pas. Utilisez un PNG ou un JPEG.";
  if (["exe", "msi", "bat", "cmd", "com", "scr", "sh", "js", "mjs", "php", "py", "rb", "pl", "jar", "apk", "dll", "html", "htm", "xhtml", "hta", "vbs", "ps1", "docm", "xlsm", "pptm"].includes(ext)) return `Ce type de fichier n'est pas autorisé (.${ext}) : un fichier exécutable ou contenant du code ne peut pas être envoyé.`;
  if (["docx", "xlsx", "pptx", "doc", "xls", "ppt"].includes(ext)) return `Ce fichier n'est pas un vrai document .${ext} : son contenu ne correspond pas à son extension.`;
  if (["mov", "mkv", "avi", "heic", "heif"].includes(ext)) return `Le format .${ext} n'est pas pris en charge : utilisez MP4 ou WebM pour une vidéo, JPEG, PNG ou WebP pour une image.`;
  return `Format non pris en charge : ce type de fichier n'est pas autorisé. Formats acceptés : ${FORMATS}.`;
}

// Nom affiché : jamais de chemin (« ../../x.png » → « x.png »), pas de caractères de contrôle
const displayName = (original) => String(original || "fichier").replace(/[\u0000-\u001f\u007f]/g, "").split(/[\\/]/).pop().replace(/\s+/g, " ").trim().slice(0, 120) || "fichier";
const clip = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const publicUrl = (ctx, p) => `${String(ctx.baseUrl || "").replace(/\/+$/, "")}${p}`;
const shape = (ctx, row) => (row ? {
  id: row.id, kind: row.kind, type: row.type || (row.kind === "image" ? "image" : "document"), name: row.name, title: row.title || "", alt: row.alt, caption: row.caption || "", description: row.description || "",
  mime: row.mime, size: row.size, width: row.width, height: row.height, path: row.path, url: publicUrl(ctx, row.path), createdAt: row.created_at, createdBy: row.created_by ?? null, deletedAt: row.deleted_at || null,
} : null);

// allow : types acceptés par l'appelant (les e-mails n'acceptent que images et PDF) ; sans allow, toute la liste blanche
function saveUpload(ctx, { buffer, originalName, declaredType, allow = null }) {
  checkCtx(ctx);
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new MarketingError("invalid_field", "Fichier vide.");
  const info = sniff(buffer, originalName);
  if (!info) throw new MarketingError("invalid_field", refuse(originalName, declaredType));
  if (allow && info.type === "video" && !allow.includes("video")) throw new MarketingError("invalid_field", "Un e-mail ne peut pas lire de vidéo. Publiez-la (YouTube, Vimeo…) puis utilisez le bloc « Vidéo » avec son adresse : le message affichera une miniature cliquable.");
  if (allow && !allow.includes(info.type)) throw new MarketingError("invalid_field", `Ce fichier est ${LIMIT_WORDS[info.type]} : ici, seuls ${allow.map((t) => TYPE_LABELS[t].toLowerCase()).join(" et ")} sont acceptés. Les autres fichiers s'envoient dans Site Web → Médias.`);
  // Limite choisie dans Paramètres → Médias (jamais au-delà du plafond du serveur)
  let max = LIMITS[info.type];
  try { const m = require("../../services/settings").main().mediaLimits; const k = info.type === "pdf" ? "document" : info.type; if (m[k]) max = Math.min(max, m[k]); } catch { /* réglages indisponibles : plafond du serveur */ }
  if (buffer.length > max) throw new MarketingError("invalid_field", `Fichier trop lourd (${(buffer.length / 1048576).toFixed(1)} Mo) : ${max / 1048576} Mo au plus pour ${LIMIT_WORDS[info.type]}.`);
  if (info.type === "image" && info.mime !== "image/avif" && (!info.width || !info.height)) throw new MarketingError("invalid_field", "Image illisible : ses dimensions n'ont pas pu être lues.");
  const dir = path.join(uploadsRoot, "marketing", String(ctx.organizationId));
  fs.mkdirSync(dir, { recursive: true });
  const file = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${info.ext}`; // nom entièrement fabriqué ici
  fs.writeFileSync(path.join(dir, file), buffer);
  const publicPath = `${PUBLIC_BASE}/${ctx.organizationId}/${file}`;
  const row = ctx.db
    .prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, width, height, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *")
    .get(ctx.organizationId, info.kind, info.type, publicPath, displayName(originalName), info.mime, buffer.length, info.width || null, info.height || null, ctx.userId ?? null);
  audit(ctx, "media.uploaded", "media", row.id, { type: info.type, size: buffer.length });
  return shape(ctx, row);
}

const SORTS = { recent: "id DESC", ancien: "id ASC", nom: "name COLLATE NOCASE ASC, id DESC", nom_desc: "name COLLATE NOCASE DESC, id DESC", taille: "size DESC, id DESC" };
// type : un des TYPES, ou « documents » (PDF + documents Office). kind (historique, e-mails) : « image » ou « document »
// (PDF et documents Office : jamais les vidéos ni l'audio). trashed : la corbeille. from : date (AAAA-MM-JJ HH:MM:SS) minimale.
function listMedia(ctx, { q = "", kind = "", type = "", trashed = false, sort = "recent", from = "", limit = 40, offset = 0 } = {}) {
  checkCtx(ctx);
  const where = ["organization_id = ?", trashed ? "deleted_at IS NOT NULL" : "deleted_at IS NULL"];
  const args = [ctx.organizationId];
  if (kind === "image") where.push("type = 'image'");
  else if (kind === "document") where.push("type IN ('pdf', 'document')");
  if (type === "documents") where.push("type IN ('pdf', 'document')");
  else if (TYPES.includes(type)) { where.push("type = ?"); args.push(type); }
  if (/^\d{4}-\d{2}-\d{2}/.test(String(from))) { where.push("created_at >= ?"); args.push(String(from).slice(0, 19)); }
  const text = String(q || "").trim().slice(0, 100);
  if (text) {
    const like = `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    where.push("(name LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\' OR alt LIKE ? ESCAPE '\\' OR caption LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')");
    args.push(like, like, like, like, like);
  }
  const n = Math.min(Math.max(Number(limit) || 40, 1), 100);
  const o = Math.max(Number(offset) || 0, 0);
  const rows = ctx.db.prepare(`SELECT * FROM mk_media WHERE ${where.join(" AND ")} ORDER BY ${SORTS[sort] || SORTS.recent} LIMIT ? OFFSET ?`).all(...args, n, o);
  const total = ctx.db.prepare(`SELECT COUNT(*) n FROM mk_media WHERE ${where.join(" AND ")}`).get(...args).n;
  return { items: rows.map((r) => shape(ctx, r)), total, more: o + rows.length < total };
}
// Compteurs de la bibliothèque (hors corbeille) par type, et corbeille
function mediaCounts(ctx) {
  checkCtx(ctx);
  const rows = ctx.db.prepare("SELECT type, COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL GROUP BY type").all(ctx.organizationId);
  const by = Object.fromEntries(rows.map((r) => [r.type, r.n]));
  const counts = Object.fromEntries(TYPES.map((t) => [t, by[t] || 0]));
  counts.documents = counts.pdf + counts.document;
  counts.all = TYPES.reduce((s, t) => s + counts[t], 0);
  counts.trash = ctx.db.prepare("SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NOT NULL").get(ctx.organizationId).n;
  return counts;
}

const getMedia = (ctx, id) => (checkCtx(ctx), shape(ctx, Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_media WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null));

function updateMedia(ctx, id, { name, alt, title, caption, description } = {}) {
  const current = getMedia(ctx, id);
  if (!current) throw new MarketingError("not_found", "Fichier introuvable.");
  const next = {
    name: name === undefined ? current.name : displayName(name),
    alt: alt === undefined ? current.alt : clip(alt, 200),
    title: title === undefined ? current.title : clip(title, 150),
    caption: caption === undefined ? current.caption : clip(caption, 300),
    description: description === undefined ? current.description : clip(description, 1000),
  };
  ctx.db.prepare("UPDATE mk_media SET name = ?, alt = ?, title = ?, caption = ?, description = ? WHERE id = ? AND organization_id = ?").run(next.name, next.alt, next.title, next.caption, next.description, id, ctx.organizationId);
  return getMedia(ctx, id);
}

// Ce qui utilise ce fichier dans l'organisation : modèles d'e-mails (blocs), pages (en ligne ou brouillon, Site Web et
// Tunnels), modèles de pages, composants réutilisables et réglages des sites — son chemin apparaît dans leur contenu
const likeOf = (p) => `%${p.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
function mediaUsage(ctx, media) {
  const like = likeOf(media.path);
  const db = ctx.db, org = ctx.organizationId;
  const safe = (fn) => { try { return fn(); } catch (e) { if (/no such (table|column)/i.test(e.message)) return []; throw e; } };
  const templates = db.prepare("SELECT id, name, 'modèle' AS kind FROM mk_templates WHERE organization_id = ? AND blocks LIKE ? ESCAPE '\\'").all(org, like);
  const pages = db.prepare("SELECT id, name, 'page' AS kind FROM mk_landing_pages WHERE organization_id = ? AND (sections LIKE ? ESCAPE '\\' OR draft LIKE ? ESCAPE '\\' OR seo LIKE ? ESCAPE '\\')").all(org, like, like, like);
  const components = db.prepare("SELECT id, name, 'composant' AS kind FROM mk_web_components WHERE organization_id = ? AND section LIKE ? ESCAPE '\\'").all(org, like);
  const pageTemplates = safe(() => db.prepare("SELECT id, name, 'modèle de page' AS kind FROM mk_page_templates WHERE organization_id = ? AND content LIKE ? ESCAPE '\\'").all(org, like));
  const sites = safe(() => db.prepare("SELECT id, name, 'site' AS kind FROM mk_sites WHERE organization_id = ? AND (tokens LIKE ? ESCAPE '\\' OR settings LIKE ? ESCAPE '\\')").all(org, like, like));
  // Articles (image mise en avant, images de partage, images dans le texte) : le texte cite l'adresse du fichier
  const articles = safe(() => db.prepare("SELECT id, title AS name, 'article' AS kind FROM posts WHERE featured_media_id = ? OR cover_path = ? OR og_image_path = ? OR twitter_image_path = ? OR content LIKE ? ESCAPE '\\'").all(media.id, media.path, media.path, media.path, like));
  return [...templates, ...pages, ...components, ...pageTemplates, ...sites, ...articles];
}
const usageHref = (u) => ({ page: `/marketing/pages/${u.id}`, composant: `/marketing/site-web/composants/${u.id}/editeur`, site: `/marketing/site-web/sites/${u.id}`, modèle: `/marketing/modeles/${u.id}`, article: `/formateur/blog/${u.id}/modifier` }[u.kind] || null);

// Suppression définitive : refusée si un contenu utilise le fichier ; le fichier n'est retiré du disque que s'il n'a
// jamais servi dans une campagne lancée (les e-mails déjà envoyés pointent vers lui)
function removeMedia(ctx, media) {
  const used = mediaUsage(ctx, media);
  if (used.length) throw new MarketingError("invalid_state", `Ce fichier est utilisé par ${used.length} élément${used.length > 1 ? "s" : ""} (${used.slice(0, 3).map((t) => `${t.kind} « ${t.name} »`).join(", ")}${used.length > 3 ? "…" : ""}) : retirez-le d'abord de ${used.length > 1 ? "ces contenus" : "ce contenu"}.`);
  const sent = ctx.db.prepare("SELECT 1 FROM mk_campaigns WHERE organization_id = ? AND snapshot LIKE ? ESCAPE '\\' LIMIT 1").get(ctx.organizationId, likeOf(media.path));
  // Fiche et fichier ensemble : si l'effacement du fichier échoue, la fiche est rétablie (jamais de fichier sans fiche)
  ctx.db.exec("SAVEPOINT mk_media_delete");
  try {
    ctx.db.prepare("DELETE FROM mk_media WHERE id = ? AND organization_id = ?").run(media.id, ctx.organizationId);
    if (!sent) removeUploadedFile(media.path, "fichier de la médiathèque supprimé définitivement");
    ctx.db.exec("RELEASE mk_media_delete");
  } catch (error) {
    ctx.db.exec("ROLLBACK TO mk_media_delete");
    ctx.db.exec("RELEASE mk_media_delete");
    throw error;
  }
  audit(ctx, "media.deleted", "media", media.id, { kept: Boolean(sent) });
  return true;
}
function deleteMedia(ctx, id) {
  const media = getMedia(ctx, id);
  if (!media) throw new MarketingError("not_found", "Fichier introuvable.");
  return removeMedia(ctx, media);
}
// Corbeille : le fichier reste en place (les contenus qui l'utilisent continuent de l'afficher) ; restaurable
function trashMedia(ctx, id) {
  const media = getMedia(ctx, id);
  if (!media) throw new MarketingError("not_found", "Fichier introuvable.");
  if (media.deletedAt) return media;
  ctx.db.prepare("UPDATE mk_media SET deleted_at = datetime('now'), deleted_by = ? WHERE id = ? AND organization_id = ?").run(ctx.userId ?? null, id, ctx.organizationId);
  audit(ctx, "media.trashed", "media", id, {});
  return getMedia(ctx, id);
}
function restoreMedia(ctx, id) {
  const media = getMedia(ctx, id);
  if (!media) throw new MarketingError("not_found", "Fichier introuvable.");
  ctx.db.prepare("UPDATE mk_media SET deleted_at = NULL, deleted_by = NULL WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
  audit(ctx, "media.restored", "media", id, {});
  return getMedia(ctx, id);
}
// Suppression définitive depuis la corbeille seulement
function purgeMedia(ctx, id) {
  const media = getMedia(ctx, id);
  if (!media) throw new MarketingError("not_found", "Fichier introuvable.");
  if (!media.deletedAt) throw new MarketingError("invalid_state", "Mettez d'abord le fichier à la corbeille : il ne peut être supprimé définitivement que depuis la corbeille.");
  return removeMedia(ctx, media);
}

module.exports = {
  saveUpload, listMedia, mediaCounts, getMedia, updateMedia, deleteMedia, trashMedia, restoreMedia, purgeMedia, mediaUsage, usageHref, sniff,
  MAX_IMAGE, MAX_DOCUMENT, MAX_AUDIO, MAX_VIDEO, MAX_UPLOAD, PUBLIC_BASE, TYPES, TYPE_LABELS, FORMATS, SORTS,
};
