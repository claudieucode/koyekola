// KOLAKISA CMS → Apparence → Patterns : bibliothèque de compositions (sections) réutilisables d'UN site.
// Aucun second format ni second moteur : un pattern est une liste de VRAIES sections du Page Builder (pages/sections.js), les compositions du site vivent dans
// appearance_patterns (site_id ; NULL = site principal) avec corbeille ; les compositions INTÉGRÉES viennent de pages/patterns.js. Insérer un pattern ajoute des sections
// NATIVES (nouveaux identifiants, contenu revalidé) au brouillon de la page : elles restent modifiables avec les outils habituels. Chaque lecture et écriture est limitée au site
// vérifié par le serveur (siteId : entier | null = principal) ; un identifiant de pattern ou de page d'un autre site est introuvable.
const db = require("../config/database");
const { sameScope } = require("./siteScope");
const appearance = require("./appearance");
const builtinLib = require("../marketing/pages/patterns");
const sectionsLib = require("../marketing/pages/sections");
const { UserError } = require("../utils/errors");
const { transaction } = require("../marketing/db/tx");

const pagesLib = () => require("../marketing/pages");
const parse = (t) => { try { const v = JSON.parse(t); return Array.isArray(v) ? v : []; } catch { return []; } };
const MAX_SECTIONS = 12; // sections d'une composition
// Identifiants retirés (le moteur en donne de nouveaux à l'insertion) : une copie indépendante
const strip = (n) => (Array.isArray(n) ? n.map(strip) : n && typeof n === "object" ? Object.fromEntries(Object.entries(n).filter(([k]) => k !== "id").map(([k, v]) => [k, strip(v)])) : n);
const countNodes = (sections) => { let n = 0; const walk = (x) => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === "object") { if (x.type) n += 1; Object.values(x).forEach(walk); } }; walk(sections); return n; };
const labelOf = (s) => { const name = s.name || (s.props && (s.props.title || s.props.heading || s.props.text)) || s.title || s.heading || ""; return `${s.type}${name ? ` — ${String(name).replace(/<[^>]*>/g, "").slice(0, 50)}` : ""}`; };

// ---------- Lecture ----------
function builtin(ctx) {
  return builtinLib.catalog(ctx).map((p) => ({ ref: `builtin:${p.key}`, key: p.key, category: p.category, label: p.label, description: "", sections: p.sections.length, elements: countNodes(p.sections), source: "builtin" }));
}
function mine(siteId) {
  return appearance.patternRows(siteId).map((p) => { const s = parse(p.sections); return { ref: `mine:${p.id}`, id: p.id, category: p.category || appearance.PATTERN_CATEGORY, label: p.name, description: p.description || "", sections: s.length, elements: countNodes(s), source: "mine", createdAt: p.created_at, sourcePageId: p.source_page_id }; });
}
const trash = (siteId) => db.prepare(`SELECT id, name, description, deleted_at FROM appearance_patterns WHERE ${sameScope("site_id")} AND deleted_at IS NOT NULL ORDER BY deleted_at DESC LIMIT 50`).all(siteId).map((p) => ({ id: p.id, label: p.name, description: p.description || "", deletedAt: p.deleted_at }));
// Une composition d'un autre site (ou la corbeille) n'est jamais retournée
function ownRow(siteId, id, { deleted = false } = {}) {
  if (!Number.isInteger(id) || id < 1) return null;
  return db.prepare(`SELECT * FROM appearance_patterns WHERE id = ? AND ${sameScope("site_id")} AND deleted_at IS ${deleted ? "NOT NULL" : "NULL"}`).get(id, siteId) || null;
}
// Sections d'une référence « builtin:<clé> » ou « mine:<id> » (copie profonde, jamais l'objet du catalogue)
function sectionsOf(ctx, siteId, ref) {
  const m = /^(builtin|mine):(.{1,60})$/.exec(String(ref || ""));
  if (!m) throw new UserError("Pattern inconnu.");
  if (m[1] === "builtin") {
    const p = builtinLib.catalog(ctx).find((x) => x.key === m[2]);
    if (!p) throw new UserError("Pattern inconnu.");
    return { label: p.label, sections: JSON.parse(JSON.stringify(p.sections)) };
  }
  const row = ownRow(siteId, Number(m[2]));
  if (!row) throw new UserError("Pattern introuvable pour ce site.");
  return { label: row.name, sections: parse(row.sections) };
}
// Pages du site où insérer : jamais une étape de tunnel ni une page archivée ; chaque page avec ses sections réelles (pour choisir l'emplacement)
function pagesOf(ctx, siteId) {
  return pagesLib().listPages(ctx, { siteId }).filter((p) => p.kind !== "step" && !p.archived_at).map((p) => { const page = pagesLib().getPage(ctx, p.id); return { id: p.id, name: p.name, status: p.status, hasDraft: Boolean(p.has_draft), sections: page ? page.working.sections.map((s, i) => ({ index: i, label: labelOf(s) })) : [] }; });
}
function pageOf(ctx, siteId, pageId) {
  const page = pagesLib().getPage(ctx, Number(pageId));
  if (!page || page.archived_at || page.kind === "step" || (page.site_id ?? null) !== (siteId ?? null)) throw new UserError("Page introuvable pour ce site.");
  return page;
}

// ---------- Écriture ----------
// Enregistrer des sections d'une page comme composition du site (copie indépendante revalidée par le moteur)
function createFromPage(ctx, siteId, { pageId, indexes, name, description = "", userId = null }) {
  const page = pageOf(ctx, siteId, pageId);
  const list = [...new Set((Array.isArray(indexes) ? indexes : []).map(Number))].filter((i) => Number.isInteger(i) && i >= 0);
  if (!list.length) throw new UserError("Choisissez au moins une section à enregistrer.");
  if (list.length > MAX_SECTIONS) throw new UserError(`${MAX_SECTIONS} sections au plus par composition.`);
  const all = page.working.sections || [];
  const picked = list.sort((a, b) => a - b).map((i) => all[i]);
  if (picked.some((s) => !s)) throw new UserError("Section introuvable dans cette page.");
  if (picked.some((s) => s.type === "component")) throw new UserError("Une section déjà synchronisée (composant) s'utilise telle quelle dans le Page Builder : elle ne peut pas devenir un pattern.");
  const clean = picked.map((s, i) => strip(sectionsLib.normalizeSection(ctx, strip(s), i)));
  return transaction(db, () => appearance.createPattern({ name, description, sections: clean, siteId, sourcePageId: page.id, userId }));
}
function rename(siteId, id, { name, description }, userId = null) {
  if (!ownRow(siteId, id)) throw new UserError("Pattern introuvable pour ce site.");
  appearance.renamePattern(id, { name, description }, userId);
}
function duplicate(siteId, id, userId = null) {
  const row = ownRow(siteId, id);
  if (!row) throw new UserError("Pattern introuvable pour ce site.");
  let name = `${row.name} (copie)`;
  for (let n = 2; db.prepare(`SELECT 1 FROM appearance_patterns WHERE ${sameScope("site_id")} AND name = ? COLLATE NOCASE AND deleted_at IS NULL`).get(siteId, name); n += 1) name = `${row.name} (copie ${n})`;
  return appearance.createPattern({ name: name.slice(0, 60), description: row.description || "", sections: parse(row.sections), siteId, sourcePageId: row.source_page_id, userId });
}
function trashOne(siteId, id, userId = null) { if (!ownRow(siteId, id)) throw new UserError("Pattern introuvable pour ce site."); return appearance.deletePattern(id, userId); }
function restoreOne(siteId, id, userId = null) { if (!ownRow(siteId, id, { deleted: true })) throw new UserError("Ce pattern n'est pas dans la corbeille de ce site."); return appearance.restorePattern(id, userId); }
function purgeOne(siteId, id) { if (!ownRow(siteId, id, { deleted: true })) throw new UserError("Ce pattern n'est pas dans la corbeille de ce site."); return appearance.purgePattern(id); }

// Insérer dans le BROUILLON d'une page du site : au début, à la fin, ou après la section « after » (index). Les sections reçoivent de nouveaux identifiants et sont revalidées ;
// rien n'est publié (la page garde son brouillon, à vérifier puis publier selon les règles habituelles).
function insert(ctx, siteId, { ref, pageId, position = "end", after = null }) {
  const { label, sections } = sectionsOf(ctx, siteId, ref);
  const page = pageOf(ctx, siteId, pageId);
  const current = page.working.sections || [];
  if (current.length + sections.length > sectionsLib.MAX_SECTIONS) throw new UserError(`Une page contient ${sectionsLib.MAX_SECTIONS} sections au plus : celle-ci en a déjà ${current.length}.`);
  const fresh = sectionsLib.normalizeSections(ctx, sections.map((s) => ({ ...strip(s), id: sectionsLib.newSectionId() })));
  let at = current.length;
  if (position === "start") at = 0;
  else if (position === "after") { const i = Number(after); if (!Number.isInteger(i) || i < 0 || i >= current.length) throw new UserError("Section de repère introuvable."); at = i + 1; }
  else if (position !== "end") throw new UserError("Position inconnue.");
  const next = [...current.slice(0, at), ...fresh, ...current.slice(at)];
  const content = { sections: next, theme: page.working.theme, title: page.working.title, description: page.working.description, seo: page.working.seo };
  const saved = pagesLib().saveDraft(ctx, page.id, content, { revision: page.revision });
  return { label, pageId: page.id, pageName: page.name, added: fresh.length, at, revision: saved.revision };
}

module.exports = { MAX_SECTIONS, builtin, mine, trash, sectionsOf, pagesOf, createFromPage, rename, duplicate, trashOne, restoreOne, purgeOne, insert, labelOf, strip };
