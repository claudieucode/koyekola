// Produits numériques : fichiers privés, droits de téléchargement créés à l'encaissement, liens signés, limites (nombre et durée), révocation au remboursement total.
// Les fichiers sont rangés dans DATA_DIR/shop-files (jamais sous /uploads, qui est public), sous un nom aléatoire ; ils ne sortent que par `resolve` + `consume`.
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { dataDir } = require("../../config/paths");
const { MarketingError } = require("../errors");

const DIR = path.join(dataDir, "shop-files");
const MAX_BYTES = 25 * 1024 * 1024;
const DEFAULT_LIMIT = 5, DEFAULT_DAYS = 30;
// Extensions acceptées → type servi (toujours en pièce jointe, jamais affiché dans le navigateur). Aucun exécutable, script, page web ni SVG.
const TYPES = { ".pdf": "application/pdf", ".zip": "application/zip", ".epub": "application/epub+zip", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".wav": "audio/wav", ".mp4": "video/mp4", ".webm": "video/webm", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".txt": "text/plain", ".csv": "text/csv", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation" };
const siteCond = (s) => (s.siteId == null ? "site_id IS NULL" : "site_id = ?");
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const secret = () => process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || "kolakisa-dev";
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max);

function magicOk(ext, buf) {
  const head = buf.subarray(0, 12);
  const starts = (b) => b.every((x, i) => head[i] === x);
  switch (ext) {
    case ".pdf": return starts([0x25, 0x50, 0x44, 0x46]);
    case ".zip": case ".docx": case ".xlsx": case ".pptx": case ".epub": return starts([0x50, 0x4b]);
    case ".png": return starts([0x89, 0x50, 0x4e, 0x47]);
    case ".jpg": case ".jpeg": return starts([0xff, 0xd8, 0xff]);
    case ".webp": return head.toString("latin1", 0, 4) === "RIFF" && head.toString("latin1", 8, 12) === "WEBP";
    case ".mp3": return starts([0x49, 0x44, 0x33]) || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0);
    case ".mp4": case ".m4a": return head.toString("latin1", 4, 8) === "ftyp";
    case ".wav": return head.toString("latin1", 0, 4) === "RIFF";
    case ".webm": return starts([0x1a, 0x45, 0xdf, 0xa3]);
    case ".txt": case ".csv": return !buf.subarray(0, 2000).includes(0); // texte : aucun octet nul
    default: return false;
  }
}

function addFile(s, productId, { label, buffer, originalName }) {
  const product = s.db.prepare(`SELECT id, type FROM mk_shop_products WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(productId), s.organizationId, ...siteArgs(s));
  if (!product) throw new MarketingError("not_found", "Produit introuvable.");
  if (product.type !== "digital") throw new MarketingError("invalid", "Les fichiers à télécharger ne se joignent qu'à un produit de type « Numérique ».");
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new MarketingError("invalid", "Choisissez un fichier.");
  if (buffer.length > MAX_BYTES) throw new MarketingError("invalid", "Fichier trop volumineux (25 Mo au plus).");
  const ext = path.extname(String(originalName || "")).toLowerCase();
  if (!TYPES[ext]) throw new MarketingError("invalid", `Format non accepté. Formats acceptés : ${Object.keys(TYPES).join(", ")}.`);
  if (!magicOk(ext, buffer)) throw new MarketingError("invalid", "Le contenu du fichier ne correspond pas à son format.");
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 });
  const stored = `${crypto.randomBytes(16).toString("hex")}${ext}`;
  fs.writeFileSync(path.join(DIR, stored), buffer, { mode: 0o600 });
  const safeName = clean(path.basename(String(originalName)).replace(/[^\w.\- ()]/g, "_"), 120) || `fichier${ext}`;
  const id = Number(s.db.prepare("INSERT INTO mk_shop_product_files (organization_id, site_id, product_id, label, stored_name, original_name, mime, size_bytes, sha256) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(s.organizationId, s.siteId ?? null, product.id, clean(label, 120) || safeName, stored, safeName, TYPES[ext], buffer.length, crypto.createHash("sha256").update(buffer).digest("hex")).lastInsertRowid);
  return id;
}
const listFiles = (s, productId) => s.db.prepare(`SELECT id, label, original_name, mime, size_bytes, created_at FROM mk_shop_product_files WHERE product_id = ? AND organization_id = ? AND ${siteCond(s)} ORDER BY id`).all(Number(productId), s.organizationId, ...siteArgs(s));
function removeFile(s, fileId) {
  const f = s.db.prepare(`SELECT * FROM mk_shop_product_files WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(fileId), s.organizationId, ...siteArgs(s));
  if (!f) throw new MarketingError("not_found", "Fichier introuvable.");
  s.db.prepare("DELETE FROM mk_shop_product_files WHERE id = ?").run(f.id);
  try { fs.unlinkSync(path.join(DIR, f.stored_name)); } catch { /* déjà absent */ }
}

// À l'encaissement : un droit par fichier et par ligne de commande (idempotent). Ne lève jamais.
function grant(s, orderId) {
  try {
    const order = s.db.prepare("SELECT id, paid_at FROM mk_shop_orders WHERE id = ? AND organization_id = ?").get(orderId, s.organizationId);
    if (!order || !order.paid_at) return 0;
    const rows = s.db.prepare(`SELECT i.id item_id, f.id file_id, p.download_limit, p.download_days FROM mk_shop_order_items i
      JOIN mk_shop_products p ON p.id = i.product_id JOIN mk_shop_product_files f ON f.product_id = p.id WHERE i.order_id = ?`).all(orderId);
    let n = 0;
    for (const r of rows) {
      const lim = r.download_limit == null ? DEFAULT_LIMIT : r.download_limit; const days = r.download_days == null ? DEFAULT_DAYS : r.download_days;
      const exp = days > 0 ? new Date(Date.now() + days * 86400000).toISOString().slice(0, 19).replace("T", " ") : null;
      n += s.db.prepare("INSERT OR IGNORE INTO mk_shop_downloads (organization_id, site_id, order_id, order_item_id, file_id, max_downloads, expires_at) VALUES (?,?,?,?,?,?,?)").run(s.organizationId, s.siteId ?? null, orderId, r.item_id, r.file_id, lim > 0 ? lim : null, exp).changes;
    }
    return n;
  } catch (error) { console.error(`[KOLAKISA] Boutique : droits de téléchargement (commande ${orderId}) : ${error.message}`); return 0; }
}
const revokeForOrder = (db, orderId) => db.prepare("UPDATE mk_shop_downloads SET revoked = 1 WHERE order_id = ?").run(orderId).changes;

const sign = (id) => crypto.createHmac("sha256", secret()).update(`shop-download:${id}`).digest("hex").slice(0, 32);
const tokenOf = (id) => `${id}-${sign(id)}`;
function parseToken(token) {
  const m = /^(\d{1,12})-([0-9a-f]{32})$/.exec(String(token || ""));
  if (!m) return null;
  const a = Buffer.from(sign(m[1])), b = Buffer.from(m[2]);
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? Number(m[1]) : null;
}

// Liste (pour la page de commande de l'acheteur)
function forOrder(s, orderId) {
  return s.db.prepare(`SELECT d.id, d.max_downloads, d.download_count, d.expires_at, d.revoked, f.label, f.original_name, f.size_bytes FROM mk_shop_downloads d JOIN mk_shop_product_files f ON f.id = d.file_id WHERE d.order_id = ? AND d.organization_id = ? ORDER BY d.id`).all(orderId, s.organizationId)
    .map((d) => ({ ...d, token: tokenOf(d.id), state: stateOf(d) }));
}
function stateOf(d, now = Date.now()) {
  if (d.revoked) return "revoked";
  if (d.expires_at && Date.parse(`${String(d.expires_at).replace(" ", "T")}Z`) < now) return "expired";
  if (d.max_downloads != null && d.download_count >= d.max_downloads) return "exhausted";
  return "ok";
}

// Vérifie le lien et les conditions ; ne consomme rien. → { ok, reason?, row?, path? }
function resolve(s, token) {
  const id = parseToken(token);
  if (!id) return { ok: false, reason: "invalid" };
  const row = s.db.prepare(`SELECT d.*, f.stored_name, f.original_name, f.mime, f.size_bytes, o.status ostatus, o.paid_at, o.payment_status FROM mk_shop_downloads d JOIN mk_shop_product_files f ON f.id = d.file_id JOIN mk_shop_orders o ON o.id = d.order_id WHERE d.id = ? AND d.organization_id = ? AND d.${siteCond(s)}`).get(id, s.organizationId, ...siteArgs(s));
  if (!row) return { ok: false, reason: "invalid" };
  if (!row.paid_at || row.ostatus === "cancelled" || row.ostatus === "refunded") return { ok: false, reason: "revoked" };
  const st = stateOf(row);
  if (st !== "ok") return { ok: false, reason: st };
  const file = path.join(DIR, row.stored_name);
  if (!file.startsWith(DIR + path.sep) || !fs.existsSync(file)) return { ok: false, reason: "missing" };
  return { ok: true, row, path: file };
}
// Compte le téléchargement de façon atomique (deux demandes simultanées ne dépassent jamais la limite)
const consume = (s, id) => s.db.prepare("UPDATE mk_shop_downloads SET download_count = download_count + 1, last_download_at = datetime('now') WHERE id = ? AND revoked = 0 AND (max_downloads IS NULL OR download_count < max_downloads)").run(id).changes === 1;

module.exports = { DIR, TYPES, MAX_BYTES, addFile, listFiles, removeFile, grant, revokeForOrder, forOrder, resolve, consume, tokenOf, parseToken, stateOf };
