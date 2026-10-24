// KOLAKISA — moteur d'URLs publiques (palier 12). UNE source pour savoir :
//   adresse (hôte) → site → ressource (type, identifiant) → état (en ligne, corbeille, déplacée, inexistante) → adresse courante.
// Il ne remplace aucun routeur : les routes existantes (/p/<adresse>, /blog/<adresse>, /cours/<adresse>, taxonomies) restent exactement
// les mêmes. Il fournit : la résolution d'une adresse (resolve), l'adresse publique d'une ressource (publicPath / publicUrl), le moteur
// de slugs (normalisation, adresses réservées, unicité), l'historique des anciennes adresses (pages, taxonomies ; les articles et
// formations gardent leurs tables existantes, lues ici) et la correspondance hôte → site (domaines des sites).
//
// Domaines des sites : l'adresse publique d'un site (Réglages du site → Référencement) est son domaine. Une requête dont l'hôte est
// un de ces domaines est servie « en tant que ce site » (accueil = page d'accueil du site, /<adresse> = page du site). Un hôte
// inconnu n'est JAMAIS un site : le client ne peut pas fabriquer un site en envoyant un en-tête Host.
const db = require("../config/database");
const { slugify } = require("../utils/format");

db.exec(`
  -- Anciennes adresses (slugs) d'une ressource dont l'adresse a changé : l'ancienne adresse redirige (301) vers l'adresse COURANTE de la ressource
  -- (calculée à chaque demande : jamais de chaîne A → B → C). Types : page, ou la clé d'une taxonomie (category, tag…).
  CREATE TABLE IF NOT EXISTS cms_url_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_type TEXT NOT NULL,
    resource_id INTEGER NOT NULL,
    site_id INTEGER,
    old_slug TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT 'slug',
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (resource_type, old_slug)
  );
  CREATE INDEX IF NOT EXISTS idx_cms_url_history_resource ON cms_url_history(resource_type, resource_id);
`);

// ---------- Moteur de slugs ----------
// Adresses réservées : routes techniques et espaces du site. Une page d'un site à domaine propre est servie à la racine (/<adresse>) :
// elle ne doit donc jamais reprendre le nom d'une route existante.
const RESERVED = new Set(["p", "blog", "cours", "categorie", "catalogue", "formateur", "marketing", "connexion", "inscription", "deconnexion", "api", "uploads", "css", "js", "img", "fonts", "webhooks", "stripe",
  "t", "u", "preferences", "sante", "sitemap", "robots", "favicon", "panier", "commande", "mes-cours", "apprendre", "certificat", "favoris", "profil", "compte", "gestion", "support", "notifications",
  "a-propos", "faq", "contact", "cookies", "mot-de-passe-oublie", "reinitialiser", "invitation", "admin", "static", "assets", "public", "mon-espace", "recherche", "search", "feed", "rss"]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isReserved = (slug) => RESERVED.has(String(slug || "").toLowerCase()) || /^sitemap.*/.test(String(slug || "")) || /^robots/.test(String(slug || ""));

// « Formation Photoshop Avancée » → « formation-photoshop-avancee » ; jamais vide (repli fourni)
function normalizeSlug(text, { max = 60, fallback = "page" } = {}) {
  const s = slugify(String(text ?? "")).slice(0, max).replace(/-+$/, "");
  return s || fallback;
}
// Contrôle d'une adresse saisie : renvoie { ok, slug, error }
function checkSlug(input, { reservedCheck = false } = {}) {
  const raw = String(input ?? "").trim();
  if (!raw) return { ok: false, error: "L'adresse est vide." };
  const slug = raw.toLowerCase();
  if (!SLUG.test(slug)) return { ok: false, error: "Adresse invalide : lettres minuscules sans accent, chiffres et tirets (ex. « guide-gratuit »)." };
  if (reservedCheck && isReserved(slug)) return { ok: false, error: `« ${slug} » est réservée à une route du site : choisissez une autre adresse.` };
  return { ok: true, slug };
}
// Adresse libre dans un espace de noms : « base », « base-2 », « base-3 »… (les adresses de l'historique ne sont pas réattribuées d'office)
function uniqueSlug(type, base, { exceptId = null, reservedCheck = false } = {}) {
  let slug = base;
  for (let n = 2; isTaken(type, slug, exceptId) || (reservedCheck && isReserved(slug)); n++) slug = `${base.slice(0, 55)}-${n}`;
  return slug;
}
function isTaken(type, slug, exceptId = null) {
  if (type === "page") return Boolean(db.prepare("SELECT 1 FROM mk_landing_pages WHERE slug = ? AND id IS NOT ?").get(slug, exceptId) || db.prepare("SELECT 1 FROM cms_url_history WHERE resource_type = 'page' AND old_slug = ? AND resource_id IS NOT ?").get(slug, exceptId));
  return Boolean(db.prepare("SELECT 1 FROM taxonomy_terms WHERE taxonomy = ? AND slug = ? AND id IS NOT ?").get(type, slug, exceptId) || db.prepare("SELECT 1 FROM cms_url_history WHERE resource_type = ? AND old_slug = ? AND resource_id IS NOT ?").get(type, slug, exceptId));
}

// ---------- Domaines des sites ----------
let sitesCache = null;
let sitesAt = 0;
const TTL = 5000; // secondes : un changement d'adresse publique est aussi invalidé tout de suite (invalidateSites)
function loadSites() {
  if (sitesCache && Date.now() - sitesAt < TTL) return sitesCache;
  const byHost = new Map();
  const byId = new Map();
  const retired = new Set(); // domaines d'un site archivé ou supprimé (et repris par aucun site actif)
  try {
    for (const s of db.prepare("SELECT id, organization_id, name, status, home_page_id, settings, deleted_at FROM mk_sites").all()) {
      let conf = {};
      try { conf = JSON.parse(s.settings || "{}"); } catch { conf = {}; }
      let base = "";
      let host = "";
      const url = conf.seo && conf.seo.publicUrl;
      if (url) { try { const u = new URL(url); if (u.protocol === "https:") { base = u.origin; host = u.hostname.toLowerCase(); } } catch { /* adresse invalide : ignorée */ } }
      const rd = conf.reading || {};
      const front = rd.showOnFront === "posts" ? "posts" : "page";
      const info = { id: s.id, name: s.name, active: s.status === "active" && !s.deleted_at, homePageId: front === "posts" ? null : s.home_page_id, front, postsPage: Number.isInteger(rd.postsPage) ? rd.postsPage : null, postsPerPage: Number.isInteger(rd.postsPerPage) && rd.postsPerPage >= 1 && rd.postsPerPage <= 50 ? rd.postsPerPage : 10, feedItems: Number.isInteger(rd.feedItems) && rd.feedItems >= 1 && rd.feedItems <= 50 ? rd.feedItems : 20, feedContent: rd.feedContent === "full" ? "full" : "excerpt", base, host, noindex: Boolean(conf.extras && conf.extras.noindex) };
      byId.set(s.id, info);
      if (host && info.active && !byHost.has(host)) byHost.set(host, info);
      else if (host && !info.active) retired.add(host);
    }
    for (const h of byHost.keys()) retired.delete(h); // un domaine repris par un site actif n'est plus « retiré »
  } catch (error) { if (!/no such (table|column)/i.test(error.message)) throw error; }
  sitesCache = { byHost, byId, retired };
  sitesAt = Date.now();
  return sitesCache;
}
const invalidateSites = () => { sitesCache = null; };
const cacheInfo = () => ({ entries: sitesCache ? sitesCache.byId.size : 0, loaded: sitesCache !== null });
// Nom d'hôte normalisé : minuscules, sans port, sans point final, internationalisé (IDN) en ASCII — pour comparer deux hôtes sans confusion possible
const normHost = (h) => {
  const raw = String(h || "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.+$/, "");
  if (!raw || raw.startsWith("[")) return raw; // adresse IPv6 : telle quelle
  try { return require("url").domainToASCII(raw) || raw; } catch { return raw; }
};
// Site dont l'adresse publique a cet hôte (null si aucun : l'hôte n'est alors pas un site)
// Domaine d'un site archivé ou supprimé : il ne doit servir AUCUN contenu (surtout pas celui du site principal)
const isRetiredHost = (host) => loadSites().retired.has(normHost(host));
const siteForHost = (host) => loadSites().byHost.get(normHost(host)) || null;
const siteInfo = (id) => (id ? loadSites().byId.get(Number(id)) || null : null);
// Hôte du site principal (SITE_URL) : jamais un domaine de site
function mainHost() { try { return new URL(process.env.SITE_URL).hostname.toLowerCase(); } catch { return ""; } }

// ---------- Adresses publiques ----------
const taxonomy = () => require("./taxonomy");
// Page : « /p/<adresse> » ; page d'un site à domaine propre : racine (« / » pour son accueil, « /<adresse> » sinon)
function pagePath(page, { hostSite = undefined } = {}) {
  // Page d'accueil du site principal (Paramètres → Lecture) : son adresse est « / »
  if (page && page.id && (page.site_id === null || page.site_id === undefined) && (page.status === undefined || page.status === "published") && !page.archived_at) { try { if (require("./settings").main().homeId === page.id) return "/"; } catch { /* réglages indisponibles */ } }
  const site = siteInfo(page.site_id);
  const own = site && site.base ? site : null;
  // hostSite : site de la requête (domaine propre). Une page n'est servie à la racine que sur le domaine de SON site.
  if (own && (hostSite === undefined || (hostSite && hostSite.id === own.id))) return own.homePageId === page.id ? "/" : `/${page.slug}`;
  return `/p/${page.slug}`;
}
// Adresse « de référence » d'une page (celle des liens, du plan du site et du canonical) : racine du domaine du site s'il en a un
const pageCanonicalPath = (page) => pagePath(page, { hostSite: undefined });
// Base absolue d'une page : domaine du site s'il en a un
function baseOfPage(page) { const s = siteInfo(page.site_id); return s && s.base ? s.base : ""; }

function publicPath(type, row, opts = {}) {
  switch (type) {
    case "page": return pagePath(row, opts);
    case "post": return require("./permalinks").postPath(row); // structure des permaliens du site qui sert l'article (adresse logique du site seulement sur son domaine)
    case "course": return `/cours/${row.slug}`;
    default: return taxonomy().TAXONOMIES[type] ? `${taxonomy().baseOf(type, row)}/${row.slug}` : null;
  }
}
// Adresse absolue : base du site (domaine propre) sinon celle de la requête / SITE_URL
function publicUrl(req, type, row, opts = {}) {
  const { siteBase } = require("../utils/seo");
  const path = publicPath(type, row, opts);
  if (path === null) return null;
  const own = type === "page" ? baseOfPage(row) : "";
  const base = own || siteBase(req);
  return `${base.replace(/\/+$/, "")}${path === "/" ? "/" : path}`;
}

// ---------- Contenus par site : « maison publique » d'un article ou d'un terme (R6 lot 4, résolution B2 par domaine) ----------
// Un contenu rattaché à un site (table mk_content_sites, lot 1) est servi sur le DOMAINE de ce site, sous l'adresse logique de ce site (`address`, sinon son adresse actuelle).
// Sur le domaine principal ne restent que les contenus historiques (sans rattachement) ET ceux d'un site SANS domaine : tant que la forme d'adresse d'un site sans domaine n'est pas
// décidée (B1 : non servi / B2 : préfixe), ils restent servis exactement comme avant — aucune adresse publique existante ne disparaît.
const TYPE_TABLE = { post: "posts", term: "taxonomy_terms" };
function attachedSite(type, id) {
  try { const r = db.prepare("SELECT site_id, address FROM mk_content_sites WHERE content_type = ? AND content_id = ?").get(type, id); return r || null; } catch { return null; }
}
// Site qui sert ce contenu sur son domaine, ou null (domaine principal)
function publicHomeOf(type, id) {
  const r = attachedSite(type, id);
  const s = r && siteInfo(r.site_id);
  return s && s.base ? s.id : null;
}
// Adresse publique d'un article/terme sur le domaine de son site : adresse logique si elle existe, sinon l'adresse actuelle
const addressOf = (type, row) => { const r = attachedSite(type, row.id); return (r && r.address) || row.slug; };
const domainSiteIds = () => [...loadSites().byId.values()].filter((s) => s.base).map((s) => s.id);
// Fragment SQL « ce contenu est servi par CE domaine » pour les listes (idExpr : colonne identifiant, ex. « posts.id ») ; null = aucune restriction
function contentScope(type, idExpr, hostSite) {
  const base = `FROM mk_content_sites cs WHERE cs.content_type = '${type}' AND cs.content_id = ${idExpr}`;
  try { db.prepare("SELECT 1 FROM mk_content_sites LIMIT 1").get(); } catch { return null; }
  if (hostSite) return { sql: `EXISTS (SELECT 1 ${base} AND cs.site_id = ?)`, params: [hostSite.id] };
  const ids = domainSiteIds();
  return ids.length ? { sql: `NOT EXISTS (SELECT 1 ${base} AND cs.site_id IN (${ids.map(() => "?").join(",")}))`, params: ids } : null;
}
// Résolution d'un article dans le contexte d'un domaine : { row } servi ici ; { redirect } adresse à suivre (301) ; null = introuvable ici (aucune fuite : un contenu d'un autre domaine est « inconnu »)
function resolvePost(slug, hostSite) {
  if (!SLUG.test(slug)) return null;
  const where = "SELECT p.* FROM posts p JOIN mk_content_sites cs ON cs.content_type = 'post' AND cs.content_id = p.id WHERE cs.site_id = ?";
  const here = (row) => (row ? { row } : null);
  if (hostSite) {
    let hit = null;
    try { hit = db.prepare(`${where} AND cs.address = ?`).get(hostSite.id, slug) || db.prepare(`${where} AND p.slug = ?`).get(hostSite.id, slug); } catch { hit = null; }
    if (hit) { const addr = addressOf("post", hit); return addr === slug ? here(hit) : { row: hit, redirect: `/blog/${addr}` }; }
    // Ancienne adresse (historique des articles) d'un article DE CE SITE
    const moved = db.prepare("SELECT p.* FROM post_slug_history h JOIN posts p ON p.id = h.post_id WHERE h.old_slug = ?").get(slug);
    if (moved && (attachedSite("post", moved.id) || {}).site_id === hostSite.id) return { row: moved, redirect: `/blog/${addressOf("post", moved)}`, moved: true };
    return null;
  }
  let row = db.prepare("SELECT * FROM posts WHERE slug = ?").get(slug);
  let moved = false;
  if (!row) { row = db.prepare("SELECT p.* FROM post_slug_history h JOIN posts p ON p.id = h.post_id WHERE h.old_slug = ?").get(slug); moved = Boolean(row); }
  if (!row) return null;
  const home = publicHomeOf("post", row.id);
  if (home) return { row, redirect: `${siteInfo(home).base}/blog/${addressOf("post", row)}`, foreign: true }; // servi par le domaine de son site : l'ancienne adresse y renvoie (301)
  return moved ? { row, redirect: `/blog/${row.slug}`, moved: true } : { row };
}
// Même résolution pour un terme (catégorie, étiquette) : adresse logique du site, sinon adresse actuelle
function resolveTerm(taxonomyKey, slug, hostSite) {
  if (!SLUG.test(slug)) return null;
  if (hostSite) {
    const where = "SELECT t.* FROM taxonomy_terms t JOIN mk_content_sites cs ON cs.content_type = 'term' AND cs.content_id = t.id WHERE t.taxonomy = ? AND cs.site_id = ?";
    try { return db.prepare(`${where} AND cs.address = ?`).get(taxonomyKey, hostSite.id, slug) || db.prepare(`${where} AND t.slug = ?`).get(taxonomyKey, hostSite.id, slug) || null; } catch { return null; }
  }
  const row = taxonomy().bySlug(taxonomyKey, slug);
  return row && !publicHomeOf("term", row.id) ? row : null;
}

// ---------- Résolution d'une adresse ----------
// resolve("/p/offre", { hostSite }) → { type, id, state, row, path, siteId } | { type: null, state: "none" }
// state : live (servie), draft (existe, pas en ligne), trashed (corbeille), foreign (appartient à un autre site que l'hôte), moved (ancienne adresse), none
function cleanPath(pathname) {
  let p = String(pathname || "");
  p = p.split("#")[0].split("?")[0];
  try { p = decodeURI(p); } catch { return null; }
  if (!p.startsWith("/") || p.startsWith("//") || /[\u0000-\u001f<>"\\]/.test(p)) return null;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
}
const pageState = (row, hostSite) => {
  if (row.archived_at) return "trashed";
  if (hostSite && row.site_id !== hostSite.id) return "foreign";
  return row.status === "published" ? "live" : "draft";
};
function pageBySlug(slug) { return SLUG.test(slug) ? db.prepare("SELECT id, slug, name, title, status, archived_at, published_at, site_id, kind FROM mk_landing_pages WHERE slug = ?").get(slug) || null : null; }

function resolve(pathname, { hostSite = null } = {}) {
  const p = cleanPath(pathname);
  if (p === null) return { type: null, state: "none", path: null };
  const none = { type: null, state: "none", path: p };
  let m;
  // Domaine d'un site : accueil et pages à la racine
  if (hostSite) {
    if (p === "/") {
      const home = hostSite.homePageId ? db.prepare("SELECT id, slug, name, title, status, archived_at, published_at, site_id, kind FROM mk_landing_pages WHERE id = ?").get(hostSite.homePageId) : null;
      if (home) return { type: "page", id: home.id, row: home, state: pageState(home, hostSite), path: "/", siteId: home.site_id };
      return { ...none, state: "none" };
    }
    if ((m = /^\/([a-z0-9][a-z0-9-]*)$/.exec(p)) && !isReserved(m[1])) {
      const row = pageBySlug(m[1]);
      if (row) return { type: "page", id: row.id, row, state: pageState(row, hostSite), path: pagePath(row, { hostSite }), siteId: row.site_id };
    }
  }
  if ((m = /^\/p\/([a-z0-9][a-z0-9-]*)$/.exec(p))) {
    const row = pageBySlug(m[1]);
    if (row) return { type: "page", id: row.id, row, state: pageState(row, hostSite), path: pagePath(row, { hostSite }), siteId: row.site_id };
  }
  // Permalien d'un article selon la structure du site (ou une ancienne structure) : même résolution que le routeur
  { const pr = require("./permalinks").rowForPath(p, hostSite);
    if (pr) { const owner = (attachedSite("post", pr.id) || {}).site_id ?? null; return { type: "post", id: pr.id, row: pr, state: pr.deleted_at ? "trashed" : pr.published ? "live" : "draft", path: require("./permalinks").postPath(pr), siteId: owner }; } }
  if ((m = /^\/blog\/([a-z0-9][a-z0-9-]*)$/.exec(p)) && !["categorie", "etiquette", "auteur"].includes(m[1])) {
    // Contenus par site (R6 lot 4) : l'article est résolu dans le contexte du domaine demandé ; celui d'un autre domaine est « foreign » (comme une page d'un autre site)
    const r = resolvePost(m[1], hostSite);
    if (r) {
      const row = r.row, dead = row.deleted_at || !row.published;
      const owner = (attachedSite("post", row.id) || {}).site_id ?? null;
      if (r.foreign) return { type: "post", id: row.id, row, state: "foreign", path: r.redirect, siteId: owner };
      if (r.moved) return { type: "post", id: row.id, state: !dead ? "moved" : "trashed", path: r.redirect, siteId: owner };
      return { type: "post", id: row.id, row, state: row.deleted_at ? "trashed" : row.published ? "live" : "draft", path: r.redirect || require("./permalinks").postPath(row), siteId: owner };
    }
  }
  if ((m = /^\/cours\/([a-z0-9][a-z0-9-]*)$/.exec(p))) {
    const row = db.prepare("SELECT id, slug, title, published, archived FROM courses WHERE slug = ?").get(m[1]);
    if (row) return { type: "course", id: row.id, row, state: row.archived ? "trashed" : row.published ? "live" : "draft", path: `/cours/${row.slug}`, siteId: null };
    const moved = db.prepare("SELECT c.id, c.slug, c.published, c.archived FROM course_slug_history h JOIN courses c ON c.id = h.course_id WHERE h.old_slug = ?").get(m[1]);
    if (moved) return { type: "course", id: moved.id, state: moved.published && !moved.archived ? "moved" : "trashed", path: `/cours/${moved.slug}`, siteId: null };
  }
  const tx = taxonomy();
  for (const key of Object.keys(tx.TAXONOMIES)) {
    const base = [tx.defaultBase(key), tx.baseOf(key)].find((b) => p.startsWith(`${b}/`)) || tx.defaultBase(key);
    if (p.startsWith(`${base}/`) && (m = /^\/([a-z0-9][a-z0-9-]*)$/.exec(p.slice(base.length)))) {
      const row = resolveTerm(key, m[1], hostSite);
      if (row) return { type: key, id: row.id, row, state: "live", path: tx.urlOf(row), siteId: (attachedSite("term", row.id) || {}).site_id ?? null };
    }
  }
  // Ancienne adresse d'une page ou d'un terme (historique)
  const h = movedTarget(p, { hostSite });
  if (h) return h;
  return none;
}

// Ancienne adresse (historique cms_url_history) → { type, id, state: "moved" | "trashed", path } vers l'adresse COURANTE de la ressource
function movedTarget(p, { hostSite = null } = {}) {
  let m;
  const pageSlug = (m = /^\/p\/([a-z0-9][a-z0-9-]*)$/.exec(p)) ? m[1] : hostSite && (m = /^\/([a-z0-9][a-z0-9-]*)$/.exec(p)) ? m[1] : null;
  if (pageSlug) {
    const h = db.prepare("SELECT resource_id FROM cms_url_history WHERE resource_type = 'page' AND old_slug = ?").get(pageSlug);
    if (h) {
      const row = db.prepare("SELECT id, slug, name, title, status, archived_at, published_at, site_id, kind FROM mk_landing_pages WHERE id = ?").get(h.resource_id);
      if (row && !pageBySlugLive(pageSlug)) {
        const state = pageState(row, hostSite);
        if (state === "live") return { type: "page", id: row.id, row, state: "moved", path: pagePath(row, { hostSite }), siteId: row.site_id };
        return { type: "page", id: row.id, row, state: state === "foreign" ? "none" : "trashed", path: pagePath(row, { hostSite }), siteId: row.site_id };
      }
    }
  }
  const tx = taxonomy();
  for (const key of Object.keys(tx.TAXONOMIES)) {
    const base = [tx.defaultBase(key), tx.baseOf(key)].find((x) => p.startsWith(`${x}/`)) || tx.defaultBase(key);
    if (p.startsWith(`${base}/`) && (m = /^\/([a-z0-9][a-z0-9-]*)$/.exec(p.slice(base.length)))) {
      const h = db.prepare("SELECT resource_id FROM cms_url_history WHERE resource_type = ? AND old_slug = ?").get(key, m[1]);
      const row = h && tx.get(h.resource_id);
      // Contenus par site (R6 lot 4) : l'ancienne adresse d'un terme ne mène qu'au terme DU domaine demandé
      const ownerHere = row && ((hostSite ? (attachedSite("term", row.id) || {}).site_id === hostSite.id : !publicHomeOf("term", row.id)));
      if (row && row.taxonomy === key && ownerHere && !resolveTerm(key, m[1], hostSite)) return { type: key, id: row.id, row, state: "moved", path: hostSite && attachedSite("term", row.id).address ? `${tx.baseOf(key)}/${attachedSite("term", row.id).address}` : tx.urlOf(row), siteId: (attachedSite("term", row.id) || {}).site_id ?? null };
    }
  }
  return null;
}
const pageBySlugLive = (slug) => Boolean(db.prepare("SELECT 1 FROM mk_landing_pages WHERE slug = ?").get(slug));

// Adresse à laquelle redirige une ancienne adresse (null si rien à rediriger)
function movedLocation(pathname, { hostSite = null } = {}) {
  const p = cleanPath(pathname);
  if (p === null) return null;
  const r = movedTarget(p, { hostSite });
  return r && r.state === "moved" && r.path && r.path !== p ? r.path : null;
}

// ---------- Historique ----------
// Une ressource change d'adresse : l'ancienne adresse est conservée (seulement si la ressource avait été en ligne) et la nouvelle est
// « reprise » (une ancienne adresse reprise par une ressource vivante ne redirige plus). Aucune redirection n'est créée pour une copie.
function slugChanged(type, id, { oldSlug, newSlug, siteId = null, wasLive = true, userId = null, reason = "slug" } = {}) {
  if (!oldSlug || !newSlug || oldSlug === newSlug) return;
  // Deux instructions simples (pas de transaction propre : l'appelant peut déjà en avoir une) ; la seconde ne réussit qu'après la première
  db.prepare("DELETE FROM cms_url_history WHERE resource_type = ? AND old_slug = ?").run(type, newSlug);
  if (wasLive) {
    db.prepare(`INSERT INTO cms_url_history (resource_type, resource_id, site_id, old_slug, reason, created_by) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(resource_type, old_slug) DO UPDATE SET resource_id = excluded.resource_id, site_id = excluded.site_id, reason = excluded.reason, created_at = datetime('now')`)
      .run(type, id, siteId, oldSlug, reason, userId);
  }
}
// Une ressource disparaît (fusion, suppression avec réaffectation) : son adresse mène désormais à la ressource de remplacement
function slugMovedTo(type, oldSlug, targetId, { siteId = null, reason = "fusion" } = {}) {
  db.prepare(`INSERT INTO cms_url_history (resource_type, resource_id, site_id, old_slug, reason) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(resource_type, old_slug) DO UPDATE SET resource_id = excluded.resource_id, reason = excluded.reason, created_at = datetime('now')`).run(type, targetId, siteId, oldSlug, reason);
}
const historyOf = (type, id) => db.prepare("SELECT * FROM cms_url_history WHERE resource_type = ? AND resource_id = ? ORDER BY id DESC").all(type, id);
const purgeHistory = (type, id) => db.prepare("DELETE FROM cms_url_history WHERE resource_type = ? AND resource_id = ?").run(type, id);

// Les taxonomies annoncent leurs changements : l'historique suit sans modifier le service des taxonomies
let wired = false;
function wireTaxonomyEvents() {
  if (wired) return;
  wired = true;
  const { events } = taxonomy();
  events.on("term.updated", (term, before) => { if (before && before.slug !== term.slug) slugChanged(term.taxonomy, term.id, { oldSlug: before.slug, newSlug: term.slug, reason: "slug" }); });
  events.on("term.merged", (source, target) => { if (source && target) { slugMovedTo(source.taxonomy, source.slug, target.id, { reason: "fusion" }); retarget(source.taxonomy, source.id, target.id); } });
  events.on("term.deleted", (source, target) => { if (source && target) { slugMovedTo(source.taxonomy, source.slug, target.id, { reason: "suppression" }); retarget(source.taxonomy, source.id, target.id); } else if (source) purgeHistory(source.taxonomy, source.id); });
}
// Les anciennes adresses d'un terme supprimé mènent au terme de remplacement
const retarget = (type, fromId, toId) => db.prepare("UPDATE cms_url_history SET resource_id = ? WHERE resource_type = ? AND resource_id = ?").run(toId, type, fromId);
wireTaxonomyEvents();

module.exports = {
  RESERVED, isReserved, normalizeSlug, checkSlug, uniqueSlug, isTaken,
  siteForHost, isRetiredHost, siteInfo, invalidateSites, cacheInfo, mainHost, normHost,
  pagePath, pageCanonicalPath, baseOfPage, publicPath, publicUrl,
  resolve, cleanPath, movedLocation, movedTarget, publicHomeOf, addressOf, contentScope, resolvePost, resolveTerm,
  slugChanged, slugMovedTo, historyOf, purgeHistory,
};
