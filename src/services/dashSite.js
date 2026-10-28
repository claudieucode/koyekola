// KOLAKISA — contexte de site de « Mon espace » (/formateur/*) : quel site la personne administre-t-elle, et en a-t-elle le droit ?
//
//   session (identité) + ?site= (simple DEMANDE) ─► siteContext.resolve ─► { site, siteId, perms } | refus ─► repli sur le site principal
//
// Réutilise le gestionnaire de sites existant (mk_sites) et la logique d'accès du CMS (siteContext / cmsAccess) : aucune seconde liste de sites.
// Convention conservée : site principal = site_id NULL (siteScope). Le navigateur ne décide jamais : chaque requête est revérifiée ici.
const siteContext = require("./siteContext");
const primarySite = require("./primarySite");
const siteScope = require("./siteScope");
const urls = require("./urls");

const MAIN = "principal";

const organizationId = (db) => (db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get() || {}).id || null;

// « ?site=12 » → 12, « ?site=principal » ou absent → null (principal), tout le reste → NaN (invalide)
function parseRaw(raw) {
  if (Array.isArray(raw)) raw = raw[0];
  if (raw === undefined || raw === null || raw === "" || raw === MAIN) return null;
  return /^\d{1,12}$/.test(String(raw)) ? Number(raw) : NaN;
}

function describe(db, orgId, site) {
  const main = !site;
  const row = main ? primarySite.row(db, orgId) : null;
  const info = !main ? urls.siteInfo(site.id) : null;
  let domain = "";
  if (main) { try { domain = new URL(process.env.SITE_URL).hostname; } catch { domain = ""; } } else if (info && info.host) domain = info.host;
  return {
    id: main ? null : site.id, key: main ? MAIN : String(site.id), main,
    name: main ? (row && row.name) || "Site principal" : site.name,
    domain, status: main ? "active" : site.status, archived: !main && site.status === "archived",
  };
}

// Sites proposés à cette personne : le principal (si elle y a accès) puis chaque site actif auquel elle a accès
function listFor(db, userId, orgId) {
  const out = [];
  const principal = siteContext.resolve(db, { userId, organizationId: orgId }, null);
  if (principal.ok) out.push(describe(db, orgId, null));
  const rows = db.prepare(`SELECT id FROM mk_sites WHERE organization_id = ? AND deleted_at IS NULL AND status = 'active'${primarySite.excludeSql(db)} ORDER BY name COLLATE NOCASE`).all(orgId);
  for (const { id } of rows) {
    const r = siteContext.resolve(db, { userId, organizationId: orgId }, id);
    if (r.ok) out.push(describe(db, orgId, r.site));
  }
  return out;
}

// → { ok, site, siteId, perms, sites, current, denied } ; « denied » = le site demandé a été refusé (on retombe alors sur un site autorisé)
function forRequest(db, userId, rawSite) {
  const orgId = organizationId(db);
  if (!orgId) return { ok: false, siteId: null, sites: [], current: null, perms: new Set(), denied: null };
  const sites = listFor(db, userId, orgId);
  const wanted = parseRaw(rawSite);
  let r = Number.isNaN(wanted) ? { ok: false, reason: "invalid", message: "Identifiant de site invalide." } : siteContext.resolve(db, { userId, organizationId: orgId }, wanted);
  let denied = null;
  if (!r.ok) {
    denied = r.message || "Site indisponible.";
    const fallback = sites[0];
    r = fallback ? siteContext.resolve(db, { userId, organizationId: orgId }, fallback.id) : r;
  }
  if (!r.ok) return { ok: false, siteId: null, sites, current: null, perms: new Set(), denied };
  const current = sites.find((s) => s.id === r.siteId) || describe(db, orgId, r.site);
  return { ok: true, site: r.site, siteId: r.siteId, perms: r.perms, sites, current, denied, organizationId: orgId };
}

// Ajoute (ou remplace) ?site= dans une adresse du tableau de bord SANS ré-encoder le reste de l'adresse ; le principal n'a pas besoin de paramètre
function withSite(href, siteId) {
  if (!href || /^(https?:)?\/\//.test(href) || href.startsWith("#")) return href;
  const hashAt = href.indexOf("#");
  const hash = hashAt === -1 ? "" : href.slice(hashAt);
  let rest = hashAt === -1 ? href : href.slice(0, hashAt);
  const had = /[?&]site=/.test(rest);
  if (siteId === null || siteId === undefined) {
    if (!had) return href;
    rest = rest.replace(/([?&])site=[^&]*(&|$)/, (m, a, b) => (b ? a : "")).replace(/[?&]$/, "");
    return rest + hash;
  }
  rest = rest.replace(/([?&])site=[^&]*(&|$)/, (m, a, b) => (b ? a : "")).replace(/[?&]$/, "");
  return `${rest}${rest.includes("?") ? "&" : "?"}site=${Number(siteId)}${hash}`;
}

// Site actif de la requête (null = principal). Hors contexte vérifié, on refuse plutôt que de retomber silencieusement sur le principal.
const siteIdOf = (req) => (req.dashSite && req.dashSite.ok ? req.dashSite.siteId : null);

// Garde d'objet : l'objet chargé (formation, question, message…) appartient-il au site actif ?
//  - même site → true ;
//  - autre site auquel la personne a accès → GET : redirection vers la même adresse avec ?site= (liens profonds), autre méthode : 409 (jamais d'écriture dans un autre site) ;
//  - site inaccessible → 404 (on ne révèle rien) ; renvoie false quand la réponse est déjà envoyée.
function guardObject(req, res, objectSiteId, { notFound = "Élément introuvable." } = {}) {
  const wanted = objectSiteId === undefined || objectSiteId === null ? null : Number(objectSiteId);
  const current = siteIdOf(req);
  if (wanted === current) return true;
  const db = require("../config/database");
  const other = forRequest(db, req.session.user.id, wanted === null ? MAIN : wanted);
  if (!other.ok || other.siteId !== wanted || other.denied) { res.status(404).render("error", { message: notFound }); return false; }
  if (req.method === "GET" || req.method === "HEAD") {
    const u = new URL(req.originalUrl, "http://x");
    u.searchParams.set("site", wanted === null ? MAIN : String(wanted));
    res.redirect(u.pathname + u.search);
    return false;
  }
  res.status(409).render("error", { message: "Le site affiché ne correspond pas à cet élément : rechargez la page depuis le bon site." });
  return false;
}

// Formulaire multipart (le corps n'est lu qu'après la résolution du site) : le champ « site » éventuel doit désigner le site actif
function bodySiteMatches(req, res) {
  const sent = req.body && req.body.site;
  if (sent === undefined || sent === null || sent === "") return true;
  const wanted = parseRaw(sent);
  if (Number.isNaN(wanted) || wanted !== siteIdOf(req)) {
    res.status(409).render("error", { message: "Le site affiché ne correspond pas à celui de la requête : rechargez la page depuis le bon site." });
    return false;
  }
  return true;
}

module.exports = { siteIdOf, guardObject, bodySiteMatches, MAIN, parseRaw, forRequest, listFor, withSite, scope: siteScope };
