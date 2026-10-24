// Export du contenu d'un site (palier 13) : format JSON structuré « kolakisa-site@1 », réimportable.
// Principes : un seul format (pas de HTML brut), des RÉFÉRENCES stables entre ressources (p12, a5, t3…) que l'import remappe sur de
// nouveaux identifiants, les fichiers médias ne sont PAS exportés (métadonnées et chemins seulement), et jamais de secret :
// ni utilisateurs, ni e-mails, ni mots de passe, ni jetons, ni clés. Toutes les lectures passent par les services du CMS.
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
  seo: { label: "Référencement (SEO)", scope: "org", read: "seo.view", write: "seo.edit" },
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
    if (mode === "import" && external && t === "comments") return Boolean(ctx.orgLevel && ctx.can("comments.moderate")); // sources externes seulement : l'import natif ne reprend jamais de commentaires
    if (mode === "import" && !m.write) return false;
    if (m.mainOk && siteId === null && !ctx.orgLevel) return false; // réglages du site principal : équipe de l'organisation seulement
    if (m.sensitive && !ctx.can("contacts.view_sensitive")) return false;
    if (m.scope === "org" && !ctx.orgLevel) return false; // un accès limité à un site ne touche jamais au contenu de l'organisation
    return ctx.can(mode === "export" ? m.read : m.write);
  });
}

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

function count(ctx, type, siteId) {
  const org = ctx.organizationId;
  switch (type) {
    case "site": return siteId === null ? 0 : 1;
    case "settings": return 1;
    case "pages": return db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE organization_id = ? AND site_id IS ? AND archived_at IS NULL").get(org, siteId).n;
    case "menus": return db.prepare("SELECT COUNT(*) n FROM nav_menus WHERE site_id IS ?").get(siteId).n;
    case "redirects": return db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE site_id IS ?").get(siteId).n;
    case "taxonomies": return db.prepare("SELECT COUNT(*) n FROM taxonomy_terms").get().n;
    case "articles": return db.prepare("SELECT COUNT(*) n FROM posts WHERE deleted_at IS NULL").get().n;
    case "media": return db.prepare("SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL").get(org).n;
    case "seo": return db.prepare("SELECT COUNT(*) n FROM seo_meta").get().n;
    case "comments": return db.prepare("SELECT COUNT(*) n FROM blog_comments WHERE status = 'approved'").get().n;
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

  async pages(ctx, api, siteId) {
    const pages = require("../../marketing/pages");
    const home = siteId === null ? null : (db.prepare(`SELECT home_page_id h FROM mk_sites WHERE id = ?${primarySite.excludeSql(db)}`).get(siteId) || {}).h;
    const out = [];
    const ok = await paged(api, "SELECT id, name, slug, kind, status, indexable, tags, parent_id FROM mk_landing_pages WHERE organization_id = ? AND site_id IS ? AND archived_at IS NULL ORDER BY id", [ctx.organizationId, siteId], (r) => {
      const exp = pages.exportPage(ctx, r.id);
      out.push({ ref: refOf("p", r.id), name: r.name, slug: r.slug, kind: r.kind, status: r.status, indexable: Boolean(r.indexable), tags: j(r.tags, []), isHome: home === r.id, parentRef: r.parent_id ? refOf("p", r.parent_id) : null, content: exp.content });
      api.advance({ done: 1 });
    }, 25);
    return ok ? out : null;
  },

  async taxonomies(ctx, api) {
    const out = [];
    const ok = await paged(api, "SELECT id, taxonomy, name, slug, description, parent_id FROM taxonomy_terms ORDER BY taxonomy, COALESCE(parent_id, 0), id", [], (r) => {
      out.push({ ref: refOf("t", r.id), taxonomy: r.taxonomy, name: r.name, slug: r.slug, description: r.description || "", parentRef: r.parent_id ? refOf("t", r.parent_id) : null });
      api.advance({ done: 1 });
    }, 200);
    return ok ? out : null;
  },

  async articles(ctx, api) {
    const taxonomy = require("../taxonomy");
    const out = [];
    const COLS = ["excerpt", "content", "content_format", "cover_path", "cover_alt", "seo_title", "seo_description", "focus_keyword", "secondary_keywords", "canonical_url", "robots_index", "robots_follow", "og_title", "og_description", "og_image_path",
      "twitter_card", "twitter_title", "twitter_description", "twitter_image_path", "language", "schema_type", "reading_minutes", "toc_enabled", "toc_depth", "toc_numbering", "toc_title", "comments_enabled", "featured"];
    const ok = await paged(api, `SELECT id, slug, title, status, published_at, created_at, updated_at, ${COLS.join(", ")} FROM posts WHERE deleted_at IS NULL ORDER BY id`, [], (r) => {
      const t = taxonomy.termsOf("post", r.id);
      const item = { ref: refOf("a", r.id), slug: r.slug, title: r.title, status: r.status, publishedAt: iso(r.published_at), createdAt: iso(r.created_at), updatedAt: iso(r.updated_at),
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

  async media(ctx, api) {
    const out = [];
    const ok = await paged(api, "SELECT id, kind, path, name, mime, size, width, height, alt, title, caption, description FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL ORDER BY id", [ctx.organizationId], (r) => {
      out.push({ ref: refOf("x", r.id), kind: r.kind, path: r.path, name: r.name, mime: r.mime, size: r.size, width: r.width, height: r.height, alt: r.alt, title: r.title, caption: r.caption, description: r.description });
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

  // Commentaires : texte et nom d'affichage seulement (jamais e-mail ni empreinte d'adresse IP)
  async comments(ctx, api) {
    const out = [];
    const cols = db.prepare("PRAGMA table_info(blog_comments)").all().map((c) => c.name);
    const has = (c) => cols.includes(c);
    const ok = await paged(api, `SELECT id, ${has("content_type") ? "content_type" : "'post' AS content_type"}, ${has("content_id") ? "content_id" : "post_id AS content_id"}, ${has("parent_id") ? "parent_id" : "NULL AS parent_id"}, ${has("author_name") ? "author_name" : "NULL AS author_name"}, user_id, body, created_at FROM blog_comments WHERE ${has("status") ? "status = 'approved'" : "1 = 1"} ORDER BY id`, [], (r) => {
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

async function build(ctx, api, { types, siteId }) {
  const allowed = allowedTypes(ctx, { siteId, mode: "export" });
  const chosen = ORDER.filter((t) => types.includes(t) && allowed.includes(t));
  if (!chosen.length) throw new Error("Aucune ressource à exporter : sélection vide ou droits insuffisants.");
  const sizes = Object.fromEntries(chosen.map((t) => [t, count(ctx, t, siteId)]));
  api.setTotal(Object.values(sizes).reduce((a, b) => a + b, 0));
  const resources = {};
  const counts = {};
  for (const t of chosen) {
    if (sizes[t] > MAX_PER_TYPE) throw new Error(`« ${TYPES[t].label} » : ${sizes[t]} éléments, au-delà de la limite de ${MAX_PER_TYPE} par export. Exportez par site ou par type.`);
    api.message(`Export : ${TYPES[t].label}`);
    const part = await EXPORTERS[t](ctx, api, siteId);
    if (part === null) return { cancelled: true };
    resources[t] = part;
    counts[t] = Array.isArray(part) ? part.length : 1;
  }
  const site = siteId === null ? null : db.prepare(`SELECT id, name FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(db)}`).get(siteId, ctx.organizationId);
  const body = { format: FORMAT, exportedAt: new Date().toISOString(), generator: "KOLAKISA CMS", source: { siteId, siteName: site ? site.name : "Site principal" }, selection: chosen, counts,
    media: { policy: "metadata-and-references", files: false, note: "Les fichiers ne sont pas inclus : seuls les chemins et les métadonnées sont exportés." }, resources };
  const text = JSON.stringify(body);
  if (leaksSecret(text)) throw new Error("Export interrompu : une valeur ressemblant à un secret a été détectée. Rien n'a été produit.");
  const sha256 = crypto.createHash("sha256").update(JSON.stringify(resources)).digest("hex");
  return { text: JSON.stringify({ ...body, integrity: { sha256, resourcesBytes: Buffer.byteLength(JSON.stringify(resources)) } }, null, 1), counts };
}

module.exports = { FORMAT, TYPES, ORDER, MAX_PER_TYPE, allowedTypes, count, build, leaksSecret, refOf };
