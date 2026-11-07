// Pages d'atterrissage publiques (/p/<adresse>) : aucune session ni compte. Mêmes protections que les formulaires
// publics (champ piège, limite par IP, case de consentement revérifiée ici). Les clics passent par /p/<adresse>/clic/<n>
// qui ne redirige QUE vers un lien enregistré dans la page (jamais une adresse fournie par le visiteur).
const express = require("express");
const landing = require("../landing");
const perfEngine = require("../../perfEngine");
const pages = require("../pages");
const { tokensToCss } = require("../pages/tokens");
const forms = require("../forms");
const { tagContact } = require("../audience/tags");
const { createRateLimiter } = require("../../middlewares/security");
const { sendSubscriptionConfirmation } = require("../../utils/mailer");
const { renderMarkdown } = require("../../utils/markdown");
const antispam = require("../forms/antispam");
const formUpload = require("./formUpload");
const visitorsLib = require("../visitors");
const { consentedVisitor } = require("./visitorsPublic");
const funnels = require("../funnels");
const funnelEvents = require("../funnels/events");
const { visibleTree, audienceMatches, walk } = require("../pages/nodes");
const { visitorContext } = require("../pages/visitorContext");
const abtests = require("../pages/abtests");

const PENDING_TEXT = "Merci ! Un e-mail de confirmation vient de vous être envoyé : cliquez sur le lien qu'il contient pour finaliser votre inscription (pensez aux courriers indésirables).";

module.exports = ({ db }) => {
  const router = express.Router();
  const limiter = createRateLimiter(5, 60 * 60 * 1000);
  const secret = () => process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || "kolakisa";

  router.use("/p", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready) return res.status(503).render("error", { message: "Cette page est momentanément indisponible." });
    req.mkPages = { organizationId: marketing.organizationId, bus: marketing.bus, settings: marketing.settings };
    res.locals.formToken = antispam.issue(); // anti-robot des inscriptions (voir forms/antispam.js)
    next();
  });
  const ctxOf = (req) => ({ db, organizationId: req.mkPages.organizationId, userId: null, bus: req.mkPages.bus, settings: req.mkPages.settings, baseUrl: process.env.SITE_URL });
  // R7 lot 3 : le formulaire d'un AUTRE site que celui de la page n'est jamais affiché (donnée historique incluse) — le rendu ne contourne pas la règle d'isolation
  const sameSite = (page, f) => Boolean(f) && (f.siteId ?? null) === (page.site_id ?? null);
  const loadForm = (page) => { if (!page.form_id) return null; const f = forms.getForm({ db, organizationId: page.organization_id }, page.form_id); return sameSite(page, f) ? f : null; };
  // Page affichée : composants synchronisés résolus, formations relues dans le catalogue
  // Personnalisation : sections et éléments filtrés selon ce que le site sait réellement du visiteur
  const shownPage = (req, page) => {
    const visitor = visitorContext(db, req.mkPages.organizationId, req);
    // En-tête et pied de page du site (composants choisis dans le site) autour des sections de la page
    return landing.viewModel(ctxOf(req), { ...page, visitor, sections: pages.withSiteParts(ctxOf(req), { ...page, visitor }, pages.resolveSections(ctxOf(req), page.sections), { themeBuilder: true }).filter((s) => !s.hidden && audienceMatches(s.audience, visitor)).map((s) => (s.type === "layout" ? { ...s, children: visibleTree(s.children, visitor) } : s)) });
  };
  // Design system du site de la page (site actif seulement)
  const siteOf = (req, page) => { const site = page.site_id ? pages.getSite(ctxOf(req), page.site_id) : null; return site && site.status === "active" ? site : null; };
  // widget : identifiant du widget « Formulaire » concerné (son message / ses erreurs ne touchent que lui)
  const show = (req, res, page, { status = 200, error = null, values = {}, thanks = null, widget = null } = {}) => {
    const form = loadForm(page);
    // Palier 18 : une page servie dans un tunnel actif reçoit les réglages de CONTEXTE de son étape (noindex, pied de page masqué) — la page CMS reste une seule ressource
    const funnelContext = funnels.contextForPage(db, page);
    res.status(status).render("marketing-public/landing", {
      funnelContext, page: { ...shownPage(req, page), funnelNoindex: Boolean(funnelContext && funnelContext.noindex) }, site: siteOf(req, page), tokensToCss, form: form && form.status === "published" ? form : null, fieldCatalog: forms.FIELD_CATALOG,
      propertyDefs: form ? forms.propertyFieldDefs(db, page.organization_id, form) : [], renderMarkdown, preview: false,
      error: widget ? null : error, values: widget ? {} : values, thanks: widget ? null : thanks, widgetForm: widget ? { id: widget, error, values, thanks } : null,
    }, (err, html) => {
      if (err) return req.next(err);
      // Programme 22.9 : l'image principale visible d'emblée n'est pas différée (réglage par site, activé par défaut) ; jamais d'échec de page pour une optimisation
      try { if (perfEngine.lcpEnabled(db, page.site_id)) html = perfEngine.prioritizeLcp(html).html; } catch { /* page servie telle quelle */ }
      res.send(html);
    });
  };
  // Widget « Formulaire » de la page (dans une section libre) : son formulaire, ou null
  const widgetOf = (page, id) => {
    if (!/^[a-z0-9]{6,20}$/.test(String(id || ""))) return null;
    let found = null;
    for (const s of page.sections) if (s.type === "layout") walk(s.children, (n) => { if (n.id === id && n.type === "signupform" && !n.hidden) found = n; });
    if (!found) return null;
    try { const f = forms.getForm({ db, organizationId: page.organization_id }, Number(found.props.formId)); return sameSite(page, f) ? f : null; } catch { return null; }
  };

  // Test A/B en cours : version du visiteur (collante s'il a accepté le suivi, sinon stable pour la journée, sans cookie) et contenu correspondant
  const forVisitor = (req, page) => {
    const test = abtests.runningTestFor(db, page.id);
    if (!test || !test.variantB) return { page, test: null, visitor: null };
    const { visitor, variant, consent } = abtests.assignment(db, test, { vid: consentedVisitor(req), fingerprint: landing.visitorOf(req, secret()) });
    const shown = variant === "b" ? { ...page, sections: test.variantB.sections, title: test.variantB.title, description: test.variantB.description } : page;
    return { page: shown, test, visitor, variant, consent };
  };

  router.get("/p/:slug", (req, res) => {
    const published = landing.getPublishedPage(db, req.params.slug, { standalone: true });
    if (!published) return res.status(404).render("error", { message: "Cette page n'existe pas ou n'est plus en ligne." });
    const { page, test, visitor, consent } = forVisitor(req, published);
    if (!page) return res.status(404).render("error", { message: "Cette page n'existe pas ou n'est plus en ligne." });
    const widget = req.query.w && widgetOf(page, req.query.w) ? String(req.query.w) : null;
    const thanks = req.query.inscrit === "1" ? (req.query.confirmer === "1" ? PENDING_TEXT : ((widget ? widgetOf(page, widget) : loadForm(page)) || {}).thankYouText || "Merci, votre inscription est enregistrée.") : null;
    // Retour sur la page après sa propre inscription : pas une nouvelle visite. Arrivée sur l'étape suivante d'un tunnel
    // (remerciement…) : c'est bien une visite de cette page.
    const selfReturn = thanks && (widget || page.sections.some((s) => s.type === "form"));
    const exposure = Boolean(test) && !selfReturn && !landing.isBot(req);
    if (!selfReturn && !landing.isBot(req)) {
      landing.record(db, page, "view", landing.visitorOf(req, secret()));
    }
    show(req, res, page, { thanks, widget });
    // Exposition : seulement si la page a réellement été servie (réponse 200) — une erreur de rendu n'expose personne
    if (exposure) {
      const record = () => { if (res.statusCode === 200) { try { abtests.recordView(db, test, visitor, Date.now(), { consent }); } catch (error) { console.error("[KOLAKISA] Exposition A/B :", error.message); } } };
      if (res.writableEnded || res.headersSent) record(); else res.once("finish", record);
    }
  });

  router.get("/p/:slug/clic/:n(\\d{1,3})", (req, res) => {
    const published = landing.getPublishedPage(db, req.params.slug, { standalone: true });
    if (!published) return res.status(404).render("error", { message: "Cette page n'existe pas ou n'est plus en ligne." });
    const { page, test, visitor } = forVisitor(req, published);
    const link = landing.linksOf(shownPage(req, page))[Number(req.params.n)];
    if (!link) return res.redirect(`/p/${page.slug}`);
    if (!landing.isBot(req)) {
      landing.record(db, page, "click", landing.visitorOf(req, secret()), link.label);
      if (test) abtests.recordConversion(db, test, visitor, "click");
    }
    // Palier 19 : un contact connu (visiteur ayant accepté la mesure) qui clique un bouton d'une étape de tunnel produit « funnel.cta.clicked » (le tunnel produit, l'automatisation décide)
    try {
      const vid = consentedVisitor(req);
      const known = vid ? db.prepare("SELECT contact_id FROM mk_web_visitors WHERE id = ?").get(vid) : null;
      if (known && known.contact_id && !landing.isBot(req)) {
        const cctx = { ...ctxOf({ mkPages: { organizationId: page.organization_id, bus: req.app.locals.marketing && req.app.locals.marketing.bus, settings: null } }), audit: false };
        const contact = db.prepare("SELECT id, email FROM mk_contacts WHERE id = ? AND organization_id = ?").get(known.contact_id, page.organization_id);
        const dest = link.url === funnels.NEXT_URL ? "next_step" : /^\/etape\/\d+$/.test(link.url) ? "step" : /^https?:\/\//i.test(link.url) ? "external" : "internal";
        if (contact) funnelEvents.emitCta(cctx, contact, funnelEvents.stepsWhere(cctx, "s.page_id = ?", page.id), { label: link.label, index: Number(req.params.n), destination: dest });
      }
    } catch (error) { console.error("[KOLAKISA] Événements du tunnel (bouton) :", error.message); }
    // Bouton « étape suivante » : la prochaine étape en ligne du tunnel de la page (sinon, retour sur la page)
    if (link.url === funnels.NEXT_URL) return res.redirect(funnels.nextUrlForPage(db, page) || `/p/${page.slug}`);
    // Bouton « étape précise du tunnel » (/etape/<identifiant>) : seulement une étape du MÊME tunnel, atteignable ; sinon retour sur la page (jamais d'adresse inventée)
    const specific = /^\/etape\/(\d{1,9})$/.exec(link.url);
    if (specific) return res.redirect(funnels.stepUrlForPage(db, page, Number(specific[1])) || `/p/${page.slug}`);
    res.redirect(link.url);
  });

  router.post("/p/:slug/inscription", formUpload, (req, res, next) => {
    const published = landing.getPublishedPage(db, req.params.slug, { standalone: true });
    if (!published) return res.status(404).render("error", { message: "Cette page n'existe pas ou n'est plus en ligne." });
    const { page, test, visitor } = forVisitor(req, published);
    // Widget « Formulaire » (w = son identifiant) ou section d'inscription de la page : même circuit, même protections
    const widget = req.body && req.body.w ? String(req.body.w) : null;
    const form = widget ? widgetOf(page, widget) : loadForm(page);
    const back = widget ? `w=${widget}#kw-f-${widget}` : "#inscription";
    const at = (q) => `/p/${page.slug}?${q}${widget ? "&" + back : back}`;
    if (!form || form.status !== "published") return show(req, res, page, { status: 400, error: "L'inscription n'est pas disponible pour le moment.", widget: form ? widget : null });
    // Robot (champ piège rempli, jeton absent ou envoi trop rapide) : faux succès silencieux
    if (String(req.body.website || "").trim() || !antispam.check(req.body.ft)) return res.redirect(at("inscrit=1"));
    if (req.uploadError) return show(req, res, page, { status: 400, error: req.uploadError, values: req.body, widget });
    if (limiter.isLimited(req.ip)) return show(req, res, page, { status: 429, error: "Trop de tentatives : réessayez dans un instant.", values: req.body, widget });
    if (!req.body.consent) return show(req, res, page, { status: 400, error: "Cochez la case pour confirmer votre inscription.", values: req.body, widget });
    limiter.hit(req.ip);
    try {
      const ctx = ctxOf(req);
      const result = forms.submitForm(ctx, form.id, { ...req.body, ip: req.ip, file: req.file, page: `/p/${page.slug}` });
      if (!result.ok) return show(req, res, page, { status: 400, error: result.reason === "invalid_email" ? "Adresse e-mail invalide." : result.message || "Inscription impossible pour le moment.", values: req.body, widget });
      // Étiquettes propres à la page (en plus de celles du formulaire) : on sait d'où vient l'inscription
      if (result.contact && !result.withheld) for (const tag of page.tags) tagContact({ ...ctx, audit: false }, result.contact.id, tag); // R7 lot 3 : jamais d'étiquette sur un contact d'une autre origine
      landing.record(db, page, "signup", landing.visitorOf(req, secret()), result.pending ? "en attente de confirmation" : "confirmée");
      if (test) abtests.recordConversion(db, test, visitor, "signup");
      if (result.contact && !result.withheld && consentedVisitor(req)) visitorsLib.recordFormSubmit(db, page.organization_id, { visitorId: consentedVisitor(req), contactId: result.contact.id, path: `/p/${page.slug}`, formName: form.name });
      // Palier 19 : le formulaire d'une étape de tunnel TERMINE cette étape (fait établi côté serveur) ; le parcours déjà suivi de ce visiteur rejoint son contact, daté de son vrai moment
      if (result.contact && !result.withheld) { // R7 lot 3 : ni parcours de visiteur ni étape de tunnel rattachés à un contact d'une autre origine
        try {
          const fctx = { ...ctx, userId: null, audit: false };
          const contactRow = { id: result.contact.id, email: result.contact.email };
          if (consentedVisitor(req)) funnelEvents.replayVisitor(fctx, consentedVisitor(req), result.contact.id);
          funnelEvents.emitFormCompletion(fctx, contactRow, funnelEvents.stepsWhere(fctx, "s.page_id = ?", page.id));
        } catch (error) { console.error("[KOLAKISA] Événements du tunnel (formulaire) :", error.message); }
      }
      // Page d'un tunnel : le visiteur passe à l'étape suivante (une page du tunnel affiche le message de confirmation ;
      // une formation, non : en attente de confirmation, il reste donc ici pour lire la consigne)
      const next = funnels.nextUrlForPage(db, page);
      const toNext = next && (next.startsWith("/p/") || !result.pending) ? next : null;
      if (result.pending) {
        const base = String(process.env.SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
        sendSubscriptionConfirmation(db, { to: result.email, formName: form.name, url: `${base}/f/confirmer/${result.token}` });
        return res.redirect(toNext ? `${toNext}?inscrit=1&confirmer=1` : at("inscrit=1&confirmer=1"));
      }
      res.redirect(toNext ? (toNext.startsWith("/p/") ? `${toNext}?inscrit=1` : toNext) : at("inscrit=1"));
    } catch (error) {
      next(error);
    }
  });
  return router;
};
