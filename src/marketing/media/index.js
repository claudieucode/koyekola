// Médiathèque de KOLAKISA Marketing : images (et documents PDF) insérés dans les e-mails, une par organisation.
// Le TYPE est lu dans le contenu du fichier (signature), jamais dans le nom ni dans le type déclaré par le navigateur ;
// l'extension enregistrée en découle. SVG refusé (il peut contenir du script). Les dimensions sont lues dans l'en-tête
// de l'image. Le fichier est conservé dans le dossier des fichiers envoyés (UPLOADS_DIR : survit aux déploiements) et
// servi à une adresse publique permanente — un e-mail n'utilise jamais une adresse temporaire du navigateur.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { uploadsRoot } = require("../../config/paths");
const { checkCtx, audit, MarketingError } = require("../audience/shared");
const { removeUploadedFile } = require("../../utils/uploads");

const MAX_IMAGE = 5 * 1024 * 1024; // une image d'e-mail au-delà de 5 Mo n'a pas de sens (chargement, filtres)
const MAX_DOCUMENT = 10 * 1024 * 1024;
const PUBLIC_BASE = "/uploads/marketing";

// ---------- Type réel du fichier (signature) ----------
function sniff(buf) {
  const b = buf;
  if (b.length >= 24 && b[0] === 0x89 && b.toString("latin1", 1, 4) === "PNG") return { kind: "image", mime: "image/png", ext: ".png", width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b.length >= 10 && b.toString("latin1", 0, 3) === "GIF") return { kind: "image", mime: "image/gif", ext: ".gif", width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { kind: "image", mime: "image/jpeg", ext: ".jpg", ...jpegSize(b) };
  if (b.length >= 30 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP") return { kind: "image", mime: "image/webp", ext: ".webp", ...webpSize(b) };
  if (b.length >= 5 && b.toString("latin1", 0, 5) === "%PDF-") return { kind: "document", mime: "application/pdf", ext: ".pdf", width: null, height: null };
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

// Explication claire pour un fichier refusé (jamais d'acceptation silencieuse)
function refuse(originalName, declared) {
  const ext = path.extname(String(originalName || "")).toLowerCase();
  if (ext === ".svg" || declared === "image/svg+xml") return "Les images SVG ne sont pas acceptées : elles peuvent contenir du code et la plupart des messageries ne les affichent pas. Exportez-la en PNG.";
  if (/^video\//.test(declared || "") || [".mp4", ".webm", ".mov", ".m4v"].includes(ext)) return "Un e-mail ne peut pas lire de vidéo. Publiez-la (YouTube, Vimeo…) puis utilisez le bloc « Vidéo » avec son adresse : le message affichera une miniature cliquable.";
  return "Format non pris en charge : images JPEG, PNG, GIF ou WebP, et documents PDF uniquement.";
}

const displayName = (original) => String(original || "fichier").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, 120) || "fichier";
const publicUrl = (ctx, p) => `${String(ctx.baseUrl || "").replace(/\/+$/, "")}${p}`;
const shape = (ctx, row) => (row ? { id: row.id, kind: row.kind, name: row.name, mime: row.mime, size: row.size, width: row.width, height: row.height, alt: row.alt, path: row.path, url: publicUrl(ctx, row.path), createdAt: row.created_at } : null);

function saveUpload(ctx, { buffer, originalName, declaredType }) {
  checkCtx(ctx);
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new MarketingError("invalid_field", "Fichier vide.");
  const info = sniff(buffer);
  if (!info) throw new MarketingError("invalid_field", refuse(originalName, declaredType));
  const max = info.kind === "image" ? MAX_IMAGE : MAX_DOCUMENT;
  if (buffer.length > max) throw new MarketingError("invalid_field", `Fichier trop lourd (${(buffer.length / 1048576).toFixed(1)} Mo) : ${max / 1048576} Mo au plus pour ${info.kind === "image" ? "une image" : "un document"}.`);
  if (info.kind === "image" && (!info.width || !info.height)) throw new MarketingError("invalid_field", "Image illisible : ses dimensions n'ont pas pu être lues.");
  const dir = path.join(uploadsRoot, "marketing", String(ctx.organizationId));
  fs.mkdirSync(dir, { recursive: true });
  const file = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${info.ext}`;
  fs.writeFileSync(path.join(dir, file), buffer);
  const publicPath = `${PUBLIC_BASE}/${ctx.organizationId}/${file}`;
  const row = ctx.db
    .prepare("INSERT INTO mk_media (organization_id, kind, path, name, mime, size, width, height, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *")
    .get(ctx.organizationId, info.kind, publicPath, displayName(originalName), info.mime, buffer.length, info.width || null, info.height || null, ctx.userId ?? null);
  audit(ctx, "media.uploaded", "media", row.id, { kind: info.kind, size: buffer.length });
  return shape(ctx, row);
}

function listMedia(ctx, { q = "", kind = "", limit = 40, offset = 0 } = {}) {
  checkCtx(ctx);
  const where = ["organization_id = ?"];
  const args = [ctx.organizationId];
  if (kind === "image" || kind === "document") { where.push("kind = ?"); args.push(kind); }
  const text = String(q || "").trim().slice(0, 100);
  if (text) { where.push("(name LIKE ? ESCAPE '\\' OR alt LIKE ? ESCAPE '\\')"); const like = `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`; args.push(like, like); }
  const n = Math.min(Math.max(Number(limit) || 40, 1), 100);
  const o = Math.max(Number(offset) || 0, 0);
  const rows = ctx.db.prepare(`SELECT * FROM mk_media WHERE ${where.join(" AND ")} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args, n, o);
  const total = ctx.db.prepare(`SELECT COUNT(*) n FROM mk_media WHERE ${where.join(" AND ")}`).get(...args).n;
  return { items: rows.map((r) => shape(ctx, r)), total, more: o + rows.length < total };
}

const getMedia = (ctx, id) => (checkCtx(ctx), shape(ctx, Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_media WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null));

function updateMedia(ctx, id, { name, alt } = {}) {
  const current = getMedia(ctx, id);
  if (!current) throw new MarketingError("not_found", "Fichier introuvable.");
  const next = {
    name: name === undefined ? current.name : displayName(name),
    alt: alt === undefined ? current.alt : String(alt).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 200),
  };
  ctx.db.prepare("UPDATE mk_media SET name = ?, alt = ? WHERE id = ? AND organization_id = ?").run(next.name, next.alt, id, ctx.organizationId);
  return getMedia(ctx, id);
}

// Modèles de l'organisation qui utilisent ce fichier (son chemin apparaît dans leurs blocs)
function mediaUsage(ctx, media) {
  return ctx.db.prepare("SELECT id, name FROM mk_templates WHERE organization_id = ? AND blocks LIKE ? ESCAPE '\\'").all(ctx.organizationId, `%${media.path.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
}

function deleteMedia(ctx, id) {
  const media = getMedia(ctx, id);
  if (!media) throw new MarketingError("not_found", "Fichier introuvable.");
  const used = mediaUsage(ctx, media);
  if (used.length) throw new MarketingError("invalid_state", `Ce fichier est utilisé par ${used.length} modèle${used.length > 1 ? "s" : ""} (${used.slice(0, 3).map((t) => `« ${t.name} »`).join(", ")}${used.length > 3 ? "…" : ""}) : retirez-le d'abord de ${used.length > 1 ? "ces modèles" : "ce modèle"}.`);
  // Les e-mails déjà envoyés pointent vers ce fichier : il n'est retiré du disque que s'il n'a jamais servi dans une campagne lancée
  const sent = ctx.db.prepare("SELECT 1 FROM mk_campaigns WHERE organization_id = ? AND snapshot LIKE ? ESCAPE '\\' LIMIT 1").get(ctx.organizationId, `%${media.path.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  // Fiche et fichier ensemble : si l'effacement du fichier échoue, la fiche est rétablie (jamais de fichier sans fiche)
  ctx.db.exec("SAVEPOINT mk_media_delete");
  try {
    ctx.db.prepare("DELETE FROM mk_media WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
    if (!sent) removeUploadedFile(media.path, "fichier de la médiathèque marketing supprimé");
    ctx.db.exec("RELEASE mk_media_delete");
  } catch (error) {
    ctx.db.exec("ROLLBACK TO mk_media_delete");
    ctx.db.exec("RELEASE mk_media_delete");
    throw error;
  }
  audit(ctx, "media.deleted", "media", id, { kept: Boolean(sent) });
  return true;
}

module.exports = { saveUpload, listMedia, getMedia, updateMedia, deleteMedia, mediaUsage, sniff, MAX_IMAGE, MAX_DOCUMENT, PUBLIC_BASE };
