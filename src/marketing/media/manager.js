// Gestionnaire de fichiers de la médiathèque (lot 1) : favoris, tags, collections, préférences, dossiers enrichis, corbeille de dossiers, conservation de la corbeille,
// stockage, doublons, copie. S'appuie UNIQUEMENT sur le service existant (index.js, folders.js) : même base, mêmes contextes de site, mêmes droits, aucun second stockage.
// Tout ce qui est propre à une médiathèque (tags, collections, dossiers) exige un site choisi (comme les dossiers) ; les favoris et préférences sont propres à la PERSONNE.
const { checkCtx, audit, MarketingError } = require("../audience/shared");
const media = require("./index");
const folders = require("./folders");
const variants = require("./variants");

const COLORS = ["", "bleu", "vert", "orange", "rouge", "violet", "jaune", "rose", "gris"];
const RETENTION = [0, 7, 30, 90];
const clip = (v, n) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const fold = (v) => String(v || "").toLocaleLowerCase("fr").normalize("NFC");
const bad = (message) => new MarketingError("invalid_field", message);
const missing = (message) => new MarketingError("not_found", message);

// ---------- Médiathèque courante ----------
const scope = (ctx) => folders.scopeOf(ctx); // { siteId } ou null (vue d'ensemble de l'équipe : pas de dossiers, tags ni collections)
function needScope(ctx) {
  checkCtx(ctx);
  const s = scope(ctx);
  if (!s) throw bad("Choisissez un site : les dossiers, tags et collections appartiennent à la médiathèque d'un site.");
  return s;
}
const siteKeyOf = (ctx) => { const s = scope(ctx); return s ? (s.siteId === null ? "principal" : String(s.siteId)) : "tous"; };
const siteCond = (s, alias = "") => (s.siteId === null ? { sql: `${alias}site_id IS NULL`, args: [] } : { sql: `${alias}site_id = ?`, args: [s.siteId] });
const needUser = (ctx) => { if (ctx.userId == null) throw bad("Personne n'est connectée."); return ctx.userId; };
// Un fichier de CETTE médiathèque (même règle que le déplacement) : jamais celui d'un autre site
function ownMedia(ctx, id, { trashed = false } = {}) {
  const s = needScope(ctx);
  const m = media.getMedia(ctx, Number(id));
  if (!m) throw missing("Fichier introuvable.");
  const inScope = s.siteId === null ? m.reach === "shared" : m.reach === "site" && m.siteId === s.siteId;
  if (!inScope) throw new MarketingError("forbidden", "Ce fichier n'appartient pas à cette médiathèque.");
  if (!trashed && m.deletedAt) throw new MarketingError("invalid_state", "Ce fichier est à la corbeille.");
  return m;
}
const idsOf = (ids, max = 200) => [...new Set((Array.isArray(ids) ? ids : []).map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0))].slice(0, max);

// ---------- Favoris (par personne) ----------
function setStar(ctx, kind, id, on) {
  const userId = needUser(ctx);
  if (!["media", "folder"].includes(kind)) throw bad("Type de favori inconnu.");
  if (kind === "media") ownMedia(ctx, id); else if (!folders.getFolder(ctx, Number(id))) throw missing("Dossier introuvable.");
  if (on) ctx.db.prepare("INSERT OR IGNORE INTO mk_media_stars (user_id, organization_id, kind, target_id) VALUES (?, ?, ?, ?)").run(userId, ctx.organizationId, kind, Number(id));
  else ctx.db.prepare("DELETE FROM mk_media_stars WHERE user_id = ? AND organization_id = ? AND kind = ? AND target_id = ?").run(userId, ctx.organizationId, kind, Number(id));
  return Boolean(on);
}
const starredSet = (ctx, kind) => (ctx.userId == null ? new Set() : new Set(ctx.db.prepare("SELECT target_id FROM mk_media_stars WHERE user_id = ? AND organization_id = ? AND kind = ?").all(ctx.userId, ctx.organizationId, kind).map((r) => r.target_id)));

// ---------- Tags ----------
const tagName = (v) => clip(v, 40).replace(/[,;]/g, " ").trim();
function listTags(ctx) {
  const s = needScope(ctx), c = siteCond(s, "t.");
  return ctx.db.prepare(`SELECT t.id, t.name, t.color, (SELECT COUNT(*) FROM mk_media_tag_links l JOIN mk_media m ON m.id = l.media_id WHERE l.tag_id = t.id AND m.deleted_at IS NULL) AS count
    FROM mk_media_tags t WHERE t.organization_id = ? AND ${c.sql} ORDER BY t.name COLLATE NOCASE`).all(ctx.organizationId, ...c.args);
}
function getTag(ctx, id) {
  const s = needScope(ctx), c = siteCond(s);
  return ctx.db.prepare(`SELECT * FROM mk_media_tags WHERE id = ? AND organization_id = ? AND ${c.sql}`).get(Number(id), ctx.organizationId, ...c.args) || null;
}
function findOrCreateTag(ctx, name) {
  const s = needScope(ctx), clean = tagName(name);
  if (!clean) throw bad("Donnez un nom au tag.");
  const c = siteCond(s);
  const found = ctx.db.prepare(`SELECT * FROM mk_media_tags WHERE organization_id = ? AND ${c.sql}`).all(ctx.organizationId, ...c.args).find((t) => fold(t.name) === fold(clean));
  if (found) return found;
  const row = ctx.db.prepare("INSERT INTO mk_media_tags (organization_id, site_id, name, created_by) VALUES (?, ?, ?, ?) RETURNING *").get(ctx.organizationId, s.siteId, clean, ctx.userId ?? null);
  audit(ctx, "media.tag_created", "media_tag", row.id, {});
  return row;
}
function createTag(ctx, { name, color = "" } = {}) {
  const tag = findOrCreateTag(ctx, name);
  if (COLORS.includes(color) && color !== tag.color) ctx.db.prepare("UPDATE mk_media_tags SET color = ? WHERE id = ?").run(color, tag.id);
  return getTag(ctx, tag.id);
}
function renameTag(ctx, id, { name, color } = {}) {
  const tag = getTag(ctx, id);
  if (!tag) throw missing("Tag introuvable.");
  const next = name === undefined ? tag.name : tagName(name);
  if (!next) throw bad("Donnez un nom au tag.");
  if (listTags(ctx).some((t) => t.id !== tag.id && fold(t.name) === fold(next))) throw new MarketingError("invalid_state", `Un tag « ${next} » existe déjà.`);
  try { ctx.db.prepare("UPDATE mk_media_tags SET name = ?, color = ? WHERE id = ?").run(next, color !== undefined && COLORS.includes(color) ? color : tag.color, tag.id); }
  catch (e) { if (/UNIQUE/i.test(e.message)) throw new MarketingError("invalid_state", `Un tag « ${next} » existe déjà.`); throw e; }
  return getTag(ctx, id);
}
function deleteTag(ctx, id) {
  const tag = getTag(ctx, id);
  if (!tag) throw missing("Tag introuvable.");
  ctx.db.prepare("DELETE FROM mk_media_tags WHERE id = ?").run(tag.id); // les liens suivent (ON DELETE CASCADE) ; aucun fichier n'est touché
  audit(ctx, "media.tag_deleted", "media_tag", tag.id, {});
  return true;
}
// Ajoute et/ou retire des tags sur plusieurs fichiers (résultat par fichier)
function tagMedia(ctx, ids, { add = [], remove = [] } = {}) {
  needScope(ctx);
  const list = idsOf(ids), done = [], failed = [];
  const addTags = [...new Set((add || []).map(tagName).filter(Boolean))].slice(0, 20).map((n) => findOrCreateTag(ctx, n));
  const allTags = listTags(ctx);
  const removeTags = [...new Set((remove || []).map(tagName).filter(Boolean))].map((n) => allTags.find((t) => fold(t.name) === fold(n))).filter(Boolean);
  for (const id of list) {
    try {
      const m = ownMedia(ctx, id); media.assertWritable(ctx, m);
      for (const t of addTags) ctx.db.prepare("INSERT OR IGNORE INTO mk_media_tag_links (media_id, tag_id) VALUES (?, ?)").run(id, t.id);
      for (const t of removeTags) ctx.db.prepare("DELETE FROM mk_media_tag_links WHERE media_id = ? AND tag_id = ?").run(id, t.id);
      done.push(id);
    } catch (e) { if (!(e instanceof MarketingError)) throw e; failed.push({ id, name: `#${id}`, message: e.message }); }
  }
  if (done.length) audit(ctx, "media.tagged", "media", done[0], { count: done.length });
  return { done, failed };
}
// Remplace l'ensemble des tags d'UN fichier
function setMediaTags(ctx, id, names) {
  const m = ownMedia(ctx, id); media.assertWritable(ctx, m);
  const wanted = [...new Set((names || []).map(tagName).filter(Boolean))].slice(0, 20);
  ctx.db.prepare("DELETE FROM mk_media_tag_links WHERE media_id = ?").run(m.id);
  for (const n of wanted) ctx.db.prepare("INSERT OR IGNORE INTO mk_media_tag_links (media_id, tag_id) VALUES (?, ?)").run(m.id, findOrCreateTag(ctx, n).id);
  return tagsOf(ctx, [m.id])[m.id] || [];
}
function tagsOf(ctx, ids) {
  const list = idsOf(ids, 500), out = {};
  if (!list.length) return out;
  for (const r of ctx.db.prepare(`SELECT l.media_id, t.id, t.name, t.color FROM mk_media_tag_links l JOIN mk_media_tags t ON t.id = l.tag_id WHERE l.media_id IN (${list.map(() => "?").join(",")}) ORDER BY t.name COLLATE NOCASE`).all(...list)) (out[r.media_id] ||= []).push({ id: r.id, name: r.name, color: r.color });
  return out;
}

// ---------- Collections ----------
function listCollections(ctx) {
  const s = needScope(ctx), c = siteCond(s, "c.");
  return ctx.db.prepare(`SELECT c.id, c.name, c.description, (SELECT COUNT(*) FROM mk_media_collection_items i JOIN mk_media m ON m.id = i.media_id WHERE i.collection_id = c.id AND m.deleted_at IS NULL) AS count
    FROM mk_media_collections c WHERE c.organization_id = ? AND ${c.sql} ORDER BY c.name COLLATE NOCASE`).all(ctx.organizationId, ...c.args);
}
function getCollection(ctx, id) {
  const s = needScope(ctx), c = siteCond(s);
  return ctx.db.prepare(`SELECT * FROM mk_media_collections WHERE id = ? AND organization_id = ? AND ${c.sql}`).get(Number(id), ctx.organizationId, ...c.args) || null;
}
function createCollection(ctx, { name, description = "" } = {}) {
  const s = needScope(ctx), clean = clip(name, 60);
  if (!clean) throw bad("Donnez un nom à la collection.");
  if (listCollections(ctx).some((c) => fold(c.name) === fold(clean))) throw new MarketingError("invalid_state", `Une collection « ${clean} » existe déjà.`);
  try {
    const row = ctx.db.prepare("INSERT INTO mk_media_collections (organization_id, site_id, name, description, created_by) VALUES (?, ?, ?, ?, ?) RETURNING *").get(ctx.organizationId, s.siteId, clean, clip(description, 300), ctx.userId ?? null);
    audit(ctx, "media.collection_created", "media_collection", row.id, {});
    return row;
  } catch (e) { if (/UNIQUE/i.test(e.message)) throw new MarketingError("invalid_state", `Une collection « ${clean} » existe déjà.`); throw e; }
}
function renameCollection(ctx, id, { name, description } = {}) {
  const col = getCollection(ctx, id);
  if (!col) throw missing("Collection introuvable.");
  const next = name === undefined ? col.name : clip(name, 60);
  if (!next) throw bad("Donnez un nom à la collection.");
  if (listCollections(ctx).some((c) => c.id !== col.id && fold(c.name) === fold(next))) throw new MarketingError("invalid_state", `Une collection « ${next} » existe déjà.`);
  try { ctx.db.prepare("UPDATE mk_media_collections SET name = ?, description = ? WHERE id = ?").run(next, description === undefined ? col.description : clip(description, 300), col.id); }
  catch (e) { if (/UNIQUE/i.test(e.message)) throw new MarketingError("invalid_state", `Une collection « ${next} » existe déjà.`); throw e; }
  return getCollection(ctx, id);
}
function deleteCollection(ctx, id) {
  const col = getCollection(ctx, id);
  if (!col) throw missing("Collection introuvable.");
  ctx.db.prepare("DELETE FROM mk_media_collections WHERE id = ?").run(col.id); // les fichiers ne sont jamais touchés
  audit(ctx, "media.collection_deleted", "media_collection", col.id, {});
  return true;
}
function collectionItems(ctx, id, ids, add) {
  const col = getCollection(ctx, id);
  if (!col) throw missing("Collection introuvable.");
  const done = [], failed = [];
  for (const mid of idsOf(ids)) {
    try {
      const m = ownMedia(ctx, mid);
      if (add) ctx.db.prepare("INSERT OR IGNORE INTO mk_media_collection_items (collection_id, media_id) VALUES (?, ?)").run(col.id, m.id);
      else ctx.db.prepare("DELETE FROM mk_media_collection_items WHERE collection_id = ? AND media_id = ?").run(col.id, mid);
      done.push(mid);
    } catch (e) { if (!(e instanceof MarketingError)) throw e; failed.push({ id: mid, name: `#${mid}`, message: e.message }); }
  }
  return { done, failed };
}
const addToCollection = (ctx, id, ids) => collectionItems(ctx, id, ids, true);
const removeFromCollection = (ctx, id, ids) => collectionItems(ctx, id, ids, false);
function collectionsOf(ctx, ids) {
  const list = idsOf(ids, 500), out = {};
  if (!list.length) return out;
  for (const r of ctx.db.prepare(`SELECT i.media_id, c.id, c.name FROM mk_media_collection_items i JOIN mk_media_collections c ON c.id = i.collection_id WHERE i.media_id IN (${list.map(() => "?").join(",")}) ORDER BY c.name COLLATE NOCASE`).all(...list)) (out[r.media_id] ||= []).push({ id: r.id, name: r.name });
  return out;
}

// ---------- Préférences d'affichage (par personne et par médiathèque) ----------
const VIEWS = ["grille", "liste", "details", "icones", "compacte"];
const COLUMNS = ["type", "size", "dims", "folder", "modified", "created", "author", "tags"];
const SORT_KEYS = ["recent", "ancien", "nom", "nom_desc", "taille", "modifie", "type"];
const DEFAULT_PREFS = { view: "grille", size: 160, density: "confortable", columns: ["type", "size", "dims", "modified"], sort: "recent", sortDir: "", sidebar: "open", info: "closed", infoWidth: 340, foldersFirst: true, sections: { order: ["bibliotheque", "types", "dossiers", "favoris", "smart", "collections", "tags", "portee", "organisation"], hidden: [] }, theme: { mode: "clair", colors: {}, radius: 8, space: 100, iconSize: 16 } };
const SECTIONS = ["bibliotheque", "types", "dossiers", "favoris", "smart", "collections", "tags", "portee", "organisation"];
function sanitizeSections(v) {
  const o = v && typeof v === "object" ? v : {};
  const order = [...new Set((Array.isArray(o.order) ? o.order : []).filter((k) => SECTIONS.includes(k)))];
  SECTIONS.forEach((k) => { if (!order.includes(k)) order.push(k); });
  // « organisation » (doublons, stockage, corbeille) ne se masque pas : c'est le seul accès à la corbeille
  const hidden = [...new Set((Array.isArray(o.hidden) ? o.hidden : []).filter((k) => SECTIONS.includes(k) && k !== "organisation"))];
  return { order, hidden };
}
const THEME_MODES = ["clair", "sombre", "personnalise"];
const THEME_KEYS = ["sideBg", "mainBg", "text", "textSoft", "icon", "sep", "sel", "hover", "folder", "accent", "border", "badge"];
const clampInt = (v, lo, hi, d) => (Number.isFinite(Number(v)) ? Math.min(Math.max(Math.round(Number(v)), lo), hi) : d);
function sanitizeTheme(t) {
  const o = t && typeof t === "object" ? t : {};
  const colors = {};
  if (o.colors && typeof o.colors === "object") THEME_KEYS.forEach((k) => { if (typeof o.colors[k] === "string" && /^#[0-9a-fA-F]{6}$/.test(o.colors[k])) colors[k] = o.colors[k].toLowerCase(); });
  return { mode: THEME_MODES.includes(o.mode) ? o.mode : "clair", colors, radius: clampInt(o.radius, 0, 20, 8), space: clampInt(o.space, 80, 140, 100), iconSize: clampInt(o.iconSize, 14, 26, 16) };
}
function sanitizePrefs(input) {
  const p = input && typeof input === "object" ? input : {};
  const out = {};
  if (VIEWS.includes(p.view)) out.view = p.view;
  if (Number.isFinite(Number(p.size))) out.size = Math.min(Math.max(Math.round(Number(p.size)), 90), 320);
  if (["confortable", "compacte"].includes(p.density)) out.density = p.density;
  if (Array.isArray(p.columns)) out.columns = [...new Set(p.columns.filter((c) => COLUMNS.includes(c)))]; // l'ordre choisi est conservé
  if (p.sections && typeof p.sections === "object") out.sections = sanitizeSections(p.sections);
  if (SORT_KEYS.includes(p.sort)) out.sort = p.sort;
  if (["", "asc", "desc"].includes(p.sortDir)) out.sortDir = p.sortDir;
  if (["open", "rail", "hidden"].includes(p.sidebar)) out.sidebar = p.sidebar === "hidden" ? "rail" : p.sidebar; // « masquée » n'existe plus : la barre se réduit toujours à une bande qui garde son bouton
  if (p.theme && typeof p.theme === "object") out.theme = sanitizeTheme(p.theme);
  if (["open", "closed"].includes(p.info)) out.info = p.info;
  if (Number.isFinite(Number(p.infoWidth))) out.infoWidth = Math.min(Math.max(Math.round(Number(p.infoWidth)), 280), 560);
  if (typeof p.foldersFirst === "boolean") out.foldersFirst = p.foldersFirst;
  return out;
}
function getPrefs(ctx) {
  checkCtx(ctx);
  let saved = {};
  if (ctx.userId != null) { const row = ctx.db.prepare("SELECT data FROM mk_media_prefs WHERE user_id = ? AND organization_id = ? AND site_key = ?").get(ctx.userId, ctx.organizationId, siteKeyOf(ctx)); try { saved = sanitizePrefs(JSON.parse(row ? row.data : "{}")); } catch { saved = {}; } }
  return { ...DEFAULT_PREFS, ...saved };
}
function setPrefs(ctx, patch) {
  checkCtx(ctx);
  const userId = needUser(ctx);
  const next = { ...getPrefs(ctx), ...sanitizePrefs(patch) };
  ctx.db.prepare("INSERT INTO mk_media_prefs (user_id, organization_id, site_key, data, updated_at) VALUES (?, ?, ?, ?, datetime('now')) ON CONFLICT (user_id, organization_id, site_key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at").run(userId, ctx.organizationId, siteKeyOf(ctx), JSON.stringify(next));
  return next;
}

// ---------- Dossiers enrichis ----------
function updateFolder(ctx, id, { color, description } = {}) {
  needScope(ctx);
  const f = folders.getFolder(ctx, Number(id));
  if (!f) throw missing("Dossier introuvable.");
  if (color !== undefined && !COLORS.includes(color)) throw bad("Couleur inconnue.");
  ctx.db.prepare("UPDATE mk_media_folders SET color = ?, description = ? WHERE id = ?").run(color === undefined ? f.color : color, description === undefined ? f.description : clip(description, 300), f.id);
  return folders.getFolder(ctx, f.id);
}
const descendantIds = (ctx, id, { includeDeleted = false } = {}) => ctx.db.prepare(`WITH RECURSIVE d(id) AS (SELECT id FROM mk_media_folders WHERE id = ? UNION ALL SELECT f.id FROM mk_media_folders f JOIN d ON f.parent_id = d.id${includeDeleted ? "" : " WHERE f.deleted_at IS NULL"}) SELECT id FROM d`).all(id).map((r) => r.id);
function folderPath(ctx, id) { const crumbs = folders.breadcrumb(ctx, Number(id)); return ["Médiathèque", ...crumbs.map((c) => c.name)].join(" / "); }
function folderProperties(ctx, id) {
  needScope(ctx);
  const f = folders.getFolder(ctx, Number(id));
  if (!f) throw missing("Dossier introuvable.");
  const ids = descendantIds(ctx, f.id), marks = ids.map(() => "?").join(",");
  const totals = ctx.db.prepare(`SELECT COUNT(*) files, COALESCE(SUM(size), 0) bytes FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND folder_id IN (${marks})`).get(ctx.organizationId, ...ids);
  const direct = ctx.db.prepare("SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND folder_id = ?").get(ctx.organizationId, f.id).n;
  return { id: f.id, name: f.name, path: folderPath(ctx, f.id), color: f.color || "", description: f.description || "", createdAt: f.created_at, subfolders: ids.length - 1, files: totals.files, directFiles: direct, bytes: totals.bytes, starred: starredSet(ctx, "folder").has(f.id) };
}

// ---------- Corbeille de dossiers ----------
// Mettre un dossier à la corbeille = le dossier, ses sous-dossiers ET leurs fichiers, d'un seul geste réversible. Rien n'est effacé du disque.
function trashFolder(ctx, id) {
  needScope(ctx);
  const f = folders.getFolder(ctx, Number(id));
  if (!f) throw missing("Dossier introuvable.");
  const ids = descendantIds(ctx, f.id), marks = ids.map(() => "?").join(",");
  const when = new Date().toISOString().slice(0, 19).replace("T", " ");
  const files = ctx.db.prepare(`SELECT id FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND folder_id IN (${marks})`).all(ctx.organizationId, ...ids);
  for (const r of files) media.assertWritable(ctx, media.getMedia(ctx, r.id));
  ctx.db.exec("SAVEPOINT mk_trash_folder");
  try {
    ctx.db.prepare(`UPDATE mk_media SET deleted_at = ?, deleted_by = ?, trashed_with_folder = ? WHERE organization_id = ? AND deleted_at IS NULL AND folder_id IN (${marks})`).run(when, ctx.userId ?? null, f.id, ctx.organizationId, ...ids);
    ctx.db.prepare(`UPDATE mk_media_folders SET deleted_at = ?, deleted_by = ? WHERE deleted_at IS NULL AND id IN (${marks})`).run(when, ctx.userId ?? null, ...ids);
    ctx.db.prepare("DELETE FROM mk_media_stars WHERE kind = 'folder' AND organization_id = ? AND target_id IN (" + marks + ")").run(ctx.organizationId, ...ids);
    ctx.db.exec("RELEASE mk_trash_folder");
  } catch (e) { ctx.db.exec("ROLLBACK TO mk_trash_folder"); ctx.db.exec("RELEASE mk_trash_folder"); throw e; }
  audit(ctx, "media.folder_trashed", "media_folder", f.id, { files: files.length, folders: ids.length });
  return { folderId: f.id, files: files.length, folders: ids.length };
}
const trashedFolder = (ctx, id) => { const s = needScope(ctx), c = siteCond(s); return ctx.db.prepare(`SELECT * FROM mk_media_folders WHERE id = ? AND organization_id = ? AND ${c.sql} AND deleted_at IS NOT NULL`).get(Number(id), ctx.organizationId, ...c.args) || null; };
function freeName(ctx, f, parent, name) {
  let n = name, i = 1;
  while (ctx.db.prepare("SELECT 1 FROM mk_media_folders WHERE organization_id = ? AND ifnull(site_id,0) = ifnull(?,0) AND ifnull(parent_id,0) = ifnull(?,0) AND name = ? COLLATE NOCASE AND deleted_at IS NULL AND id <> ?").get(ctx.organizationId, f.site_id, parent, n, f.id)) n = `${name} (restauré${i > 1 ? " " + i : ""})`, i++;
  return n;
}
function restoreFolder(ctx, id) {
  const f = trashedFolder(ctx, id);
  if (!f) throw missing("Dossier introuvable dans la corbeille.");
  const ids = descendantIds(ctx, f.id, { includeDeleted: true }).filter((x) => ctx.db.prepare("SELECT deleted_at FROM mk_media_folders WHERE id = ?").get(x).deleted_at === f.deleted_at);
  const marks = ids.map(() => "?").join(",");
  ctx.db.exec("SAVEPOINT mk_restore_folder");
  try {
    // Le dossier parent est-il toujours là ? Sinon le dossier revient à la racine ; un nom déjà pris reçoit « (restauré) »
    const parent = f.parent_id && ctx.db.prepare("SELECT 1 FROM mk_media_folders WHERE id = ? AND deleted_at IS NULL").get(f.parent_id) ? f.parent_id : null;
    ctx.db.prepare("UPDATE mk_media_folders SET deleted_at = NULL, deleted_by = NULL, parent_id = ?, name = ? WHERE id = ?").run(parent, freeName(ctx, f, parent, f.name), f.id);
    ctx.db.prepare(`UPDATE mk_media_folders SET deleted_at = NULL, deleted_by = NULL WHERE id IN (${marks}) AND id <> ?`).run(...ids, f.id);
    ctx.db.prepare("UPDATE mk_media SET deleted_at = NULL, deleted_by = NULL, trashed_with_folder = NULL WHERE organization_id = ? AND trashed_with_folder = ?").run(ctx.organizationId, f.id);
    ctx.db.exec("RELEASE mk_restore_folder");
  } catch (e) { ctx.db.exec("ROLLBACK TO mk_restore_folder"); ctx.db.exec("RELEASE mk_restore_folder"); throw e; }
  audit(ctx, "media.folder_restored", "media_folder", f.id, {});
  return folders.getFolder(ctx, f.id);
}
// Contenus encore utilisés dans un dossier en corbeille : la suppression définitive est refusée tant qu'il en reste (mêmes règles que pour un fichier)
function usedInTrashedFolder(ctx, id) {
  const used = [];
  for (const r of ctx.db.prepare("SELECT id FROM mk_media WHERE organization_id = ? AND trashed_with_folder = ?").all(ctx.organizationId, Number(id))) {
    const m = media.getMedia(ctx, r.id), u = m ? media.mediaUsage(ctx, m) : [];
    if (u.length) used.push({ id: m.id, name: m.name, usage: u.slice(0, 3).map((x) => `${x.kind} « ${x.name} »`) });
  }
  return used;
}
function purgeFolder(ctx, id) {
  const f = trashedFolder(ctx, id);
  if (!f) throw missing("Dossier introuvable dans la corbeille.");
  const used = usedInTrashedFolder(ctx, f.id);
  if (used.length) throw new MarketingError("invalid_state", `${used.length} fichier${used.length > 1 ? "s" : ""} de ce dossier ${used.length > 1 ? "sont utilisés" : "est utilisé"} (${used.slice(0, 3).map((u) => `« ${u.name} » par ${u.usage[0]}`).join(", ")}) : retirez-${used.length > 1 ? "les" : "le"} d'abord de ces contenus. Rien n'a été supprimé.`);
  const ids = descendantIds(ctx, f.id, { includeDeleted: true }).filter((x) => ctx.db.prepare("SELECT deleted_at FROM mk_media_folders WHERE id = ?").get(x).deleted_at === f.deleted_at);
  let purged = 0;
  for (const r of ctx.db.prepare("SELECT id FROM mk_media WHERE organization_id = ? AND trashed_with_folder = ?").all(ctx.organizationId, f.id)) { media.purgeMedia(ctx, r.id); purged++; }
  ctx.db.prepare(`DELETE FROM mk_media_folders WHERE id IN (${ids.map(() => "?").join(",")})`).run(...ids);
  audit(ctx, "media.folder_purged", "media_folder", f.id, { files: purged });
  return { files: purged, folders: ids.length };
}
// Contenu de la corbeille de CETTE médiathèque : dossiers (racines mises à la corbeille) et fichiers mis à la corbeille un par un, avec leur emplacement d'origine
function listTrash(ctx, { q = "" } = {}) {
  const s = needScope(ctx), c = siteCond(s), vis = media.visibleSql(ctx);
  const like = `%${clip(q, 80).replace(/[\\%_]/g, (x) => `\\${x}`)}%`;
  const fs = ctx.db.prepare(`SELECT f.*, (SELECT COUNT(*) FROM mk_media m WHERE m.trashed_with_folder = f.id) AS files FROM mk_media_folders f
    WHERE f.organization_id = ? AND ${c.sql.replace("site_id", "f.site_id")} AND f.deleted_at IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM mk_media_folders p WHERE p.id = f.parent_id AND p.deleted_at = f.deleted_at) AND f.name LIKE ? ESCAPE '\\' ORDER BY f.deleted_at DESC`).all(ctx.organizationId, ...c.args, like);
  const files = ctx.db.prepare(`SELECT * FROM mk_media WHERE organization_id = ? AND deleted_at IS NOT NULL AND (trashed_with_folder IS NULL OR trashed_with_folder NOT IN (SELECT id FROM mk_media_folders)) AND ${vis.sql} AND name LIKE ? ESCAPE '\\' ORDER BY deleted_at DESC, id DESC LIMIT 500`).all(ctx.organizationId, ...vis.params, like);
  const folderName = (fid) => (fid ? (ctx.db.prepare("SELECT name FROM mk_media_folders WHERE id = ?").get(fid) || {}).name || null : null);
  return {
    folders: fs.map((f) => ({ id: f.id, name: f.name, color: f.color || "", deletedAt: f.deleted_at, files: f.files, originalPath: f.parent_id ? folderPathAny(ctx, f.parent_id) : "Médiathèque" })),
    files: files.map((r) => ({ ...media.getMedia(ctx, r.id), originalFolder: folderName(r.folder_id) })),
  };
}
function folderPathAny(ctx, id) { const out = []; for (let cur = id, n = 0; cur && n < 12; n++) { const r = ctx.db.prepare("SELECT id, name, parent_id FROM mk_media_folders WHERE id = ?").get(cur); if (!r) break; out.unshift(r.name); cur = r.parent_id; } return ["Médiathèque", ...out].join(" / "); }
// Vider la corbeille : tout ce qui n'est plus utilisé est supprimé définitivement ; ce qui est encore utilisé est CONSERVÉ et signalé (jamais de contenu cassé en silence)
function emptyTrash(ctx) {
  needScope(ctx);
  const t = listTrash(ctx), kept = []; let purged = 0;
  for (const f of t.folders) { try { const r = purgeFolder(ctx, f.id); purged += r.files; } catch (e) { if (!(e instanceof MarketingError)) throw e; kept.push({ name: f.name, kind: "dossier", message: e.message }); } }
  for (const m of t.files) { try { media.purgeMedia(ctx, m.id); purged++; } catch (e) { if (!(e instanceof MarketingError)) throw e; kept.push({ name: m.name, kind: "fichier", message: e.message }); } }
  audit(ctx, "media.trash_emptied", "media", 0, { purged, kept: kept.length });
  return { purged, kept };
}
// Politique de conservation : 0 = jamais de suppression automatique
function getRetention(ctx) {
  checkCtx(ctx);
  const row = ctx.db.prepare("SELECT trash_retention_days d FROM mk_media_settings WHERE organization_id = ? AND site_key = ?").get(ctx.organizationId, siteKeyOf(ctx));
  return row ? row.d : 0;
}
function setRetention(ctx, days) {
  needScope(ctx);
  const d = Number(days);
  if (!RETENTION.includes(d)) throw bad("Durée de conservation inconnue (0, 7, 30 ou 90 jours).");
  ctx.db.prepare("INSERT INTO mk_media_settings (organization_id, site_key, trash_retention_days, updated_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT (organization_id, site_key) DO UPDATE SET trash_retention_days = excluded.trash_retention_days, updated_at = excluded.updated_at").run(ctx.organizationId, siteKeyOf(ctx), d);
  audit(ctx, "media.retention_set", "media", 0, { days: d });
  return d;
}
const lastSweep = new Map();
// Suppression automatique des éléments restés à la corbeille plus longtemps que la durée choisie. Un élément encore UTILISÉ n'est jamais supprimé. Au plus une fois par heure et par médiathèque.
function sweepTrash(ctx, { force = false } = {}) {
  const days = getRetention(ctx);
  if (!days) return { purged: 0, days };
  const key = `${ctx.organizationId}:${siteKeyOf(ctx)}`;
  if (!force && Date.now() - (lastSweep.get(key) || 0) < 3600e3) return { purged: 0, days, skipped: true };
  lastSweep.set(key, Date.now());
  const limit = new Date(Date.now() - days * 864e5).toISOString().slice(0, 19).replace("T", " ");
  let purged = 0;
  for (const f of listTrash(ctx).folders.filter((x) => x.deletedAt <= limit)) { try { purged += purgeFolder(ctx, f.id).files; } catch (e) { if (!(e instanceof MarketingError)) throw e; } }
  for (const m of listTrash(ctx).files.filter((x) => x.deletedAt <= limit)) { try { media.purgeMedia(ctx, m.id); purged++; } catch (e) { if (!(e instanceof MarketingError)) throw e; } }
  if (purged) audit(ctx, "media.trash_swept", "media", 0, { purged, days });
  return { purged, days };
}

// ---------- Fichiers : copie, utilisation ----------
// Copie PHYSIQUE d'un fichier (nouvelle adresse, mêmes informations) : sert à travailler sur une variante sans toucher à l'original
function copyMedia(ctx, id, { folderId, keepName = false } = {}) {
  const m = ownMedia(ctx, id);
  const where = media.parsePublicPath(ctx, m.path);
  if (!where) throw new MarketingError("unavailable", "Le fichier d'origine est introuvable sur le stockage.");
  let buffer;
  try { buffer = require("fs").readFileSync(where.absolute); } catch { throw new MarketingError("unavailable", "Le fichier d'origine est introuvable sur le stockage : copie impossible."); }
  const ext = (m.path.match(/\.[A-Za-z0-9]+$/) || [""])[0];
  const base = m.name.replace(/\.[A-Za-z0-9]{1,6}$/, "");
  let saved = media.saveUpload(ctx, { buffer, originalName: keepName ? m.name : `${base} (copie)${ext}`, declaredType: m.mime, siteId: m.siteId ?? undefined });
  const target = folderId === undefined ? m.folderId : folderId;
  if (target) { const r = folders.moveMedia(ctx, [saved.id], target); if (r.failed.length) throw new MarketingError("invalid_field", r.failed[0].message); }
  saved = media.updateMedia(ctx, saved.id, { alt: m.alt, title: m.title, caption: m.caption, description: m.description });
  audit(ctx, "media.copied", "media", saved.id, { from: m.id });
  return media.getMedia(ctx, saved.id);
}
// Enregistre l'utilisation d'un fichier par un éditeur (alimente « Récemment utilisés »)
function touchUsed(ctx, ids) {
  needScope(ctx);
  const list = idsOf(ids, 50);
  if (!list.length) return 0;
  let n = 0;
  for (const id of list) { try { ownMedia(ctx, id); ctx.db.prepare("UPDATE mk_media SET last_used_at = datetime('now') WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId); n++; } catch (e) { if (!(e instanceof MarketingError)) throw e; } }
  return n;
}

// ---------- Fiches enrichies pour l'écran (miniatures, favoris, tags, collections, dossier) ----------
function decorate(ctx, items) {
  const ids = items.map((m) => m.id);
  const stars = starredSet(ctx, "media");
  let tags = {}, cols = {};
  try { tags = tagsOf(ctx, ids); cols = collectionsOf(ctx, ids); } catch (e) { if (!/no such table/i.test(e.message)) throw e; }
  const folderIds = [...new Set(items.map((m) => m.folderId).filter(Boolean))];
  const names = folderIds.length ? Object.fromEntries(ctx.db.prepare(`SELECT id, name FROM mk_media_folders WHERE id IN (${folderIds.map(() => "?").join(",")})`).all(...folderIds).map((r) => [r.id, r.name])) : {};
  return items.map((m) => {
    const image = m.type === "image" && m.mime !== "image/gif";
    return { ...m, thumb: image ? variants.sourceFor(m.path, "thumbnail") : m.type === "image" ? m.path : null, medium: image ? variants.sourceFor(m.path, "medium") : m.type === "image" ? m.path : null, starred: stars.has(m.id), tags: tags[m.id] || [], collections: cols[m.id] || [], folderName: m.folderId ? names[m.folderId] || null : null };
  });
}

// ---------- Compteurs de la barre latérale ----------
function sidebarCounts(ctx) {
  checkCtx(ctx);
  const vis = media.visibleSql(ctx), counts = media.mediaCounts(ctx);
  const one = (sql, ...a) => ctx.db.prepare(sql).get(ctx.organizationId, ...vis.params, ...a).n;
  const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 19).replace("T", " ");
  const out = { ...counts, recent: one(`SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND ${vis.sql} AND created_at >= ?`, since), used: one(`SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND ${vis.sql} AND last_used_at IS NOT NULL`) };
  out.large = one(`SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND ${vis.sql} AND size >= ?`, media.LARGE_BYTES);
  out.duplicates = one(`SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND ${vis.sql} AND sha256 IN (SELECT sha256 FROM mk_media WHERE organization_id = ? AND sha256 IS NOT NULL AND deleted_at IS NULL AND ${vis.sql} GROUP BY sha256 HAVING COUNT(*) > 1)`, ctx.organizationId, ...vis.params);
  out.unfiled = one(`SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND ${vis.sql} AND folder_id IS NULL`);
  out.shared = ctx.db.prepare("SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND reach = 'shared'").get(ctx.organizationId).n;
  out.starred = ctx.userId == null ? 0 : ctx.db.prepare(`SELECT COUNT(*) n FROM mk_media m WHERE m.organization_id = ? AND m.deleted_at IS NULL AND ${vis.sql.replace(/\b(reach|site_id)\b/g, "m.$1")} AND m.id IN (SELECT target_id FROM mk_media_stars WHERE user_id = ? AND kind = 'media')`).get(ctx.organizationId, ...vis.params, ctx.userId).n;
  const s = scope(ctx);
  out.trashFolders = s ? ctx.db.prepare(`SELECT COUNT(*) n FROM mk_media_folders f WHERE f.organization_id = ? AND ${siteCond(s, "f.").sql} AND f.deleted_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mk_media_folders p WHERE p.id = f.parent_id AND p.deleted_at = f.deleted_at)`).get(ctx.organizationId, ...siteCond(s, "f.").args).n : 0;
  out.trashStanding = ctx.db.prepare(`SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NOT NULL AND (trashed_with_folder IS NULL OR trashed_with_folder NOT IN (SELECT id FROM mk_media_folders)) AND ${vis.sql}`).get(ctx.organizationId, ...vis.params).n;
  return out;
}

// ---------- Stockage ----------
// « bytes » = taille LOGIQUE des fichiers originaux enregistrés (ce que la médiathèque affiche). « uniqueBytes » = ce que les mêmes fichiers occuperaient si les copies identiques n'étaient gardées qu'une fois.
// Le stockage physique du fournisseur peut différer (versions réduites fabriquées à la demande, sauvegardes, déduplication éventuelle) : ces chiffres ne le mesurent pas.
function storageStats(ctx) {
  checkCtx(ctx);
  const vis = media.visibleSql(ctx), base = `organization_id = ? AND deleted_at IS NULL AND ${vis.sql}`, a = [ctx.organizationId, ...vis.params];
  const total = ctx.db.prepare(`SELECT COUNT(*) files, COALESCE(SUM(size), 0) bytes FROM mk_media WHERE ${base}`).get(...a);
  const unique = ctx.db.prepare(`SELECT COALESCE(SUM(s), 0) b FROM (SELECT MAX(size) s FROM mk_media WHERE ${base} AND sha256 IS NOT NULL GROUP BY sha256 UNION ALL SELECT size FROM mk_media WHERE ${base} AND sha256 IS NULL)`).get(...a, ...a).b;
  const byType = ctx.db.prepare(`SELECT type, COUNT(*) count, COALESCE(SUM(size), 0) bytes FROM mk_media WHERE ${base} GROUP BY type ORDER BY bytes DESC`).all(...a);
  const largest = ctx.db.prepare(`SELECT id, name, type, size, path, folder_id AS folderId, created_at AS createdAt FROM mk_media WHERE ${base} ORDER BY size DESC, id DESC LIMIT 10`).all(...a);
  const recent = ctx.db.prepare(`SELECT id, name, type, size, path, created_at AS createdAt FROM mk_media WHERE ${base} ORDER BY id DESC LIMIT 10`).all(...a);
  const monthly = ctx.db.prepare(`SELECT substr(created_at, 1, 7) month, COUNT(*) count, COALESCE(SUM(size), 0) bytes FROM mk_media WHERE ${base} GROUP BY month ORDER BY month`).all(...a);
  const trash = ctx.db.prepare(`SELECT COUNT(*) files, COALESCE(SUM(size), 0) bytes FROM mk_media WHERE organization_id = ? AND deleted_at IS NOT NULL AND ${vis.sql}`).get(...a);
  const s = scope(ctx);
  const folderCount = s ? ctx.db.prepare(`SELECT COUNT(*) n FROM mk_media_folders WHERE organization_id = ? AND ${siteCond(s).sql} AND deleted_at IS NULL`).get(ctx.organizationId, ...siteCond(s).args).n : 0;
  const alerts = s ? getStorageAlerts(ctx) : { warnMb: 0, critMb: 0 };
  return { alerts: { ...alerts, level: alertLevel(total.bytes, alerts), editable: Boolean(s) }, files: total.files, folders: folderCount, bytes: total.bytes, uniqueBytes: unique, byType, largest, recent, monthly, trash, limits: media.uploadConfig().limits,
    note: "Tailles des fichiers originaux enregistrés. Les versions réduites fabriquées à la demande et le stockage physique du fournisseur ne sont pas comptés." };
}

// ---------- Doublons : détail et résolution (jamais de suppression automatique) ----------
function duplicateDetail(ctx, sha256) {
  checkCtx(ctx);
  const vis = media.visibleSql(ctx);
  if (!/^[0-9a-f]{64}$/.test(String(sha256))) throw bad("Empreinte invalide.");
  const rows = ctx.db.prepare(`SELECT id FROM mk_media WHERE organization_id = ? AND sha256 = ? AND deleted_at IS NULL AND ${vis.sql} ORDER BY id`).all(ctx.organizationId, sha256, ...vis.params);
  const items = decorate(ctx, rows.map((r) => media.getMedia(ctx, r.id)));
  return items.map((m) => ({ ...m, usage: media.mediaUsage(ctx, m).map((u) => ({ kind: u.kind, name: u.name, href: media.usageHref(u), confidence: u.confidence })), path_label: m.folderId ? folderPath(ctx, m.folderId) : "Médiathèque" }));
}
// Garde UN exemplaire : les autres vont à la corbeille (réversible) ou dans un dossier. Les contenus qui citent un exemplaire écarté continuent de l'afficher tant qu'il est à la corbeille.
function resolveDuplicates(ctx, { sha256, keepId, action = "trash", folderId = null, ids } = {}) {
  needScope(ctx);
  const group = duplicateDetail(ctx, sha256);
  if (!group.some((m) => m.id === Number(keepId))) throw bad("L'exemplaire à conserver ne fait pas partie du groupe.");
  const chosen = idsOf(ids && ids.length ? ids : group.map((m) => m.id)).filter((x) => x !== Number(keepId) && group.some((m) => m.id === x));
  if (!chosen.length) throw bad("Aucun exemplaire à traiter.");
  if (action === "move") return folders.moveMedia(ctx, chosen, folderId);
  if (action !== "trash") throw bad("Action inconnue.");
  const done = [], failed = [];
  for (const id of chosen) { try { media.trashMedia(ctx, id); done.push(id); } catch (e) { if (!(e instanceof MarketingError)) throw e; failed.push({ id, name: `#${id}`, message: e.message }); } }
  return { done, failed };
}

// ---------- Suggestions de recherche ----------
function suggest(ctx, q) {
  checkCtx(ctx);
  const text = clip(q, 60);
  if (text.length < 2) return [];
  const like = `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`, vis = media.visibleSql(ctx), out = [];
  for (const r of ctx.db.prepare(`SELECT id, name, type FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND ${vis.sql} AND (name LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\') ORDER BY CASE WHEN name LIKE ? ESCAPE '\\' THEN 0 ELSE 1 END, id DESC LIMIT 5`).all(ctx.organizationId, ...vis.params, like, like, `${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`)) out.push({ kind: "media", label: r.name, value: r.name, type: r.type, id: r.id });
  const s = scope(ctx);
  if (s) {
    const c = siteCond(s);
    for (const r of ctx.db.prepare(`SELECT id, name FROM mk_media_tags WHERE organization_id = ? AND ${c.sql} AND name LIKE ? ESCAPE '\\' ORDER BY name COLLATE NOCASE LIMIT 3`).all(ctx.organizationId, ...c.args, like)) out.push({ kind: "tag", label: r.name, id: r.id });
    for (const r of ctx.db.prepare(`SELECT id, name FROM mk_media_folders WHERE organization_id = ? AND ${c.sql} AND deleted_at IS NULL AND name LIKE ? ESCAPE '\\' ORDER BY name COLLATE NOCASE LIMIT 3`).all(ctx.organizationId, ...c.args, like)) out.push({ kind: "folder", label: r.name, id: r.id });
  }
  return out.slice(0, 10);
}

// =====================================================================================================================
// Lot 2 : dossiers intelligents et recherches enregistrées, ordre et copie des dossiers, historique, alertes de stockage
// =====================================================================================================================

// ---------- Dossiers intelligents (partagés par le site) et recherches enregistrées (personnelles) ----------
// Un critère n'est jamais du SQL : ce sont les réglages de l'adresse de la médiathèque (q, type, ext, tmin…), relus et validés par le serveur à chaque ouverture.
const CRITERIA_KEYS = ["q", "type", "ext", "mois", "periode", "tmin", "tmax", "lmin", "lmax", "doublons", "volumineux", "tag", "collection", "favoris", "utilise", "recents", "dossier"];
function sanitizeCriteria(input) {
  const o = input && typeof input === "object" ? input : {};
  const out = {};
  for (const k of CRITERIA_KEYS) {
    const raw = o[k];
    if (raw === undefined || raw === null || raw === "" || typeof raw === "object") continue;
    const v = clip(String(raw), 80);
    if (!v) continue;
    if (["tmin", "tmax", "lmin", "lmax", "tag", "collection"].includes(k) && !/^\d{1,9}$/.test(v)) continue;
    if (["doublons", "volumineux", "favoris", "utilise", "recents"].includes(k)) { if (v === "1") out[k] = "1"; continue; }
    if (k === "dossier" && !/^(\d{1,9}|racine)$/.test(v)) continue;
    if (k === "ext" && !/^[a-z0-9]{1,8}$/i.test(v)) continue;
    if (k === "mois" && !/^\d{4}-\d{2}$/.test(v)) continue;
    out[k] = v;
  }
  return out;
}
const smartRow = (r) => ({ id: r.id, kind: r.kind, name: r.name, color: r.color, criteria: (() => { try { return sanitizeCriteria(JSON.parse(r.criteria)); } catch { return {}; } })(), mine: r.kind === "search" });
function listSmart(ctx) {
  const s = needScope(ctx), c = siteCond(s);
  return ctx.db.prepare(`SELECT * FROM mk_media_smart WHERE organization_id = ? AND ${c.sql} AND (kind = 'smart' OR owner_id = ?) ORDER BY kind, name COLLATE NOCASE`).all(ctx.organizationId, ...c.args, ctx.userId ?? -1).map(smartRow);
}
function getSmart(ctx, id) {
  const s = needScope(ctx), c = siteCond(s);
  const r = ctx.db.prepare(`SELECT * FROM mk_media_smart WHERE id = ? AND organization_id = ? AND ${c.sql} AND (kind = 'smart' OR owner_id = ?)`).get(Number(id), ctx.organizationId, ...c.args, ctx.userId ?? -1);
  if (!r) throw missing("Vue introuvable.");
  return r;
}
function createSmart(ctx, { name, kind = "smart", criteria, color = "" } = {}) {
  const s = needScope(ctx), clean = clip(name, 60), crit = sanitizeCriteria(criteria);
  if (!["smart", "search"].includes(kind)) throw bad("Type de vue inconnu.");
  if (!clean) throw bad("Donnez un nom à cette vue.");
  if (!Object.keys(crit).length) throw bad("Choisissez au moins un critère (recherche, type, taille…) avant d'enregistrer.");
  if (color && !COLORS.includes(color)) throw bad("Couleur inconnue.");
  if (ctx.userId == null) throw bad("Connexion requise.");
  try {
    const row = ctx.db.prepare("INSERT INTO mk_media_smart (organization_id, site_id, kind, owner_id, name, color, criteria) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *").get(ctx.organizationId, s.siteId, kind, kind === "search" ? ctx.userId : null, clean, color, JSON.stringify(crit));
    audit(ctx, "media.smart_created", "media_smart", row.id, { kind });
    return smartRow(row);
  } catch (e) { if (/UNIQUE/i.test(e.message)) throw new MarketingError("invalid_state", `Une vue « ${clean} » existe déjà.`); throw e; }
}
function updateSmart(ctx, id, { name, criteria, color } = {}) {
  const r = getSmart(ctx, id);
  const nextName = name === undefined ? r.name : clip(name, 60);
  if (!nextName) throw bad("Donnez un nom à cette vue.");
  let nextCrit = r.criteria;
  if (criteria !== undefined) { const c = sanitizeCriteria(criteria); if (!Object.keys(c).length) throw bad("Choisissez au moins un critère."); nextCrit = JSON.stringify(c); }
  if (color !== undefined && color && !COLORS.includes(color)) throw bad("Couleur inconnue.");
  try {
    ctx.db.prepare("UPDATE mk_media_smart SET name = ?, criteria = ?, color = ?, updated_at = datetime('now') WHERE id = ?").run(nextName, nextCrit, color === undefined ? r.color : color, r.id);
  } catch (e) { if (/UNIQUE/i.test(e.message)) throw new MarketingError("invalid_state", `Une vue « ${nextName} » existe déjà.`); throw e; }
  audit(ctx, "media.smart_updated", "media_smart", r.id, {});
  return smartRow(getSmart(ctx, r.id));
}
function deleteSmart(ctx, id) {
  const r = getSmart(ctx, id);
  ctx.db.prepare("DELETE FROM mk_media_smart WHERE id = ?").run(r.id); // une vue ne contient aucun fichier : rien d'autre n'est touché
  audit(ctx, "media.smart_deleted", "media_smart", r.id, { kind: r.kind });
  return { id: r.id };
}

// ---------- Ordre manuel des dossiers (entre frères) ----------
function moveFolderOrder(ctx, id, dir) {
  const s = needScope(ctx);
  if (!["up", "down"].includes(dir)) throw bad("Direction inconnue.");
  const f = folders.getFolder(ctx, Number(id));
  if (!f) throw missing("Dossier introuvable.");
  const c = siteCond(s);
  const sibs = ctx.db.prepare(`SELECT id FROM mk_media_folders WHERE organization_id = ? AND ${c.sql} AND ifnull(parent_id, 0) = ifnull(?, 0) AND deleted_at IS NULL ORDER BY sort_order, name COLLATE NOCASE`).all(ctx.organizationId, ...c.args, f.parent_id ?? null).map((r) => r.id);
  const i = sibs.indexOf(f.id), j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= sibs.length) return { moved: false };
  [sibs[i], sibs[j]] = [sibs[j], sibs[i]];
  const upd = ctx.db.prepare("UPDATE mk_media_folders SET sort_order = ? WHERE id = ?");
  sibs.forEach((fid, n) => upd.run(n, fid)); // renumérotation de la fratrie : l'ordre devient explicite
  audit(ctx, "media.folder_reordered", "media_folder", f.id, { dir });
  return { moved: true };
}

// ---------- Copie d'un dossier (sous-dossiers et fichiers) ----------
// Les fichiers sont réellement copiés (nouveaux fichiers, nouvelles adresses) : le dossier d'origine n'est jamais modifié. Limite pour rester rapide et sûre.
const COPY_MAX_FILES = 300;
function duplicateFolder(ctx, id) {
  const s = needScope(ctx);
  const root = folders.getFolder(ctx, Number(id));
  if (!root) throw missing("Dossier introuvable.");
  const ids = descendantIds(ctx, root.id);
  const c = siteCond(s);
  const files = ctx.db.prepare(`SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND folder_id IN (${ids.map(() => "?").join(",")})`).get(ctx.organizationId, ...ids).n;
  if (files > COPY_MAX_FILES) throw new MarketingError("invalid_state", `Ce dossier contient ${files} fichiers : la copie est limitée à ${COPY_MAX_FILES} fichiers à la fois.`);
  const taken = new Set(ctx.db.prepare(`SELECT name FROM mk_media_folders WHERE organization_id = ? AND ${c.sql} AND ifnull(parent_id, 0) = ifnull(?, 0) AND deleted_at IS NULL`).all(ctx.organizationId, ...c.args, root.parent_id ?? null).map((r) => fold(r.name)));
  let name = clip(`${root.name} (copie)`, 80);
  for (let n = 2; taken.has(fold(name)); n++) name = clip(`${root.name} (copie ${n})`, 80);
  const failures = [];
  let copiedFiles = 0, subfolders = 0;
  const walk = (srcId, parentId, newName) => {
    const src = ctx.db.prepare("SELECT * FROM mk_media_folders WHERE id = ?").get(srcId);
    const made = folders.createFolder(ctx, { name: newName ?? src.name, parentId });
    ctx.db.prepare("UPDATE mk_media_folders SET color = ?, description = ?, sort_order = ? WHERE id = ?").run(src.color, src.description, src.sort_order, made.id);
    const mine = ctx.db.prepare("SELECT id, name FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND folder_id = ? ORDER BY id").all(ctx.organizationId, srcId);
    for (const m of mine) { try { copyMedia(ctx, m.id, { folderId: made.id, keepName: true }); copiedFiles++; } catch (e) { failures.push({ id: m.id, name: m.name, message: e.message }); } }
    const kids = ctx.db.prepare("SELECT id FROM mk_media_folders WHERE parent_id = ? AND deleted_at IS NULL ORDER BY sort_order, name COLLATE NOCASE").all(srcId);
    for (const k of kids) { walk(k.id, made.id, null); subfolders++; }
    return made;
  };
  const made = walk(root.id, root.parent_id ?? null, name);
  audit(ctx, "media.folder_duplicated", "media_folder", made.id, { from: root.id, files: copiedFiles });
  return { folder: folders.getFolder(ctx, made.id), copiedFiles, subfolders, failures };
}

// ---------- Historique des opérations (lecture du journal d'audit ; rien n'est annulable depuis cet écran) ----------
const ACTIONS = {
  "media.uploaded": "Fichier importé", "media.copied": "Fichier copié", "media.moved": "Fichiers déplacés", "media.trashed": "Mis à la corbeille", "media.restored": "Restauré", "media.deleted": "Supprimé définitivement",
  "media.assigned": "Dossier modifié", "media.shared": "Partage modifié", "media.folder_created": "Dossier créé", "media.folder_renamed": "Dossier renommé", "media.folder_moved": "Dossier déplacé",
  "media.folder_trashed": "Dossier mis à la corbeille", "media.folder_restored": "Dossier restauré", "media.folder_deleted": "Dossier supprimé", "media.folder_purged": "Dossier supprimé définitivement",
  "media.folder_reordered": "Ordre des dossiers modifié", "media.folder_duplicated": "Dossier copié", "media.tag_created": "Tag créé", "media.tag_deleted": "Tag supprimé", "media.tagged": "Tags modifiés",
  "media.collection_created": "Collection créée", "media.collection_deleted": "Collection supprimée", "media.smart_created": "Vue enregistrée", "media.smart_updated": "Vue modifiée", "media.smart_deleted": "Vue supprimée",
  "media.trash_emptied": "Corbeille vidée", "media.trash_swept": "Corbeille nettoyée (conservation)", "media.retention_set": "Conservation de la corbeille modifiée", "media.storage_alerts_set": "Seuils de stockage modifiés",
};
function history(ctx, { limit = 50, before, action } = {}) {
  checkCtx(ctx);
  const s = folders.scopeOf(ctx);
  const lim = Math.min(Math.max(Math.round(Number(limit)) || 50, 1), 200);
  const where = ["l.organization_id = ?", "l.action LIKE 'media.%'"], args = [ctx.organizationId];
  if (s) { if (s.siteId === null) where.push("l.site_id IS NULL"); else { where.push("l.site_id = ?"); args.push(s.siteId); } }
  if (Number.isInteger(Number(before)) && Number(before) > 0) { where.push("l.id < ?"); args.push(Number(before)); }
  if (action && Object.hasOwn(ACTIONS, action)) { where.push("l.action = ?"); args.push(action); }
  const rows = ctx.db.prepare(`SELECT l.id, l.action, l.resource_type AS type, l.resource_id AS rid, l.metadata, l.created_at AS at, l.user_id AS uid, u.username FROM mk_audit_logs l LEFT JOIN users u ON u.id = l.user_id WHERE ${where.join(" AND ")} ORDER BY l.id DESC LIMIT ?`).all(...args, lim + 1);
  const more = rows.length > lim;
  const items = rows.slice(0, lim).map((r) => {
    let meta = {}; try { meta = JSON.parse(r.metadata || "{}"); } catch { meta = {}; }
    let target = "";
    if (r.type === "media") target = ctx.db.prepare("SELECT name FROM mk_media WHERE id = ? AND organization_id = ?").get(Number(r.rid), ctx.organizationId)?.name || "";
    else if (r.type === "media_folder") target = ctx.db.prepare("SELECT name FROM mk_media_folders WHERE id = ? AND organization_id = ?").get(Number(r.rid), ctx.organizationId)?.name || "";
    else if (r.type === "media_smart") target = ctx.db.prepare("SELECT name FROM mk_media_smart WHERE id = ? AND organization_id = ?").get(Number(r.rid), ctx.organizationId)?.name || "";
    return { id: r.id, action: r.action, label: ACTIONS[r.action] || r.action.replace(/^media\./, ""), target, count: Number(meta.count || meta.files || 0) || null, at: r.at, user: r.username || (r.uid ? `Utilisateur n° ${r.uid}` : "Système") };
  });
  return { items, next: more ? items[items.length - 1].id : null, actions: Object.entries(ACTIONS).map(([key, label]) => ({ key, label })) };
}

// ---------- Alertes de stockage (seuils propres à chaque médiathèque) ----------
const alertKey = (ctx, f) => `mediastorage.${scopeOfSite(ctx)}.${f}`;
const scopeOfSite = (ctx) => { const s = needScope(ctx); return s.siteId === null ? "main" : `site_${s.siteId}`; };
function getStorageAlerts(ctx) {
  needScope(ctx);
  const rd = (f) => { const r = ctx.db.prepare("SELECT value FROM mk_settings WHERE organization_id = ? AND key = ?").get(ctx.organizationId, alertKey(ctx, f)); return r && /^\d{1,7}$/.test(String(r.value)) ? Number(r.value) : 0; };
  return { warnMb: rd("warn_mb"), critMb: rd("crit_mb") };
}
function setStorageAlerts(ctx, { warnMb, critMb } = {}) {
  needScope(ctx);
  const num = (v, label) => { if (v === "" || v === null || v === undefined) return 0; if (!/^\d{1,7}$/.test(String(v))) throw bad(`${label} : entrez un nombre entier de Mo (0 = désactivé).`); return Number(v); };
  const w = num(warnMb, "Seuil d'avertissement"), c = num(critMb, "Seuil critique");
  if (w && c && w >= c) throw bad("Le seuil d'avertissement doit être inférieur au seuil critique.");
  const set = ctx.db.prepare("INSERT INTO mk_settings (organization_id, key, value, is_secret) VALUES (?, ?, ?, 0) ON CONFLICT (organization_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')");
  set.run(ctx.organizationId, alertKey(ctx, "warn_mb"), String(w)); set.run(ctx.organizationId, alertKey(ctx, "crit_mb"), String(c));
  audit(ctx, "media.storage_alerts_set", "media_storage", 0, {});
  return getStorageAlerts(ctx);
}
// niveau d'alerte d'après la taille LOGIQUE des fichiers enregistrés (jamais une capacité inventée : sans seuil, aucune alerte)
function alertLevel(bytes, a) { const mb = bytes / 1048576; if (a.critMb && mb >= a.critMb) return "crit"; if (a.warnMb && mb >= a.warnMb) return "warn"; return "ok"; }

// niveau d'alerte du stockage pour la barre latérale : sans seuil défini, aucune requête de somme n'est faite
function storageLevel(ctx) {
  if (!folders.scopeOf(ctx)) return "ok";
  const a = getStorageAlerts(ctx);
  if (!a.warnMb && !a.critMb) return "ok";
  const vis = media.visibleSql(ctx);
  const bytes = ctx.db.prepare(`SELECT COALESCE(SUM(size), 0) b FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND ${vis.sql}`).get(ctx.organizationId, ...vis.params).b;
  return alertLevel(bytes, a);
}

module.exports = {
  SECTIONS, CRITERIA_KEYS, sanitizeCriteria, listSmart, getSmart, createSmart, updateSmart, deleteSmart, moveFolderOrder, duplicateFolder, history, getStorageAlerts, setStorageAlerts, storageLevel,
  COLORS, RETENTION, VIEWS, COLUMNS, DEFAULT_PREFS, siteKeyOf, ownMedia,
  setStar, starredSet,
  listTags, createTag, renameTag, deleteTag, tagMedia, setMediaTags, tagsOf,
  listCollections, createCollection, renameCollection, deleteCollection, addToCollection, removeFromCollection, collectionsOf,
  getPrefs, setPrefs, sanitizePrefs,
  updateFolder, folderProperties, folderPath, descendantIds,
  trashFolder, restoreFolder, purgeFolder, listTrash, emptyTrash, getRetention, setRetention, sweepTrash,
  copyMedia, touchUsed, decorate, sidebarCounts, storageStats, duplicateDetail, resolveDuplicates, suggest,
};
