// Routage public par domaine de site (palier 12). Les routes existantes ne changent pas : ces middlewares ne font que
//   1. identifier le site d'après l'hôte demandé (seulement les domaines enregistrés dans les réglages SEO des sites),
//   2. servir, sur ce domaine, l'accueil du site (« / ») et ses pages (« /<adresse> ») en réutilisant le rendu de /p/<adresse>,
//   3. normaliser la casse et la barre finale des adresses de contenu (301), sans toucher aux routes techniques,
//   4. rediriger (301) une ancienne adresse de page ou de terme vers l'adresse courante, avant la page d'erreur 404,
//   5. empêcher l'indexation d'un environnement de développement / local (en-tête X-Robots-Tag).
const urls = require("../services/urls");

const isRead = (req) => req.method === "GET" || req.method === "HEAD";
const queryOf = (req) => (req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "");
const MISSING = "/__introuvable__"; // adresse qu'aucune route ne sert : la page d'erreur 404 habituelle prend le relais

// Hôtes autorisés pour servir le site principal : le domaine configuré (SITE_URL) avec ou sans « www. », plus la liste facultative HOTES_AUTORISES
// (séparée par des virgules : domaine provisoire de l'hébergeur, etc.). Hôtes locaux / réseau privé : toujours acceptés (sondes de l'hébergeur, développement, tests).
// Sans SITE_URL (installation neuve, développement) : aucune restriction. → "main" | "unknown"
// Hôte local STRICT : « localhost », adresse IP privée ou de bouclage COMPLÈTE (jamais un nom de domaine qui commence par des chiffres, ex. 127.evil.com), IPv6 de bouclage,
// ou suffixe jamais délégué sur Internet (.local, .localhost, .internal, .lan)
function isLocalHost(host) {
  if (host === "localhost" || /\.(local|localhost|internal|lan)$/.test(host) || /^\[?::1\]?$/.test(host)) return true;
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 127 || a === 10 || (a === 192 && b === 168) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31);
}
function hostPolicy(host) {
  if (!process.env.SITE_URL) return "main";
  if (!host) return "unknown";
  if (isLocalHost(host)) return "main";
  const main = urls.mainHost();
  const bare = main.replace(/^www\./, "");
  if (host === main || host === bare || host === `www.${bare}`) return "main";
  const extra = String(process.env.HOTES_AUTORISES || "").split(",").map((h) => urls.normHost(h)).filter(Boolean);
  return extra.includes(host) ? "main" : "unknown";
}

// 1. Site de la requête (req.kwSite) : uniquement un domaine enregistré ; jamais déduit d'un hôte arbitraire
function attachSite(req, res, next) {
  const host = urls.normHost(req.hostname);
  req.kwSite = host && host !== urls.mainHost() ? urls.siteForHost(host) : null;
  req.kwRetired = !req.kwSite && host && host !== urls.mainHost() ? urls.isRetiredHost(host) : false;
  // Domaine ni principal, ni site actif, ni retiré : inconnu de Kolakisa (voir hostPolicy)
  req.kwUnknownHost = !req.kwSite && !req.kwRetired && hostPolicy(host) === "unknown";
  // Sur le domaine d'un site, toutes les adresses absolues (canonical, plan du site, robots.txt, JSON-LD) sont celles de ce site
  if (req.kwSite && req.kwSite.base) req.seoBase = req.kwSite.base;
  // Domaine secondaire (alias vérifié, ex. www ou adresse de plateforme) : redirection 301 vers le domaine principal du site, chemin et requête conservés (une seule adresse par page)
  if (req.kwSite && req.kwSite.host && host !== req.kwSite.host && isRead(req) && req.path !== "/sante") return res.redirect(301, `${req.kwSite.base}${req.originalUrl}`);
  if (req.kwSite || req.kwRetired) neutralErrors(req, res);
  next();
}

// Vitrine d'un site à domaine propre : toute page d'erreur (« error ») est rendue SANS l'habillage de la plateforme (en-tête, catalogue, blog, connexion) ni le modèle 404 du site
// principal ; « pas encore publié » tant que le site n'a aucune page d'accueil en ligne. Le code HTTP choisi par la route est conservé.
function neutralErrors(req, res) {
  const render = res.render.bind(res);
  res.render = (view, locals, cb) => {
    if (view !== "error") return render(view, locals, cb);
    const site = req.kwSite || null;
    let built = true;
    if (site) { try { const home = urls.resolve("/", { hostSite: site }); built = Boolean(home && home.type === "page" && home.state === "live"); } catch { built = false; } }
    res.set("X-Robots-Tag", "noindex, nofollow");
    return render("site-public-error", { siteName: site ? site.name : "Ce site", built, message: (locals && locals.message) || "Cette page n'existe pas ou n'est plus en ligne.", themeTemplate: (locals && typeof locals.themeTemplate === "string") ? locals.themeTemplate : "" }, cb);
  };
}

// 2. Accueil et pages d'un site à domaine propre
function siteRouting(req, res, next) {
  const site = req.kwSite;
  if (!site || !isRead(req)) return next();
  const r = urls.resolve(req.path, { hostSite: site });
  if (site.front === "posts" && req.path === "/") { req.url = `/blog${queryOf(req)}`; req.kwList = { basePath: "/" }; return next(); }
  if (site.front !== "posts" && site.postsPage) {
    let pr = null;
    try { pr = postsPageOf(site.id, site.homePageId, site.postsPage); } catch { pr = null; }
    if (pr) {
      const where = urls.pagePath(pr, { hostSite: site });
      if (req.path === where || req.path === `/p/${pr.slug}`) { req.url = `/blog${queryOf(req)}`; req.kwList = { basePath: where, title: pr.title || pr.name }; return next(); }
      if (req.path === "/blog") return res.redirect(301, `${where}${queryOf(req)}`);
    }
  }
  if (req.path === "/" ) {
    if (r.type === "page" && r.state === "live") { req.url = `/p/${r.row.slug}${queryOf(req)}`; return next(); }
    req.url = MISSING; return next();
  }
  // /p/<adresse> sur le domaine d'un site : page de CE site → adresse propre (301) ; page d'un autre site ou inexistante → 404
  if (/^\/p\/[^/]+$/.test(req.path)) {
    if (r.type === "page" && r.state === "live") return res.redirect(301, `${urls.pagePath(r.row, { hostSite: site })}${queryOf(req)}`);
    if (r.type === "page" && r.state === "foreign") { req.url = MISSING; return next(); }
    return next();
  }
  // /<adresse> : page en ligne de ce site
  if (r.type === "page" && /^\/[a-z0-9][a-z0-9-]*$/.test(req.path) && r.state === "live" && r.row.site_id === site.id) {
    if (r.path === "/") return res.redirect(301, `/${queryOf(req)}`);
    req.url = `/p/${r.row.slug}${queryOf(req)}`;
  }
  next();
}

// 2 ter. Isolation des domaines (palier 2) : le domaine d'un site ne sert JAMAIS le contenu public du site principal (blog, formations, catalogue,
// pages éditoriales), et le domaine d'un site archivé ou supprimé ne sert rien du tout (il ne retombe pas sur le site principal).
// Réponse 404 comme pour une adresse inconnue. Restent servis sur le domaine d'un site : ses pages, les fichiers, robots.txt / plan du site (adaptés au site),
// les formulaires et le suivi, la connexion et les comptes (communs à la plateforme), les pages techniques.
// R7 lot 6.6 : « commande » (paiement, retour du fournisseur, confirmation) rejoint la liste — le parcours d'achat reste entièrement sur l'hôte principal (voir docs/r7-contacts-par-site-2026-10-16/15-rapport-R7-lot-6-6-commerce.md)
const MAIN_SITE_ONLY = /^\/(blog|cours|catalogue|categorie|a-propos|faq|feed|recherche|panier|commande|favoris|formations?)(\/|$)/i;
// Domaine d'un site dont le module « lms » est activé (req.lmsSite > 0, voir services/lmsSites) : catalogue, fiches, panier et commande de CE site sont servis ;
// les routes filtrent par site (aucune formation du site principal ni d'un autre site). Blog, à-propos, FAQ, recherche… restent réservés au site principal.
const LMS_SITE_OK = /^\/(cours|catalogue|categorie|panier|commande|favoris|formations?)(\/|$)/i;
const ALWAYS_OK = /^\/(sante|uploads|css|js|img|fonts|favicon\.(ico|svg)|avatar|effacement)(\/|$|\.)/i;
const refusedLogged = new Set();
// Blog propre à un site (R6 lot 4) : le domaine d'un site sert SON blog (articles rattachés à ce site, adresses logiques du site) dès que ce site a au moins un article en ligne ;
// sans article, le blog reste introuvable sur ce domaine (comme avant). Il ne sert jamais le blog du site principal ni celui d'un autre site (portée appliquée par les routes du blog).
const BLOG_PATH = /^\/(blog|feed)(\/|$)/i;
function siteHasBlog(siteId) {
  try {
    return Boolean(require("../config/database").prepare("SELECT 1 FROM posts p JOIN mk_content_sites cs ON cs.content_type = 'post' AND cs.content_id = p.id WHERE cs.site_id = ? AND p.published = 1 AND p.deleted_at IS NULL LIMIT 1").get(siteId));
  } catch { return false; }
}
function siteIsolation(req, res, next) {
  if (req.path === "/sante") return next(); // sonde de santé : joignable quel que soit l'hôte
  // Domaine inconnu de Kolakisa : jamais le site principal ni celui d'un autre site (421 « requête mal dirigée »)
  if (req.kwUnknownHost) {
    // Diagnostic : l'hôte lu et les en-têtes reçus sont consignés (une fois par hôte et par processus) pour repérer tout de suite un hôte légitime refusé par erreur
    const seen = String(req.hostname || "").slice(0, 100);
    if (!refusedLogged.has(seen) && refusedLogged.size < 200) {
      refusedLogged.add(seen);
      console.warn(`[KOLAKISA] Hôte refusé (421) : « ${seen} » — en-tête Host : « ${String(req.headers.host || "").slice(0, 100)} », X-Forwarded-Host : « ${String(req.headers["x-forwarded-host"] || "").slice(0, 100)} ». S'il s'agit d'un domaine légitime, l'ajouter à HOTES_AUTORISES.`);
    }
    return res.status(421).type("text/plain").send(`Ce domaine (${seen.replace(/[^a-z0-9.\-:\[\]]/gi, "?")}) n'est pas configuré sur cette plateforme.`);
  }
  if (ALWAYS_OK.test(req.path)) return next();
  if (req.kwSite && BLOG_PATH.test(req.path) && siteHasBlog(req.kwSite.id)) return next();
  if (req.kwSite && req.lmsSite > 0 && LMS_SITE_OK.test(req.path)) return next();
  if (req.kwRetired || (req.kwSite && MAIN_SITE_ONLY.test(req.path))) {
    if (!isRead(req)) return res.status(404).type("text/plain").send("Introuvable");
    req.url = MISSING;
  }
  next();
}

// 2 bis. Page d'accueil du site principal choisie dans Paramètres → Lecture : « / » affiche cette page (réécriture interne, comme sur le domaine
// d'un site) ; son adresse /p/<adresse> redirige vers « / » (une seule adresse). Si la page n'est plus publiée, l'accueil standard reprend.
function mainHome() {
  const id = require("../services/settings").main().homeId;
  if (!id) return null;
  const row = require("../config/database").prepare("SELECT id, slug, status, archived_at, site_id, kind FROM mk_landing_pages WHERE id = ?").get(id);
  return row && row.status === "published" && !row.archived_at && row.site_id === null && row.kind !== "step" ? row : null;
}
// Page des articles (Paramètres → Lecture) : page publiée, de ce site, différente de l'accueil ; seulement quand l'accueil est une page statique
function postsPageOf(siteId, homeId, postsId) {
  if (!postsId || postsId === homeId) return null;
  const row = require("../config/database").prepare("SELECT id, slug, name, title, status, archived_at, site_id, kind FROM mk_landing_pages WHERE id = ?").get(postsId);
  return row && row.status === "published" && !row.archived_at && (row.site_id ?? null) === (siteId ?? null) && row.kind !== "step" ? row : null;
}
function homeRouting(req, res, next) {
  if (req.kwSite || !isRead(req)) return next();
  let mode = "standard", home = null, postsRow = null;
  try {
    const st = require("../services/settings").main();
    mode = st.showOnFront; home = mainHome();
    if (mode === "page") postsRow = postsPageOf(null, home && home.id, st.postsPage);
  } catch { return next(); }
  if (mode === "posts" && req.path === "/") { req.url = `/blog${queryOf(req)}`; req.kwList = { basePath: "/" }; return next(); }
  if (postsRow) {
    const where = `/p/${postsRow.slug}`;
    if (req.path === where) { req.url = `/blog${queryOf(req)}`; req.kwList = { basePath: where, title: postsRow.title || postsRow.name }; return next(); }
    if (req.path === "/blog") return res.redirect(301, `${where}${queryOf(req)}`);
  }
  if (!home) return next();
  if (req.path === "/") { req.url = `/p/${home.slug}${queryOf(req)}`; return next(); }
  if (req.path === `/p/${home.slug}`) return res.redirect(301, `/${queryOf(req)}`);
  next();
}

// 3. Casse et barre finale : seulement pour les adresses de contenu public (jamais jetons, administration, fichiers, API)
const NORMALIZED = /^\/(p|blog|cours|categorie|catalogue)(\/|$)/;
function normalizePaths(req, res, next) {
  if (!isRead(req)) return next();
  try { if (!require("../services/settings").main().normalizePaths) return next(); } catch { /* réglage indisponible : normalisation active */ }
  const raw = req.path;
  if (raw.includes("%")) return next();
  if (require("../services/permalinks").owns(raw, req.kwSite || null)) return next(); // permalien actif d'un article : sa forme canonique est celle de la structure du site // adresse encodée : jamais réécrite (les séquences %XX ne sont pas de la « casse »)
  const single = req.kwSite && /^\/[A-Za-z0-9-]+\/?$/.test(raw);
  if (!NORMALIZED.test(raw.toLowerCase()) && !single) return next();
  let fixed = raw;
  if (fixed.length > 1) fixed = fixed.replace(/\/+$/, "") || "/";
  if (/[A-Z]/.test(fixed)) fixed = fixed.toLowerCase();
  if (fixed === raw || fixed.startsWith("//")) return next();
  res.redirect(301, `${fixed}${queryOf(req)}`);
}

// 4. Ancienne adresse → adresse courante (calculée à chaque demande : jamais de chaîne)
function movedFallback(req, res, next) {
  if (!isRead(req)) return next();
  let loc = null;
  // Redirections > Paramètres : « automatique » (défaut), « à valider » ou « désactivé » — les deux derniers ne redirigent pas les anciennes adresses des pages et des catégories d'un site tant qu'une règle n'a pas été validée
  try { if (require("../seo/redirectTools").autoModeFor(req.kwSite ? req.kwSite.id : null) !== "auto") return next(); } catch { /* réglage illisible : comportement habituel */ }
  try { loc = urls.movedLocation(req.path, { hostSite: req.kwSite || null }); } catch { loc = null; }
  if (!loc) return next();
  res.redirect(301, `${loc}${queryOf(req)}`);
}

// 5. Environnement non public : jamais indexé (développement, adresse locale ou réseau privé), ou ALLOW_INDEXING=0 ; ALLOW_INDEXING=1 force l'ouverture
const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)|\.(local|localhost|internal|lan)$/i;
// Visibilité masquée dans Paramètres → Indexation (site principal) : un seul point de décision pour l'en-tête HTTP, la balise robots, robots.txt et le plan du site
function closedBySetting() {
  try { return require("../services/settings").main().searchVisibility === "closed"; } catch { return false; }
}
function indexingAllowed(req) {
  if (process.env.ALLOW_INDEXING === "0") return false;
  if (closedBySetting() && !(req && req.kwSite)) return false; // la visibilité du site principal ne ferme pas un site à domaine propre : il a son propre réglage
  if (process.env.ALLOW_INDEXING === "1") return true; // forcé (tests, préproduction publique volontaire)
  let host = "";
  try { host = process.env.SITE_URL ? new URL(process.env.SITE_URL).hostname : req.hostname; } catch { host = req.hostname; }
  return !PRIVATE_HOST.test(String(host || ""));
}
function indexingGuard(req, res, next) {
  // Environnement non public, visibilité masquée (site principal) ou site entier en noindex (réglage du site) : en-tête HTTP lu par les moteurs
  if (!indexingAllowed(req) || (req.kwSite && req.kwSite.noindex)) res.set("X-Robots-Tag", "noindex, nofollow");
  next();
}

module.exports = { closedBySetting, attachSite, siteIsolation, homeRouting, siteRouting, normalizePaths, movedFallback, indexingGuard, indexingAllowed, MISSING };
