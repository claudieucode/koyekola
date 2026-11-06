// KOLAKISA CMS → Personnaliser : écran plein cadre (panneau de réglages à gauche, aperçu réel du site à droite).
// Le site vient de l'adresse vérifiée par le serveur (« ?site=<id> »), jamais d'un état global ; sans site, c'est le site principal (équipe seulement).
// Droits : appearance.read (ouvrir) · appearance.styles (brouillon) · appearance.publish (publier) · pages.code (CSS additionnel) · seo.edit (description du site).
// Réglages de design : UN seul moteur (services/siteStyles), le même que Apparence → Styles ; l'écran appelle ses routes /site-web/styles/{rendu,brouillon,annuler,publier,restaurer}
// (aperçu réel, brouillon, publication, versions) : aucune seconde logique de publication. Menus, widgets et en-tête/pied (Theme Builder) restent gérés par leurs écrans,
// qui sont affichés ici sans être dupliqués. Seul le choix de la page d'accueil d'un site est écrit directement (route /site-web/personnaliser/accueil).
const express = require("express");
const target = require("./siteTarget");
const pages = require("../pages");
const navigation = require("../../services/navigation");
const widgets = require("../../services/widgets");
const widgetCatalog = require("../widgets/catalog");
const siteStyles = require("../../services/siteStyles");
const { recordAudit } = require("../audit");
const { UserError } = require("../../utils/errors");
const { need, safeJson } = require("./kit");
const categories = require("./personnaliserCategories");
const { previewTargets } = require("./styles");

const BASE = "/marketing/site-web/personnaliser";
const API = "/marketing/site-web/styles";
// Formats d'aperçu : largeur du viewport simulé (null = toute la largeur disponible). Ajouter un format = ajouter une ligne.
const DEVICES = Object.freeze([
  { id: "desktop", label: "Ordinateur", width: null },
  { id: "tablet", label: "Tablette", width: 768 },
  { id: "mobile", label: "Mobile", width: 375 },
]);
const LOCATION_LABEL = { header: "En-tête", footer: "Pied de page", mobile: "Mobile" };

module.exports = () => {
  const router = express.Router();

  router.get("/site-web/personnaliser", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const can = (p) => req.mk.can(p);
    const st = siteStyles.state(req.mk.ctx, t.siteId, { can });
    const q = t.siteId ? `?site=${t.siteId}` : "";
    const wanted = new Set(categories.flatMap((c) => c.panels));
    const panels = st.panels.filter((p) => wanted.has(p.id));
    // L'aperçu des pages réelles part du brouillon enregistré (copie de travail de CETTE session, pour CE site seulement)
    const key = t.siteId === null ? "p" : String(t.siteId);
    req.session.kwStyleDraft = { ...(req.session.kwStyleDraft || {}) };
    if (Object.keys(st.changes).length) req.session.kwStyleDraft[key] = st.changes; else delete req.session.kwStyleDraft[key];
    const previews = previewTargets(req, t);
    const menus = navigation.listMenus({ siteId: t.siteId }).map((m) => ({ id: m.id, name: m.name, items: m.items, locations: (m.locations || []).map((l) => LOCATION_LABEL[l] || l), broken: m.broken }));
    const layout = widgets.get(t.siteId).layout;
    const zones = widgetCatalog.ZONES.map((z) => ({ key: z.key, label: z.label, where: z.where, count: (layout.zones[z.key] || []).length }));
    let homePages = [], homeId = null;
    if (!t.principal) {
      homeId = t.site && t.site.home_page_id ? t.site.home_page_id : null;
      homePages = pages.listPages(req.mk.ctx, { siteId: t.siteId }).filter((p) => p.kind !== "step" && !p.archived_at).slice(0, 200).map((p) => ({ id: p.id, name: p.name }));
    }
    const boot = {
      siteId: t.siteId, siteName: t.name, principal: t.principal, readOnly: t.readOnly, base: BASE, api: API, siteQuery: q,
      categories, devices: DEVICES, defaultDevice: "desktop",
      preview: { url: previews.length ? previews[0].url : "/", targets: previews },
      panels: panels.map((p) => ({ id: p.id, label: p.label, icon: p.icon, hint: p.hint, tabs: p.tabs, controls: p.controls })),
      values: st.values, live: st.live, changes: st.changes, draft: st.draft, revision: st.revision, stale: st.stale, pendingEngineDraft: st.pendingEngineDraft, perControl: st.can,
      can: { edit: can("appearance.styles") && !t.readOnly, publish: can("appearance.publish") && !t.readOnly, css: can("pages.code"), seo: can("seo.edit"), home: can("forms.write") && !t.readOnly },
      menus, zones, home: { id: homeId, pages: homePages },
      links: {
        close: t.principal ? "/marketing" : `/marketing/site-web/sites/${t.siteId}/tableau-de-bord`,
        menus: t.principal ? "/marketing/site-web/navigation" : `/marketing/site-web/navigation?site=${t.siteId}`,
        widgets: `/marketing/site-web/widgets${q}`, themeBuilder: `/marketing/site-web/apparence/theme-builder${q}`, styles: `${API}${q}`,
        pages: t.principal ? "/marketing/pages" : `/marketing/site-web/sites/${t.siteId}/pages`,
      },
    };
    res.set("Cache-Control", "no-store");
    res.render("marketing/personnaliser", { title: `Personnaliser — ${t.name}`, T: t, bootJson: safeJson(boot), mediaSite: t.siteId ? String(t.siteId) : "principal" });
  });

  // Page d'accueil d'un site : écriture directe (pas de brouillon), droits de modification des pages, site vérifié par le serveur
  router.post("/site-web/personnaliser/accueil", need("forms.write"), (req, res) => {
    const t = target(req, res, { json: true }); if (!t) return;
    res.set("Cache-Control", "no-store");
    if (t.principal) return res.status(422).json({ error: { code: "invalid_state", message: "L'accueil du site principal est la page d'accueil de Kolakisa : il se modifie dans Pages." } });
    if (t.readOnly) return res.status(409).json({ error: { code: "invalid_state", message: "Ce site est archivé ou supprimé : restaurez-le avant de le modifier." } });
    const raw = req.body && req.body.page;
    const pageId = raw === "" || raw === null || raw === undefined ? null : Number(raw);
    if (pageId !== null && (!Number.isInteger(pageId) || pageId < 1)) return res.status(422).json({ error: { code: "invalid_field", message: "Page inconnue." } });
    try {
      pages.setHomePage(req.mk.ctx, t.siteId, pageId);
      try { recordAudit(req.mk.ctx.db, { organizationId: req.mk.ctx.organizationId, userId: req.session.user.id, action: "site.home_page_set", resourceType: "site", resourceId: t.siteId, metadata: { pageId }, siteId: t.siteId }); } catch { /* l'audit ne bloque jamais l'action */ }
      res.json({ ok: true, page: pageId });
    } catch (e) {
      if (e instanceof UserError || (e && e.status === 422)) return res.status(422).json({ error: { code: "invalid_field", message: e.message } });
      return res.status(422).json({ error: { code: "invalid_field", message: e && e.message ? e.message : "Page refusée." } });
    }
  });
  return router;
};
