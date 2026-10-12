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
const tokensModule = require("./tokens");
const { normalizeTokens, DEFAULT_TOKENS } = tokensModule;

const MAX_VERSIONS = 100;
const KINDS = { landing: "Page d'atterrissage", page: "Page de site", step: "Étape de tunnel" };
const HEX = /^#[0-9a-f]{6}$/i;

const conflict = () => new MarketingError("conflict", "Cette page a été modifiée ailleurs (autre onglet ou autre personne) : rechargez-la avant d'enregistrer, vos modifications n'ont pas été enregistrées.");
const componentConflict = () => new MarketingError("conflict", "Ce composant a été modifié ailleurs (autre onglet ou autre personne) : rechargez-le avant de continuer, vos modifications n'ont pas été enregistrées.");
const json = (text, fallback) => { try { return text ? JSON.parse(text) : fallback; } catch { return fallback; } };

// ---------- Contenu d'une page ----------

function normalizeTheme(input) {
  const theme = {};
  for (const [k, d] of Object.entries(landing.DEFAULT_THEME)) theme[k] = HEX.test(String(input && input[k] || "")) ? input[k].toLowerCase() : d;
  // CSS personnalisé de la page : le texte saisi est gardé (pour être modifié), après vérification complète
  const css = String(input && input.css || "").trim();
  if (css) {
    try { require("./nodes").normalizePageCss(css); } catch (e) { throw bad(e.message); }
    theme.css = css.slice(0, 8000);
  }
  // Format de mise en page (conception guidée) : valeur du thème, enregistrée et versionnée avec la page
  const layout = layoutFormat.normalizeLayout(input && input.layout);
  if (layout) theme.layout = layout;
  // Magnétisme de défilement de la page (position, marge, arrêt obligatoire)
  const snap = require("./scrollSnap").normalize(input && input.scrollSnap);
  if (snap) theme.scrollSnap = snap;
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
  // Directives robots (palier 11) : suivi des liens et directives avancées, seulement si elles sont activées
  for (const flag of ["nofollow", "noarchive", "nosnippet", "noimageindex"]) if (src[flag] === true) seo[flag] = true;
  // Partage social et mot-clé principal : valeurs propres à la page (sinon repli automatique du moteur SEO)
  if (line(src.ogTitle, 95)) seo.ogTitle = line(src.ogTitle, 95);
  if (line(src.ogDescription, 200)) seo.ogDescription = line(src.ogDescription, 200);
  if (src.twitterCard === "summary" || src.twitterCard === "summary_large_image") seo.twitterCard = src.twitterCard;
  if (line(src.focusKeyword, 80)) seo.focusKeyword = line(src.focusKeyword, 80);
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

// Widgets réservés (HTML…) : vérifiés pour la personne connectée (ctx.can, posé par les routes web). Un appel interne
// sans ctx.can (script, tâche de fond, tests du moteur) n'est pas limité.
const layoutFormat = require("./layoutFormat");
function checkWidgetRights(ctx, before, after) {
  if (typeof ctx.can !== "function") return;
  try { require("./nodes").lockedWidgetChanges(before, after, ctx.can); } catch (e) { throw new MarketingError("forbidden_widget", e.message); }
}

// Enregistrement du BROUILLON (sauvegarde automatique de l'éditeur). `revision` : celle que l'éditeur a chargée ; si la
// page a été enregistrée entre-temps ailleurs, rien n'est écrasé (erreur « conflict »).
function saveDraft(ctx, id, input = {}, { revision, record = true } = {}) {
  const page = requirePage(ctx, id);
  if (page.archived_at) throw bad("Cette page est archivée : restaurez-la pour la modifier.");
  if (!Number.isInteger(revision)) throw bad("Révision manquante.");
  // Diagnostics non bloquants (réglages écartés car inapplicables) : renvoyés à l'éditeur, qui nettoie son document
  const warnings = [];
  const previous = ctx.__warnings;
  ctx.__warnings = warnings;
  let content;
  try { content = normalizeContent(ctx, page, input); } finally { ctx.__warnings = previous; }
  checkWidgetRights(ctx, [...page.working.sections, ...page.published.sections], content.sections);
  layoutFormat.checkLocked(page.working, content);
  const next = revision + 1;
  const changed = ctx.db.prepare("UPDATE mk_landing_pages SET draft = ?, revision = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ? AND revision = ?")
    .run(JSON.stringify(content), next, id, ctx.organizationId, revision).changes;
  if (!changed) throw conflict();
  // Historique commun (palier 10) : l'état du brouillon est conservé comme point d'historique (jamais bloquant)
  if (record) require("../../services/revisions").hooks.pageDraft(ctx, page, content);
  return { revision: next, content, warnings };
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
  if (ctx.db.prepare("SELECT 1 FROM mk_page_tests WHERE variant_page_id = ?").get(id)) throw bad("Cette page est la version B d'un test A/B : elle ne se publie pas seule. Démarrez le test depuis la page d'origine.");
  const content = page.working;
  const check = landing.preflight(ctx, { ...page, sections: resolveSections(ctx, content.sections) });
  if (!check.ready) throw new MarketingError("preflight_failed", check.errors.join(" "));
  return transaction(ctx.db, () => {
    // Publier une seconde fois SANS aucun changement (double clic, page remise en ligne) ne fabrique pas une copie identique : elle chasserait de
    // l'historique (borné) de vraies versions. Le contenu est comparé à la dernière version ; identique → on garde son numéro.
    const last = ctx.db.prepare("SELECT number, content FROM mk_page_versions WHERE page_id = ? ORDER BY number DESC LIMIT 1").get(id);
    const serialized = JSON.stringify(content);
    const same = last && last.content === serialized;
    const number = same ? last.number : (last ? last.number : 0) + 1;
    if (!same) ctx.db.prepare("INSERT INTO mk_page_versions (organization_id, page_id, number, content, reason, created_by) VALUES (?, ?, ?, ?, 'publish', ?)")
      .run(ctx.organizationId, id, number, serialized, ctx.userId ?? null);
    ctx.db.prepare(`UPDATE mk_landing_pages SET sections = ?, theme = ?, title = ?, description = ?, seo = ?, draft = NULL, revision = revision + 1,
        status = 'published', published_at = COALESCE(published_at, datetime('now')), scheduled_at = NULL, updated_at = datetime('now') WHERE id = ?`)
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

// ---------- Programmation de la publication (palier 23) ----------
// Une page peut être mise en ligne automatiquement à une date future (UTC). Il n'y a pas de tâche de fond : comme pour les articles, la page
// est publiée à la première visite du site (ou lecture du plan du site, ou ouverture de la liste des pages) APRÈS l'heure prévue.
// Les contrôles de publication (formulaire publié, etc.) sont faits dès la programmation ET au moment de publier ; si la page n'est plus publiable à
// l'heure dite, la programmation est retirée et l'échec est consigné dans le journal d'audit (jamais d'échec silencieux).
const SCHEDULE_FORMAT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
function schedulePage(ctx, id, at) {
  const page = requirePage(ctx, id);
  if (page.archived_at) throw bad("Cette page est archivée : restaurez-la avant de la programmer.");
  if (ctx.db.prepare("SELECT 1 FROM mk_page_tests WHERE variant_page_id = ?").get(id)) throw bad("Cette page est la version B d'un test A/B : elle ne se programme pas seule.");
  const when = String(at || "");
  if (!SCHEDULE_FORMAT.test(when) || Number.isNaN(Date.parse(when.replace(" ", "T") + "Z"))) throw bad("Date de programmation invalide.");
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  if (when <= now) throw bad("Programmation : choisissez une date et une heure dans le futur.");
  const check = landing.preflight(ctx, { ...page, sections: resolveSections(ctx, page.working.sections) });
  if (!check.ready) throw new MarketingError("preflight_failed", check.errors.join(" "));
  ctx.db.prepare("UPDATE mk_landing_pages SET scheduled_at = ?, updated_at = datetime('now') WHERE id = ?").run(when, id);
  audit(ctx, "page.scheduled", "landing", id, { at: when, slug: page.slug });
  return { at: when };
}
function cancelSchedule(ctx, id) {
  const page = requirePage(ctx, id);
  if (!page.scheduled_at) return false;
  ctx.db.prepare("UPDATE mk_landing_pages SET scheduled_at = NULL, updated_at = datetime('now') WHERE id = ?").run(id);
  audit(ctx, "page.schedule_cancelled", "landing", id, { was: page.scheduled_at });
  return true;
}
let lastPromotion = 0;
function promoteScheduledPages(db, { force = false } = {}) {
  const nowMs = Date.now();
  if (!force && nowMs - lastPromotion < 15000) return 0; // au plus une vérification toutes les 15 s par processus
  lastPromotion = nowMs;
  let due;
  try { due = db.prepare("SELECT id, organization_id FROM mk_landing_pages WHERE scheduled_at IS NOT NULL AND scheduled_at <= datetime('now') AND archived_at IS NULL ORDER BY scheduled_at LIMIT 25").all(); } catch { return 0; }
  let done = 0;
  for (const row of due) {
    const ctx = { db, organizationId: row.organization_id, userId: null };
    // `audit()` ignore les actions sans personne connectée : la mise en ligne automatique est consignée directement (utilisateur vide = le système)
    const trace = (action, metadata) => { try { require("../audit").recordAudit(db, { organizationId: row.organization_id, userId: null, action, resourceType: "landing", resourceId: row.id, metadata }); } catch { /* la trace ne bloque pas la publication */ } };
    try { publish(ctx, row.id); trace("page.published", { scheduled: true }); done += 1; } catch (error) {
      db.prepare("UPDATE mk_landing_pages SET scheduled_at = NULL WHERE id = ?").run(row.id);
      trace("page.schedule_failed", { reason: String(error.message || error).slice(0, 300) });
    }
  }
  return done;
}
// Intergiciel du serveur : vérifie les programmations échues avant de servir une page
const schedulerMiddleware = (req, res, next) => { try { promoteScheduledPages(require("../../config/database")); } catch { /* jamais bloquant */ } next(); };

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
    WHERE p.organization_id = ? AND p.archived_at IS ${archived ? "NOT " : ""}NULL${bySite}
      AND p.id NOT IN (SELECT variant_page_id FROM mk_page_tests WHERE variant_page_id IS NOT NULL) -- versions B des tests A/B : gérées dans leur test
    ORDER BY p.updated_at DESC, p.id DESC`).all(...params);
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
// Restaurer = copier la version dans le BROUILLON (la version en ligne ne change pas tant qu'on ne publie pas). Palier 10 : l'état actuel du
// brouillon est d'abord sauvegardé dans l'historique, le contenu est revalidé comme une saisie, et la restauration est elle-même un point d'historique.
function restoreVersion(ctx, id, number) {
  getVersion(ctx, id, number); // 404 propre si la version n'existe pas
  require("../../services/revisions").adapter("page").restore(ctx, id, `v:${Number(number)}`);
  audit(ctx, "page.version_restored", "landing", id, { version: Number(number) });
  return requirePage(ctx, id);
}

// ---------- Cycle de vie ----------

function uniqueName(ctx, table, base) {
  let name = base.slice(0, 100), n = 2;
  while (ctx.db.prepare(`SELECT 1 FROM ${table} WHERE organization_id = ? AND name = ? COLLATE NOCASE`).get(ctx.organizationId, name)) name = `${base.slice(0, 90)} (${n++})`;
  return name;
}

// Nouvelle page dans un site (ou isolée) : même création que les pages d'atterrissage, avec sa nature
function createPage(ctx, { name, siteId = null, kind = "page", template = null, layout = null, blank = false } = {}) {
  if (!Object.hasOwn(KINDS, kind)) throw bad("Nature de page inconnue.");
  if (siteId !== null) requireSite(ctx, siteId, { active: true });
  // Gabarit choisi : ses sections (validées par la grammaire commune, comme toute section enregistrée)
  const mine = typeof template === "string" && /^mine:\d+$/.test(template) ? getPageTemplate(ctx, Number(template.slice(5))) : null;
  const fromTemplate = mine ? mine.content.sections : template ? require("./templates").buildTemplate(ctx, template) : null;
  if (template && !fromTemplate) throw bad("Modèle de page inconnu.");
  const page = landing.createPage(ctx, { name });
  // Palier 23 : une page de SITE (À propos, Contact…) est indexable par défaut (comme sur WordPress) ; une page d'atterrissage ou une étape de tunnel reste non indexée
  // jusqu'à ce qu'on la rende indexable. La personne peut toujours changer ce réglage dans la fiche de la page.
  ctx.db.prepare("UPDATE mk_landing_pages SET kind = ?, site_id = ?, indexable = ? WHERE id = ?").run(kind, siteId, kind === "page" ? 1 : 0, page.id);
  if (fromTemplate) {
    const sections = normalizeSections(ctx, fromTemplate.map((s) => ({ ...s, id: newSectionId() })));
    checkWidgetRights(ctx, [], sections);
    ctx.db.prepare("UPDATE mk_landing_pages SET sections = ? WHERE id = ?").run(JSON.stringify(sections), page.id);
    if (mine && mine.content.theme) ctx.db.prepare("UPDATE mk_landing_pages SET theme = ? WHERE id = ?").run(JSON.stringify(normalizeTheme(mine.content.theme)), page.id);
    audit(ctx, "page.created_from_template", "landing", page.id, { template });
    return withLayout(ctx, page.id, layout);
  }
  // Page de site : un bandeau et un texte (la section d'inscription des pages d'atterrissage demanderait un formulaire
  // avant toute publication)
  // Page vierge demandée explicitement (éditeur) : aucune section, l'éditeur propose alors création classique ou guidée. Sans `blank`, le contenu de départ historique est inchangé.
  if (blank) ctx.db.prepare("UPDATE mk_landing_pages SET sections = '[]' WHERE id = ?").run(page.id);
  else if (kind === "page" || kind === "step") {
    const start = [{ ...page.sections[0], id: newSectionId() }, { type: "text", markdown: "Présentez ici le contenu de la page.", id: newSectionId() }];
    ctx.db.prepare("UPDATE mk_landing_pages SET sections = ? WHERE id = ?").run(JSON.stringify(start), page.id);
  }
  return withLayout(ctx, page.id, layout);
}
// Conception guidée dès la création : le format est écrit dans le thème de la page (aucune migration)
function withLayout(ctx, id, layout) {
  if (layout) {
    const norm = layoutFormat.normalizeLayout(layout);
    if (norm) {
      const row = ctx.db.prepare("SELECT theme FROM mk_landing_pages WHERE id = ?").get(id);
      const theme = { ...JSON.parse(row.theme || "{}"), layout: norm };
      ctx.db.prepare("UPDATE mk_landing_pages SET theme = ? WHERE id = ?").run(JSON.stringify(theme), id);
      audit(ctx, "page.layout_format_set", "landing", id, { format: norm.format, locked: norm.locked });
    }
  }
  return requirePage(ctx, id);
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
  // « Aucun en-tête » suit la page ; une variante aussi, tant que la copie reste dans le même site (elle appartient à ce site)
  if (page.header_mode === "none" || (page.header_mode === "variant" && target === page.site_id)) {
    ctx.db.prepare("UPDATE mk_landing_pages SET header_mode = ?, header_component_id = ? WHERE id = ?").run(page.header_mode, page.header_mode === "variant" ? page.header_component_id : null, newId);
  }
  audit(ctx, "page.duplicated", "landing", newId, { from: id });
  return requirePage(ctx, newId);
}

// Archiver : la page est retirée du site (hors ligne) et des listes ; rien n'est effacé (statistiques, versions)
function archivePage(ctx, id, { detach = false } = {}) {
  requirePage(ctx, id);
  // Palier 18 : une page utilisée par un tunnel actif ne part pas à la corbeille en silence (refus listant les tunnels, ou détachement explicite)
  require("../funnels").guardPageRemoval(ctx, id, { detach, action: "mise à la corbeille" });
  require("./themeTemplates").guardPageRemoval(ctx, id, { detach, action: "mise à la corbeille" }); // mission 9 : une page qui sert de modèle de thème ne disparaît pas en silence
  require("./abtests").guardPageRemoval(ctx, id, "mise à la corbeille"); // palier 22 : une page testée ne disparaît pas en silence
  ctx.db.prepare("UPDATE mk_landing_pages SET archived_at = datetime('now'), scheduled_at = NULL, status = CASE status WHEN 'published' THEN 'unpublished' ELSE status END, revision = revision + 1, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
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

const siteSettingsLib = require("./siteSettings");
const invalidateSites = () => require("../../services/urls").invalidateSites();
const { themeCss } = require("./themeCss");
// Un site lu : jetons et réglages toujours complets et valides, et tout ce que la page publique en affiche (CSS du thème,
// du CSS du site, transitions, visionneuse) calculé une fois — canevas, aperçu et page publiée lisent exactement la même chose
const parseSite = (row) => {
  if (!row) return null;
  const tokens = normalizeTokens(json(row.tokens, {}));
  const settings = siteSettingsLib.normalizeSettings(json(row.settings, {}));
  return { ...row, tokens, settings, assets: siteSettingsLib.siteAssets(tokens, settings, themeCss) };
};
const SITE_TYPES = { "": "Non précisé", vitrine: "Site vitrine", blog: "Blog", boutique: "Boutique", formation: "Formation", autre: "Autre" };
const SITE_VIEWS = ["actifs", "archives", "supprimes", "tous"];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function freeSiteSlug(ctx, base, exceptId = null) {
  let slug = base, n = 2;
  while (ctx.db.prepare("SELECT 1 FROM mk_sites WHERE organization_id = ? AND slug = ? AND id IS NOT ?").get(ctx.organizationId, slug, exceptId)) slug = `${base.slice(0, 55)}-${n++}`;
  return slug;
}
// Les sites créés avant le Site Manager n'ont pas d'identifiant lisible : il leur est attribué (une seule fois) d'après leur nom
function backfillSlugs(ctx) {
  const rows = ctx.db.prepare("SELECT id, name FROM mk_sites WHERE organization_id = ? AND slug IS NULL ORDER BY id").all(ctx.organizationId);
  for (const r of rows) ctx.db.prepare("UPDATE mk_sites SET slug = ? WHERE id = ?").run(freeSiteSlug(ctx, landing.slugify(r.name).replace(/^page$/, "site"), r.id), r.id);
}
function cleanSiteSlug(ctx, value, { exceptId = null } = {}) {
  const v = String(value ?? "").trim().toLowerCase();
  if (!SLUG_RE.test(v) || v.length < 2 || v.length > 60) throw bad("Identifiant lisible invalide : 2 à 60 caractères, lettres minuscules, chiffres et tirets (ex. mon-site).");
  if (ctx.db.prepare("SELECT 1 FROM mk_sites WHERE organization_id = ? AND slug = ? AND id IS NOT ?").get(ctx.organizationId, v, exceptId)) throw new MarketingError("duplicate", "Cet identifiant est déjà utilisé par un autre site.");
  return v;
}
function cleanSiteType(value) {
  const v = String(value ?? "").trim();
  if (!Object.prototype.hasOwnProperty.call(SITE_TYPES, v)) throw bad("Type de site inconnu.");
  return v;
}
function getSite(ctx, id) {
  checkCtx(ctx);
  backfillSlugs(ctx);
  return parseSite(Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_sites WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null);
}
function requireSite(ctx, id, { active = false } = {}) {
  const site = getSite(ctx, Number(id));
  if (!site) throw new MarketingError("not_found", "Site introuvable.");
  if (active && (site.status !== "active" || site.deleted_at)) throw bad("Ce site est archivé ou supprimé : restaurez-le d'abord.");
  return site;
}
// view : actifs | archives | supprimes | tous (hors supprimés) ; q : recherche dans le nom, l'identifiant lisible et la description (lecture seule)
function listSites(ctx, { archived = false, view = null, q = "", only = null } = {}) {
  checkCtx(ctx);
  backfillSlugs(ctx);
  const v = SITE_VIEWS.includes(view) ? view : archived ? "archives" : "actifs";
  const where = ["s.organization_id = ?"];
  const args = [ctx.organizationId];
  if (v === "supprimes") where.push("s.deleted_at IS NOT NULL");
  else { where.push("s.deleted_at IS NULL"); if (v !== "tous") { where.push("s.status = ?"); args.push(v === "archives" ? "archived" : "active"); } }
  const term = String(q || "").trim().slice(0, 80);
  if (term) { const like = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`; where.push("(s.name LIKE ? ESCAPE '\\' OR s.slug LIKE ? ESCAPE '\\' OR s.description LIKE ? ESCAPE '\\')"); args.push(like, like, like); }
  if (Array.isArray(only)) { where.push(`s.id IN (${only.length ? only.map(() => "?").join(",") : "NULL"})`); args.push(...only); }
  return ctx.db.prepare(`SELECT s.*,
      (SELECT COUNT(*) FROM mk_landing_pages p WHERE p.site_id = s.id AND p.archived_at IS NULL) AS pages,
      (SELECT COUNT(*) FROM mk_landing_pages p WHERE p.site_id = s.id AND p.archived_at IS NULL AND p.status = 'published') AS published
    FROM mk_sites s WHERE ${where.join(" AND ")} ORDER BY s.updated_at DESC, s.id DESC`).all(...args).map(parseSite);
}
function siteCounts(ctx) {
  checkCtx(ctx);
  const r = ctx.db.prepare(`SELECT COALESCE(SUM(deleted_at IS NULL AND status = 'active'), 0) AS actifs, COALESCE(SUM(deleted_at IS NULL AND status = 'archived'), 0) AS archives,
    COALESCE(SUM(deleted_at IS NOT NULL), 0) AS supprimes FROM mk_sites WHERE organization_id = ?`).get(ctx.organizationId);
  return { actifs: r.actifs, archives: r.archives, supprimes: r.supprimes, tous: r.actifs + r.archives };
}
function sitePages(ctx, siteId, { archived = false } = {}) {
  requireSite(ctx, siteId);
  return ctx.db.prepare(`SELECT id, name, slug, title, status, kind, published_at, updated_at, draft IS NOT NULL AS has_draft, archived_at, header_mode, header_component_id FROM mk_landing_pages
    WHERE organization_id = ? AND site_id = ? AND archived_at IS ${archived ? "NOT " : ""}NULL ORDER BY name COLLATE NOCASE`).all(ctx.organizationId, siteId);
}

function createSite(ctx, { name, tokens, slug, description, siteType } = {}) {
  checkCtx(ctx);
  const clean_ = line(name, 100);
  if (!clean_) throw bad("Le nom du site est obligatoire.");
  if (ctx.db.prepare("SELECT 1 FROM mk_sites WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, clean_)) throw new MarketingError("duplicate", "Un site porte déjà ce nom.");
  backfillSlugs(ctx);
  const finalSlug = slug !== undefined && String(slug).trim() !== "" ? cleanSiteSlug(ctx, slug) : freeSiteSlug(ctx, landing.slugify(clean_).replace(/^page$/, "site"));
  const desc = line(description ?? "", 500);
  const type = cleanSiteType(siteType ?? "");
  const id = Number(ctx.db.prepare("INSERT INTO mk_sites (organization_id, name, slug, description, site_type, tokens, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(ctx.organizationId, clean_, finalSlug, desc, type, JSON.stringify(normalizeTokens(tokens || DEFAULT_TOKENS, { strict: Boolean(tokens) })), ctx.userId ?? null).lastInsertRowid);
  audit(ctx, "site.created", "site", id, {});
  return getSite(ctx, id);
}
function updateSite(ctx, id, { name, tokens, slug, description, siteType } = {}) {
  const site = requireSite(ctx, id, { active: true });
  const newName = name === undefined ? site.name : line(name, 100);
  if (!newName) throw bad("Le nom du site est obligatoire.");
  const dup = ctx.db.prepare("SELECT id FROM mk_sites WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, newName);
  if (dup && dup.id !== site.id) throw new MarketingError("duplicate", "Un site porte déjà ce nom.");
  const newTokens = tokens === undefined ? site.tokens : normalizeTokens(tokens, { strict: true });
  const newSlug = slug === undefined ? site.slug : cleanSiteSlug(ctx, slug, { exceptId: site.id });
  const newDesc = description === undefined ? site.description : line(description, 500);
  const newType = siteType === undefined ? site.site_type : cleanSiteType(siteType);
  ctx.db.prepare("UPDATE mk_sites SET name = ?, slug = ?, description = ?, site_type = ?, tokens = ?, updated_at = datetime('now') WHERE id = ?").run(newName, newSlug, newDesc, newType, JSON.stringify(newTokens), site.id);
  audit(ctx, "site.updated", "site", site.id, { tokens: tokens !== undefined });
  return getSite(ctx, site.id);
}
// Où le site lui-même référence une couleur personnalisée (pour le message de refus) : libellés lisibles, jamais de chemin technique
function siteColorHolders(tokens, settings) {
  const has = (v, key) => JSON.stringify(v === undefined ? null : v).includes(`"token:${key}"`);
  return (key) => {
    const where = [];
    if ((settings.classes || []).some((c) => has(c.styles, key) || has(c.states, key))) where.push("classes globales");
    if (has(tokens.buttons, key)) where.push("boutons");
    if (has(tokens.link, key)) where.push("liens");
    if (has(tokens.list, key)) where.push("listes");
    if (has(tokens.forms, key)) where.push("champs de formulaire");
    if (has(tokens.images, key) || has(tokens.typeExtra, key) || has(tokens.border, key)) where.push("images, textes ou bordures");
    if (has(settings.background, key)) where.push("fond du site");
    if (!where.length) where.push("autres réglages");
    return where;
  };
}
// Enregistrement des réglages d'un site (couleurs, polices… = jetons). Une seule révision pour l'ensemble des réglages :
// deux enregistrements concurrents ne s'écrasent jamais en silence.
function saveSiteDesign(ctx, id, { tokens, settings, name, revision } = {}) {
  const site = requireSite(ctx, id, { active: true });
  if (!Number.isInteger(revision)) throw bad("Révision manquante : rechargez le panneau des réglages.");
  if (revision !== site.settings_revision) {
    throw new MarketingError("conflict", "Les réglages de ce site ont été modifiés ailleurs (autre onglet ou autre personne) : rechargez-les avant d'enregistrer, vos modifications n'ont pas été enregistrées.");
  }
  const nextTokens = tokens === undefined ? site.tokens : normalizeTokens(tokens, { strict: true });
  const nextSettings = settings === undefined ? site.settings : siteSettingsLib.normalizeSettings(settings, { strict: true });
  const nextName = name === undefined ? site.name : line(name, 100);
  if (!nextName) throw bad("Le nom du site est obligatoire.");
  if (nextName !== site.name) {
    const dup = ctx.db.prepare("SELECT id FROM mk_sites WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, nextName);
    if (dup && dup.id !== site.id) throw new MarketingError("duplicate", "Un site porte déjà ce nom.");
  }
  // Supprimer une couleur personnalisée encore utilisée casserait des widgets : refusé, avec le détail
  const removed = site.tokens.customColors.filter((c) => !nextTokens.customColors.some((n) => n.key === c.key));
  if (removed.length) {
    // Références portées par le site lui-même (classes globales, boutons, liens, puces, champs, fond…) : elles aussi laisseraient une variable CSS inexistante
    const siteText = JSON.stringify({ tokens: { ...nextTokens, customColors: undefined }, settings: nextSettings });
    const ownerOf = siteColorHolders(nextTokens, nextSettings);
    for (const c of removed) {
      if (siteText.includes(`"token:${c.key}"`)) throw bad(`La couleur « ${c.label} » est utilisée par les réglages du site (${ownerOf(c.key).join(", ")}) : remplacez-la avant de la supprimer.`);
    }
    const usage = colorUsage(ctx, site.id);
    const busy = removed.filter((c) => usage[c.key] && usage[c.key].pages > 0);
    if (busy.length) {
      const first = busy[0];
      throw bad(`La couleur « ${first.label} » est utilisée dans ${usage[first.key].pages} page(s) du site : remplacez-la dans ces pages avant de la supprimer.`);
    }
  }
  // Un domaine n'appartient qu'à un seul site (sinon la même adresse servirait deux sites)
  const publicUrl = nextSettings.seo && nextSettings.seo.publicUrl;
  if (publicUrl) {
    const host = new URL(publicUrl).hostname.toLowerCase();
    const clash = ctx.db.prepare("SELECT id, name, settings FROM mk_sites WHERE id <> ? AND status = 'active'").all(site.id).find((o) => { try { const u = JSON.parse(o.settings || "{}").seo; return u && u.publicUrl && new URL(u.publicUrl).hostname.toLowerCase() === host; } catch { return false; } });
    if (clash) throw new MarketingError("duplicate", `Cette adresse publique est déjà celle du site « ${clash.name} » : un domaine ne peut servir qu'un seul site.`);
  }
  const info = ctx.db.prepare("UPDATE mk_sites SET name = ?, tokens = ?, settings = ?, settings_revision = settings_revision + 1, updated_at = datetime('now') WHERE id = ? AND settings_revision = ?")
    .run(nextName, JSON.stringify(nextTokens), JSON.stringify(nextSettings), site.id, revision);
  if (info.changes !== 1) throw new MarketingError("conflict", "Les réglages de ce site ont été modifiés ailleurs : rechargez-les avant d'enregistrer.");
  invalidateSites();
  audit(ctx, "site.design_saved", "site", site.id, {});
  return getSite(ctx, site.id);
}

// Où chaque couleur (jeton) est utilisée : nombre de pages du site, et de références, dans le contenu en ligne, le
// brouillon et les composants du site. Une référence est la chaîne « token:<clé> » enregistrée dans les styles.
function colorUsage(ctx, siteId) {
  const site = requireSite(ctx, siteId);
  const keys = [...tokensModule.COLOR_KEYS, "on-primary", "on-accent", ...site.tokens.customColors.map((c) => c.key)];
  const usage = Object.fromEntries(keys.map((k) => [k, { pages: 0, refs: 0 }]));
  const count = (text, key) => {
    let n = 0;
    for (let i = text.indexOf(`token:${key}"`); i !== -1; i = text.indexOf(`token:${key}"`, i + 1)) n++;
    return n;
  };
  const rows = ctx.db.prepare("SELECT sections, theme, draft FROM mk_landing_pages WHERE organization_id = ? AND site_id = ? AND archived_at IS NULL").all(ctx.organizationId, site.id);
  const comps = ctx.db.prepare("SELECT section FROM mk_web_components WHERE organization_id = ? AND site_id = ?").all(ctx.organizationId, site.id);
  for (const r of rows) {
    const text = `${r.sections || ""}${r.theme || ""}${r.draft || ""}`;
    for (const k of keys) { const n = count(text, k); if (n) { usage[k].pages += 1; usage[k].refs += n; } }
  }
  for (const c of comps) for (const k of keys) { const n = count(String(c.section || ""), k); if (n) usage[k].refs += n; }
  return usage;
}
function setHomePage(ctx, siteId, pageId) {
  const site = requireSite(ctx, siteId, { active: true });
  if (pageId !== null) {
    const page = requirePage(ctx, Number(pageId));
    if (page.site_id !== site.id || page.archived_at) throw bad("La page d'accueil doit être une page de ce site.");
  }
  ctx.db.prepare("UPDATE mk_sites SET home_page_id = ?, updated_at = datetime('now') WHERE id = ?").run(pageId, site.id);
  invalidateSites();
}
function movePage(ctx, pageId, siteId) {
  requirePage(ctx, pageId);
  if (siteId !== null) requireSite(ctx, siteId, { active: true });
  ctx.db.prepare("UPDATE mk_sites SET home_page_id = NULL WHERE home_page_id = ? AND organization_id = ? AND id IS NOT ?").run(pageId, ctx.organizationId, siteId);
  invalidateSites();
  const before = requirePage(ctx, pageId);
  ctx.db.prepare("UPDATE mk_landing_pages SET site_id = ?, updated_at = datetime('now') WHERE id = ?").run(siteId, pageId);
  // Une variante d'en-tête appartient au site d'origine : la page déplacée reprend l'en-tête de son nouveau site (« aucun en-tête » reste un choix de la page)
  if (before.site_id !== siteId && before.header_mode === "variant") ctx.db.prepare("UPDATE mk_landing_pages SET header_mode = 'inherit', header_component_id = NULL WHERE id = ?").run(pageId);
  audit(ctx, "page.moved", "landing", pageId, { siteId });
}
// Archiver un site : ses pages en ligne passent hors ligne (rien n'est effacé) ; restaurer ne republie rien d'office
function archiveSite(ctx, id) {
  const site = requireSite(ctx, id);
  if (site.deleted_at) throw bad("Ce site est supprimé : restaurez-le d'abord.");
  transaction(ctx.db, () => {
    ctx.db.prepare("UPDATE mk_landing_pages SET status = 'unpublished', updated_at = datetime('now') WHERE site_id = ? AND status = 'published'").run(site.id);
    ctx.db.prepare("UPDATE mk_sites SET status = 'archived', archived_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(site.id);
    invalidateSites();
  });
  audit(ctx, "site.archived", "site", site.id, {});
}
function restoreSite(ctx, id) {
  const site = requireSite(ctx, id);
  if (site.deleted_at) throw bad("Ce site est dans la corbeille : sortez-le d'abord de la corbeille.");
  // Le domaine d'un site archivé a pu être repris par un autre site : il n'est pas rendu en silence (le site restauré retrouve ses réglages sans domaine)
  const restoredUrl = site.settings.seo && site.settings.seo.publicUrl;
  if (restoredUrl) {
    const host = new URL(restoredUrl).hostname.toLowerCase();
    const taken = ctx.db.prepare("SELECT settings FROM mk_sites WHERE id <> ? AND status = 'active'").all(site.id).some((o) => { try { const u = JSON.parse(o.settings || "{}").seo; return u && u.publicUrl && new URL(u.publicUrl).hostname.toLowerCase() === host; } catch { return false; } });
    if (taken) { const next = { ...site.settings, seo: { ...site.settings.seo, publicUrl: "" } }; ctx.db.prepare("UPDATE mk_sites SET settings = ? WHERE id = ?").run(JSON.stringify(next), site.id); }
  }
  ctx.db.prepare("UPDATE mk_sites SET status = 'active', archived_at = NULL, updated_at = datetime('now') WHERE id = ?").run(site.id);
  invalidateSites();
  audit(ctx, "site.restored", "site", site.id, {});
}
// Dupliquer un site : configuration (design system, réglages, description, type) et, si demandé, ses pages (en brouillon, hors ligne, nouvelles adresses).
// Médias, tunnels, articles et autres données du CMS ne sont jamais copiés.
function duplicateSite(ctx, id, { withPages = true } = {}) {
  const site = requireSite(ctx, id);
  if (site.deleted_at) throw bad("Ce site est supprimé : restaurez-le d'abord.");
  return transaction(ctx.db, () => {
    const copy = createSite(ctx, { name: uniqueName(ctx, "mk_sites", `${site.name} (copie)`), tokens: site.tokens, description: site.description, siteType: site.site_type });
    // Une copie n'hérite jamais du domaine de l'original (un domaine ne sert qu'un seul site)
    ctx.db.prepare("UPDATE mk_sites SET settings = ? WHERE id = ?").run(JSON.stringify({ ...site.settings, seo: { ...site.settings.seo, publicUrl: "" } }), copy.id);
    if (withPages) {
      const map = new Map();
      for (const p of sitePages(ctx, site.id)) map.set(p.id, duplicatePage(ctx, p.id, { siteId: copy.id }).id);
      if (site.home_page_id && map.has(site.home_page_id)) setHomePage(ctx, copy.id, map.get(site.home_page_id));
      duplicateSiteParts(ctx, site, copy, map);
    }
    audit(ctx, "site.duplicated", "site", copy.id, { from: site.id, withPages });
    return getSite(ctx, copy.id);
  });
}
// Parties globales d'une copie de site : l'en-tête, le pied de page et les variantes réservés au site d'origine sont COPIÉS pour la copie
// (nouveaux identifiants, modifier l'un ne change pas l'autre) ; un composant partagé par tous les sites reste partagé.
function duplicateSiteParts(ctx, site, copy, pageMap) {
  const done = new Map();
  const cloneOf = (cid) => {
    if (!cid) return null;
    if (done.has(cid)) return done.get(cid);
    const c = getComponent(ctx, Number(cid));
    if (!c || !c.section) return null;
    if (c.site_id === null) { done.set(cid, c.id); return c.id; }
    if (c.site_id !== site.id) return null;
    const created = createComponent(ctx, { name: uniqueName(ctx, "mk_web_components", `${c.name} (copie)`), section: freshIds(c.section), siteId: copy.id, kind: c.kind });
    if (c.variant_of) ctx.db.prepare("UPDATE mk_web_components SET variant_of = ? WHERE id = ?").run(cloneOf(c.variant_of), created.id);
    done.set(cid, created.id);
    return created.id;
  };
  const header = cloneOf(site.header_component_id), footer = cloneOf(site.footer_component_id);
  if (header || footer) setSiteParts(ctx, copy.id, { header, footer });
  for (const [from, to] of pageMap) {
    const src = ctx.db.prepare("SELECT header_mode, header_component_id FROM mk_landing_pages WHERE id = ?").get(from);
    if (src && src.header_mode === "variant") {
      const v = cloneOf(src.header_component_id);
      if (v) ctx.db.prepare("UPDATE mk_landing_pages SET header_mode = 'variant', header_component_id = ? WHERE id = ?").run(v, to);
    }
  }
}
// Suppression logique : seulement un site archivé (donc hors ligne). Rien n'est effacé : pages, accès et réglages restent en base et le site se restaure depuis la corbeille.
function deleteSite(ctx, id) {
  const site = requireSite(ctx, id);
  if (site.deleted_at) throw bad("Ce site est déjà supprimé.");
  if (site.status !== "archived") throw bad("Archivez d'abord ce site : seul un site archivé peut être supprimé.");
  ctx.db.prepare("UPDATE mk_sites SET deleted_at = datetime('now'), deleted_by = ?, updated_at = datetime('now') WHERE id = ?").run(ctx.userId ?? null, site.id);
  invalidateSites();
  audit(ctx, "site.deleted", "site", site.id, {});
}
function undeleteSite(ctx, id) {
  const site = requireSite(ctx, id);
  if (!site.deleted_at) throw bad("Ce site n'est pas supprimé.");
  ctx.db.prepare("UPDATE mk_sites SET deleted_at = NULL, deleted_by = NULL, updated_at = datetime('now') WHERE id = ?").run(site.id);
  invalidateSites();
  audit(ctx, "site.undeleted", "site", site.id, {});
}

// ---------- Composants réutilisables ----------

const COMPONENT_KINDS = ["standard", "global"];
// Nombre d'éléments (blocs) d'une section de composant : la section libre compte ses éléments imbriqués, un autre type de section compte pour un
function countBlocks(section) {
  if (!section) return 0;
  const walk = (list) => list.reduce((n, x) => n + 1 + walk(Array.isArray(x.children) ? x.children : []), 0);
  return section.type === "layout" ? walk(Array.isArray(section.children) ? section.children : []) : 1;
}
// « global » = portée (tous les sites) ; « kind » = nature (modèle standard ou référence globale à instances liées)
const readComponent = (row) => row ? { ...row, section: json(row.section, null), draft: json(row.draft, null), hasDraft: Boolean(row.draft), global: row.site_id === null, kind: row.kind || "standard", blocks: countBlocks(json(row.section, null)) } : null;
function listComponents(ctx, { siteId = null } = {}) {
  checkCtx(ctx);
  return ctx.db.prepare("SELECT * FROM mk_web_components WHERE organization_id = ? AND (site_id IS NULL OR site_id = ?) ORDER BY name COLLATE NOCASE")
    .all(ctx.organizationId, siteId).map(readComponent);
}
function getComponent(ctx, id) {
  checkCtx(ctx);
  const row = Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_web_components WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null;
  return readComponent(row);
}
// Une section enregistrée comme composant : jamais un composant dans un composant (pas de boucle possible)
function componentSection(ctx, section) {
  if (!section || section.type === "component") throw bad("Un composant ne peut pas contenir un autre composant.");
  const { id: _id, ...rest } = section;
  return normalizeSection(ctx, rest, 0);
}
function createComponent(ctx, { name, section, siteId = null, kind = "standard" } = {}) {
  checkCtx(ctx);
  if (!COMPONENT_KINDS.includes(kind)) throw bad("Nature de composant inconnue (standard ou global).");
  const n = line(name, 80);
  if (!n) throw bad("Le nom du composant est obligatoire.");
  if (siteId !== null) requireSite(ctx, siteId, { active: true });
  if (ctx.db.prepare("SELECT 1 FROM mk_web_components WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, n)) throw new MarketingError("duplicate", "Un composant porte déjà ce nom.");
  checkWidgetRights(ctx, [], [componentSection(ctx, section)]);
  const id = Number(ctx.db.prepare("INSERT INTO mk_web_components (organization_id, site_id, name, section, kind, created_by) VALUES (?, ?, ?, ?, ?, ?)")
    .run(ctx.organizationId, siteId, n, JSON.stringify(componentSection(ctx, section)), kind, ctx.userId ?? null).lastInsertRowid);
  audit(ctx, "component.created", "component", id, { kind });
  return getComponent(ctx, id);
}
// global : true = partagé par tous les sites ; false = réservé au site siteId (refusé s'il est utilisé ailleurs)
function updateComponent(ctx, id, { name, section, global, siteId, revision } = {}) {
  const c = getComponent(ctx, id);
  if (!c) throw new MarketingError("not_found", "Composant introuvable.");
  if (Number.isInteger(revision) && revision !== c.revision) throw componentConflict();
  const n = name === undefined ? c.name : line(name, 80);
  if (!n) throw bad("Le nom du composant est obligatoire.");
  const dup = ctx.db.prepare("SELECT id FROM mk_web_components WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, n);
  if (dup && dup.id !== c.id) throw new MarketingError("duplicate", "Un composant porte déjà ce nom.");
  const s = section === undefined ? c.section : componentSection(ctx, section);
  checkWidgetRights(ctx, [c.section], [s]);
  let site = c.site_id;
  if (global === true) site = null;
  else if (global === false) {
    const sid = Number(siteId);
    if (!Number.isInteger(sid)) throw bad("Choisissez le site auquel réserver ce composant.");
    requireSite(ctx, sid, { active: true });
    const elsewhere = componentUsage(ctx, c.id).filter((p) => p.site_id !== sid);
    if (elsewhere.length) throw new MarketingError("in_use", `Ce composant est utilisé par des pages d'un autre site ou hors site (${elsewhere.map((p) => `« ${p.name} »`).join(", ")}) : il doit rester global.`);
    site = sid;
  }
  ctx.db.prepare("UPDATE mk_web_components SET name = ?, section = ?, site_id = ?, revision = revision + 1, updated_at = datetime('now') WHERE id = ?").run(n, JSON.stringify(s), site, c.id);
  audit(ctx, "component.updated", "component", c.id, {});
  return getComponent(ctx, c.id);
}
// Copie de travail : modifiée dans l'éditeur du composant, SANS effet sur les pages tant que la mise à jour n'est pas demandée
function saveComponentDraft(ctx, id, section, { revision } = {}) {
  const c = getComponent(ctx, id);
  if (!c) throw new MarketingError("not_found", "Composant introuvable.");
  if (Number.isInteger(revision) && revision !== c.revision) throw componentConflict();
  const s = componentSection(ctx, section);
  checkWidgetRights(ctx, [c.section], [s]);
  ctx.db.prepare("UPDATE mk_web_components SET draft = ?, revision = revision + 1, updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(s), c.id);
  return getComponent(ctx, c.id);
}
// Mise à jour explicite : la copie de travail devient la version diffusée (les instances liées l'affichent), numéro de version + 1
function publishComponent(ctx, id, { revision } = {}) {
  const c = getComponent(ctx, id);
  if (!c) throw new MarketingError("not_found", "Composant introuvable.");
  // La mise à jour porte sur la version que la personne a vue confirmée : si le serveur en a une autre, rien n'est diffusé
  if (Number.isInteger(revision) && revision !== c.revision) throw componentConflict();
  if (!c.draft) return { component: c, changed: false, instances: componentInstances(ctx, c.id) };
  checkWidgetRights(ctx, [c.section], [c.draft]);
  transaction(ctx.db, () => {
    ctx.db.prepare("UPDATE mk_web_components SET section = ?, draft = NULL, version = version + 1, revision = revision + 1, updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(c.draft), c.id);
    audit(ctx, "component.published", "component", c.id, { version: c.version + 1 });
  });
  return { component: getComponent(ctx, c.id), changed: true, instances: componentInstances(ctx, c.id) };
}
function discardComponentDraft(ctx, id, { revision } = {}) {
  const c = getComponent(ctx, id);
  if (!c) throw new MarketingError("not_found", "Composant introuvable.");
  if (Number.isInteger(revision) && revision !== c.revision) throw componentConflict();
  ctx.db.prepare("UPDATE mk_web_components SET draft = NULL, revision = revision + 1, updated_at = datetime('now') WHERE id = ?").run(c.id);
  return getComponent(ctx, c.id);
}
// Instances liées réellement présentes dans le contenu de travail de chaque page (brouillon s'il existe, sinon version en ligne) : nombre exact, pas une recherche de texte
function countRefs(list, id) {
  return (Array.isArray(list) ? list : []).reduce((n, x) => n + (x && x.type === "component" && Number(x.componentId) === Number(id) ? 1 : 0), 0);
}
function componentInstances(ctx, id) {
  const rows = ctx.db.prepare("SELECT id, name, status, site_id, sections, draft FROM mk_landing_pages WHERE organization_id = ? AND (sections LIKE ? OR sections LIKE ? OR draft LIKE ? OR draft LIKE ?) ORDER BY name")
    .all(ctx.organizationId, `%"componentId":${Number(id)}}%`, `%"componentId":${Number(id)},%`, `%"componentId":${Number(id)}}%`, `%"componentId":${Number(id)},%`);
  const out = rows.map((p) => {
    const draft = json(p.draft, null);
    const working = draft && Array.isArray(draft.sections) ? draft.sections : json(p.sections, []);
    return { id: p.id, name: p.name, status: p.status, site_id: p.site_id, count: countRefs(working, id), live: countRefs(json(p.sections, []), id) };
  }).filter((p) => p.count > 0 || p.live > 0);
  return out;
}
// Pages (en ligne ou en brouillon) qui affichent ce composant synchronisé
function componentUsage(ctx, id) {
  const n = Number(id);
  const end = `%"componentId":${n}}%`, mid = `%"componentId":${n},%`;
  return ctx.db.prepare("SELECT id, name, status, site_id FROM mk_landing_pages WHERE organization_id = ? AND (sections LIKE ? OR sections LIKE ? OR draft LIKE ? OR draft LIKE ?) ORDER BY name")
    .all(ctx.organizationId, end, mid, end, mid);
}
// Copie profonde d'une section de composant avec de NOUVEAUX identifiants (sections et éléments) : une instance détachée ne partage aucun identifiant avec la source
function freshIds(section) {
  const crypto = require("crypto");
  const nid = () => crypto.randomBytes(6).toString("hex");
  const walk = (x) => {
    const y = { ...x, id: nid() };
    if (Array.isArray(x.children)) y.children = x.children.map(walk);
    return y;
  };
  return walk(section);
}
// Transforme une liste de sections : chaque instance liée au composant est retirée (mode « instances ») ou remplacée par une copie indépendante (mode « detach »)
function convertRefs(list, c, mode) {
  let changed = 0;
  const out = [];
  for (const x of Array.isArray(list) ? list : []) {
    if (x && x.type === "component" && Number(x.componentId) === c.id) {
      changed += 1;
      if (mode === "detach") {
        const copy = freshIds(c.section);
        const { type: _t, componentId: _c, ...attrs } = x;
        out.push({ ...copy, ...(attrs.hideOn ? { hideOn: attrs.hideOn } : {}), ...(attrs.name ? { name: attrs.name } : {}), id: x.id || copy.id });
      }
    } else out.push(x);
  }
  return { list: out, changed };
}
const DELETE_MODES = ["instances", "detach"];
// Suppression intelligente. Sans instance liée : suppression directe. Avec des instances : un choix OBLIGATOIRE — « instances » (supprimer aussi les instances liées)
// ou « detach » (les conserver, devenues indépendantes). Tout se passe dans UNE transaction : en cas d'échec, rien n'est modifié (aucune instance orpheline).
// skipDraftOfPage : le brouillon de cette page est converti par l'éditeur ouvert (annulable) ; sa version en ligne, elle, est traitée ici.
function deleteComponent(ctx, id, { mode = null, skipDraftOfPage = null } = {}) {
  const c = getComponent(ctx, id);
  if (!c) throw new MarketingError("not_found", "Composant introuvable.");
  const asPart = ctx.db.prepare("SELECT name FROM mk_sites WHERE organization_id = ? AND (header_component_id = ? OR footer_component_id = ?)").all(ctx.organizationId, c.id, c.id);
  if (asPart.length) throw new MarketingError("in_use", `Ce composant est l'en-tête ou le pied de page du site ${asPart.map((x) => `« ${x.name} »`).join(", ")} : choisissez-en un autre d'abord.`);
  const asVariant = ctx.db.prepare("SELECT name FROM mk_landing_pages WHERE organization_id = ? AND header_component_id = ?").all(ctx.organizationId, c.id);
  if (asVariant.length) throw new MarketingError("in_use", `Cette variante est l'en-tête de ${asVariant.length} page(s) : ${asVariant.map((x) => `« ${x.name} »`).join(", ")}. Remettez-les sur l'en-tête du site (page › en-tête) avant de supprimer cette variante.`);
  const used = componentInstances(ctx, c.id);
  if (used.length && !mode) {
    const error = new MarketingError("in_use", `Ce composant a encore des instances liées dans ${used.length} page(s) : ${used.map((p) => `« ${p.name} »`).join(", ")}. Choisissez : les supprimer aussi, ou les conserver comme blocs indépendants.`);
    error.details = { instances: used.reduce((n, p) => n + p.count, 0), pages: used };
    throw error;
  }
  if (mode && !DELETE_MODES.includes(mode)) throw bad("Choix de suppression inconnu (instances ou detach).");
  let converted = 0, pagesTouched = 0;
  const revisions = {}; // nouvelle révision des pages modifiées : l'éditeur ouvert sur l'une d'elles évite ainsi un faux conflit à son prochain enregistrement
  transaction(ctx.db, () => {
    for (const p of used) {
      const row = ctx.db.prepare("SELECT id, sections, draft, revision FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(p.id, ctx.organizationId);
      const live = convertRefs(json(row.sections, []), c, mode);
      let draftJson = row.draft, dChanged = 0;
      if (row.draft && Number(skipDraftOfPage) !== row.id) {
        const d = json(row.draft, null);
        if (d && Array.isArray(d.sections)) { const r = convertRefs(d.sections, c, mode); dChanged = r.changed; draftJson = JSON.stringify({ ...d, sections: r.list }); }
      }
      if (!live.changed && !dChanged) continue;
      ctx.db.prepare("UPDATE mk_landing_pages SET sections = ?, draft = ?, revision = revision + 1, updated_at = datetime('now') WHERE id = ? AND organization_id = ?")
        .run(live.changed ? JSON.stringify(live.list) : row.sections, draftJson, row.id, ctx.organizationId);
      converted += live.changed + dChanged; pagesTouched += 1; revisions[row.id] = row.revision + 1;
    }
    // Garde-fou : plus aucune référence (hors brouillon géré par l'éditeur ouvert) ne doit pointer vers ce composant
    const left = componentInstances(ctx, c.id).filter((p) => Number(skipDraftOfPage) !== p.id || p.live > 0);
    if (left.length) throw new MarketingError("failed", "La conversion des instances n'a pas abouti : rien n'a été supprimé.");
    ctx.db.prepare("DELETE FROM mk_web_components WHERE id = ?").run(c.id);
    audit(ctx, "component.deleted", "component", c.id, { mode: mode || "none", pages: pagesTouched, instances: converted });
  });
  return { mode: mode || "none", pages: pagesTouched, instances: converted, revisions };
}
// Affichage : chaque composant synchronisé est remplacé par sa dernière version (un composant supprimé disparaît)
// ---------- Parties globales d'un site (en-tête, pied de page) ----------
// Un composant réutilisable choisi dans les réglages du site, affiché autour des sections de chacune de ses pages
function partOf(ctx, cid, which) {
  if (!cid) return null;
  const c = getComponent(ctx, Number(cid));
  return c && c.section && c.section.type !== "component" ? { ...c.section, id: c.section.id || `part${which}${c.id}`.slice(0, 20), fromComponent: c.id, sitePart: which } : null;
}
function siteParts(ctx, siteId) {
  const none = { header: null, footer: null };
  if (!siteId) return none;
  const site = getSite(ctx, Number(siteId));
  if (!site || site.status !== "active") return none;
  return { header: partOf(ctx, site.header_component_id, "header"), footer: partOf(ctx, site.footer_component_id, "footer") };
}
// Affichage : l'en-tête d'une page est celui du site (par défaut), aucun (exception) ou une variante (exception)
function withSiteParts(ctx, page, sections) {
  const p = siteParts(ctx, page && page.site_id);
  let header = p.header;
  if (page && page.site_id && header) {
    if (page.header_mode === "none") header = null;
    else if (page.header_mode === "variant") header = partOf(ctx, page.header_component_id, "header") || p.header;
  }
  return [header, ...sections, p.footer].filter(Boolean);
}
function setSiteParts(ctx, siteId, { header = null, footer = null } = {}) {
  const site = requireSite(ctx, siteId, { active: true });
  const check = (id, label) => {
    if (id === null || id === undefined || id === "") return null;
    const c = getComponent(ctx, Number(id));
    if (!c || !c.section) throw bad(`${label} : composant introuvable.`);
    if (c.site_id !== null && c.site_id !== site.id) throw bad(`${label} : ce composant appartient à un autre site.`);
    return c.id;
  };
  const h = check(header, "En-tête"), f = check(footer, "Pied de page");
  ctx.db.prepare("UPDATE mk_sites SET header_component_id = ?, footer_component_id = ?, updated_at = datetime('now') WHERE id = ?").run(h, f, site.id);
  audit(ctx, "site.parts_updated", "site", site.id, { header: h, footer: f });
  return getSite(ctx, site.id);
}

// ---------- En-tête du site : exceptions par page, variantes, vue d'ensemble ----------
const HEADER_MODES = ["inherit", "none", "variant"];
// Choix de l'en-tête d'UNE page : celui du site (inherit), aucun (none) ou une variante (variant + composant du site)
function setPageHeader(ctx, pageId, { mode, componentId } = {}) {
  const page = requirePage(ctx, pageId);
  if (!page.site_id) throw bad("Cette page n'appartient à aucun site : rattachez-la à un site pour lui choisir un en-tête.");
  if (!HEADER_MODES.includes(mode)) throw bad("Choix d'en-tête inconnu.");
  const site = requireSite(ctx, page.site_id, { active: true });
  let cid = null;
  if (mode === "variant") {
    const c = getComponent(ctx, Number(componentId));
    if (!c || !c.section) throw bad("Variante introuvable.");
    if (c.site_id !== null && c.site_id !== site.id) throw bad("Cette variante appartient à un autre site.");
    if (c.id === site.header_component_id) throw bad("C'est déjà l'en-tête du site : choisissez « En-tête du site » pour cette page.");
    cid = c.id;
  }
  ctx.db.prepare("UPDATE mk_landing_pages SET header_mode = ?, header_component_id = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(mode, cid, page.id, ctx.organizationId);
  audit(ctx, "page.header_set", "landing", page.id, { mode, componentId: cid });
  return getPage(ctx, page.id);
}
// Variante : copie de l'en-tête du site, enregistrée comme composant du site, liée à sa source
function createHeaderVariant(ctx, siteId, { name } = {}) {
  const site = requireSite(ctx, siteId, { active: true });
  const source = site.header_component_id ? getComponent(ctx, site.header_component_id) : null;
  if (!source || !source.section) throw bad("Ce site n'a pas encore d'en-tête : choisissez-en un d'abord.");
  let label = line(name, 80);
  if (!label) {
    let n = 1;
    do { label = `${source.name} — variante ${n}`.slice(0, 80); n += 1; } while (ctx.db.prepare("SELECT 1 FROM mk_web_components WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, label));
  }
  const copy = createComponent(ctx, { name: label, section: source.section, siteId: site.id });
  ctx.db.prepare("UPDATE mk_web_components SET variant_of = ? WHERE id = ?").run(source.id, copy.id);
  audit(ctx, "site.header_variant_created", "site", site.id, { source: source.id, variant: copy.id });
  return getComponent(ctx, copy.id);
}
// Vue d'ensemble de l'en-tête d'un site : données réelles (pages qui l'utilisent, exceptions, variantes)
function headerOverview(ctx, siteId) {
  const site = requireSite(ctx, siteId);
  const header = site.header_component_id ? getComponent(ctx, site.header_component_id) : null;
  const all = sitePages(ctx, site.id);
  const comps = new Map(listComponents(ctx, { siteId: site.id }).map((c) => [c.id, c]));
  const brief = (p) => ({ id: p.id, name: p.name, status: p.status, kind: p.kind });
  const using = [], exceptions = [];
  for (const p of all) {
    if (p.header_mode === "none") exceptions.push({ ...brief(p), mode: "none", variant: null });
    else if (p.header_mode === "variant" && comps.get(p.header_component_id)) exceptions.push({ ...brief(p), mode: "variant", variant: { id: p.header_component_id, name: comps.get(p.header_component_id).name } });
    else using.push(brief(p));
  }
  const variants = header ? [...comps.values()].filter((c) => c.variant_of === header.id).map((c) => ({ id: c.id, name: c.name, pages: exceptions.filter((e) => e.variant && e.variant.id === c.id).length })) : [];
  const usable = [...comps.values()].filter((c) => c.section && c.section.type !== "component").map((c) => ({ id: c.id, name: c.name, global: c.global }));
  return {
    header: header ? { id: header.id, name: header.name, global: header.global } : null,
    // « Publié » : l'en-tête est choisi et s'affiche sur les pages du site (composant synchronisé : toujours sa dernière version)
    status: header ? "published" : "none", type: "global",
    using, exceptions, variants, usable, total: all.length,
  };
}

// ---------- Modèles de pages enregistrés par l'équipe ----------
const userTemplate = (row) => (row ? { id: row.id, name: row.name, category: row.category, description: row.description, content: json(row.content, { sections: [] }), updatedAt: row.updated_at } : null);
function listPageTemplates(ctx) {
  checkCtx(ctx);
  return ctx.db.prepare("SELECT * FROM mk_page_templates WHERE organization_id = ? ORDER BY category COLLATE NOCASE, name COLLATE NOCASE").all(ctx.organizationId).map(userTemplate);
}
function getPageTemplate(ctx, id) {
  checkCtx(ctx);
  return userTemplate(Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_page_templates WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null);
}
// Enregistrer un contenu de page comme modèle (validé comme toute page ; un modèle du même nom est remplacé)
function savePageTemplate(ctx, { name, category, description, content } = {}) {
  checkCtx(ctx);
  const n = line(name, 80);
  if (!n) throw bad("Le nom du modèle est obligatoire.");
  const clean = normalizeContent(ctx, { name: n }, content || {});
  const resolved = { ...clean, sections: resolveSections(ctx, clean.sections).map((sec) => { const { fromComponent: _f, ...rest } = sec; return rest; }) };
  if (!resolved.sections.length) throw bad("Le modèle est vide.");
  const cat = line(category, 60) || "Mes modèles", desc = line(description, 200);
  ctx.db.prepare(`INSERT INTO mk_page_templates (organization_id, name, category, description, content, created_by) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (organization_id, name) DO UPDATE SET category = excluded.category, description = excluded.description, content = excluded.content, updated_at = datetime('now')`)
    .run(ctx.organizationId, n, cat, desc, JSON.stringify(resolved), ctx.userId ?? null);
  const row = ctx.db.prepare("SELECT * FROM mk_page_templates WHERE organization_id = ? AND name = ?").get(ctx.organizationId, n);
  audit(ctx, "page_template.saved", "page_template", row.id, { name: n });
  return userTemplate(row);
}
function deletePageTemplate(ctx, id) {
  const t = getPageTemplate(ctx, Number(id));
  if (!t) throw new MarketingError("not_found", "Modèle introuvable.");
  ctx.db.prepare("DELETE FROM mk_page_templates WHERE id = ?").run(t.id);
  audit(ctx, "page_template.deleted", "page_template", t.id, { name: t.name });
}
// Export : le contenu de travail d'une page, dans un format que l'import relit (et valide entièrement)
const EXPORT_FORMAT = "kolakisa-page@1";
function exportPage(ctx, id) {
  const page = requirePage(ctx, id);
  return { format: EXPORT_FORMAT, name: page.name, kind: page.kind, exportedAt: new Date().toISOString(), content: { ...page.working, sections: resolveSections(ctx, page.working.sections).map((sec) => { const { fromComponent: _f, ...rest } = sec; return rest; }) } };
}
// Import : une NOUVELLE page (aucune page existante n'est remplacée), contenu revalidé comme une saisie
function importPage(ctx, data, { siteId = null } = {}) {
  if (!data || data.format !== EXPORT_FORMAT || !data.content || !Array.isArray(data.content.sections)) throw bad("Fichier non reconnu : exportez une page depuis l'éditeur KOLAKISA (format kolakisa-page@1).");
  const name = uniqueName(ctx, "mk_landing_pages", line(data.name, 100) || "Page importée");
  const kind = Object.hasOwn(KINDS, data.kind) ? data.kind : "page";
  const page = createPage(ctx, { name, siteId, kind });
  try {
    saveDraft(ctx, page.id, data.content, { revision: requirePage(ctx, page.id).revision });
  } catch (e) {
    ctx.db.prepare("DELETE FROM mk_landing_pages WHERE id = ?").run(page.id);
    throw e;
  }
  audit(ctx, "page.imported", "landing", page.id, {});
  return requirePage(ctx, page.id);
}

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
  createPage, duplicatePage, archivePage, restorePage, schedulePage, cancelSchedule, promoteScheduledPages, schedulerMiddleware,
  getSite, requireSite, listSites, sitePages, createSite, updateSite, saveSiteDesign, colorUsage, setHomePage, movePage, archiveSite, restoreSite, duplicateSite, deleteSite, undeleteSite, siteCounts, SITE_TYPES, SITE_VIEWS,
  listComponents, getComponent, createComponent, updateComponent, componentUsage, componentInstances, saveComponentDraft, publishComponent, discardComponentDraft, deleteComponent, COMPONENT_KINDS, resolveSections,
  siteParts, withSiteParts, setSiteParts, setPageHeader, createHeaderVariant, headerOverview, HEADER_MODES, listPageTemplates, getPageTemplate, savePageTemplate, deletePageTemplate, exportPage, importPage, EXPORT_FORMAT,
  normalizeSeo, normalizeTheme, TYPES,
};
