// KOLAKISA CMS — espace d'administration d'UN site (palier 3, B1).
//
// Adresses : /marketing/site-web/sites/<id>/<module> (un site) et /marketing/site-web/principal/<module> (site principal).
// Le moteur est partagé (mêmes services, même coque, mêmes composants visuels) ; ce qui change, c'est le SITE, et il vient
// UNIQUEMENT de l'adresse, vérifiée par le serveur (web/index.js → siteContext.resolve) : req.mk.site / req.mk.siteId.
// Un « ?site= », un champ de formulaire ou un en-tête envoyé par le navigateur n'est jamais lu ici.
//
// Règles : lecture seule sauf là où une action réelle existe déjà (création de page) ; un module dont les données ne sont pas
// encore isolées par site (prochains paliers) affiche « Bientôt », sans donnée ni action simulée.
const express = require("express");
const pages = require("../pages");
const nav = require("./cmsNav");
const scope = require("../../services/siteScope");
const { need } = require("./kit");
const data = require("./cmsData");

const BASE = nav.BASE;
const fdate = (v) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—");
const empty = (icon, title, text, cta) => ({ icon, title, text, cta: cta || null });
const PAGE_STATUS = { published: { label: "En ligne", cls: "mk-status-ok" }, draft: { label: "Brouillon", cls: "" }, unpublished: { label: "Hors ligne", cls: "mk-status-warn" }, scheduled: { label: "Programmée", cls: "mk-status-info" } };
const pageStatus = (p) => ({ status: PAGE_STATUS[p.status] || { label: String(p.status), cls: "" } });

const safeCount = (db, sql, params = []) => { try { return db.prepare(sql).get(...params).n; } catch { return 0; } };

// Informations du « bandeau d'identité » : seulement ce qui est vrai pour ce site
const describe = (req, site) => ({ siteId: site.id, principal: false, base: `${BASE}/sites/${site.id}`, name: site.name, status: site.status === "archived" ? "archived" : "active", deleted: Boolean(site.deleted_at), slug: site.slug || null, listHref: listHref(req) });
const listHref = (req) => (req.mk.siteOnly ? `${BASE}/mes-sites` : `${BASE}/sites`);
function spaceOf(req) {
  const m = /^\/site-web\/(?:sites\/(\d{1,12})|principal)(?:\/|$)/.exec(req.path);
  if (!m) return null;
  if (m[1] === undefined) return req.mk.siteId === null ? { siteId: null, principal: true, base: `${BASE}/principal`, name: "Site principal", status: "active", deleted: false, slug: null, listHref: listHref(req) } : null;
  const site = req.mk.site;
  if (!site || site.id !== Number(m[1])) return null;
  return describe(req, site);
}

const readOnlyNote = (space) => (space.status === "archived" || space.deleted ? "Ce site est archivé : ses pages sont hors ligne et aucune création n'est possible. Restaurez-le depuis ses réglages." : null);

const SCREENS = {
  "tableau-de-bord"(req, space) {
    const { db } = req.mk.ctx;
    const w = scope.where(space.siteId, "p");
    const pg = db.prepare(`SELECT COUNT(*) total, COALESCE(SUM(p.status = 'published'), 0) publiees, COALESCE(SUM(p.status IN ('draft', 'unpublished')), 0) brouillons
      FROM mk_landing_pages p WHERE p.organization_id = ? AND p.archived_at IS NULL AND p.kind <> 'step'${w.sql}`).get(req.mk.ctx.organizationId, ...w.params);
    const wc = scope.where(space.siteId);
    const own = (t) => safeCount(db, `SELECT COUNT(*) n FROM ${t} WHERE 1 = 1${wc.sql}`, wc.params);
    const recent = db.prepare(`SELECT p.id, p.name, p.slug, p.status, p.updated_at FROM mk_landing_pages p WHERE p.organization_id = ? AND p.archived_at IS NULL AND p.kind <> 'step'${w.sql} ORDER BY p.updated_at DESC, p.id DESC LIMIT 8`).all(req.mk.ctx.organizationId, ...w.params);
    const stats = [
      { label: "Pages en ligne", value: pg.publiees, href: `${space.base}/pages` },
      { label: "Brouillons", value: pg.brouillons, href: `${space.base}/pages` },
      { label: "Composants propres au site", value: own("mk_web_components"), href: `${space.base}/composants` },
      { label: "Redirections", value: own("seo_redirects"), href: `${space.base}/redirections` },
      { label: "Listes d'envoi", value: own("mk_lists"), href: space.principal ? "/marketing/listes?site=principal" : `${space.base}/listes` },
      { label: "Campagnes", value: own("mk_campaigns"), href: space.principal ? "/marketing/campagnes?site=principal" : `${space.base}/campagnes` },
    ];
    return { title: "Tableau de bord", lead: `Vue d'ensemble de « ${space.name} » : uniquement les contenus de ce site.`, note: readOnlyNote(space), stats,
      table: { caption: "Pages récemment modifiées", columns: [{ label: "Page" }, { label: "État" }, { label: "Modifiée le" }], rows: recent.map((p) => ({ cells: [{ text: p.name, href: `/marketing/pages/${p.id}`, sub: `/${p.slug}` }, pageStatus(p), fdate(p.updated_at)] })),
        empty: empty("layout", "Aucune page pour l'instant", "Les pages de ce site apparaîtront ici dès leur création.", space.status === "active" && req.mk.can("forms.write") ? { label: "Ajouter une page", href: `${space.base}/pages#nouvelle` } : null) } };
  },

  pages(req, space) {
    const list = pages.listPages(req.mk.ctx, { siteId: space.siteId }).filter((p) => p.kind !== "step");
    const canCreate = space.status === "active" && !space.deleted && req.mk.can("forms.write");
    return { title: "Pages", lead: `Les pages de « ${space.name} ». Une page s'ouvre dans l'éditeur visuel KOLAKISA.`, note: readOnlyNote(space),
      createForm: canCreate ? { action: "/marketing/pages", hidden: space.siteId === null ? {} : { site_id: String(space.siteId) }, label: "Nouvelle page dans ce site", field: "name", placeholder: "Accueil, Programme, Contact…", button: "Créer la page" } : null,
      table: { caption: "Pages du site", columns: [{ label: "Page" }, { label: "Adresse" }, { label: "État" }, { label: "Modifiée le" }],
        rows: list.map((p) => ({ cells: [{ text: p.name, href: `/marketing/pages/${p.id}` }, `/${p.slug}`, pageStatus(p), fdate(p.updated_at)] })),
        empty: empty("layout", "Aucune page", "Ce site n'a pas encore de page.") } };
  },

  composants(req, space) {
    const list = pages.listComponents(req.mk.ctx, { siteId: space.siteId });
    return { title: "Composants", lead: "Les composants réutilisables : ceux propres à ce site et les composants globaux partagés par tous les sites (ils se modifient dans l'éditeur de pages).", note: readOnlyNote(space),
      table: { caption: "Composants", columns: [{ label: "Composant" }, { label: "Portée" }, { label: "Version", num: true }],
        rows: list.map((c) => ({ cells: [c.name, c.site_id === null ? "Global (tous les sites)" : "Propre à ce site", String(c.version ?? "—")] })),
        empty: empty("layers", "Aucun composant", "Les composants se créent depuis l'éditeur de pages.") } };
  },

  redirections(req, space) {
    const w = scope.where(space.siteId);
    const rows = req.mk.ctx.db.prepare(`SELECT source_path, target, status, enabled, hits, created_at FROM seo_redirects WHERE 1 = 1${w.sql} ORDER BY id DESC LIMIT 500`).all(...w.params);
    return { title: "Redirections", lead: "Les redirections propres à ce site (lecture seule).", note: readOnlyNote(space),
      table: { caption: "Redirections du site", columns: [{ label: "Ancienne adresse" }, { label: "Nouvelle adresse" }, { label: "Type" }, { label: "État" }, { label: "Visites", num: true }, { label: "Créée le" }],
        rows: rows.map((r) => ({ cells: [r.source_path, r.target, String(r.status), r.enabled ? { status: { label: "Active", cls: "mk-status-ok" } } : { status: { label: "Désactivée", cls: "" } }, String(r.hits || 0), fdate(r.created_at)] })),
        empty: empty("arrowRightLeft", "Aucune redirection", "Ce site n'a aucune redirection.") } };
  },

  equipe(req, space) {
    const rows = req.mk.ctx.db.prepare("SELECT u.username, m.role, m.created_at FROM mk_site_members m JOIN users u ON u.id = m.user_id WHERE m.site_id = ? ORDER BY u.username COLLATE NOCASE").all(space.siteId);
    return { title: "Équipe du site", lead: "Les personnes qui ont un rôle sur ce site. L'équipe de l'organisation a accès à tous les sites.", note: readOnlyNote(space),
      table: { caption: "Équipe du site", columns: [{ label: "Personne" }, { label: "Rôle" }, { label: "Depuis le" }],
        rows: rows.map((r) => ({ cells: [r.username, data.ROLE_LABEL[r.role] || r.role, fdate(r.created_at)] })),
        empty: empty("users", "Aucune personne rattachée", "Aucun rôle propre à ce site n'est attribué : seule l'équipe de l'organisation y accède.") } };
  },
};

const SOON_TEXT = {
  B2: "Médiathèque propre à chaque site, avec partage explicite entre sites.", B3: "Modèles de pages et blocs privés à un site ou partagés.",
  B4: "Formulaires, soumissions et contacts rattachés à chaque site, avec leurs consentements.", B5: "Blog propre à chaque site : articles, catégories, étiquettes et commentaires.", B6: "Réglages et métadonnées SEO propres à chaque site.",
  menus: "L'édition des menus d'un site n'a pas encore d'écran.",
  C4: "Cet écran existe dans le CMS principal ; son ouverture pour chaque site est prévue après vérification de son isolation.",
  P2: "Styles et design propres à chaque site, avec le même moteur que le site principal.",
  corbeille: "La corbeille d'un site ne sera activée qu'une fois démontré qu'un site ne peut ni consulter ni modifier les éléments supprimés d'un autre site.",
};

module.exports = () => {
  const router = express.Router();
  router.get("/site-web/principal", need("forms.read"), (req, res) => res.redirect(`${BASE}/principal/tableau-de-bord`));
  const handle = (req, res, next) => {
    const space = res.locals.siteSpace;
    if (!space) {
      const reason = req.mk.siteContext && !req.mk.siteContext.ok ? req.mk.siteContext.reason : "not_found";
      return res.status(reason === "forbidden" ? 403 : 404).render("error", { message: reason === "forbidden" ? "Vous n'avez pas accès à ce site." : "Site introuvable." });
    }
    const mod = req.params.module;
    const item = nav.siteModuleOf(space, mod);
    if (!item || item.external) return next();
    if (!req.mk.can(item.permission)) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'ouvrir cet écran." });
    const active = item.key;
    if (item.status === "preview") {
      const key = item.phase;
      return res.render("marketing/cms-screen", { active, query: req.query, PER_PAGE: 25, preview: true, title: item.label, lead: `${item.label} de « ${space.name} ».`,
        soon: `${SOON_TEXT[key] || ""} Ce module sera isolé par site dans un prochain palier : aucune donnée n'est affichée ici et aucune donnée d'un autre site n'est montrée.` });
    }
    const screen = SCREENS[mod];
    if (!screen) return next();
    if (mod === "equipe" && space.principal) return next();
    const model = screen(req, space);
    res.render("marketing/cms-screen", { active, query: req.query, PER_PAGE: 25, preview: false, ...model });
  };
  router.get("/site-web/sites/:id(\\d+)/:module([a-z-]+)", need("forms.read"), handle);
  router.get("/site-web/principal/:module([a-z-]+)", need("forms.read"), handle);
  return router;
};
// Le site de la requête, disponible pour toute la requête (coque, bandeau, titre) — jamais lu ailleurs que dans l'adresse ou dans le contexte vérifié par le serveur.
// Monté tôt (avant siteWeb) pour que la fiche de réglages et les écrans de l'espace partagent le même contexte.
//   • siteSpace     : l'adresse EST celle d'un espace (/sites/<id>/… ou /principal/…) ;
//   • siteCandidate : un écran partagé (Emailing, Tests A/B, Analytics, Outils) servi pour un site que le serveur a vérifié (req.mk.site) ; la vue ne
//                     s'en sert que si l'écran est déclaré propre au site (cmsNav.isSiteScopedKey). Jamais un « ?site= » non vérifié.
// Délégation (P1a) : GET /sites/<id>/<module partagé> sert l'écran EXISTANT avec ce site fixé par l'adresse (le « site » reçu du client est écrasé).
module.exports.attach = (req, res, next) => {
  const space = spaceOf(req);
  if (space) res.locals.siteSpace = space;
  else if (req.mk.site && Number.isInteger(req.mk.siteId) && req.mk.site.id === req.mk.siteId) res.locals.siteCandidate = describe(req, req.mk.site);
  const m = /^\/site-web\/sites\/(\d{1,12})\/([a-z-]+)\/?$/.exec(req.path);
  if (!m || !Object.hasOwn(nav.DELEGATED, m[2]) || (req.method !== "GET" && req.method !== "HEAD")) return next();
  if (!space) {
    const reason = req.mk.siteContext && !req.mk.siteContext.ok ? req.mk.siteContext.reason : "not_found";
    return res.status(reason === "forbidden" ? 403 : 404).render("error", { message: reason === "forbidden" ? "Vous n'avez pas accès à ce site." : "Site introuvable." });
  }
  const id = space.siteId;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query || {})) if (k !== "site" && typeof v === "string") q.set(k, v);
  q.set("site", String(id));
  req.query = { ...req.query, site: String(id) };
  req.url = `${nav.DELEGATED[m[2]]}?${q}`;
  // L'équipe de l'organisation filtre les écrans d'Emailing par `siteFilter` (calculé AVANT ce point depuis l'adresse d'origine) : on le fixe sur ce site
  if (req.mk.ctx.siteScope === undefined) req.mk.ctx.siteFilter = id;
  // Sites proposés par les écrans d'Emailing : préparés par la barrière d'accès d'après l'adresse d'ORIGINE (qui n'a pas la forme d'un écran d'Emailing) → ici, d'après le site fixé
  Object.assign(res.locals, require("./kit").siteChoices(req));
  next();
};
module.exports.SCREENS = SCREENS;
module.exports.spaceOf = spaceOf;
