// Campagnes → Réseaux sociaux (point 12 de la parité Mailchimp) : écrire une publication, la publier tout de suite ou la
// programmer sur Facebook, Instagram et LinkedIn ; suivi (statut réel, lien, clics) ; Paramètres → Réseaux sociaux.
const express = require("express");
const social = require("../social");
const web = require("../social/webVersion");
const media = require("../media");
const { MarketingError } = require("../errors");
const { attempt, need } = require("./kit");

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
const asArray = (v) => (Array.isArray(v) ? v : v === undefined || v === "" ? [] : [v]);
function parseWhen(body) {
  if (body.when !== "later") return undefined;
  const raw = String(body.send_at_utc || body.send_at || "").trim();
  const ms = Date.parse(/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw}Z`);
  if (!raw || !Number.isFinite(ms)) throw new MarketingError("invalid_field", "Indiquez la date et l'heure de publication.");
  return ms;
}
const absolute = (base, path) => (/^https:\/\//i.test(path) ? path : path && path.startsWith("/") && base ? `${base}${path}` : "");

module.exports = () => {
  const router = express.Router();
  // R7 lot 6.3 : un accès limité à un site garde son site dans l'adresse de retour (sinon l'écran lui serait refusé)
  const home = (req) => (req.mk.siteOnly ? `/marketing/reseaux?site=${req.mk.siteId}` : "/marketing/reseaux");

  router.get("/reseaux", need("campaigns.read"), (req, res) => {
    const { ctx } = req.mk;
    const base = String(process.env.SITE_URL || "").replace(/\/+$/, "");
    // Partager une campagne envoyée : lien = sa version web, texte = son objet, image = la première de l'e-mail
    let prefill = { body: "", link: "", image: "", campaignId: "" };
    const cid = intOrNull(req.query.campagne);
    if (cid) {
      const c = web.publishableCampaign(ctx.db, ctx.organizationId, cid);
      if (c && (!req.mk.siteOnly || c.site_id === ctx.siteScope)) { const v = web.renderWebVersion(ctx, c); prefill = { body: v.subject + (v.preheader ? `\n\n${v.preheader}` : ""), link: web.webUrl(ctx, c.id), image: v.image, campaignId: c.id }; }
    }
    res.render("marketing/social", {
      title: "Réseaux sociaux", active: "social", posts: social.listPosts(ctx), cfg: social.getSocialView(ctx), siteOnly: req.mk.siteOnly, siteChoices: req.mk.siteOnly ? [] : social.listSiteGrants(ctx).filter((s) => s.moduleEnabled && s.networks.length), NETWORKS: social.NETWORKS, LIMITS: social.LIMITS,
      images: media.listMedia(require("../media/requestContext").mediaCtx(req), { kind: "image", limit: 60 }).items.map((m) => ({ ...m, url: absolute(base, m.path) })).filter((m) => m.url),
      prefill, canWrite: req.mk.can("campaigns.write"), httpsSite: base.startsWith("https://"),
    });
  });
  router.post("/reseaux", need("campaigns.write"), (req, res, next) => {
    attempt(req, res, next, home(req), () => {
      const b = req.body;
      const r = social.createPosts(req.mk.ctx, {
        siteId: req.mk.siteOnly ? undefined : b.for_site, // accès limité : toujours SON site (jamais celui du corps)
        networks: asArray(b.networks), body: b.body, linkUrl: b.link_url, imageUrl: b.image_lib || b.image_url, campaignId: intOrNull(b.campaign_id) ?? undefined, scheduledAt: parseWhen(b),
      });
      const n = r.ids.length;
      return r.scheduledAt > Date.now() + 60000 ? `${n} publication${n > 1 ? "s" : ""} programmée${n > 1 ? "s" : ""}.` : `${n} publication${n > 1 ? "s" : ""} en cours d'envoi : le statut s'affiche ci-dessous (rechargez dans un instant).`;
    });
  });
  for (const [path, fn, text] of [["annuler", social.cancelPost, "Publication annulée."], ["relancer", social.retryPost, "Publication relancée."], ["supprimer", social.deletePost, "Publication retirée de la liste (rien n'est supprimé sur le réseau)."]]) {
    router.post(`/reseaux/:id(\\d+)/${path}`, need("campaigns.write"), (req, res, next) => {
      attempt(req, res, next, home(req), () => { fn(req.mk.ctx, Number(req.params.id)); return text; });
    });
  }

  // ---------- Paramètres → Réseaux sociaux ----------
  router.get("/reseaux/reglages", need("settings.read"), (req, res) => {
    res.render("marketing/social-settings", { title: "Réseaux sociaux", active: "socialsettings", cfg: social.getSocialConfig(req.mk.ctx), grants: social.listSiteGrants(req.mk.ctx), NETWORKS: social.NETWORKS, canWrite: req.mk.can("settings.write") });
  });
  // Autorisations de publier par site : équipe seulement (route d'organisation, refusée à tout accès limité à un site)
  router.post("/reseaux/reglages/sites", need("settings.write"), (req, res, next) => {
    attempt(req, res, next, "/marketing/reseaux/reglages", () => {
      const r = social.setSiteGrants(req.mk.ctx, intOrNull(req.body.site_id), asArray(req.body.networks));
      return r.added.length || r.removed.length ? "Autorisations du site enregistrées." : "Aucun changement.";
    });
  });
  router.post("/reseaux/reglages", need("settings.write"), (req, res, next) => {
    attempt(req, res, next, "/marketing/reseaux/reglages", () => {
      const b = req.body;
      social.saveSocialConfig(req.mk.ctx, {
        facebookPageId: b.facebook_page_id, instagramUserId: b.instagram_user_id, linkedinAuthor: b.linkedin_author,
        facebookToken: b.facebook_token, linkedinToken: b.linkedin_token, clearFacebook: b.clear_facebook === "1", clearLinkedin: b.clear_linkedin === "1",
      });
      return "Réglages des réseaux sociaux enregistrés.";
    });
  });
  router.post("/reseaux/reglages/tester/:network(facebook|instagram|linkedin)", need("settings.write"), (req, res, next) => {
    social.testConnection(req.mk.ctx, req.params.network)
      .then((r) => { req.session.mkFlash = { type: r.ok ? "ok" : "error", text: r.message }; res.redirect("/marketing/reseaux/reglages"); })
      .catch((error) => { if (!(error instanceof MarketingError)) return next(error); req.session.mkFlash = { type: "error", text: error.message }; res.redirect("/marketing/reseaux/reglages"); });
  });
  return router;
};
