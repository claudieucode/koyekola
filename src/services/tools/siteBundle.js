// Sauvegarde d'UN site avec ses médias (R5, décision D6) : paquet « kolakisa-site-bundle@1 ».
//   exporter  : contenu du site (export « kolakisa-site@1 » des types de portée site) + les fichiers qui lui appartiennent ou que son contenu référence ;
//   inspecter : validation COMPLÈTE d'un paquet, sans rien écrire (structure, bornes, sommes de contrôle, type réel des fichiers, chemins) ;
//   planifier : ce que ferait la restauration (fichiers réutilisés / créés, analyse de l'import), sans rien écrire ;
//   restaurer : écrit les fichiers (création exclusive) et leurs fiches dans l'espace du site CIBLE, applique le contenu par le moteur d'import existant,
//               et défait ses propres écritures en cas d'échec. Aucune donnée d'un autre site n'est lue en écriture ni modifiée.
// Format (documenté dans docs/r5-medias-et-sauvegarde-par-site-2026-10-16/format-paquet-site.md) :
//   "KKSITE1\n" | longueur du manifeste (uint32 BE) | manifeste JSON (UTF-8) | octets des fichiers, bout à bout, dans l'ordre du manifeste
// Les chemins d'origine écrits dans le paquet ne servent JAMAIS de chemin sur le disque : un fichier restauré reçoit une adresse fabriquée ici.
const crypto = require("node:crypto");
const primarySite = require("../primarySite"); // R9-4 : la ligne dédiée du site principal n'est pas un site ordinaire
const fs = require("node:fs");
const db = require("../../config/database");
const media = require("../../marketing/media");
const exporter = require("./exporter");
const importer = require("./importer");

const FORMAT = "kolakisa-site-bundle@1";
const MAGIC = Buffer.from("KKSITE1\n", "latin1");
const MAX_MANIFEST = 24 * 1024 * 1024;
const MAX_FILES = 500;
const MAX_TOTAL = 400 * 1024 * 1024;
const SITE_TYPES = ["site", "settings", "pages", "menus", "redirects"]; // types d'export de portée « site »
const sha = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const SHA = /^[0-9a-f]{64}$/;
const ORIGIN = /^\/uploads\/marketing\/\d{1,9}\/(?:site-\d{1,9}\/)?[A-Za-z0-9][A-Za-z0-9_.-]{0,150}$/;
const REFS = /\/uploads\/marketing\/\d{1,9}\/(?:site-\d{1,9}\/)?[A-Za-z0-9][A-Za-z0-9_.-]{0,150}/g;
const LIMITS = { image: media.MAX_IMAGE, pdf: media.MAX_DOCUMENT, document: media.MAX_DOCUMENT, audio: media.MAX_AUDIO, video: media.MAX_VIDEO };
const fail = (message) => Object.assign(new Error(message), { user: true });

// Contexte de média de CE site : un accès limité ne voit que son site ; l'équipe, le site choisi + les médias communs
const mediaCtx = (ctx, siteId) => ({ ...ctx, siteFilter: undefined, siteScope: undefined, ...(ctx.orgLevel ? { siteFilter: siteId } : { siteScope: siteId }) });
const syncApi = (ctx) => ({ ctx, setTotal() {}, advance() {}, reset() {}, message() {}, cancelled: () => false, yieldTurn: () => Promise.resolve() });

// ---------- Export ----------
async function build(ctx, { siteId }) {
  if (!Number.isInteger(siteId)) throw fail("Choisissez un site : le site principal n'a pas de paquet de sauvegarde.");
  if (!ctx.can("media.read")) throw fail("La sauvegarde d'un site avec ses médias demande le droit de lire les médias.");
  const mctx = mediaCtx(ctx, siteId);
  const out = await exporter.build(ctx, syncApi(ctx), { types: SITE_TYPES, siteId });
  if (out.cancelled) throw fail("Export annulé.");
  const data = JSON.parse(out.text);
  // Fichiers : ceux du site + ceux que le contenu référence (seulement ceux que cette personne a le droit de voir)
  const wanted = new Map();
  const add = (row) => { if (row && !wanted.has(row.path)) wanted.set(row.path, row); };
  for (const row of db.prepare("SELECT * FROM mk_media WHERE organization_id = ? AND reach = 'site' AND site_id = ? AND deleted_at IS NULL ORDER BY id").all(ctx.organizationId, siteId)) add(row);
  const vis = media.visibleSql(mctx);
  for (const p of new Set(JSON.stringify(data.resources).match(REFS) || [])) add(db.prepare(`SELECT * FROM mk_media WHERE organization_id = ? AND path = ? AND deleted_at IS NULL AND ${vis.sql}`).get(ctx.organizationId, p, ...vis.params));
  if (wanted.size > MAX_FILES) throw fail(`Trop de fichiers pour un paquet (${wanted.size}, ${MAX_FILES} au plus).`);
  const files = []; const chunks = []; const missing = []; let offset = 0;
  for (const row of wanted.values()) {
    const where = media.parsePublicPath(ctx, row.path);
    let bytes = null;
    try { bytes = where ? fs.readFileSync(where.absolute) : null; } catch { bytes = null; }
    if (!bytes) { missing.push(row.path); continue; } // fiche sans fichier : signalée, jamais inventée
    if (offset + bytes.length > MAX_TOTAL) throw fail("Paquet trop volumineux : réduisez les médias du site.");
    files.push({ id: `f${files.length + 1}`, path: row.path, name: row.name, mime: row.mime, kind: row.kind, type: row.type, size: bytes.length, sha256: sha(bytes), offset, length: bytes.length,
      width: row.width, height: row.height, alt: row.alt || "", title: row.title || "", caption: row.caption || "", description: row.description || "", reach: row.reach });
    chunks.push(bytes); offset += bytes.length;
  }
  const dataText = JSON.stringify(data);
  const manifest = { format: FORMAT, createdAt: new Date().toISOString(), generator: "KOLAKISA CMS", source: { siteId, siteName: data.source.siteName }, dataSha256: sha(Buffer.from(dataText)), data, files, missing };
  const head = Buffer.from(JSON.stringify(manifest));
  const len = Buffer.alloc(4); len.writeUInt32BE(head.length);
  return { buffer: Buffer.concat([MAGIC, len, head, ...chunks]), counts: out.counts, files: files.length, missing };
}

// ---------- Validation (aucune écriture) ----------
function inspect(buffer) {
  const errors = [];
  const bad = (m) => { errors.push(m); return { errors }; };
  if (!Buffer.isBuffer(buffer) || buffer.length < MAGIC.length + 4) return bad("Fichier vide ou trop court : ce n'est pas un paquet de site.");
  if (!buffer.subarray(0, MAGIC.length).equals(MAGIC)) return bad("Fichier non reconnu : un paquet de sauvegarde de site KOLAKISA est attendu.");
  const mlen = buffer.readUInt32BE(MAGIC.length);
  if (mlen < 2 || mlen > MAX_MANIFEST) return bad("Paquet abîmé : taille du manifeste invalide.");
  const start = MAGIC.length + 4 + mlen;
  if (start > buffer.length) return bad("Paquet tronqué : le manifeste est incomplet.");
  let m;
  try { m = JSON.parse(buffer.subarray(MAGIC.length + 4, start).toString("utf8")); } catch { return bad("Paquet abîmé : manifeste illisible."); }
  if (!m || typeof m !== "object" || Array.isArray(m)) return bad("Paquet abîmé : manifeste invalide.");
  if (m.format !== FORMAT) return bad(`Format de paquet non pris en charge (« ${importer.line(m.format, 40) || "absent"} »).`);
  if (!m.data || typeof m.data !== "object" || Array.isArray(m.data)) return bad("Paquet incomplet : contenu du site absent.");
  if (typeof m.dataSha256 !== "string" || sha(Buffer.from(JSON.stringify(m.data))) !== m.dataSha256) errors.push("Le contenu du site a été modifié ou abîmé depuis la sauvegarde (somme de contrôle différente).");
  if (!Array.isArray(m.files)) return bad("Paquet incomplet : liste de fichiers absente.");
  if (m.files.length > MAX_FILES) return bad(`Trop de fichiers (${m.files.length}, ${MAX_FILES} au plus).`);
  const parsed = importer.parseFile(JSON.stringify(m.data));
  if (parsed.errors.length) errors.push(...parsed.errors);
  const ids = new Set(); const paths = new Set(); const entries = [];
  let expect = 0;
  for (const f of m.files) {
    const tag = `Fichier ${importer.line(f && f.name, 60) || importer.line(f && f.id, 20) || "?"}`;
    if (!f || typeof f !== "object" || !/^f\d{1,5}$/.test(String(f.id)) || ids.has(f.id)) { errors.push(`${tag} : identifiant invalide ou en double.`); continue; }
    ids.add(f.id);
    if (typeof f.path !== "string" || !ORIGIN.test(f.path) || f.path.includes("..")) { errors.push(`${tag} : chemin d'origine dangereux ou invalide.`); continue; }
    if (paths.has(f.path)) { errors.push(`${tag} : deux fichiers portent le même chemin d'origine.`); continue; }
    paths.add(f.path);
    if (!Number.isInteger(f.offset) || !Number.isInteger(f.length) || !Number.isInteger(f.size) || f.length !== f.size || f.size < 1 || f.offset !== expect) { errors.push(`${tag} : position ou taille incohérente.`); continue; }
    expect += f.length;
    if (typeof f.sha256 !== "string" || !SHA.test(f.sha256)) { errors.push(`${tag} : somme de contrôle absente ou invalide.`); continue; }
    if (start + f.offset + f.length > buffer.length) { errors.push(`${tag} : fichier tronqué (le paquet est incomplet).`); continue; }
    const bytes = buffer.subarray(start + f.offset, start + f.offset + f.length);
    if (sha(bytes) !== f.sha256) { errors.push(`${tag} : fichier abîmé (somme de contrôle différente).`); continue; }
    const real = media.sniff(bytes, f.name);
    if (!real) { errors.push(`${tag} : type de fichier non reconnu ou non autorisé.`); continue; }
    if (real.mime !== f.mime || real.type !== f.type) { errors.push(`${tag} : le contenu ne correspond pas au type annoncé.`); continue; }
    if (f.size > (LIMITS[real.type] || media.MAX_DOCUMENT)) { errors.push(`${tag} : dépasse la taille maximale autorisée pour ce type.`); continue; }
    entries.push({ meta: f, bytes, real });
  }
  if (!errors.length && start + expect !== buffer.length) errors.push("Paquet abîmé : octets en trop après le dernier fichier.");
  // Références aux fichiers : tout chemin « /uploads/ » du contenu doit être sûr ; ceux qui ne sont pas dans le paquet sont signalés
  const text = JSON.stringify(m.data.resources || {});
  const unsafe = /\/uploads\/[^"\\\s]*(?:\.\.|%2e|%2f|\\\\)/i.test(text);
  if (unsafe) errors.push("Le contenu référence un chemin de fichier dangereux : paquet refusé.");
  const warnings = [];
  const notIn = [...new Set(text.match(REFS) || [])].filter((p) => !paths.has(p));
  if (notIn.length) warnings.push(`${notIn.length} fichier(s) référencé(s) par le contenu ne sont pas dans le paquet : leur adresse est conservée telle quelle.`);
  if (Array.isArray(m.missing) && m.missing.length) warnings.push(`${m.missing.length} fichier(s) étaient déjà introuvables lors de la sauvegarde.`);
  return { errors, warnings, manifest: m, entries, data: parsed.data || null, totalBytes: expect };
}

// ---------- Plan (aucune écriture) ----------
function sameBytes(file, bytes) { try { return fs.statSync(file).size === bytes.length && fs.readFileSync(file).equals(bytes); } catch { return false; } }
function plan(ctx, buffer, { siteId }) {
  const ins = inspect(buffer);
  if (ins.errors.length) return { ok: false, errors: ins.errors, warnings: ins.warnings || [] };
  const mctx = mediaCtx(ctx, siteId);
  const vis = media.visibleSql(mctx);
  const mapping = []; const reservedNew = new Set();
  for (const { meta, bytes, real } of ins.entries) {
    // 1) même contenu déjà disponible pour CE site (commun ou propre à ce site) : réutilisé, rien n'est dupliqué
    const same = db.prepare(`SELECT * FROM mk_media WHERE organization_id = ? AND size = ? AND mime = ? AND deleted_at IS NULL AND ${vis.sql}`).all(ctx.organizationId, bytes.length, meta.mime, ...vis.params)
      .find((r) => { const w = media.parsePublicPath(ctx, r.path); return w && sameBytes(w.absolute, bytes); });
    if (same) { mapping.push({ id: meta.id, from: meta.path, to: same.path, action: "reuse", mediaId: same.id }); continue; }
    // 2) adresse d'origine libre et rangée dans le dossier du site cible : conservée (restaurer un site sur lui-même garde ses adresses)
    const origin = media.parsePublicPath(ctx, meta.path);
    const free = origin && origin.siteId === siteId && !fs.existsSync(origin.absolute) && !db.prepare("SELECT 1 FROM mk_media WHERE organization_id = ? AND path = ?").get(ctx.organizationId, meta.path);
    if (free && !reservedNew.has(meta.path)) { reservedNew.add(meta.path); mapping.push({ id: meta.id, from: meta.path, to: meta.path, action: "create", keep: true }); continue; }
    // 3) sinon une adresse neuve, fabriquée ici (jamais dérivée du nom ni du chemin du paquet)
    let to; do { to = media.newPublicPath(ctx, siteId, real.ext); } while (reservedNew.has(to) || fs.existsSync(media.parsePublicPath(ctx, to).absolute));
    reservedNew.add(to);
    mapping.push({ id: meta.id, from: meta.path, to, action: "create", keep: false });
  }
  return { ok: true, errors: [], warnings: ins.warnings, ins, mapping, source: ins.manifest.source, counts: ins.data ? Object.fromEntries(Object.entries(ins.data.resources).map(([k, v]) => [k, Array.isArray(v) ? v.length : 1])) : {} };
}

// ---------- Restauration ----------
// Ordre : tout valider (plan) → écrire les fichiers et leurs fiches → appliquer le contenu (moteur d'import existant, en brouillon) → en cas d'échec, tout défaire.
// Rien n'est écrit si le paquet est invalide ; seuls les fichiers CRÉÉS par cette restauration sont retirés en cas d'échec (jamais un fichier existant).
async function restore(ctx, buffer, { siteId, onConflict = "skip" }) {
  if (!Number.isInteger(siteId)) throw fail("Choisissez le site à restaurer.");
  if (!ctx.can("tools.import")) throw fail("Vous n'avez pas la permission d'importer dans ce site.");
  // « Mettre à jour » est exclu : une restauration doit pouvoir être défaite entièrement, ce qui n'est pas possible pour une modification d'élément existant
  if (!["skip", "duplicate", "stop"].includes(onConflict)) throw fail("Une restauration de paquet accepte seulement : ignorer les éléments déjà présents, créer des copies, ou tout arrêter.");
  const pl = plan(ctx, buffer, { siteId });
  if (!pl.ok) throw Object.assign(fail(pl.errors[0]), { errors: pl.errors });
  if (pl.ins.entries.length && !ctx.can("media.upload")) throw fail("La restauration des médias demande le droit d'envoyer des fichiers.");
  const exchange = require("./exchange");
  const types = SITE_TYPES.filter((t) => Object.hasOwn(pl.ins.manifest.data.resources, t));
  // Analyse à blanc AVANT toute écriture : un paquet dont le contenu serait refusé par l'import ne laisse aucun fichier derrière lui
  const dry = importer.analyse(ctx, pl.ins.data, { siteId, types: SITE_TYPES.filter((t) => types.includes(t)), onConflict });
  const refused = dry.items.filter((i) => i.action === "error");
  if (dry.blocked) throw fail("Restauration refusée : conflits détectés avec la stratégie « tout arrêter ».");
  if (refused.length) throw fail(`Restauration refusée : ${refused.length} élément(s) invalide(s) (${refused[0].label} : ${refused[0].issues.join(" ")}).`);
  // État du site cible avant la restauration (réglages, jetons, clés propres au site) : rétabli en cas d'échec, le contenu créé étant défait par l'import lui-même
  const siteBefore = db.prepare(`SELECT * FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(db)}`).get(siteId, ctx.organizationId);
  const kvPattern = `%site\\_${siteId}.%`; // clés de réglages propres au site (ex. email.site_3.from_name)
  const kvBefore = db.prepare("SELECT key, value, is_secret FROM mk_settings WHERE organization_id = ? AND key LIKE ? ESCAPE '\\'").all(ctx.organizationId, kvPattern);
  const rollbackSite = () => {
    try {
      const cols = Object.keys(siteBefore).filter((c) => c !== "id" && c !== "organization_id");
      db.prepare(`UPDATE mk_sites SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE id = ? AND organization_id = ?`).run(...cols.map((c) => siteBefore[c]), siteId, ctx.organizationId);
      db.prepare("DELETE FROM mk_settings WHERE organization_id = ? AND key LIKE ? ESCAPE '\\'").run(ctx.organizationId, kvPattern);
      for (const k of kvBefore) db.prepare("INSERT INTO mk_settings (organization_id, key, value, is_secret) VALUES (?, ?, ?, ?)").run(ctx.organizationId, k.key, k.value, k.is_secret);
    } catch { /* l'état précédent n'a pas pu être rétabli : signalé par le rapport de l'opération */ }
  };
  const written = []; const rows = [];
  const byId = new Map(pl.mapping.map((m) => [m.id, m]));
  const undoMedia = () => {
    for (const id of rows.reverse()) { try { db.prepare("DELETE FROM mk_media WHERE id = ? AND organization_id = ? AND reach = 'site' AND site_id = ?").run(id, ctx.organizationId, siteId); } catch { /* déjà retirée */ } }
    for (const file of written.reverse()) { try { fs.unlinkSync(file); } catch { /* déjà retiré */ } }
  };
  try {
    for (const { meta, bytes, real } of pl.ins.entries) {
      const m = byId.get(meta.id);
      if (m.action !== "create") continue;
      const where = media.parsePublicPath(ctx, m.to);
      if (!where || where.siteId !== siteId) throw new Error("Adresse de destination invalide.");
      fs.mkdirSync(require("node:path").dirname(where.absolute), { recursive: true });
      fs.writeFileSync(where.absolute, bytes, { flag: "wx" }); // création exclusive : jamais d'écrasement
      written.push(where.absolute);
      const r = db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, width, height, alt, title, caption, description, created_by, reach, site_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'site', ?) RETURNING id")
        .get(ctx.organizationId, real.kind, real.type, m.to, importer.line(meta.name, 150) || "fichier", real.mime, bytes.length, real.width || meta.width || null, real.height || meta.height || null,
          importer.line(meta.alt, 300), importer.line(meta.title, 200), importer.line(meta.caption, 500), importer.clip(meta.description, 2000), ctx.userId ?? null, siteId);
      rows.push(r.id);
    }
    // Références du contenu : anciennes adresses → adresses de destination (texte exact d'une adresse complète, bornée par un caractère non autorisé dans un nom)
    const moved = new Map(pl.mapping.filter((m) => m.to !== m.from).map((m) => [m.from, m.to]));
    const resources = JSON.stringify(pl.ins.manifest.data.resources).replace(REFS, (p) => moved.get(p) ?? p); // un seul passage : une adresse déjà remplacée n'est jamais remplacée de nouveau
    const data = { ...pl.ins.manifest.data, resources: JSON.parse(resources) };
    delete data.integrity;
    const out = await exchange.applyNow(ctx, { siteId, text: JSON.stringify(data), types, onConflict, source: "site-bundle" });
    if (!out.ok) { rollbackSite(); undoMedia(); throw Object.assign(fail(out.message), { run: out.run }); }
    return { ok: true, run: out.run, report: out.report, created: { files: written.length, rows: rows.length, reused: pl.mapping.filter((m) => m.action === "reuse").length }, warnings: pl.warnings, mapping: pl.mapping.map(({ id, action, from, to }) => ({ id, action, from, to })) };
  } catch (error) {
    if (!error.run) { rollbackSite(); undoMedia(); }
    throw error;
  }
}

module.exports = { restore, mediaCtxOf: mediaCtx, FORMAT, MAGIC, SITE_TYPES, MAX_FILES, MAX_TOTAL, build, inspect, plan, sha, mediaCtx, syncApi };
