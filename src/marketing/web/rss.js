// Pages des campagnes RSS (Campagnes → Campagnes RSS) : liste, création, réglages, aperçu du prochain envoi, historique.
// Activer exige le droit d'envoyer des campagnes (comme lancer une campagne) ; créer/modifier, celui de les rédiger.
const express = require("express");
const rss = require("../rss");
const templates = require("../templates");
const audience = require("../audience");
const segments = require("../segments");
const compliance = require("../compliance");
const { blogCategories } = require("../bridge/catalog");
const sendtime = require("../sending/sendtime");
const { MarketingError } = require("../errors");
const { attempt, need } = require("./kit");

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
const STATUS_CLASS = { draft: "", active: "mk-status-ok", paused: "mk-status-warn" };
const workerOn = () => process.env.MARKETING_WORKER === "on";

// Champs du formulaire → service (cases à cocher HTML : « on »)
function inputOf(b) {
  const target = /^(list|segment):(\d+)$/.exec(String(b.target || ""));
  return {
    name: b.name, source: b.source, feedUrl: b.feed_url, blogCategory: b.blog_category, templateId: intOrNull(b.template_id),
    targetType: target ? target[1] : "", targetId: target ? Number(target[2]) : null, category: b.category || "",
    trackClicks: b.track_clicks === "on", trackOpens: b.track_opens === "on", frequency: b.frequency,
    days: Array.isArray(b.days) ? b.days : b.days ? [b.days] : [], monthDay: b.month_day, sendTime: b.send_time, maxItems: Number(b.max_items),
  };
}
// Modèles marketing qui contiennent un bloc « Articles » (seuls utilisables par une campagne RSS)
const rssTemplates = (ctx) => ctx.db.prepare(`SELECT id, name FROM mk_templates WHERE organization_id = ? AND kind = 'marketing' AND EXISTS (SELECT 1 FROM json_each(blocks) j WHERE json_extract(j.value, '$.type') = 'posts') ORDER BY name COLLATE NOCASE`).all(ctx.organizationId);

module.exports = () => {
  const router = express.Router();
  const formData = (ctx) => ({
    rssTemplates: rssTemplates(ctx), lists: audience.listLists(ctx), segments: segments.listSegments(ctx), categories: compliance.listCategories(ctx),
    blogCats: blogCategories(ctx), FREQUENCIES: rss.FREQUENCIES, WEEKDAYS: rss.WEEKDAYS, orgTz: sendtime.orgTimeZone(ctx),
  });
  const asyncAttempt = (req, res, next, back, action) => Promise.resolve().then(action).then((message) => {
    if (message) req.session.mkFlash = { type: "ok", text: message };
    res.redirect(typeof back === "function" ? back() : back);
  }).catch((error) => {
    if (!(error instanceof MarketingError)) return next(error);
    req.session.mkFlash = { type: "error", text: error.message };
    res.redirect(typeof back === "function" ? back() : back);
  });

  router.get("/rss", need("campaigns.read"), (req, res) => {
    res.render("marketing/rss-list", { title: "Campagnes RSS", active: "rss", items: rss.listRss(req.mk.ctx), STATUSES: rss.STATUSES, STATUS_CLASS, FREQUENCIES: rss.FREQUENCIES, WEEKDAYS: rss.WEEKDAYS, workerOn: workerOn() });
  });
  router.get("/rss/nouvelle", need("campaigns.write"), (req, res) => {
    const values = req.session.mkRssDraft ?? null;
    delete req.session.mkRssDraft;
    res.render("marketing/rss-new", { title: "Nouvelle campagne RSS", active: "rss", values, wantedTemplate: intOrNull(req.query.modele), ...formData(req.mk.ctx) });
  });
  // Modèle de départ « Nouveaux articles » (titre, texte, bloc Articles) : prêt à personnaliser dans l'éditeur
  router.post("/rss/modele", need("templates.write"), (req, res, next) => {
    let created = null;
    attempt(req, res, next, () => `/marketing/rss/nouvelle${created ? `?modele=${created.id}` : ""}`, () => {
      const taken = (n) => Boolean(req.mk.ctx.db.prepare("SELECT 1 FROM mk_templates WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(req.mk.ctx.organizationId, n));
      let name = "Nouveaux articles";
      for (let i = 2; taken(name) && i < 100; i++) name = `Nouveaux articles (${i})`;
      created = templates.createTemplate(req.mk.ctx, { name, kind: "marketing", category: "newsletter", subject: "Nouveaux articles sur {{org.name}}", preheader: "Les dernières publications, rien que pour vous", blocks: [
        { type: "heading", text: "Les nouveautés du blog", level: 1 },
        { type: "text", markdown: 'Bonjour {{contact.first_name | default:"à vous"}}, voici les derniers articles publiés.' },
        { type: "posts", count: 5, layout: "excerpt", showImages: true, cta: "Lire l'article" },
      ] });
      return `Modèle « ${name} » créé : vous pouvez le personnaliser dans Modèles d'e-mails.`;
    });
  });
  router.post("/rss", need("campaigns.write"), (req, res, next) => {
    let created = null;
    attempt(req, res, next, () => (created ? `/marketing/rss/${created.id}` : "/marketing/rss/nouvelle"), () => {
      try { created = rss.createRss(req.mk.ctx, inputOf(req.body)); } catch (error) { req.session.mkRssDraft = req.body; throw error; }
      return "Campagne RSS créée (brouillon) : vérifiez l'aperçu du prochain envoi, puis activez-la.";
    });
  });

  const load = (req, res) => {
    const r = rss.getRss(req.mk.ctx, intOrNull(req.params.id));
    if (!r) res.status(404).render("error", { message: "Campagne RSS introuvable." });
    return r;
  };
  router.get("/rss/:id(\\d+)", need("campaigns.read"), async (req, res, next) => {
    try {
      const r = load(req, res);
      if (!r) return;
      const { ctx } = req.mk;
      const preview = await rss.previewRss(ctx, r.id);
      const template = templates.getTemplate(ctx, r.template_id);
      res.render("marketing/rss", {
        title: r.name, active: "rss", r, preview, template, sends: rss.rssSends(ctx, r.id), STATUSES: rss.STATUSES, STATUS_CLASS,
        canWrite: req.mk.can("campaigns.write"), canSend: req.mk.can("campaigns.send"), workerOn: workerOn(), values: null, ...formData(ctx),
      });
    } catch (error) { next(error); }
  });
  router.post("/rss/:id(\\d+)", need("campaigns.write"), (req, res, next) => {
    const r = load(req, res);
    if (!r) return;
    attempt(req, res, next, `/marketing/rss/${r.id}`, () => { rss.updateRss(req.mk.ctx, r.id, inputOf(req.body)); return "Réglages enregistrés."; });
  });
  router.post("/rss/:id(\\d+)/activer", need("campaigns.send"), (req, res, next) => {
    const r = load(req, res);
    if (!r) return;
    asyncAttempt(req, res, next, `/marketing/rss/${r.id}`, async () => {
      const { nextRunAt } = await rss.activateRss(req.mk.ctx, r.id);
      const tz = sendtime.orgTimeZone(req.mk.ctx);
      const when = new Date(nextRunAt).toLocaleString("fr-FR", { timeZone: tz, dateStyle: "full", timeStyle: "short" });
      return `Campagne RSS active : prochaine vérification le ${when} (${tz}). Rien ne part s'il n'y a pas de nouvel article.`;
    });
  });
  router.post("/rss/:id(\\d+)/pause", need("campaigns.send"), (req, res, next) => {
    const r = load(req, res);
    if (!r) return;
    attempt(req, res, next, `/marketing/rss/${r.id}`, () => { rss.pauseRss(req.mk.ctx, r.id); return "Campagne RSS en pause : aucun envoi tant qu'elle n'est pas réactivée."; });
  });
  router.post("/rss/:id(\\d+)/supprimer", need("campaigns.write"), (req, res, next) => {
    const r = load(req, res);
    if (!r) return;
    attempt(req, res, next, "/marketing/rss", () => { rss.deleteRss(req.mk.ctx, r.id); return `Campagne RSS « ${r.name} » supprimée (les envois passés restent dans Toutes les campagnes).`; });
  });
  return router;
};
