// « Site Web » dans l'Emailing : tableau de bord (chiffres réels), sites (pages, page d'accueil, design system,
// duplication, archivage). Les pages elles-mêmes sont sous /marketing/pages (même moteur pour Site Web et Tunnels).
// Droits : ceux des formulaires et pages (forms.read / forms.write).
const express = require("express");
const pages = require("../pages");
const stats = require("../pages/stats");
const tokens = require("../pages/tokens");
const { attempt, need } = require("./kit");

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);

// Formulaire du design system → jetons (valeurs refusées si invalides : jamais remplacées en silence)
function tokensFromBody(b, current) {
  const t = JSON.parse(JSON.stringify(current));
  for (const k of tokens.COLOR_KEYS) if (b[`color_${k}`] !== undefined) t.colors[k] = String(b[`color_${k}`]).trim();
  for (const k of ["heading", "body"]) if (b[`font_${k}`] !== undefined) t.fonts[k] = String(b[`font_${k}`]);
  for (const k of tokens.TYPE_KEYS) {
    if (b[`type_${k}_size`] !== undefined) t.type[k].size = Number(b[`type_${k}_size`]);
    if (b[`type_${k}_weight`] !== undefined) t.type[k].weight = Number(b[`type_${k}_weight`]);
  }
  for (const k of tokens.SPACE_KEYS) if (b[`space_${k}`] !== undefined) t.space[k] = Number(b[`space_${k}`]);
  for (const k of Object.keys(t.radius)) if (b[`radius_${k}`] !== undefined) t.radius[k] = Number(b[`radius_${k}`]);
  for (const k of Object.keys(t.shadow)) if (b[`shadow_${k}`] !== undefined) t.shadow[k] = String(b[`shadow_${k}`]);
  return t;
}

module.exports = () => {
  const router = express.Router();

  router.get("/site-web", need("forms.read"), (req, res) => {
    res.render("marketing/site-web", { title: "Site Web", active: "sitedash", d: stats.dashboard(req.mk.ctx, { days: Number(req.query.periode) || 30 }) });
  });

  router.get("/site-web/sites", need("forms.read"), (req, res) => {
    const archived = req.query.vue === "archives";
    res.render("marketing/sites", { title: "Sites", active: "sites", archived, sites: pages.listSites(req.mk.ctx, { archived }) });
  });
  router.post("/site-web/sites", need("forms.write"), (req, res, next) => {
    let created = null;
    attempt(req, res, next, () => (created ? `/marketing/site-web/sites/${created.id}` : "/marketing/site-web/sites"), () => {
      created = pages.createSite(req.mk.ctx, { name: req.body.name });
      return "Site créé : ajoutez ses pages, choisissez sa page d'accueil et réglez son design system.";
    });
  });

  const load = (req, res) => {
    const site = pages.getSite(req.mk.ctx, intOrNull(req.params.id));
    if (!site) res.status(404).render("error", { message: "Site introuvable." });
    return site;
  };
  router.get("/site-web/sites/:id(\\d+)", need("forms.read"), (req, res) => {
    const site = load(req, res);
    if (!site) return;
    res.render("marketing/site", {
      title: site.name, active: "sites", site, sitePages: pages.listPages(req.mk.ctx, { siteId: site.id }), canWrite: req.mk.can("forms.write"),
      T: tokens, cssVars: tokens.tokensToCss(site.tokens),
    });
  });
  router.post("/site-web/sites/:id(\\d+)", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, `/marketing/site-web/sites/${site.id}`, () => {
      pages.updateSite(req.mk.ctx, site.id, { name: req.body.name });
      if (req.body.home_page_id !== undefined) pages.setHomePage(req.mk.ctx, site.id, intOrNull(req.body.home_page_id));
      return "Réglages du site enregistrés.";
    });
  });
  router.post("/site-web/sites/:id(\\d+)/design", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, `/marketing/site-web/sites/${site.id}#design`, () => {
      const t = req.body.reset === "1" ? tokens.DEFAULT_TOKENS : tokensFromBody(req.body, site.tokens);
      pages.updateSite(req.mk.ctx, site.id, { tokens: t });
      const live = pages.listPages(req.mk.ctx, { siteId: site.id }).filter((p) => p.status === "published").length;
      return `Design system enregistré${req.body.reset === "1" ? " (valeurs par défaut)" : ""}.${live ? ` Il s'applique tout de suite aux ${live} page(s) en ligne du site.` : ""}`;
    });
  });
  router.post("/site-web/sites/:id(\\d+)/dupliquer", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    let copy = null;
    attempt(req, res, next, () => (copy ? `/marketing/site-web/sites/${copy.id}` : `/marketing/site-web/sites/${site.id}`), () => {
      copy = pages.duplicateSite(req.mk.ctx, site.id);
      return `Copie créée : « ${copy.name} » (ses pages sont hors ligne, en brouillon).`;
    });
  });
  router.post("/site-web/sites/:id(\\d+)/archiver", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, "/marketing/site-web/sites", () => { pages.archiveSite(req.mk.ctx, site.id); return `Site « ${site.name} » archivé : ses pages sont hors ligne (rien n'est effacé).`; });
  });
  router.post("/site-web/sites/:id(\\d+)/restaurer", need("forms.write"), (req, res, next) => {
    const site = load(req, res);
    if (!site) return;
    attempt(req, res, next, `/marketing/site-web/sites/${site.id}`, () => { pages.restoreSite(req.mk.ctx, site.id); return "Site restauré. Ses pages restent hors ligne : publiez celles qui sont prêtes."; });
  });
  return router;
};
