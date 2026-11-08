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
const gs = require("../pages/globalStyles");
const headerSettings = require("../pages/headerSettings");
const TB = require("../../themeBuilder/render");

const BASE = "/marketing/site-web/personnaliser";
const API = "/marketing/site-web/styles";
// Formats d'aperçu : largeur du viewport simulé (null = toute la largeur disponible). Ajouter un format = ajouter une ligne.
const DEVICES = Object.freeze([
  { id: "desktop", label: "Ordinateur", width: null },
  { id: "tablet", label: "Tablette", width: 768 },
  { id: "mobile", label: "Mobile", width: 375 },
]);
const LOCATION_LABEL = { header: "En-tête", footer: "Pied de page", mobile: "Mobile" };

// En-tête qui s'applique à l'accueil du site (Theme Builder). Réglages de COMPORTEMENT (collé, superposé, masqué au défilement…) modifiables d'ici seulement si :
//  · le composant appartient à CE site (jamais un composant partagé : le modifier changerait d'autres sites) ;
//  · il n'a pas de modifications non publiées dans le Theme Builder (elles seraient publiées sans que la personne les ait vues).
// Pied de page qui s'applique à l'accueil du site : lecture seule (nom, lien vers son éditeur) ; il se compose dans le Theme Builder, son unique gestionnaire.
const footerOf = (req, t) => {
  try {
    const ctx = req.mk.ctx;
    if (!TB.hasParts(ctx, t.siteId)) return null;
    const win = TB.resolveParts(ctx, t.siteId, { ...TB.defaultContext(t.siteId, "/"), visitor: { loggedIn: false } });
    if (!win.footer) return null;
    const c = pages.getComponent(ctx, Number(win.footer.sourceId));
    if (!c || !c.section) return null;
    return { id: c.id, name: win.footer.name || c.name, editUrl: `/marketing/site-web/composants/${c.id}/editeur` };
  } catch { return null; }
};
const headerOf = (req, t) => {
  try {
    const ctx = req.mk.ctx;
    if (!TB.hasParts(ctx, t.siteId)) return null;
    const win = TB.resolveParts(ctx, t.siteId, { ...TB.defaultContext(t.siteId, "/"), visitor: { loggedIn: false } });
    if (!win.header) return null;
    const c = pages.getComponent(ctx, Number(win.header.sourceId));
    if (!c || !c.section) return null;
    let reason = "";
    if (t.readOnly) reason = "Ce site est archivé ou supprimé : restaurez-le avant de le modifier.";
    else if (c.site_id === null || c.site_id !== t.siteId) reason = "Cet en-tête est partagé entre plusieurs sites : modifiez-le dans le Theme Builder pour ne pas changer les autres sites.";
    else if (c.hasDraft) reason = "Cet en-tête a des modifications non publiées dans le Theme Builder : publiez-les ou annulez-les avant de régler son comportement ici.";
    return { component: c, info: { id: c.id, name: win.header.name || c.name, settings: headerSettings.resolve(c.section), editable: !reason, reason, editUrl: `/marketing/site-web/composants/${c.id}/editeur` } };
  } catch { return null; }
};

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
      can: { edit: can("appearance.styles") && !t.readOnly, publish: can("appearance.publish") && !t.readOnly, css: can("pages.code"), seo: can("seo.edit"), home: can("forms.write") && !t.readOnly, menus: can("navigation.write") && !t.readOnly, menusPublish: can("navigation.publish") && !t.readOnly },
      global: { ...gs.uiSpec(t.siteId), base: siteStyles.liveBase(req.mk.ctx, t.siteId) },
      menus, zones, home: { id: homeId, pages: homePages },
      header: (() => { const h = headerOf(req, t); return h ? h.info : null; })(),
      footer: footerOf(req, t),
      links: {
        close: t.principal ? "/marketing" : `/marketing/site-web/sites/${t.siteId}/tableau-de-bord`,
        menus: t.principal ? "/marketing/site-web/navigation" : `/marketing/site-web/navigation?site=${t.siteId}`,
        widgets: `/marketing/site-web/widgets${q}`, fonts: `/marketing/site-web/polices${q}`, themeBuilder: `/marketing/site-web/apparence/theme-builder${q}`, styles: `${API}${q}`,
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
  // ---------- Menus : modification directe dans le panneau (mêmes fonctions de service que l'écran Navigation) ----------
  // Le site vient de l'adresse vérifiée par le serveur ; un menu ou un élément d'un AUTRE site est toujours « introuvable » (404), jamais modifié.
  const menuOfSite = (t, id) => { const m = navigation.menuRow(Number(id)); return m && (m.site_id ?? null) === t.siteId ? m : null; };
  const noMenu = (res) => res.status(404).json({ error: { code: "not_found", message: "Menu introuvable pour ce site." } });
  const menuError = (res, e) => { const status = e && e.status && e.status >= 400 && e.status < 500 ? e.status : 422; return res.status(status).json({ error: { code: status === 409 ? "conflict" : "invalid_field", message: e && e.message ? e.message : "Modification refusée." } }); };
  const menuState = (t, m) => {
    const assigned = navigation.assignments({ siteId: t.siteId });
    return {
      menu: { id: m.id, name: m.name, revision: navigation.menuRow(m.id).revision },
      items: navigation.flatten(navigation.tree(m.id)).map((n) => ({ id: n.id, parent: n.parent_id, depth: n.depth, type: n.type, label: n.label || "", shown: n.displayLabel, url: n.type === "custom" ? n.url : "", hidden: n.status === "hidden" })),
      locations: Object.values(navigation.LOCATIONS).map((l) => ({ key: l.key, label: l.label, on: assigned[l.key] === m.id })),
      limits: { items: navigation.MAX_ITEMS },
    };
  };
  router.get("/site-web/personnaliser/menus/:id(\\d+)", need("navigation.read"), (req, res) => {
    const t = target(req, res, { json: true }); if (!t) return;
    res.set("Cache-Control", "no-store");
    const m = menuOfSite(t, req.params.id); if (!m) return noMenu(res);
    res.json(menuState(t, m));
  });
  router.post("/site-web/personnaliser/menus/:id(\\d+)/element", need("navigation.write"), (req, res) => {
    const t = target(req, res, { json: true }); if (!t) return;
    res.set("Cache-Control", "no-store");
    if (t.readOnly) return res.status(409).json({ error: { code: "invalid_state", message: "Ce site est archivé ou supprimé : restaurez-le avant de le modifier." } });
    const m = menuOfSite(t, req.params.id); if (!m) return noMenu(res);
    const b = req.body || {}, action = String(b.action || "");
    try {
      if (action === "add") navigation.add(m.id, { type: "custom", url: b.url, label: b.label });
      else {
        const it = navigation.itemRow(Number(b.id));
        if (!it || it.menu_id !== m.id) return res.status(404).json({ error: { code: "not_found", message: "Élément introuvable dans ce menu." } });
        if (action === "update") navigation.updateItem(it.id, it.type === "custom" ? { label: b.label, url: b.url } : { label: b.label });
        else if (action === "remove") navigation.removeItem(it.id);
        else if (action === "up" || action === "down" || action === "in" || action === "out") navigation.shift(it.id, action);
        else return res.status(422).json({ error: { code: "invalid_field", message: "Action inconnue." } });
      }
      try { recordAudit(req.mk.ctx.db, { organizationId: req.mk.ctx.organizationId, userId: req.session.user.id, action: "menu.item_" + action, resourceType: "menu", resourceId: String(m.id), siteId: t.siteId }); } catch { /* l'audit ne bloque jamais */ }
      res.json(menuState(t, m));
    } catch (e) { return menuError(res, e); }
  });
  router.post("/site-web/personnaliser/menus/:id(\\d+)/emplacement", need("navigation.publish"), (req, res) => {
    const t = target(req, res, { json: true }); if (!t) return;
    res.set("Cache-Control", "no-store");
    if (t.readOnly) return res.status(409).json({ error: { code: "invalid_state", message: "Ce site est archivé ou supprimé : restaurez-le avant de le modifier." } });
    const m = menuOfSite(t, req.params.id); if (!m) return noMenu(res);
    const key = String((req.body || {}).key || "");
    if (!Object.hasOwn(navigation.LOCATIONS, key)) return res.status(422).json({ error: { code: "invalid_field", message: "Emplacement inconnu." } });
    try {
      const current = navigation.assignments({ siteId: t.siteId });
      navigation.assign(key, (req.body || {}).on ? m.id : (current[key] === m.id ? null : current[key] || null), { siteId: t.siteId });
      res.json(menuState(t, m));
    } catch (e) { return menuError(res, e); }
  });
  // ---------- Widgets : lecture de l'état (l'enregistrement passe par la route existante /site-web/widgets/enregistrer : même validation, même contrôle de version) ----------
  router.get("/site-web/personnaliser/widgets", need("appearance.read"), (req, res) => {
    const t = target(req, res, { json: true }); if (!t) return;
    res.set("Cache-Control", "no-store");
    const state = widgets.get(t.siteId);
    res.json({
      revision: state.revision, layout: state.layout, zones: widgetCatalog.ZONES, categories: widgetCatalog.CATEGORIES, blocks: widgetCatalog.publicCatalog(),
      menus: navigation.listMenus({ siteId: t.siteId }).filter((m) => m.status === "published").map((m) => ({ id: m.id, name: m.name })),
      canEdit: req.mk.can("appearance.publish") && !t.readOnly,
    });
  });
  // Comportement de l'en-tête du site (mode, effets, décalage, empilement, masquage au défilement, appareils) : mêmes règles de validation que le Theme Builder (headerSettings.normalize),
  // même chemin d'enregistrement (brouillon du composant puis mise à jour), site vérifié par le serveur, jamais un composant partagé.
  router.post("/site-web/personnaliser/entete", need("forms.write"), (req, res) => {
    const t = target(req, res, { json: true }); if (!t) return;
    res.set("Cache-Control", "no-store");
    const h = headerOf(req, t);
    if (!h) return res.status(422).json({ error: { code: "invalid_state", message: "Ce site n'a pas d'en-tête créé dans le Theme Builder." } });
    if (!h.info.editable) return res.status(409).json({ error: { code: "invalid_state", message: h.info.reason } });
    const norm = headerSettings.normalize(req.body && req.body.settings);
    if (!norm) return res.status(422).json({ error: { code: "invalid_field", message: "Réglages d'en-tête invalides." } });
    try {
      const ctx = req.mk.ctx, c = h.component;
      const section = JSON.parse(JSON.stringify(c.section));
      section.header = norm;
      const saved = pages.saveComponentDraft(ctx, c.id, section, { revision: c.revision });
      pages.publishComponent(ctx, c.id, { revision: saved.revision });
      try { recordAudit(ctx.db, { organizationId: ctx.organizationId, userId: req.session.user.id, action: "site.header_behavior_set", resourceType: "component", resourceId: c.id, metadata: { mode: norm.mode }, siteId: t.siteId }); } catch { /* l'audit ne bloque jamais */ }
      res.json({ ok: true, settings: headerSettings.resolve(pages.getComponent(ctx, c.id).section) });
    } catch (e) {
      const code = e && e.code === "conflict" ? 409 : 422;
      return res.status(code).json({ error: { code: code === 409 ? "conflict" : "invalid_field", message: e && e.message ? e.message : "Enregistrement refusé." } });
    }
  });
  return router;
};
