// Assistant de création de site (programme 20.6) : routes. Le site vient TOUJOURS de l'adresse (/site-web/assistant/:id), vérifié par le service (organisation + portée de la personne) ; jamais d'un champ de formulaire.
// Droits : forms.read (voir) · forms.write (créer, modifier) · pages.publish (publier) · sites.modules (équipe : modules) · navigation.write (menu). La création d'un site est réservée à l'équipe.
const express = require("express");
const wizard = require("../../siteWizard");
const catalog = require("../../siteWizard/catalog");
const lib = require("../../services/templateLibrary");
const { attempt, need } = require("./kit");
const { MarketingError } = require("../errors");

const BASE = "/marketing/site-web/assistant";

module.exports = () => {
  const router = express.Router();
  const jsonBody = express.json({ limit: "16kb" });
  const id = (req) => Number(req.params.id);
  const W = (siteId) => `/marketing/site-web/sites/${siteId}/assistant`;
  const back = (req, step) => `${W(id(req))}${step ? `?etape=${step}` : ""}`;
  const fail = (res, next, error) => {
    if (error instanceof MarketingError) return res.status(error.code === "not_found" ? 404 : error.code === "forbidden" ? 403 : error.code === "conflict" ? 409 : 422).json({ ok: false, error: error.message });
    return next(error);
  };
  // Une erreur « introuvable » ou « interdit » sur une page HTML devient la page d'erreur habituelle
  const page = (handler) => (req, res, next) => {
    try { handler(req, res, next); } catch (error) {
      if (error instanceof MarketingError) return res.status(error.code === "not_found" ? 404 : error.code === "forbidden" ? 403 : 422).render("error", { message: error.message });
      next(error);
    }
  };

  // Accueil de l'assistant : trois modes, reprise des créations en cours
  router.get("/site-web/assistant", need("forms.read"), page((req, res) => {
    const ctx = req.mk.ctx, team = !req.mk.siteOnly;
    const packs = team ? lib.packs(ctx) : [];
    res.render("marketing/site-wizard-hub", { title: "Créer un site", active: "sites", marketingShell: true, catalog, packs, inProgress: wizard.listInProgress(ctx), canCreate: team && req.mk.can("forms.write"), BASE, modeLabels: catalog.MODES });
  }));
  router.post("/site-web/assistant/demarrer", need("forms.write"), (req, res, next) => {
    let created = null;
    attempt(req, res, next, () => (created ? W(created.id) : BASE), () => {
      created = wizard.start(req.mk.ctx, { mode: req.body.mode, category: req.body.category, name: req.body.name, pack: req.body.pack, can: (p) => req.mk.can(p), userId: req.session.user.id });
      return `Site « ${created.name} » créé en brouillon. Rien n'est publié.`;
    });
  });

  // Étape courante (ou celle demandée) — rendu serveur, navigation par adresses : reprise possible à tout moment
  router.get("/site-web/sites/:id(\\d+)/assistant", need("forms.read"), page((req, res) => {
    const ctx = req.mk.ctx, siteId = id(req);
    const st = wizard.state(ctx, siteId);
    const step = catalog.STEP_KEYS.includes(String(req.query.etape)) ? String(req.query.etape) : st.step;
    const view = { siteId, st, step, catalog, BASE, W: W(siteId), can: { write: req.mk.can("forms.write") && !st.readOnly, publish: req.mk.can("pages.publish"), modules: req.mk.can("sites.modules") && !req.mk.siteOnly, menu: req.mk.can("navigation.write"), domains: req.mk.can("sites.domains") } };
    const data = st.data, infos = (data.drafts && data.drafts.infos) || data.infos || {};
    if (step === "infos") Object.assign(view, { values: { name: st.site.name, description: st.site.description || "", ...infos }, countries: catalog.COUNTRIES, langs: catalog.LANGUAGES, currencies: catalog.CURRENCIES,
      fmt: wizard.formats({ country: infos.country, lang: infos.lang, currency: infos.currency, timezone: infos.timezone }), zones: Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : [] });
    if (step === "identite") Object.assign(view, { values: (data.drafts && data.drafts.identite) || {}, tk: require("../pages/tokens"), site: st.site, palettes: require("../../services/stylePalettes").PALETTES });
    if (step === "pages") Object.assign(view, { ps: wizard.pagesState(ctx, siteId), templates: require("../pages/templates").catalog() });
    if (step === "contenus") view.contents = wizard.contentOf(ctx, siteId);
    if (step === "fonctions") view.features = wizard.featuresState(ctx, siteId);
    if (step === "apercu") Object.assign(view, { alerts: wizard.previewAlerts(ctx, siteId), ps: wizard.pagesState(ctx, siteId), devices: wizard.DEVICES, device: wizard.DEVICES[req.query.appareil] ? String(req.query.appareil) : "ordinateur", pageId: Number(req.query.page) || null });
    if (step === "publication") view.pub = wizard.publicationState(ctx, siteId);
    res.set("Cache-Control", "no-store").render("marketing/site-wizard", { title: `Création de « ${st.site.name} »`, active: "sites", marketingShell: true, ...view });
  }));

  // ── enregistrements d'étape (formulaires classiques : fonctionnent sans JavaScript) ───────────────────────────────────────────────
  router.post("/site-web/sites/:id(\\d+)/assistant/infos", need("forms.write"), (req, res, next) => {
    attempt(req, res, next, () => back(req, "identite"), () => { wizard.saveInfos(req.mk.ctx, id(req), req.body, { revision: req.body.revision }); return "Informations enregistrées."; });
  });
  router.post("/site-web/sites/:id(\\d+)/assistant/identite", need("forms.write"), (req, res, next) => {
    attempt(req, res, next, () => back(req, "pages"), () => { wizard.saveIdentity(req.mk.ctx, id(req), req.body, { revision: req.body.revision }); return "Identité visuelle enregistrée dans les styles du site."; });
  });
  router.post("/site-web/sites/:id(\\d+)/assistant/pages/action", need("forms.write"), (req, res, next) => {
    attempt(req, res, next, () => back(req, "pages"), () => wizard.pageAction(req.mk.ctx, id(req), String(req.body.action || ""), req.body).message);
  });
  router.post("/site-web/sites/:id(\\d+)/assistant/pages/proposees", need("forms.write"), (req, res, next) => {
    attempt(req, res, next, () => back(req, "pages"), () => { const r = wizard.createProposed(req.mk.ctx, id(req), req.body.keys); return `${r.created} page(s) créée(s) en brouillon.`; });
  });
  router.post("/site-web/sites/:id(\\d+)/assistant/pages/menu", need("forms.write"), need("navigation.write"), (req, res, next) => {
    attempt(req, res, next, () => back(req, "contenus"), () => { const r = wizard.applyMenu(req.mk.ctx, id(req), { can: (p) => req.mk.can(p), userId: req.session.user.id }); return `Menu « ${r.menu.name} » créé et affecté à l'en-tête s'il était libre. Il reste en brouillon tant qu'il n'est pas publié (Apparence → Menus).`; });
  });
  router.post("/site-web/sites/:id(\\d+)/assistant/pages/terminer", need("forms.write"), (req, res, next) => {
    attempt(req, res, next, () => back(req, "contenus"), () => { wizard.completePages(req.mk.ctx, id(req), { revision: req.body.revision }); return "Structure des pages validée."; });
  });
  router.post("/site-web/sites/:id(\\d+)/assistant/contenus/:pid(\\d+)", need("forms.write"), (req, res, next) => {
    attempt(req, res, next, () => back(req, "contenus"), () => { wizard.saveContent(req.mk.ctx, id(req), Number(req.params.pid), req.body); return "Contenu enregistré dans le brouillon de la page."; });
  });
  router.post("/site-web/sites/:id(\\d+)/assistant/fonctions/terminer", need("forms.write"), (req, res, next) => {
    attempt(req, res, next, () => back(req, "apercu"), () => { wizard.completeFeatures(req.mk.ctx, id(req)); return "Fonctionnalités validées."; });
  });
  router.post("/site-web/sites/:id(\\d+)/assistant/fonctions/:key([a-z_]{2,30})", need("forms.write"), need("sites.modules"), (req, res, next) => {
    attempt(req, res, next, () => back(req, "fonctions"), () => {
      if (req.mk.siteOnly) throw new MarketingError("forbidden", "L'activation des modules est réservée à l'équipe de l'organisation.");
      const r = wizard.setFeature(req.mk.ctx, id(req), req.params.key, req.body.etat === "activer");
      return r.enabled && r.needs ? { text: "Module activé.", detail: `À configurer par vous : ${r.needs} Rien n'est connecté automatiquement.` } : r.enabled ? "Module activé." : "Module désactivé (aucune donnée supprimée).";
    });
  });
  router.post("/site-web/sites/:id(\\d+)/assistant/ignorer", need("forms.write"), (req, res, next) => {
    let next_ = null;
    attempt(req, res, next, () => back(req, next_), () => { const step = String(req.body.etape || ""); wizard.skip(req.mk.ctx, id(req), step); next_ = catalog.STEP_KEYS[catalog.STEP_KEYS.indexOf(step) + 1] || step; return "Étape ignorée : vous pouvez y revenir à tout moment."; });
  });
  router.post("/site-web/sites/:id(\\d+)/assistant/publier", need("forms.write"), need("pages.publish"), (req, res, next) => {
    attempt(req, res, next, () => back(req, "publication"), () => {
      const r = wizard.publish(req.mk.ctx, id(req), { confirm: req.body.confirmer === "oui", pageIds: [].concat(req.body.pages || []), can: (p) => req.mk.can(p) });
      const ok = r.results.filter((x) => x.ok).length, ko = r.results.filter((x) => !x.ok);
      return { text: `${ok} page(s) publiée(s)${ko.length ? `, ${ko.length} refusée(s)` : ""}. Le domaine n'est pas modifié.`, detail: ko.map((x) => `${x.name} : ${x.error}`).join("\n") || undefined };
    });
  });

  // Sauvegarde automatique (JSON) : brouillon de formulaire, sans effet sur le site. Les erreurs sont renvoyées proprement (conflit, session expirée → le navigateur réessaie).
  router.post("/site-web/sites/:id(\\d+)/assistant/brouillon", need("forms.write"), jsonBody, (req, res, next) => {
    try {
      const b = req.body && typeof req.body === "object" ? req.body : {};
      const out = wizard.saveFormDraft(req.mk.ctx, id(req), String(b.step || ""), b.fields && typeof b.fields === "object" ? b.fields : {}, { revision: b.revision });
      res.set("Cache-Control", "no-store").json({ ok: true, revision: out.revision });
    } catch (error) { fail(res, next, error); }
  });
  return router;
};
module.exports.BASE = BASE;
