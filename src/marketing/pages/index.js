// Moteur de pages commun à « Site Web » et « Tunnels » (phase 2 : fondations).
// Une page = une ligne de mk_landing_pages (adresse /p/<adresse>). Trois états séparés :
//  - BROUILLON : la copie de travail (colonne draft), modifiée par l'éditeur ; elle ne touche jamais la version en ligne ;
//  - APERÇU : le brouillon affiché tel qu'il sera publié, réservé à l'équipe ;
//  - EN LIGNE : les colonnes sections / theme / title / description / seo, remplacées seulement par « Publier ».
// Chaque publication crée une version (historique). Restaurer une version la remet dans le BROUILLON : la version en
// ligne ne change qu'à la publication suivante (pas de restauration accidentelle en production).
const { MarketingError } = require("../errors");
const { checkCtx, audit } = require("../audience/shared");
const { transaction } = require("../db/tx");
const landing = require("../landing");
const { TYPES, normalizeSections, normalizeSection, newSectionId, imageUrl, line, bad } = require("./sections");
const { normalizeTokens, DEFAULT_TOKENS } = require("./tokens");

const MAX_VERSIONS = 100;
const KINDS = { landing: "Page d'atterrissage", page: "Page de site", step: "Étape de tunnel" };
const HEX = /^#[0-9a-f]{6}$/i;

const conflict = () => new MarketingError("conflict", "Cette page a été modifiée ailleurs (autre onglet ou autre personne) : rechargez-la avant d'enregistrer, vos modifications n'ont pas été enregistrées.");
const json = (text, fallback) => { try { return text ? JSON.parse(text) : fallback; } catch { return fallback; } };

// ---------- Contenu d'une page ----------

function normalizeTheme(input) {
  const theme = {};
  for (const [k, d] of Object.entries(landing.DEFAULT_THEME)) theme[k] = HEX.test(String(input && input[k] || "")) ? input[k].toLowerCase() : d;
  return theme;
}

// SEO propre à la page (le moteur SEO du site lit ces valeurs : voir phase 3)
function normalizeSeo(input = {}) {
  const src = input && typeof input === "object" ? input : {};
  const canonical = line(src.canonical, 500);
  if (canonical && !/^https:\/\/[^\s<>"'`\\/@]+(\/[^\s<>"'`\\]*)?$/i.test(canonical)) throw bad("Adresse canonique : une adresse https:// complète.");
  const seo = {};
  if (line(src.title, 70)) seo.title = line(src.title, 70);
  if (line(src.description, 160)) seo.description = line(src.description, 160);
  if (canonical) seo.canonical = canonical;
  if (src.noindex === true) seo.noindex = true;
  const ogImage = imageUrl(src.ogImage, "Image de partage");
  if (ogImage) seo.ogImage = ogImage;
  return seo;
}

// Contenu en ligne d'une ligne de page
const publishedContent = (row) => ({ sections: json(row.sections, []), theme: { ...landing.DEFAULT_THEME, ...json(row.theme, {}) }, title: row.title, description: row.description, seo: json(row.seo, {}) });

function getPage(ctx, id) {
  checkCtx(ctx);
  const row = Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null;
  if (!row) return null;
  const published = publishedContent(row);
  const draft = row.draft ? { ...published, ...json(row.draft, {}) } : null;
  const { draft: _d, sections: _s, theme: _t, seo: _seo, ...meta } = row;
  return { ...meta, tags: json(row.tags, []), published, draft, working: draft || published, hasDraft: Boolean(draft) };
}
function requirePage(ctx, id) {
  const p = getPage(ctx, id);
  if (!p) throw new MarketingError("not_found", "Page introuvable.");
  return p;
}

// Contenu validé et normalisé (sans rien enregistrer) : sert au brouillon et au rendu du canevas de l'éditeur.
// Chaque section reçoit un identifiant stable (sélection, calques, composants, tests A/B à venir).
function normalizeContent(ctx, page, input = {}) {
  const raw = (Array.isArray(input.sections) ? input.sections : []).map((s) => (s && typeof s === "object" && s.id === undefined ? { ...s, id: newSectionId() } : s));
  return {
    sections: normalizeSections(ctx, raw),
    theme: normalizeTheme(input.theme),
    title: line(input.title, 120) || page.name,
    description: line(input.description, 300),
    seo: normalizeSeo(input.seo),
  };
}

// Enregistrement du BROUILLON (sauvegarde automatique de l'éditeur). `revision` : celle que l'éditeur a chargée ; si la
// page a été enregistrée entre-temps ailleurs, rien n'est écrasé (erreur « conflict »).
function saveDraft(ctx, id, input = {}, { revision } = {}) {
  const page = requirePage(ctx, id);
  if (page.archived_at) throw bad("Cette page est archivée : restaurez-la pour la modifier.");
  if (!Number.isInteger(revision)) throw bad("Révision manquante.");
  const content = normalizeContent(ctx, page, input);
  const next = revision + 1;
  const changed = ctx.db.prepare("UPDATE mk_landing_pages SET draft = ?, revision = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ? AND revision = ?")
    .run(JSON.stringify(content), next, id, ctx.organizationId, revision).changes;
  if (!changed) throw conflict();
  return { revision: next, content };
}

function discardDraft(ctx, id) {
  requirePage(ctx, id);
  ctx.db.prepare("UPDATE mk_landing_pages SET draft = NULL, revision = revision + 1, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
  audit(ctx, "page.draft_discarded", "landing", id, {});
}

// Publication : le brouillon (s'il existe) devient la version en ligne, après les contrôles des pages d'atterrissage
// (formulaire publié si la page a une section d'inscription, formations encore en ligne…). Une version est créée.
function publish(ctx, id) {
  const page = requirePage(ctx, id);
  if (page.archived_at) throw bad("Cette page est archivée : restaurez-la avant de la publier.");
  const content = page.working;
  const check = landing.preflight(ctx, { ...page, sections: resolveSections(ctx, content.sections) });
  if (!check.ready) throw new MarketingError("preflight_failed", check.errors.join(" "));
  return transaction(ctx.db, () => {
    const number = (ctx.db.prepare("SELECT MAX(number) n FROM mk_page_versions WHERE page_id = ?").get(id).n || 0) + 1;
    ctx.db.prepare("INSERT INTO mk_page_versions (organization_id, page_id, number, content, reason, created_by) VALUES (?, ?, ?, ?, 'publish', ?)")
      .run(ctx.organizationId, id, number, JSON.stringify(content), ctx.userId ?? null);
    ctx.db.prepare(`UPDATE mk_landing_pages SET sections = ?, theme = ?, title = ?, description = ?, seo = ?, draft = NULL, revision = revision + 1,
        status = 'published', published_at = COALESCE(published_at, datetime('now')), updated_at = datetime('now') WHERE id = ?`)
      .run(JSON.stringify(content.sections), JSON.stringify(content.theme), content.title, content.description, JSON.stringify(content.seo), id);
    // Historique borné : les plus anciennes versions au-delà de MAX_VERSIONS sont effacées
    ctx.db.prepare("DELETE FROM mk_page_versions WHERE page_id = ? AND number <= ?").run(id, number - MAX_VERSIONS);
    audit(ctx, "page.published", "landing", id, { version: number, slug: page.slug });
    return { version: number };
  });
}

function unpublish(ctx, id) {
  landing.unpublishPage(ctx, id);
}

// Toutes les pages (Site Web → Pages) : site, brouillon en cours, statistiques réelles cumulées
function listPages(ctx, { archived = false, siteId } = {}) {
  checkCtx(ctx);
  const bySite = siteId === undefined ? "" : siteId === null ? " AND p.site_id IS NULL" : " AND p.site_id = ?";
  const params = [ctx.organizationId, ...(siteId ? [siteId] : [])];
  return ctx.db.prepare(`SELECT p.id, p.name, p.slug, p.title, p.status, p.kind, p.site_id, p.published_at, p.updated_at, p.archived_at, p.draft IS NOT NULL AS has_draft,
      s.name AS site_name,
      (SELECT COUNT(DISTINCT e.visitor || ':' || (e.occurred_at / 86400000)) FROM mk_landing_events e WHERE e.page_id = p.id AND e.type = 'view') AS visitors,
      (SELECT COUNT(*) FROM mk_landing_events e WHERE e.page_id = p.id AND e.type = 'signup') AS signups
    FROM mk_landing_pages p LEFT JOIN mk_sites s ON s.id = p.site_id
    WHERE p.organization_id = ? AND p.archived_at IS ${archived ? "NOT " : ""}NULL${bySite} ORDER BY p.updated_at DESC, p.id DESC`).all(...params);
}

// ---------- Versions ----------

function listVersions(ctx, id) {
  requirePage(ctx, id);
  return ctx.db.prepare("SELECT v.number, v.reason, v.created_at, v.created_by, u.username AS author FROM mk_page_versions v LEFT JOIN users u ON u.id = v.created_by WHERE v.page_id = ? ORDER BY v.number DESC").all(id);
}
function getVersion(ctx, id, number) {
  requirePage(ctx, id);
  const row = ctx.db.prepare("SELECT * FROM mk_page_versions WHERE page_id = ? AND number = ?").get(id, Number(number));
  if (!row) throw new MarketingError("not_found", "Version introuvable.");
  return { number: row.number, createdAt: row.created_at, content: json(row.content, {}) };
}
// Restaurer = copier la version dans le BROUILLON. La version en ligne ne change pas tant qu'on ne publie pas.
function restoreVersion(ctx, id, number) {
  const v = getVersion(ctx, id, number);
  ctx.db.prepare("UPDATE mk_landing_pages SET draft = ?, revision = revision + 1, updated_at = datetime('now') WHERE id = ? AND organization_id = ?")
    .run(JSON.stringify(v.content), id, ctx.organizationId);
  audit(ctx, "page.version_restored", "landing", id, { version: v.number });
  return requirePage(ctx, id);
}

// ---------- Cycle de vie ----------

function uniqueName(ctx, table, base) {
  let name = base.slice(0, 100), n = 2;
  while (ctx.db.prepare(`SELECT 1 FROM ${table} WHERE organization_id = ? AND name = ? COLLATE NOCASE`).get(ctx.organizationId, name)) name = `${base.slice(0, 90)} (${n++})`;
  return name;
}

// Nouvelle page dans un site (ou isolée) : même création que les pages d'atterrissage, avec sa nature
function createPage(ctx, { name, siteId = null, kind = "page" } = {}) {
  if (!Object.hasOwn(KINDS, kind)) throw bad("Nature de page inconnue.");
  if (siteId !== null) requireSite(ctx, siteId, { active: true });
  const page = landing.createPage(ctx, { name });
  ctx.db.prepare("UPDATE mk_landing_pages SET kind = ?, site_id = ? WHERE id = ?").run(kind, siteId, page.id);
  // Page de site : un bandeau et un texte (la section d'inscription des pages d'atterrissage demanderait un formulaire
  // avant toute publication)
  if (kind === "page") {
    const start = [{ ...page.sections[0], id: newSectionId() }, { type: "text", markdown: "Présentez ici le contenu de la page.", id: newSectionId() }];
    ctx.db.prepare("UPDATE mk_landing_pages SET sections = ? WHERE id = ?").run(JSON.stringify(start), page.id);
  }
  return requirePage(ctx, page.id);
}

// Copie : contenu de travail (brouillon s'il existe), en brouillon, hors ligne, nouvelle adresse
function duplicatePage(ctx, id, { siteId } = {}) {
  const page = requirePage(ctx, id);
  const target = siteId === undefined ? page.site_id : siteId;
  if (target !== null && target !== undefined) requireSite(ctx, target, { active: true });
  const name = uniqueName(ctx, "mk_landing_pages", `${page.name} (copie)`);
  const c = page.working;
  const sections = c.sections.map((s) => (s.id ? { ...s, id: newSectionId() } : s));
  const newId = Number(ctx.db.prepare(`INSERT INTO mk_landing_pages (organization_id, name, slug, title, description, sections, theme, form_id, tags, indexable, created_by, kind, site_id, seo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`)
    .run(ctx.organizationId, name, landing.freeSlug(ctx, landing.slugify(name)), c.title, c.description, JSON.stringify(sections), JSON.stringify(c.theme), page.form_id, JSON.stringify(page.tags), ctx.userId ?? null, page.kind, target ?? null, JSON.stringify(c.seo || {})).lastInsertRowid);
  audit(ctx, "page.duplicated", "landing", newId, { from: id });
  return requirePage(ctx, newId);
}

// Archiver : la page est retirée du site (hors ligne) et des listes ; rien n'est effacé (statistiques, versions)
function archivePage(ctx, id) {
  requirePage(ctx, id);
  ctx.db.prepare("UPDATE mk_landing_pages SET archived_at = datetime('now'), status = CASE status WHEN 'published' THEN 'unpublished' ELSE status END, revision = revision + 1, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
  ctx.db.prepare("UPDATE mk_sites SET home_page_id = NULL WHERE home_page_id = ? AND organization_id = ?").run(id, ctx.organizationId);
  audit(ctx, "page.archived", "landing", id, {});
}
// Restaurer une page archivée : elle revient hors ligne (jamais republiée d'office)
function restorePage(ctx, id) {
  requirePage(ctx, id);
  ctx.db.prepare("UPDATE mk_landing_pages SET archived_at = NULL, revision = revision + 1, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
  audit(ctx, "page.restored", "landing", id, {});
}

// ---------- Sites ----------

const parseSite = (row) => (row ? { ...row, tokens: normalizeTokens(json(row.tokens, {})) } : null);
function getSite(ctx, id) {
  checkCtx(ctx);
  return parseSite(Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_sites WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null);
}
function requireSite(ctx, id, { active = false } = {}) {
  const site = getSite(ctx, Number(id));
  if (!site) throw new MarketingError("not_found", "Site introuvable.");
  if (active && site.status !== "active") throw bad("Ce site est archivé : restaurez-le d'abord.");
  return site;
}
function listSites(ctx, { archived = false } = {}) {
  checkCtx(ctx);
  return ctx.db.prepare(`SELECT s.*,
      (SELECT COUNT(*) FROM mk_landing_pages p WHERE p.site_id = s.id AND p.archived_at IS NULL) AS pages,
      (SELECT COUNT(*) FROM mk_landing_pages p WHERE p.site_id = s.id AND p.archived_at IS NULL AND p.status = 'published') AS published
    FROM mk_sites s WHERE s.organization_id = ? AND s.status = ? ORDER BY s.updated_at DESC, s.id DESC`).all(ctx.organizationId, archived ? "archived" : "active").map(parseSite);
}
function sitePages(ctx, siteId, { archived = false } = {}) {
  requireSite(ctx, siteId);
  return ctx.db.prepare(`SELECT id, name, slug, title, status, kind, published_at, updated_at, draft IS NOT NULL AS has_draft, archived_at FROM mk_landing_pages
    WHERE organization_id = ? AND site_id = ? AND archived_at IS ${archived ? "NOT " : ""}NULL ORDER BY name COLLATE NOCASE`).all(ctx.organizationId, siteId);
}

function createSite(ctx, { name, tokens } = {}) {
  checkCtx(ctx);
  const clean_ = line(name, 100);
  if (!clean_) throw bad("Le nom du site est obligatoire.");
  if (ctx.db.prepare("SELECT 1 FROM mk_sites WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, clean_)) throw new MarketingError("duplicate", "Un site porte déjà ce nom.");
  const id = Number(ctx.db.prepare("INSERT INTO mk_sites (organization_id, name, tokens, created_by) VALUES (?, ?, ?, ?)")
    .run(ctx.organizationId, clean_, JSON.stringify(normalizeTokens(tokens || DEFAULT_TOKENS, { strict: Boolean(tokens) })), ctx.userId ?? null).lastInsertRowid);
  audit(ctx, "site.created", "site", id, {});
  return getSite(ctx, id);
}
function updateSite(ctx, id, { name, tokens } = {}) {
  const site = requireSite(ctx, id, { active: true });
  const newName = name === undefined ? site.name : line(name, 100);
  if (!newName) throw bad("Le nom du site est obligatoire.");
  const dup = ctx.db.prepare("SELECT id FROM mk_sites WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, newName);
  if (dup && dup.id !== site.id) throw new MarketingError("duplicate", "Un site porte déjà ce nom.");
  const newTokens = tokens === undefined ? site.tokens : normalizeTokens(tokens, { strict: true });
  ctx.db.prepare("UPDATE mk_sites SET name = ?, tokens = ?, updated_at = datetime('now') WHERE id = ?").run(newName, JSON.stringify(newTokens), site.id);
  audit(ctx, "site.updated", "site", site.id, { tokens: tokens !== undefined });
  return getSite(ctx, site.id);
}
function setHomePage(ctx, siteId, pageId) {
  const site = requireSite(ctx, siteId, { active: true });
  if (pageId !== null) {
    const page = requirePage(ctx, Number(pageId));
    if (page.site_id !== site.id || page.archived_at) throw bad("La page d'accueil doit être une page de ce site.");
  }
  ctx.db.prepare("UPDATE mk_sites SET home_page_id = ?, updated_at = datetime('now') WHERE id = ?").run(pageId, site.id);
}
function movePage(ctx, pageId, siteId) {
  requirePage(ctx, pageId);
  if (siteId !== null) requireSite(ctx, siteId, { active: true });
  ctx.db.prepare("UPDATE mk_sites SET home_page_id = NULL WHERE home_page_id = ? AND organization_id = ? AND id IS NOT ?").run(pageId, ctx.organizationId, siteId);
  ctx.db.prepare("UPDATE mk_landing_pages SET site_id = ?, updated_at = datetime('now') WHERE id = ?").run(siteId, pageId);
  audit(ctx, "page.moved", "landing", pageId, { siteId });
}
// Archiver un site : ses pages en ligne passent hors ligne (rien n'est effacé) ; restaurer ne republie rien d'office
function archiveSite(ctx, id) {
  const site = requireSite(ctx, id);
  transaction(ctx.db, () => {
    ctx.db.prepare("UPDATE mk_landing_pages SET status = 'unpublished', updated_at = datetime('now') WHERE site_id = ? AND status = 'published'").run(site.id);
    ctx.db.prepare("UPDATE mk_sites SET status = 'archived', archived_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(site.id);
  });
  audit(ctx, "site.archived", "site", site.id, {});
}
function restoreSite(ctx, id) {
  const site = requireSite(ctx, id);
  ctx.db.prepare("UPDATE mk_sites SET status = 'active', archived_at = NULL, updated_at = datetime('now') WHERE id = ?").run(site.id);
  audit(ctx, "site.restored", "site", site.id, {});
}
// Dupliquer un site : design system et pages (en brouillon, hors ligne, nouvelles adresses)
function duplicateSite(ctx, id) {
  const site = requireSite(ctx, id);
  return transaction(ctx.db, () => {
    const copy = createSite(ctx, { name: uniqueName(ctx, "mk_sites", `${site.name} (copie)`), tokens: site.tokens });
    const map = new Map();
    for (const p of sitePages(ctx, site.id)) map.set(p.id, duplicatePage(ctx, p.id, { siteId: copy.id }).id);
    if (site.home_page_id && map.has(site.home_page_id)) setHomePage(ctx, copy.id, map.get(site.home_page_id));
    audit(ctx, "site.duplicated", "site", copy.id, { from: site.id });
    return getSite(ctx, copy.id);
  });
}

// ---------- Composants réutilisables ----------

function listComponents(ctx, { siteId = null } = {}) {
  checkCtx(ctx);
  return ctx.db.prepare("SELECT * FROM mk_web_components WHERE organization_id = ? AND (site_id IS NULL OR site_id = ?) ORDER BY name COLLATE NOCASE")
    .all(ctx.organizationId, siteId).map((c) => ({ ...c, section: json(c.section, null), global: c.site_id === null }));
}
function getComponent(ctx, id) {
  checkCtx(ctx);
  const row = Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_web_components WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null;
  return row ? { ...row, section: json(row.section, null), global: row.site_id === null } : null;
}
// Une section enregistrée comme composant : jamais un composant dans un composant (pas de boucle possible)
function componentSection(ctx, section) {
  if (!section || section.type === "component") throw bad("Un composant ne peut pas contenir un autre composant.");
  const { id: _id, ...rest } = section;
  return normalizeSection(ctx, rest, 0);
}
function createComponent(ctx, { name, section, siteId = null } = {}) {
  checkCtx(ctx);
  const n = line(name, 80);
  if (!n) throw bad("Le nom du composant est obligatoire.");
  if (siteId !== null) requireSite(ctx, siteId, { active: true });
  if (ctx.db.prepare("SELECT 1 FROM mk_web_components WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, n)) throw new MarketingError("duplicate", "Un composant porte déjà ce nom.");
  const id = Number(ctx.db.prepare("INSERT INTO mk_web_components (organization_id, site_id, name, section, created_by) VALUES (?, ?, ?, ?, ?)")
    .run(ctx.organizationId, siteId, n, JSON.stringify(componentSection(ctx, section)), ctx.userId ?? null).lastInsertRowid);
  audit(ctx, "component.created", "component", id, {});
  return getComponent(ctx, id);
}
function updateComponent(ctx, id, { name, section } = {}) {
  const c = getComponent(ctx, id);
  if (!c) throw new MarketingError("not_found", "Composant introuvable.");
  const n = name === undefined ? c.name : line(name, 80);
  if (!n) throw bad("Le nom du composant est obligatoire.");
  const dup = ctx.db.prepare("SELECT id FROM mk_web_components WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, n);
  if (dup && dup.id !== c.id) throw new MarketingError("duplicate", "Un composant porte déjà ce nom.");
  const s = section === undefined ? c.section : componentSection(ctx, section);
  ctx.db.prepare("UPDATE mk_web_components SET name = ?, section = ?, updated_at = datetime('now') WHERE id = ?").run(n, JSON.stringify(s), c.id);
  audit(ctx, "component.updated", "component", c.id, {});
  return getComponent(ctx, c.id);
}
// Pages (en ligne ou en brouillon) qui affichent ce composant synchronisé
function componentUsage(ctx, id) {
  const n = Number(id);
  const end = `%"componentId":${n}}%`, mid = `%"componentId":${n},%`;
  return ctx.db.prepare("SELECT id, name, status FROM mk_landing_pages WHERE organization_id = ? AND (sections LIKE ? OR sections LIKE ? OR draft LIKE ? OR draft LIKE ?) ORDER BY name")
    .all(ctx.organizationId, end, mid, end, mid);
}
function deleteComponent(ctx, id) {
  const c = getComponent(ctx, id);
  if (!c) throw new MarketingError("not_found", "Composant introuvable.");
  const used = componentUsage(ctx, c.id);
  if (used.length) throw new MarketingError("in_use", `Ce composant est utilisé par ${used.length} page(s) : ${used.map((p) => `« ${p.name} »`).join(", ")}. Retirez-le de ces pages d'abord.`);
  ctx.db.prepare("DELETE FROM mk_web_components WHERE id = ?").run(c.id);
  audit(ctx, "component.deleted", "component", c.id, {});
}
// Affichage : chaque composant synchronisé est remplacé par sa dernière version (un composant supprimé disparaît)
function resolveSections(ctx, sections) {
  return sections.map((s) => {
    if (s.type !== "component") return s;
    const c = getComponent(ctx, s.componentId);
    if (!c || !c.section) return null;
    const { componentId: _c, type: _t, ...attrs } = s;
    return { ...c.section, ...attrs, fromComponent: c.id };
  }).filter(Boolean);
}

module.exports = {
  KINDS, MAX_VERSIONS,
  getPage, requirePage, listPages, normalizeContent, saveDraft, discardDraft, publish, unpublish, listVersions, getVersion, restoreVersion,
  createPage, duplicatePage, archivePage, restorePage,
  getSite, requireSite, listSites, sitePages, createSite, updateSite, setHomePage, movePage, archiveSite, restoreSite, duplicateSite,
  listComponents, getComponent, createComponent, updateComponent, componentUsage, deleteComponent, resolveSections,
  normalizeSeo, normalizeTheme, TYPES,
};
