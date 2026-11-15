// Explorateur de médias : dossiers LOGIQUES et empreintes des fichiers. Un dossier n'existe que dans la base : déplacer un fichier change sa fiche, jamais son adresse publique
// ni son emplacement sur le disque (aucune page ne casse). Un dossier appartient à UNE médiathèque : celle d'un site (site_id) ou la commune du site principal (site_id NULL) ;
// un fichier ne peut entrer que dans un dossier de sa propre médiathèque. Aucune opération ici ne supprime un fichier.
const fs = require("fs");
const crypto = require("crypto");
const { checkCtx, audit: sharedAudit, MarketingError } = require("../audience/shared");
const media = require("./index");

const MAX_DEPTH = 8;
const clip = (v) => String(v ?? "").replace(/[\u0000-\u001f\u007f/\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

// Médiathèque visée par l'écran : un site précis (accès limité ou site choisi par l'équipe), ou la commune (site principal). La vue d'ensemble de l'équipe (aucun site choisi) n'a pas de dossiers.
function scopeOf(ctx) {
  if (Number.isInteger(ctx.siteScope)) return { siteId: ctx.siteScope };
  if (Number.isInteger(ctx.siteFilter)) return { siteId: ctx.siteFilter };
  if (ctx.siteFilter === "principal") return { siteId: null };
  return null;
}
const needScope = (ctx) => {
  const s = scopeOf(ctx);
  if (!s) throw new MarketingError("invalid_field", "Choisissez un site : les dossiers appartiennent à la médiathèque d'un site.");
  return s;
};
// Les événements du journal sont rattachés au site de la médiathèque, même quand l'action vient de l'équipe (sans site limité) : l'historique d'un site ne montre que les siens.
const audit = (ctx, ...args) => { const s = scopeOf(ctx); return sharedAudit(s && Number.isInteger(s.siteId) && !Number.isInteger(ctx.siteScope) ? { ...ctx, siteScope: s.siteId } : ctx, ...args); };
const siteCond = (s) => (s.siteId === null ? { sql: "site_id IS NULL", args: [] } : { sql: "site_id = ?", args: [s.siteId] });

function getFolder(ctx, id) {
  checkCtx(ctx);
  const s = scopeOf(ctx);
  if (!s || !Number.isInteger(id)) return null;
  const c = siteCond(s);
  return ctx.db.prepare(`SELECT * FROM mk_media_folders WHERE id = ? AND organization_id = ? AND ${c.sql} AND deleted_at IS NULL`).get(id, ctx.organizationId, ...c.args) || null;
}
const depthOf = (ctx, id) => { let d = 0; for (let cur = id; cur && d <= MAX_DEPTH + 1; d++) cur = ctx.db.prepare("SELECT parent_id FROM mk_media_folders WHERE id = ?").get(cur)?.parent_id; return d; };

// Arbre de la médiathèque courante : chaque dossier avec le nombre de fichiers (hors corbeille) qu'il contient directement
function listFolders(ctx) {
  checkCtx(ctx);
  const s = scopeOf(ctx);
  if (!s) return { enabled: false, folders: [], rootCount: 0 };
  const c = siteCond(s);
  const vis = media.visibleSql(ctx);
  const folders = ctx.db.prepare(`SELECT f.id, f.parent_id AS parentId, f.name, f.color, f.description, (SELECT COUNT(*) FROM mk_media m WHERE m.folder_id = f.id AND m.deleted_at IS NULL AND m.organization_id = f.organization_id) AS count FROM mk_media_folders f WHERE f.organization_id = ? AND f.${c.sql} AND f.deleted_at IS NULL ORDER BY f.sort_order, f.name COLLATE NOCASE`).all(ctx.organizationId, ...c.args);
  const rootCount = ctx.db.prepare(`SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND folder_id IS NULL AND ${vis.sql}`).get(ctx.organizationId, ...vis.params).n;
  return { enabled: true, folders, rootCount };
}
// Fil d'Ariane : du dossier racine au dossier courant
function breadcrumb(ctx, id) {
  const out = [];
  for (let cur = getFolder(ctx, id), n = 0; cur && n < MAX_DEPTH + 2; n++, cur = cur.parent_id ? getFolder(ctx, cur.parent_id) : null) out.unshift({ id: cur.id, name: cur.name });
  return out;
}

const CATEGORIES = ["", "image", "video", "audio", "document"];
function createFolder(ctx, { name, parentId = null, category = "" } = {}) {
  const s = needScope(ctx);
  let cat = CATEGORIES.includes(category) ? category : "";
  const clean = clip(name);
  if (!clean) throw new MarketingError("invalid_field", "Donnez un nom au dossier.");
  if (parentId !== null && parentId !== undefined) {
    const parent = getFolder(ctx, Number(parentId));
    if (!parent) throw new MarketingError("not_found", "Dossier parent introuvable.");
    cat = parent.category || ""; // un sous-dossier reste dans la catégorie de son dossier de premier niveau
    if (depthOf(ctx, Number(parentId)) >= MAX_DEPTH) throw new MarketingError("invalid_field", `Les dossiers ne peuvent pas être imbriqués sur plus de ${MAX_DEPTH} niveaux.`);
  }
  try {
    const row = ctx.db.prepare("INSERT INTO mk_media_folders (organization_id, site_id, parent_id, name, created_by, category, sort_order) VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM mk_media_folders WHERE organization_id = ? AND parent_id IS ? AND deleted_at IS NULL)) RETURNING *").get(ctx.organizationId, s.siteId, parentId ?? null, clean, ctx.userId ?? null, cat, ctx.organizationId, parentId ?? null);
    audit(ctx, "media.folder_created", "media_folder", row.id, { site_id: s.siteId });
    return row;
  } catch (error) {
    if (/UNIQUE/i.test(error.message)) throw new MarketingError("invalid_state", `Un dossier « ${clean} » existe déjà à cet endroit.`);
    throw error;
  }
}

function renameFolder(ctx, id, name) {
  needScope(ctx);
  const f = getFolder(ctx, id);
  if (!f) throw new MarketingError("not_found", "Dossier introuvable.");
  const clean = clip(name);
  if (!clean) throw new MarketingError("invalid_field", "Donnez un nom au dossier.");
  try { ctx.db.prepare("UPDATE mk_media_folders SET name = ?, updated_at = datetime('now') WHERE id = ?").run(clean, id); }
  catch (error) { if (/UNIQUE/i.test(error.message)) throw new MarketingError("invalid_state", `Un dossier « ${clean} » existe déjà à cet endroit.`); throw error; }
  audit(ctx, "media.folder_renamed", "media_folder", id, {});
  return getFolder(ctx, id);
}

// Déplacer un dossier : jamais dans lui-même ni dans un de ses descendants (pas de cycle), jamais au-delà de la profondeur maximale
function moveFolder(ctx, id, parentId) {
  needScope(ctx);
  const f = getFolder(ctx, id);
  if (!f) throw new MarketingError("not_found", "Dossier introuvable.");
  const target = parentId === null || parentId === undefined || parentId === "" ? null : Number(parentId);
  if (target !== null) {
    if (!getFolder(ctx, target)) throw new MarketingError("not_found", "Dossier de destination introuvable.");
    for (let cur = target, n = 0; cur && n < 50; n++) { if (cur === id) throw new MarketingError("invalid_state", "Un dossier ne peut pas être déplacé dans lui-même ni dans un de ses sous-dossiers."); cur = ctx.db.prepare("SELECT parent_id FROM mk_media_folders WHERE id = ?").get(cur)?.parent_id; }
    const below = (root) => { let max = 0; const walk = (p, d) => { max = Math.max(max, d); for (const r of ctx.db.prepare("SELECT id FROM mk_media_folders WHERE parent_id = ?").all(p)) walk(r.id, d + 1); }; walk(root, 1); return max; };
    if (depthOf(ctx, target) + below(id) > MAX_DEPTH) throw new MarketingError("invalid_field", `Les dossiers ne peuvent pas être imbriqués sur plus de ${MAX_DEPTH} niveaux.`);
  }
  try { ctx.db.prepare("UPDATE mk_media_folders SET parent_id = ?, updated_at = datetime('now') WHERE id = ?").run(target, id); }
  catch (error) { if (/UNIQUE/i.test(error.message)) throw new MarketingError("invalid_state", "Un dossier du même nom existe déjà à la destination."); throw error; }
  audit(ctx, "media.folder_moved", "media_folder", id, { parent_id: target });
  return getFolder(ctx, id);
}

// Ordre personnalisé : seule la POSITION d'affichage change (jamais l'emplacement, jamais le tri des fichiers). Les dossiers doivent tous avoir le même parent.
function reorderFolders(ctx, parentId, ids) {
  needScope(ctx);
  const parent = parentId === null || parentId === undefined ? null : Number(parentId);
  const list = [...new Set((Array.isArray(ids) ? ids : []).map(Number).filter(Number.isInteger))];
  if (!list.length) throw new MarketingError("invalid_field", "Aucun dossier à ordonner.");
  const rows = list.map((id) => getFolder(ctx, id));
  if (rows.some((r) => !r)) throw new MarketingError("not_found", "Dossier introuvable.");
  if (rows.some((r) => (r.parent_id || null) !== parent)) throw new MarketingError("invalid_state", "Ces dossiers ne sont pas au même emplacement.");
  // les dossiers frères non cités gardent leur ordre relatif, après ceux qui sont cités
  const all = ctx.db.prepare("SELECT id FROM mk_media_folders WHERE organization_id = ? AND parent_id IS ? AND deleted_at IS NULL AND site_id IS ? ORDER BY sort_order, name COLLATE NOCASE").all(ctx.organizationId, parent, rows[0].site_id ?? null).map((r) => r.id);
  const final = [...list, ...all.filter((id) => !list.includes(id))];
  const up = ctx.db.prepare("UPDATE mk_media_folders SET sort_order = ? WHERE id = ?");
  ctx.db.exec("BEGIN");
  try { final.forEach((id, i) => up.run(i + 1, id)); ctx.db.exec("COMMIT"); } catch (e) { ctx.db.exec("ROLLBACK"); throw e; }
  audit(ctx, "media.folders_reordered", "media_folder", list[0], { parent_id: parent, count: final.length });
  return final;
}

// Supprimer un dossier : jamais un fichier. Ses fichiers et sous-dossiers remontent d'un niveau (dans le dossier parent, ou à la racine).
function deleteFolder(ctx, id) {
  needScope(ctx);
  const f = getFolder(ctx, id);
  if (!f) throw new MarketingError("not_found", "Dossier introuvable.");
  const parent = f.parent_id ?? null;
  ctx.db.exec("BEGIN");
  try {
    ctx.db.prepare("UPDATE mk_media SET folder_id = ? WHERE folder_id = ? AND organization_id = ?").run(parent, id, ctx.organizationId);
    for (const child of ctx.db.prepare("SELECT id, name FROM mk_media_folders WHERE parent_id = ?").all(id)) {
      let name = child.name;
      while (ctx.db.prepare("SELECT 1 FROM mk_media_folders WHERE organization_id = ? AND ifnull(site_id,0) = ifnull(?,0) AND ifnull(parent_id,0) = ifnull(?,0) AND name = ? COLLATE NOCASE AND id <> ?").get(ctx.organizationId, f.site_id, parent, name, child.id)) name += " (2)";
      ctx.db.prepare("UPDATE mk_media_folders SET parent_id = ?, name = ? WHERE id = ?").run(parent, name, child.id);
    }
    ctx.db.prepare("DELETE FROM mk_media_folders WHERE id = ?").run(id);
    ctx.db.exec("COMMIT");
  } catch (error) { ctx.db.exec("ROLLBACK"); if (/UNIQUE/i.test(error.message)) throw new MarketingError("invalid_state", "Un élément du même nom existe déjà dans le dossier parent : renommez-le d'abord."); throw error; }
  audit(ctx, "media.folder_deleted", "media_folder", id, {});
  return true;
}

// Déplacer des fichiers (résultat par fichier). folderId null = racine. Le fichier doit appartenir à la médiathèque courante ET le dossier aussi.
function moveMedia(ctx, ids, folderId) {
  const s = needScope(ctx);
  const target = folderId === null || folderId === undefined || folderId === "" ? null : Number(folderId);
  if (target !== null && !getFolder(ctx, target)) throw new MarketingError("not_found", "Dossier de destination introuvable.");
  const done = [], failed = [];
  for (const id of ids) {
    const m = media.getMedia(ctx, id);
    if (!m) { failed.push({ id, name: `#${id}`, message: "Fichier introuvable." }); continue; }
    const inScope = s.siteId === null ? m.reach === "shared" : m.reach === "site" && m.siteId === s.siteId;
    if (!inScope) { failed.push({ id, name: m.name, message: "Ce fichier n'appartient pas à cette médiathèque." }); continue; }
    try { media.assertWritable(ctx, m); } catch (e) { failed.push({ id, name: m.name, message: e.message }); continue; }
    ctx.db.prepare("UPDATE mk_media SET folder_id = ? WHERE id = ? AND organization_id = ?").run(target, id, ctx.organizationId);
    done.push(id);
  }
  if (done.length) audit(ctx, "media.moved", "media", done[0], { count: done.length, folder_id: target });
  return { done, failed };
}

// ---------- Empreintes et doublons ----------
const hashFile = (absolute) => new Promise((resolve, reject) => {
  const h = crypto.createHash("sha256");
  const s = fs.createReadStream(absolute);
  s.on("data", (d) => h.update(d)); s.on("error", reject); s.on("end", () => resolve(h.digest("hex")));
});
// Calcule l'empreinte des fichiers qui n'en ont pas (par lots, lecture en flux : jamais un fichier entier en mémoire). Un fichier absent du disque est compté, jamais modifié.
async function computeMissingHashes(ctx, { limit = 50 } = {}) {
  checkCtx(ctx);
  const vis = media.visibleSql(ctx);
  const rows = ctx.db.prepare(`SELECT id, path FROM mk_media WHERE organization_id = ? AND sha256 IS NULL AND ${vis.sql} ORDER BY id LIMIT ?`).all(ctx.organizationId, ...vis.params, Math.min(Math.max(Number(limit) || 50, 1), 200));
  let done = 0, missing = 0;
  for (const r of rows) {
    const where = media.parsePublicPath(ctx, r.path);
    if (!where) { missing++; continue; }
    try { const sum = await hashFile(where.absolute); ctx.db.prepare("UPDATE mk_media SET sha256 = ? WHERE id = ? AND organization_id = ?").run(sum, r.id, ctx.organizationId); done++; }
    catch { missing++; }
  }
  const left = ctx.db.prepare(`SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND sha256 IS NULL AND ${vis.sql}`).get(ctx.organizationId, ...vis.params).n;
  return { done, missing, left };
}
// Groupes de fichiers au contenu strictement identique (même empreinte) dans la médiathèque visible. Information seulement : rien n'est supprimé ni fusionné.
function duplicateGroups(ctx, { limit = 50 } = {}) {
  checkCtx(ctx);
  const vis = media.visibleSql(ctx);
  const sums = ctx.db.prepare(`SELECT sha256, COUNT(*) n, SUM(size) bytes FROM mk_media WHERE organization_id = ? AND sha256 IS NOT NULL AND deleted_at IS NULL AND ${vis.sql} GROUP BY sha256 HAVING n > 1 ORDER BY bytes DESC LIMIT ?`).all(ctx.organizationId, ...vis.params, Math.min(Math.max(Number(limit) || 50, 1), 200));
  return sums.map((g) => ({ sha256: g.sha256, count: g.n, wastedBytes: g.bytes - g.bytes / g.n, items: ctx.db.prepare(`SELECT id, name, path, size, folder_id AS folderId, created_at AS createdAt FROM mk_media WHERE organization_id = ? AND sha256 = ? AND deleted_at IS NULL AND ${vis.sql} ORDER BY id`).all(ctx.organizationId, g.sha256, ...vis.params) }));
}

module.exports = { CATEGORIES, reorderFolders, needScope, siteCond, depthOf, clip, scopeOf, getFolder, listFolders, breadcrumb, createFolder, renameFolder, moveFolder, deleteFolder, moveMedia, computeMissingHashes, duplicateGroups, MAX_DEPTH };
