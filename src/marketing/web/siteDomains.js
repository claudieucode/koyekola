// Domaines d'un site (TITAN XXXII) : liste, ajout d'un domaine personnalisé, vérification de propriété (TXT) / DNS / HTTPS, domaine principal, retrait, adresse de plateforme.
// Garde : permission « sites.domains » (administrateur) ET appartenance du site vérifiée par le serveur (jamais le site_id envoyé par le navigateur). Une personne limitée à
// UN site ne gère que les domaines de CE site ; le site principal n'a pas de domaine de site (SITE_URL).
const express = require("express");
const primarySite = require("../../services/primarySite");
const domains = require("../../services/siteDomains");
const urls = require("../../services/urls");
const { attempt, need } = require("./kit");
const { MarketingError } = require("../errors");

module.exports = () => {
  const router = express.Router();
  const loadSite = (req, res) => {
    const ctx = req.mk.ctx;
    const site = ctx.db.prepare(`SELECT id, name, slug, status, deleted_at FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(ctx.db)}`).get(Number(req.params.id), ctx.organizationId);
    if (!site || site.deleted_at || (Number.isInteger(ctx.siteScope) && ctx.siteScope !== site.id)) { res.status(404).render("error", { message: "Site introuvable." }); return null; }
    return site;
  };
  const back = (site) => `/marketing/site-web/sites/${site.id}/domaines`;
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, detail }; };

  router.get("/site-web/sites/:id(\\d+)/domaines", need("sites.domains"), async (req, res, next) => {
    try {
      const site = loadSite(req, res);
      if (!site) return;
      const ctx = req.mk.ctx;
      const list = domains.listForSite(ctx.db, site.id);
      const instructions = {};
      for (const d of list) if (d.status === "pending") instructions[d.id] = await domains.instructions(d);
      const routing = list.some((d) => d.kind === "custom") ? (await domains.instructions({ status: "verified", host: "" })).routing : null;
      res.render("marketing/site-domains", { title: `Domaines de ${site.name}`, active: "espace/reglages", site, domains: list, instructions, routing, platform: domains.platformStatus(), mainHost: urls.mainHost(), verifRequise: domains.mode() === "strict", canWrite: true });
    } catch (error) { next(error); }
  });

  router.post("/site-web/sites/:id(\\d+)/domaines", need("sites.domains"), (req, res, next) => {
    const site = loadSite(req, res);
    if (!site) return;
    attempt(req, res, next, back(site), () => {
      const d = domains.addCustomDomain(req.mk.ctx, site.id, req.body.domaine);
      return d.status === "verified" ? `Domaine « ${d.host} » ajouté.` : `Domaine « ${d.host} » ajouté, en attente de vérification : publiez l'enregistrement TXT indiqué chez votre fournisseur de domaine, puis cliquez sur « Vérifier ». Rien n'est servi avant cette preuve de propriété.`;
    });
  });

  router.post("/site-web/sites/:id(\\d+)/domaines/plateforme", need("sites.domains"), (req, res, next) => {
    const site = loadSite(req, res);
    if (!site) return;
    attempt(req, res, next, back(site), () => { const d = domains.ensurePlatformDomain(req.mk.ctx, site.id); return `Adresse de la plateforme : https://${d.host}. Son accès public dépend du DNS et du certificat de la plateforme : consultez les états DNS et HTTPS.`; });
  });

  router.post("/site-web/sites/:id(\\d+)/domaines/:did(\\d+)/verifier", need("sites.domains"), async (req, res, next) => {
    try {
      const site = loadSite(req, res);
      if (!site) return;
      const d = await domains.verifyDomain(req.mk.ctx, site.id, Number(req.params.did));
      if (d.status === "pending") flash(req, "error", `Vérification impossible pour l'instant : ${d.last_check_error || "enregistrement TXT introuvable."}`);
      else if (d.operational) flash(req, "ok", `Domaine « ${d.host} » vérifié et opérationnel (DNS et HTTPS contrôlés).`);
      else flash(req, "ok", `Domaine « ${d.host} » : propriété prouvée.`, d.note);
      res.redirect(back(site));
    } catch (error) {
      if (error instanceof MarketingError) { flash(req, "error", error.message); return res.redirect(`/marketing/site-web/sites/${Number(req.params.id)}/domaines`); }
      next(error);
    }
  });

  router.post("/site-web/sites/:id(\\d+)/domaines/:did(\\d+)/principal", need("sites.domains"), (req, res, next) => {
    const site = loadSite(req, res);
    if (!site) return;
    attempt(req, res, next, back(site), () => { const d = domains.setCanonical(req.mk.ctx, site.id, Number(req.params.did)); return `« ${d.host} » est le domaine principal : les autres domaines du site y redirigent.`; });
  });

  router.post("/site-web/sites/:id(\\d+)/domaines/:did(\\d+)/retirer", need("sites.domains"), (req, res, next) => {
    const site = loadSite(req, res);
    if (!site) return;
    attempt(req, res, next, back(site), () => { const d = domains.disableDomain(req.mk.ctx, site.id, Number(req.params.did)); return `Domaine « ${d.host} » retiré : il ne sert plus ce site.`; });
  });

  return router;
};
