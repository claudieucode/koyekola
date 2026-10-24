// Export du contenu d'un site (palier 13) : format JSON structuré « kolakisa-site@1 », réimportable.
// Principes : un seul format (pas de HTML brut), des RÉFÉRENCES stables entre ressources (p12, a5, t3…) que l'import remappe sur de
// nouveaux identifiants, les fichiers médias ne sont PAS exportés (métadonnées et chemins seulement), et jamais de secret :
// ni utilisateurs, ni e-mails, ni mots de passe, ni jetons, ni clés. Toutes les lectures passent par les services du CMS.
//
// Palier « Outils → Exporter » : l'export choisit une SÉLECTION (tout, articles, pages, un autre type), applique des FILTRES validés côté serveur (catégorie, auteur, dates dans le fuseau
// du site, statut), est TOUJOURS limité au site administré (contenu rattaché à ce site ; le site principal = contenu non rattaché), et sort au format natif (JSON) ou WXR (WordPress,
// voir wxr.js), avec ou sans les fichiers médias (archive ZIP, zip.js). Jamais de secret, d'e-mail de compte ni d'adresse IP.
const crypto = require("node:crypto");
const primarySite = require("../primarySite"); // R9-4 : la ligne dédiée du site principal n'est pas un site ordinaire
const db = require("../../config/database");

const FORMAT = "kolakisa-site@1";
const MAX_PER_TYPE = 5000;
// Types : portée (site = lié à un site ou au site principal ; org = contenu de l'organisation), droit de lecture requis
const TYPES = {
  site: { label: "Réglages du site", scope: "site", read: "forms.read", write: "forms.write", needsSite: true },
  settings: { label: "Paramètres du site", scope: "site", read: "settings.read", write: "settings.write", mainOk: true },
  pages: { label: "Pages", scope: "site", read: "forms.read", write: "forms.write" },
  menus: { label: "Menus de navigation", scope: "site", read: "navigation.read", write: "navigation.write" },
  redirects: { label: "Redirections", scope: "site", read: "redirects.view", write: "redirects.create" },
  taxonomies: { label: "Catégories et étiquettes", scope: "org", read: "taxonomies.read", write: "taxonomies.write" },
  articles: { label: "Articles", scope: "org", read: "articles.read", write: "articles.write" },
  media: { label: "Médias (métadonnées)", scope: "org", read: "media.read", write: "media.write" },
  seo: { label: "Référencement (SEO)", scope: "org", read: "seo.view", write: "seo.edit", mainOnly: true }, // table non rattachée à un site : exportée seulement pour le site principal
  comments: { label: "Commentaires", scope: "org", read: "comments.read", write: null },
  // Contact Core (palier 15) : DONNÉES PERSONNELLES — jamais cochées d'office, droits « contacts.export » ET « voir les données sensibles », équipe de l'organisation seulement.
  // Export seulement : l'import de contacts passera plus tard par les services du Contact Core (jamais d'écriture directe dans les tables).
  contacts: { label: "Contacts (données personnelles)", scope: "org", read: "contacts.export", write: null, sensitive: true },
};
const ORDER = ["site", "settings", "taxonomies", "pages", "articles", "menus", "redirects", "media", "seo", "comments", "contacts"];

// Types qu'une personne peut exporter / importer pour CE site : droit « tools.* » + droit de la ressource + portée
function allowedTypes(ctx, { siteId = null, mode = "export", external = false } = {}) {
  const gate = mode === "export" ? "tools.export" : "tools.import";
  if (!ctx.can(gate)) return [];
  return ORDER.filter((t) => {
    const m = TYPES[t];
    if (m.needsSite && siteId === null) return false;

    if (m.mainOnly && siteId !== null) return false;
    if (mode === "import" && external && t === "comments") return Boolean(ctx.orgLevel && ctx.can("comments.moderate")); // sources externes seulement : l'import natif ne reprend jamais de commentaires
    if (mode === "import" && !m.write) return false;
    if (m.mainOk && siteId === null && !ctx.orgLevel) return false; // réglages du site principal : équipe de l'organisation seulement
    if (m.sensitive && !ctx.can("contacts.view_sensitive")) return false;
    if (m.scope === "org" && !ctx.orgLevel) return false; // un accès limité à un site ne touche jamais au contenu de l'organisation
    return ctx.can(mode === "export" ? m.read : m.write);
  });
}

// ---------- Portée de site et filtres ----------
// Contenu d'un site = contenu RATTACHÉ à ce site (mk_content_sites) ; site principal = contenu non rattaché. Jamais le contenu d'un autre site.
const ownSql = (type, idExpr, siteId) => (siteId
  ? { sql: `EXISTS (SELECT 1 FROM mk_content_sites cs WHERE cs.content_type = '${type}' AND cs.content_id = ${idExpr} AND cs.site_id = ?)`, params: [siteId] }
  : { sql: `NOT EXISTS (SELECT 1 FROM mk_content_sites cs WHERE cs.content_type = '${type}' AND cs.content_id = ${idExpr})`, params: [] });
const ARTICLE_STATUSES = { draft: "Brouillon", review: "En attente de relecture", scheduled: "Planifié", published: "Publié", archived: "Archivé" };
const PAGE_STATUSES = { draft: "Brouillon", published: "Publié", scheduled: "Planifié" };
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const validDate = (v) => { const m = DATE_RE.exec(v); if (!m) return false; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]; };
// Fuseau du site (réglage « Fuseau horaire »), sinon Europe/Paris
function timezoneOf(ctx, siteId) {
  try {
    if (siteId) { const site = require("../../marketing/pages").getSite(ctx, siteId); const tz = site && site.settings && site.settings.general && site.settings.general.timezone; if (tz) return tz; }
    else { const tz = require("../settings").main().timezone; if (tz) return tz; }
  } catch { /* réglage indisponible */ }
  return "Europe/Paris";
}
// Instant UTC (« AAAA-MM-JJ hh:mm:ss ») du début du jour local `ymd` dans le fuseau `tz`
function localDayStartUtc(ymd, tz) {
  const [y, m, d] = ymd.split("-").map(Number);
  const offset = (t) => { const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(t)).map((x) => [x.type, x.value])); return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - t; };
  const base = Date.UTC(y, m - 1, d); // « minuit local » lu comme s'il était en UTC
  const guess = base - offset(base);
  const fixed = base - offset(guess); // deuxième passe : exact aussi au passage heure d'été / heure d'hiver
  return new Date(fixed).toISOString().slice(0, 19).replace("T", " ");
}
// Valide les filtres bruts (jamais d'identifiant pris sur parole : catégorie et auteur sont relus dans le site) ; { ok, filters, errors }
function normalizeFilters(ctx, siteId, scope, raw = {}) {
  const errors = [];
  const f = {};
  const only = scope === "articles" || scope === "pages";
  if (!only) return { ok: true, filters: {}, errors };
  const statuses = scope === "articles" ? ARTICLE_STATUSES : PAGE_STATUSES;
  const status = String(raw.status || "").trim();
  if (status) { if (Object.hasOwn(statuses, status)) f.status = status; else errors.push("Statut inconnu."); }
  const author = String(raw.author || "").trim();
  if (author) {
    if (!/^\d{1,9}$/.test(author) || !filterOptions(ctx, siteId, scope).authors.some((a) => a.id === Number(author))) errors.push("Auteur introuvable pour ce site.");
    else f.author = Number(author);
  }
  if (scope === "articles") {
    const cat = String(raw.category || "").trim();
    if (cat) {
      const t = /^\d{1,9}$/.test(cat) ? db.prepare("SELECT id, taxonomy FROM taxonomy_terms WHERE id = ?").get(Number(cat)) : null;
      const owner = t ? (db.prepare("SELECT site_id FROM mk_content_sites WHERE content_type = 'term' AND content_id = ?").get(t.id) || { site_id: null }).site_id : null;
      if (!t || t.taxonomy !== "category" || (owner ?? null) !== (siteId ?? null)) errors.push("Catégorie introuvable pour ce site.");
      else f.categoryIds = require("../taxonomy").subtreeIds(t.id); // la catégorie ET ses sous-catégories
    }
  }
  const from = String(raw.from || "").trim(), to = String(raw.to || "").trim();
  if (from && !validDate(from)) errors.push("Date de début invalide (AAAA-MM-JJ).");
  if (to && !validDate(to)) errors.push("Date de fin invalide (AAAA-MM-JJ).");
  if (!errors.length && from && to && from > to) errors.push("La date de début doit précéder la date de fin.");
  if (!errors.length) {
    const tz = timezoneOf(ctx, siteId);
    if (from) f.fromUtc = localDayStartUtc(from, tz);
    if (to) { const d = new Date(Date.UTC(...to.split("-").map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))))); d.setUTCDate(d.getUTCDate() + 1); f.toUtc = localDayStartUtc(d.toISOString().slice(0, 10), tz); }
    if (from) f.from = from;
    if (to) f.to = to;
  }
  return { ok: !errors.length, filters: f, errors };
}
function articlesWhere(siteId, f = {}) {
  const own = ownSql("post", "p.id", siteId);
  const w = ["p.deleted_at IS NULL", own.sql], a = [...own.params];
  if (f.status) { w.push("p.status = ?"); a.push(f.status); }
  if (f.author) { w.push("p.author_id = ?"); a.push(f.author); }
  if (f.categoryIds && f.categoryIds.length) { w.push(`EXISTS (SELECT 1 FROM taxonomy_relations r WHERE r.content_type = 'post' AND r.content_id = p.id AND r.term_id IN (${f.categoryIds.map(() => "?").join(",")}))`); a.push(...f.categoryIds); }
  if (f.fromUtc) { w.push("COALESCE(p.published_at, p.created_at) >= ?"); a.push(f.fromUtc); }
  if (f.toUtc) { w.push("COALESCE(p.published_at, p.created_at) < ?"); a.push(f.toUtc); }
  return { sql: w.join(" AND "), args: a };
}
function pagesWhere(ctx, siteId, f = {}) {
  const w = ["p.organization_id = ?", "p.site_id IS ?", "p.archived_at IS NULL"], a = [ctx.organizationId, siteId];
  if (f.status) { w.push("p.status = ?"); a.push(f.status); }
  if (f.author) { w.push("p.created_by = ?"); a.push(f.author); }
  if (f.fromUtc) { w.push("COALESCE(p.published_at, p.created_at) >= ?"); a.push(f.fromUtc); }
  if (f.toUtc) { w.push("COALESCE(p.published_at, p.created_at) < ?"); a.push(f.toUtc); }
  return { sql: w.join(" AND "), args: a };
}
// Choix proposés par l'écran, alimentés par les données RÉELLES du site
function filterOptions(ctx, siteId, scope = "articles") {
  const taxonomy = require("../taxonomy");
  const sc = ownSql("term", "t.id", siteId);
  const categories = taxonomy.tree("category", sc).map((t) => ({ id: t.id, name: t.name, depth: t.depth }));
  let authors;
  if (scope === "pages") { const w = pagesWhere(ctx, siteId); authors = db.prepare(`SELECT DISTINCT u.id, u.username name FROM mk_landing_pages p JOIN users u ON u.id = p.created_by WHERE ${w.sql} ORDER BY u.username COLLATE NOCASE`).all(...w.args); }
  else { const w = articlesWhere(siteId); authors = db.prepare(`SELECT DISTINCT u.id, u.username name FROM posts p JOIN users u ON u.id = p.author_id WHERE ${w.sql} ORDER BY u.username COLLATE NOCASE`).all(...w.args); }
  return { categories, authors, statuses: Object.entries(scope === "pages" ? PAGE_STATUSES : ARTICLE_STATUSES).map(([key, label]) => ({ key, label })), timezone: timezoneOf(ctx, siteId) };
}
const authorNames = (ids) => { const m = new Map(); for (const id of ids) { const u = id ? db.prepare("SELECT username FROM users WHERE id = ?").get(id) : null; if (u) m.set(id, u.username); } return m; };

const refOf = (prefix, id) => `${prefix}${id}`;
const iso = (v) => (v ? `${String(v).replace(" ", "T")}Z` : null);
const j = (text, fallback) => { try { return text ? JSON.parse(text) : fallback; } catch { return fallback; } };

// Lit toutes les lignes d'une requête par lots (pas de chargement massif d'un coup) ; `each` est appelé par ligne
async function paged(api, sql, args, each, size = 100) {
  for (let offset = 0; ; offset += size) {
    const rows = db.prepare(`${sql} LIMIT ? OFFSET ?`).all(...args, size, offset);
    for (const r of rows) each(r);
    await api.yieldTurn();
    if (api.cancelled()) return false;
    if (rows.length < size) return true;
  }
}

function count(ctx, type, siteId, filters = {}) {
  const org = ctx.organizationId;
  switch (type) {
    case "site": return siteId === null ? 0 : 1;
    case "settings": return 1;
    case "pages": { const w = pagesWhere(ctx, siteId, filters); return db.prepare(`SELECT COUNT(*) n FROM mk_landing_pages p WHERE ${w.sql}`).get(...w.args).n; }
    case "menus": return db.prepare("SELECT COUNT(*) n FROM nav_menus WHERE site_id IS ?").get(siteId).n;
    case "redirects": return db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE site_id IS ?").get(siteId).n;
    case "taxonomies": { const o = ownSql("term", "t.id", siteId); return db.prepare(`SELECT COUNT(*) n FROM taxonomy_terms t WHERE ${o.sql}`).get(...o.params).n; }
    case "articles": { const w = articlesWhere(siteId, filters); return db.prepare(`SELECT COUNT(*) n FROM posts p WHERE ${w.sql}`).get(...w.args).n; }
    case "media": return db.prepare("SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND site_id IS ?").get(org, siteId).n;
    case "seo": return siteId === null ? db.prepare("SELECT COUNT(*) n FROM seo_meta").get().n : 0;
    case "comments": { const o = ownSql("post", "COALESCE(c.content_id, c.post_id)", siteId); return db.prepare(`SELECT COUNT(*) n FROM blog_comments c WHERE c.status = 'approved' AND ${o.sql}`).get(...o.params).n; }
    case "contacts": return db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE organization_id = ? AND record_status IN ('active', 'inactive')").get(org).n;
    default: return 0;
  }
}

const EXPORTERS = {
  async site(ctx, api, siteId) {
    const pages = require("../../marketing/pages");
    const site = pages.getSite(ctx, siteId);
    if (!site) throw new Error("Site introuvable.");
    const s = site.settings || {};
    api.advance({ done: 1 });
    // Réglages non sensibles : pas d'adresse publique (propre au domaine d'origine, réattribuée par l'administrateur du site de destination)
    const { seo = {}, ...rest } = s;
    return { ref: refOf("s", site.id), name: site.name, tokens: site.tokens, settings: { ...rest, seo: { title: seo.title || "", ogImage: seo.ogImage || "", follow: seo.follow !== false } }, homePageRef: site.home_page_id ? refOf("p", site.home_page_id) : null };
  },

  // Valeurs des réglages du périmètre (aucun secret : le moteur de réglages n'en contient pas) ; l'import ne rejoue jamais les réglages sensibles
  async settings(ctx, api, siteId) {
    const engine = require("../settings");
    const scope = { siteId };
    const values = engine.readAll(scope, ctx);
    api.advance({ done: 1 });
    return { scope: siteId ? "site" : "main", values: Object.fromEntries(engine.defsFor(scope).map((d) => [d.key, { value: values[d.key].value, type: d.type, sensitive: Boolean(d.sensitive) }])) };
  },

  async pages(ctx, api, siteId, filters = {}) {
    const pages = require("../../marketing/pages");
    const home = siteId === null ? null : (db.prepare(`SELECT home_page_id h FROM mk_sites WHERE id = ?${primarySite.excludeSql(db)}`).get(siteId) || {}).h;
    const out = [];
    const w = pagesWhere(ctx, siteId, filters);
    const ok = await paged(api, `SELECT p.id, p.name, p.slug, p.kind, p.status, p.indexable, p.tags, p.parent_id, p.created_by, p.created_at, p.updated_at, p.published_at FROM mk_landing_pages p WHERE ${w.sql} ORDER BY p.id`, w.args, (r) => {
      const exp = pages.exportPage(ctx, r.id);
      out.push({ ref: refOf("p", r.id), name: r.name, slug: r.slug, kind: r.kind, status: r.status, indexable: Boolean(r.indexable), tags: j(r.tags, []), isHome: home === r.id, parentRef: r.parent_id ? refOf("p", r.parent_id) : null,
        authorName: (authorNames([r.created_by]).get(r.created_by)) || null, createdAt: iso(r.published_at || r.created_at), updatedAt: iso(r.updated_at), content: exp.content });
      api.advance({ done: 1 });
    }, 25);
    return ok ? out : null;
  },

  // Catégories et étiquettes DU SITE ; avec « termIds » (export d'articles seuls) : seulement celles que les articles exportés utilisent (et leurs parents)
  async taxonomies(ctx, api, siteId, filters = {}, extra = {}) {
    const out = [];
    const o = ownSql("term", "t.id", siteId);
    const only = extra.termIds ? ` AND t.id IN (${[...extra.termIds].map(() => "?").join(",") || "NULL"})` : "";
    const ok = await paged(api, `SELECT t.id, t.taxonomy, t.name, t.slug, t.description, t.parent_id FROM taxonomy_terms t WHERE ${o.sql}${only} ORDER BY t.taxonomy, COALESCE(t.parent_id, 0), t.id`, [...o.params, ...(extra.termIds ? [...extra.termIds] : [])], (r) => {
      out.push({ ref: refOf("t", r.id), taxonomy: r.taxonomy, name: r.name, slug: r.slug, description: r.description || "", parentRef: r.parent_id ? refOf("t", r.parent_id) : null });
      api.advance({ done: 1 });
    }, 200);
    return ok ? out : null;
  },

  async articles(ctx, api, siteId, filters = {}) {
    const taxonomy = require("../taxonomy");
    const out = [];
    const COLS = ["excerpt", "content", "content_format", "cover_path", "cover_alt", "seo_title", "seo_description", "focus_keyword", "secondary_keywords", "canonical_url", "robots_index", "robots_follow", "og_title", "og_description", "og_image_path",
      "twitter_card", "twitter_title", "twitter_description", "twitter_image_path", "language", "schema_type", "reading_minutes", "toc_enabled", "toc_depth", "toc_numbering", "toc_title", "comments_enabled", "featured"];
    const w = articlesWhere(siteId, filters);
    const ok = await paged(api, `SELECT p.id, p.slug, p.title, p.status, p.published_at, p.created_at, p.updated_at, p.author_id, ${COLS.map((c) => `p.${c}`).join(", ")} FROM posts p WHERE ${w.sql} ORDER BY p.id`, w.args, (r) => {
      const t = taxonomy.termsOf("post", r.id);
      const item = { ref: refOf("a", r.id), slug: r.slug, title: r.title, status: r.status, publishedAt: iso(r.published_at), createdAt: iso(r.created_at), updatedAt: iso(r.updated_at),
        authorName: (authorNames([r.author_id]).get(r.author_id)) || null,
        categoryRefs: t.categories.map((c) => refOf("t", c.id)), primaryCategoryRef: t.primary ? refOf("t", t.primary.id) : null, tagRefs: t.tags.map((x) => refOf("t", x.id)) };
      for (const c of COLS) item[c] = r[c] ?? null;
      out.push(item);
      api.advance({ done: 1 });
    }, 50);
    return ok ? out : null;
  },

  async menus(ctx, api, siteId) {
    const out = [];
    const ok = await paged(api, "SELECT id, name, slug, description, status FROM nav_menus WHERE site_id IS ? ORDER BY id", [siteId], (m) => {
      const items = db.prepare("SELECT id, parent_id, position, type, object_id, url, label, status, new_tab, rel, icon, visibility, description FROM nav_items WHERE menu_id = ? ORDER BY COALESCE(parent_id, 0), position, id").all(m.id);
      const prefix = { page: "p", article: "a", category: "t", tag: "t" };
      out.push({ ref: refOf("m", m.id), name: m.name, slug: m.slug, description: m.description || "", status: m.status,
        items: items.map((it) => ({ ref: refOf("i", it.id), parentRef: it.parent_id ? refOf("i", it.parent_id) : null, position: it.position, type: it.type, objectRef: it.object_id && prefix[it.type] ? refOf(prefix[it.type], it.object_id) : null,
          url: it.type === "custom" ? it.url : "", label: it.label, status: it.status, newTab: Boolean(it.new_tab), rel: it.rel, icon: it.icon, visibility: it.visibility, description: it.description })),
        locations: db.prepare("SELECT location FROM nav_locations WHERE menu_id = ?").all(m.id).map((l) => l.location) });
      api.advance({ done: 1 });
    }, 50);
    return ok ? out : null;
  },

  async redirects(ctx, api, siteId) {
    const out = [];
    const ok = await paged(api, "SELECT source_path, target, status, enabled, note FROM seo_redirects WHERE site_id IS ? ORDER BY id", [siteId], (r) => {
      out.push({ source: r.source_path, target: r.target, status: r.status, enabled: Boolean(r.enabled), note: r.note || "" });
      api.advance({ done: 1 });
    }, 500);
    return ok ? out : null;
  },

  async media(ctx, api, siteId) {
    const out = [];
    const ok = await paged(api, "SELECT id, kind, path, name, mime, size, width, height, alt, title, caption, description, created_at FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND site_id IS ? ORDER BY id", [ctx.organizationId, siteId], (r) => {
      out.push({ ref: refOf("x", r.id), kind: r.kind, path: r.path, name: r.name, mime: r.mime, size: r.size, width: r.width, height: r.height, alt: r.alt, title: r.title, caption: r.caption, description: r.description, createdAt: iso(r.created_at) });
      api.advance({ done: 1 });
    }, 200);
    return ok ? out : null;
  },

  async seo(ctx, api) {
    const out = [];
    const ok = await paged(api, "SELECT entity_type, entity_key, seo_title, seo_description, canonical_url, robots_index, robots_follow, og_title, og_description, og_image_path, twitter_card, focus_keyword, secondary_keywords FROM seo_meta ORDER BY entity_type, entity_key", [], (r) => {
      out.push({ entityType: r.entity_type, entityKey: r.entity_key, seoTitle: r.seo_title, seoDescription: r.seo_description, canonicalUrl: r.canonical_url, robotsIndex: r.robots_index, robotsFollow: r.robots_follow,
        ogTitle: r.og_title, ogDescription: r.og_description, ogImagePath: r.og_image_path, twitterCard: r.twitter_card, focusKeyword: r.focus_keyword, secondaryKeywords: r.secondary_keywords });
      api.advance({ done: 1 });
    }, 500);
    return ok ? out : null;
  },

  // Contacts : identité, cycle de vie, origine, étiquettes et DERNIER état de consentement — jamais l'adresse IP, le texte de preuve, les notes ni les données d'événements
  async contacts(ctx, api) {
    const out = [];
    const ok = await paged(api, `SELECT c.id, c.email, c.first_name, c.last_name, c.phone, c.company, c.job_title, c.country, c.language, c.lifecycle_stage, c.record_status, c.source, c.source_detail, c.status, c.origin_site_id, c.created_at, c.last_activity_at,
        (SELECT group_concat(t.name, char(31)) FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE ct.contact_id = c.id) AS tags,
        (SELECT k.action FROM mk_consents k WHERE k.contact_id = c.id AND k.purpose = 'marketing' ORDER BY k.id DESC LIMIT 1) AS consent
      FROM mk_contacts c WHERE c.organization_id = ? AND c.record_status IN ('active', 'inactive') ORDER BY c.id`, [ctx.organizationId], (r) => {
      out.push({ ref: refOf("k", r.id), email: r.email, firstName: r.first_name, lastName: r.last_name, phone: r.phone, company: r.company, jobTitle: r.job_title, country: r.country, language: r.language, lifecycleStage: r.lifecycle_stage,
        recordStatus: r.record_status, source: r.source, sourceDetail: r.source_detail, subscriptionStatus: r.status, marketingConsent: r.consent || null, siteRef: r.origin_site_id ? refOf("s", r.origin_site_id) : null,
        tags: r.tags ? r.tags.split("\u001f") : [], createdAt: iso(r.created_at), lastActivityAt: iso(r.last_activity_at) });
      api.advance({ done: 1 });
    }, 200);
    return ok ? out : null;
  },

  async comments(ctx, api, siteId) {
    const out = [];
    const cols = db.prepare("PRAGMA table_info(blog_comments)").all().map((c) => c.name);
    const has = (c) => cols.includes(c);
    const o = ownSql("post", `COALESCE(c.content_id, c.post_id)`, siteId);
    const ok = await paged(api, `SELECT c.id, ${has("content_type") ? "c.content_type" : "'post' AS content_type"}, ${has("content_id") ? "c.content_id" : "c.post_id AS content_id"}, ${has("parent_id") ? "c.parent_id" : "NULL AS parent_id"}, ${has("author_name") ? "c.author_name" : "NULL AS author_name"}, c.user_id, c.body, c.created_at FROM blog_comments c WHERE ${has("status") ? "c.status = 'approved'" : "1 = 1"} AND ${o.sql} ORDER BY c.id`, o.params, (r) => {
      const name = r.author_name || (r.user_id ? (db.prepare("SELECT username FROM users WHERE id = ?").get(r.user_id) || {}).username : null) || "Anonyme";
      out.push({ ref: refOf("c", r.id), contentType: r.content_type, contentRef: refOf("a", r.content_id), parentRef: r.parent_id ? refOf("c", r.parent_id) : null, authorName: name, body: r.body, createdAt: iso(r.created_at) });
      api.advance({ done: 1 });
    }, 200);
    return ok ? out : null;
  },
};

// Filet de sécurité : le fichier produit ne doit contenir aucune valeur ressemblant à un secret
const SECRET_PATTERNS = [/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{50,}/, /sk_(live|test)_[A-Za-z0-9]{10,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /"(password|password_hash|token|api_key|secret)"\s*:\s*"[^"]{6,}"/i, /AKIA[0-9A-Z]{16}/];
const leaksSecret = (text) => SECRET_PATTERNS.some((re) => re.test(text));

const userError = (message, code) => Object.assign(new Error(message), { user: true, code });
// Termes (et leurs parents) utilisés par les articles exportés : l'export d'articles seuls emporte ses catégories et étiquettes, comme WordPress
function usedTermIds(siteId, f) {
  const taxonomy = require("../taxonomy");
  const w = articlesWhere(siteId, f);
  const ids = new Set(db.prepare(`SELECT DISTINCT r.term_id FROM taxonomy_relations r JOIN posts p ON p.id = r.content_id WHERE r.content_type = 'post' AND ${w.sql}`).all(...w.args).map((r) => r.term_id));
  for (const id of [...ids]) for (const up of taxonomy.ancestors(id)) ids.add(up.id);
  return ids;
}
const REFS = /\/uploads\/marketing\/\d{1,9}\/(?:site-\d{1,9}\/)?(?:\d{4}\/(?:0[1-9]|1[0-2])\/)?[A-Za-z0-9][A-Za-z0-9_.-]{0,150}/g;
const ARCHIVE_MAX_FILES = 2000, ARCHIVE_MAX_BYTES = 300 * 1024 * 1024;
// Fichiers médias à joindre : ceux des médias exportés et ceux que les contenus exportés citent — SEULEMENT dans le dossier de ce site (jamais ceux d'un autre site)
function mediaToInclude(ctx, siteId, resources) {
  const wanted = new Set();
  for (const m of resources.media || []) if (m.path) wanted.add(m.path);
  const scan = (text) => { for (const m of String(text || "").matchAll(REFS)) wanted.add(m[0]); };
  for (const a of resources.articles || []) { if (a.cover_path) wanted.add(a.cover_path); scan(a.content); }
  for (const pg of resources.pages || []) scan(JSON.stringify((pg.content && pg.content.sections) || []));
  const { uploadsRoot } = require("../../config/paths");
  const path = require("node:path"), fs = require("node:fs");
  const root = path.join(uploadsRoot, "marketing", String(ctx.organizationId));
  const folder = siteId ? new RegExp(`^/uploads/marketing/${ctx.organizationId}/site-${siteId}/`) : new RegExp(`^/uploads/marketing/${ctx.organizationId}/(?!site-)`);
  const files = [], missing = [], foreign = [];
  for (const url of wanted) {
    if (!folder.test(url)) { foreign.push(url); continue; } // appartient à un autre site ou à l'organisation : jamais joint
    const rel = url.slice(`/uploads/marketing/${ctx.organizationId}/`.length);
    const abs = path.join(root, rel);
    if (!abs.startsWith(root + path.sep)) { foreign.push(url); continue; }
    try { const st = fs.statSync(abs); if (st.isFile()) files.push({ url, rel, abs, size: st.size }); else missing.push(url); } catch { missing.push(url); }
  }
  return { files, missing, foreign };
}

async function build(ctx, api, { types, siteId, filters: rawFilters = {}, scope = "all", format = "json", mediaFiles = false, archiveDir = null, runId = 0 }) {
  const wxr = require("./wxr");
  const allowed = allowedTypes(ctx, { siteId, mode: "export" });
  let chosen = ORDER.filter((t) => types.includes(t) && allowed.includes(t));
  if (!["json", "wxr"].includes(format)) throw userError("Format inconnu : choisissez le format natif Kolakisa ou WXR.", "format");
  const skippedFormat = [];
  if (format === "wxr") {
    skippedFormat.push(...chosen.filter((t) => !wxr.SUPPORTED.includes(t)));
    if (skippedFormat.length && scope === "other") throw userError(`« ${TYPES[skippedFormat[0]].label} » n'existe que dans le format natif Kolakisa : choisissez ce format.`, "format");
    chosen = chosen.filter((t) => wxr.SUPPORTED.includes(t));
  }
  if (scope === "articles" && allowed.includes("taxonomies") && !chosen.includes("taxonomies")) chosen = ORDER.filter((t) => t === "taxonomies" || chosen.includes(t));
  if (!chosen.length) throw userError("Aucune ressource à exporter : sélection vide ou droits insuffisants.", "empty");
  const nf = normalizeFilters(ctx, siteId, scope, rawFilters);
  if (!nf.ok) throw userError(nf.errors.join(" "), "filters");
  const f = nf.filters;
  const termIds = scope === "articles" ? usedTermIds(siteId, f) : null;
  const sizes = Object.fromEntries(chosen.map((t) => [t, t === "taxonomies" && termIds ? termIds.size : count(ctx, t, siteId, ["articles", "pages"].includes(t) ? f : {})]));
  const matched = (scope === "articles" ? sizes.articles : scope === "pages" ? sizes.pages : Object.values(sizes).reduce((a, b) => a + b, 0)) || 0;
  if (matched === 0 && scope !== "all") throw userError("Aucun contenu ne correspond à cette sélection : modifiez les filtres.", "empty");
  api.setTotal(Object.values(sizes).reduce((a, b) => a + b, 0));
  const resources = {};
  const counts = {};
  for (const t of chosen) {
    if (sizes[t] > MAX_PER_TYPE) throw userError(`« ${TYPES[t].label} » : ${sizes[t]} éléments, au-delà de la limite de ${MAX_PER_TYPE} par export. Exportez par site ou par type, ou affinez les filtres.`, "limit");
    api.message(`Export : ${TYPES[t].label}`);
    const part = await EXPORTERS[t](ctx, api, siteId, ["articles", "pages"].includes(t) ? f : {}, t === "taxonomies" && termIds ? { termIds } : {});
    if (part === null) return { cancelled: true };
    resources[t] = part;
    counts[t] = Array.isArray(part) ? part.length : 1;
  }
  // WXR : les commentaires approuvés des articles exportés accompagnent leurs articles (comme WordPress)
  if (format === "wxr" && scope === "articles" && allowed.includes("comments") && !resources.comments && (resources.articles || []).length) {
    const ids = new Set(resources.articles.map((a) => Number(a.ref.slice(1))));
    const all = await EXPORTERS.comments(ctx, { ...api, advance() {} }, siteId);
    resources.comments = (all || []).filter((c) => ids.has(Number(String(c.contentRef).slice(1))));
    counts.comments = resources.comments.length;
  }
  const site = siteId === null ? null : db.prepare(`SELECT id, name FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(db)}`).get(siteId, ctx.organizationId);
  const siteName = site ? site.name : "Site principal";
  const info = require("../urls").siteInfo(siteId);
  let baseUrl = ""; try { baseUrl = (info && info.base) || new URL(process.env.SITE_URL).origin; } catch { baseUrl = ""; }
  const include = mediaFiles ? mediaToInclude(ctx, siteId, resources) : null;
  if (include && (include.files.length > ARCHIVE_MAX_FILES || include.files.reduce((n, x) => n + x.size, 0) > ARCHIVE_MAX_BYTES)) throw userError(`Archive trop volumineuse (plus de ${ARCHIVE_MAX_FILES} fichiers ou ${ARCHIVE_MAX_BYTES / 1048576} Mo) : exportez sans les fichiers, ou par type de contenu.`, "limit");
  const sel = { scope, filters: Object.fromEntries(Object.entries({ status: f.status, authorId: f.author, categoryIds: f.categoryIds, from: f.from, to: f.to }).filter(([, v]) => v !== undefined)), timezone: timezoneOf(ctx, siteId) };
  const mediaNote = include
    ? { policy: "files-in-archive", files: true, included: include.files.length, missing: include.missing.length, note: "Les fichiers sont dans le dossier media/ de l'archive ; ceux qui n'existent plus sur le disque sont listés dans manifest.json." }
    : { policy: "metadata-and-references", files: false, note: "Les fichiers ne sont pas inclus : seuls les chemins et les métadonnées sont exportés." };
  let text;
  if (format === "wxr") {
    text = wxr.serialize({ resources, site: { name: siteName, url: baseUrl, timezone: timezoneOf(ctx, siteId), language: "fr-FR" } });
  } else {
    const body = { format: FORMAT, exportedAt: new Date().toISOString(), generator: "KOLAKISA CMS", source: { siteId, siteName }, selection: chosen, counts, export: sel, media: mediaNote, resources };
    const sha256 = crypto.createHash("sha256").update(JSON.stringify(resources)).digest("hex");
    text = JSON.stringify({ ...body, integrity: { sha256, resourcesBytes: Buffer.byteLength(JSON.stringify(resources)) } }, null, 1);
  }
  if (leaksSecret(text)) throw new Error("Export interrompu : une valeur ressemblant à un secret a été détectée. Rien n'a été produit.");
  const out = { text, counts, format, mime: format === "wxr" ? "application/xml" : "application/json", ext: format === "wxr" ? "xml" : "json", skippedFormat, matched };
  if (include) {
    if (!archiveDir) throw new Error("Dossier d'archive manquant.");
    const { ZipWriter, readZip } = require("./zip");
    const path = require("node:path"), fs = require("node:fs");
    fs.mkdirSync(archiveDir, { recursive: true, mode: 0o700 });
    const file = path.join(archiveDir, `export-${runId}-${crypto.randomBytes(8).toString("hex")}.zip`);
    const zip = new ZipWriter(file);
    try {
      zip.add(`export.${out.ext}`, Buffer.from(text, "utf8"));
      const manifest = { format: "kolakisa-export-archive@1", exportedAt: new Date().toISOString(), source: { siteName }, contentFormat: format === "wxr" ? "WXR 1.2" : FORMAT, counts, selection: sel,
        files: { included: include.files.map((x) => `media/${x.rel}`), missing: include.missing, excludedForeign: include.foreign.length }, note: "Archive de contenu : ce n'est pas une sauvegarde du serveur. Aucun secret ni fichier de configuration." };
      let n = 0;
      for (const x of include.files) { zip.add(`media/${x.rel}`, fs.readFileSync(x.abs), { compress: !/\.(jpe?g|png|webp|avif|gif|mp4|webm|mp3|m4a|ogg|pdf|docx?|xlsx?|pptx?)$/i.test(x.rel) }); if (++n % 20 === 0) { api.message(`Export : fichiers médias (${n}/${include.files.length})`); await api.yieldTurn(); if (api.cancelled()) { zip.abort(); return { cancelled: true }; } } }
      zip.add("manifest.json", Buffer.from(JSON.stringify(manifest, null, 1), "utf8"));
      const bytes = zip.close();
      // Vérification de ce qui vient d'être écrit : relue et contrôlée entrée par entrée (somme de contrôle) avant d'annoncer quoi que ce soit
      const entries = readZip(fs.readFileSync(file));
      if (!entries.some((e) => e.name === `export.${out.ext}`) || entries.length !== include.files.length + 2) throw new Error("Archive incomplète : elle n'a pas été conservée.");
      out.archive = { file, bytes, name: `export.${out.ext}`, entries: entries.length, includedFiles: include.files.length, missingFiles: include.missing.length };
    } catch (e) { zip.abort(); throw e; }
  }
  return out;
}

module.exports = { FORMAT, TYPES, ORDER, MAX_PER_TYPE, ARTICLE_STATUSES, PAGE_STATUSES, allowedTypes, count, build, leaksSecret, refOf, normalizeFilters, filterOptions, timezoneOf, mediaToInclude, usedTermIds };
