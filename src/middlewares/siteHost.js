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

// 1. Site de la requête (req.kwSite) : uniquement un domaine enregistré ; jamais déduit d'un hôte arbitraire
function attachSite(req, res, next) {
  const host = urls.normHost(req.hostname);
  req.kwSite = host && host !== urls.mainHost() ? urls.siteForHost(host) : null;
  // Sur le domaine d'un site, toutes les adresses absolues (canonical, plan du site, robots.txt, JSON-LD) sont celles de ce site
  if (req.kwSite && req.kwSite.base) req.seoBase = req.kwSite.base;
  next();
}

// 2. Accueil et pages d'un site à domaine propre
function siteRouting(req, res, next) {
  const site = req.kwSite;
  if (!site || !isRead(req)) return next();
  const r = urls.resolve(req.path, { hostSite: site });
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

// 3. Casse et barre finale : seulement pour les adresses de contenu public (jamais jetons, administration, fichiers, API)
const NORMALIZED = /^\/(p|blog|cours|categorie|catalogue)(\/|$)/;
function normalizePaths(req, res, next) {
  if (!isRead(req)) return next();
  const raw = req.path;
  if (raw.includes("%")) return next(); // adresse encodée : jamais réécrite (les séquences %XX ne sont pas de la « casse »)
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
  try { loc = urls.movedLocation(req.path, { hostSite: req.kwSite || null }); } catch { loc = null; }
  if (!loc) return next();
  res.redirect(301, `${loc}${queryOf(req)}`);
}

// 5. Environnement non public : jamais indexé (développement, adresse locale ou réseau privé), ou ALLOW_INDEXING=0 ; ALLOW_INDEXING=1 force l'ouverture
const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)|\.(local|localhost|internal|lan)$/i;
function indexingAllowed(req) {
  if (process.env.ALLOW_INDEXING === "0") return false;
  if (process.env.ALLOW_INDEXING === "1") return true; // forcé (tests, préproduction publique volontaire)
  let host = "";
  try { host = process.env.SITE_URL ? new URL(process.env.SITE_URL).hostname : req.hostname; } catch { host = req.hostname; }
  return !PRIVATE_HOST.test(String(host || ""));
}
function indexingGuard(req, res, next) {
  if (!indexingAllowed(req)) res.set("X-Robots-Tag", "noindex, nofollow");
  next();
}

module.exports = { attachSite, siteRouting, normalizePaths, movedFallback, indexingGuard, indexingAllowed, MISSING };
