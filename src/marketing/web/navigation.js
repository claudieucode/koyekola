// KOLAKISA CMS → Navigation (palier 7) : menus, éléments (pages, articles, catégories, étiquettes, accueil, liens personnalisés),
// hiérarchie, ordre (boutons et glisser-déposer), emplacements (en-tête, pied de page, mobile). Tout passe par src/services/navigation.js.
// Droits : navigation.read (voir), navigation.write (créer/modifier menus et éléments), navigation.publish (affecter un menu à un
// emplacement = l'afficher sur le site), navigation.delete (supprimer un menu).
const express = require("express");
const navigation = require("../../services/navigation");
const { UserError } = require("../../utils/errors");
const { need } = require("./kit");
const db = require("../../config/database");
const { recordAudit } = require("../audit");

const BASE = "/marketing/site-web/navigation";

module.exports = () => {
  const router = express.Router();
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, ...(detail ? { detail } : {}), noReopen: true }; };
  const fail = (req, res, next, to, error) => {
    if (!(error instanceof UserError)) return next(error);
    flash(req, "error", error.message); res.redirect(to);
  };
  // R8 lot 4 — menus PAR SITE : le site est celui du contexte vérifié par le serveur (adresse /sites/N/navigation, « ?site= » validé, ou site du menu / de l'élément appelé par identifiant) ;
  // null = site principal. Un menu ou un élément d'un autre site est introuvable, même appelé par son identifiant.
  const NAV = /^\/site-web\/(?:navigation|apparence\/menus)(?:\/|$)/;
  router.use((req, res, next) => {
    if (!NAV.test(req.path)) return next();
    if (req.mk.siteId !== null && !(req.mk.site && req.mk.site.id === req.mk.siteId)) return res.status(404).render("error", { message: "Site introuvable." });
    req.navSite = req.mk.siteId;
    next();
  });
  const menuOr404 = (req, res, json = false) => {
    const m = navigation.menuRow(Number(req.params.id));
    if (!m || (m.site_id ?? null) !== req.navSite) { if (json) res.status(404).json({ ok: false, error: "Menu introuvable." }); else res.status(404).render("error", { message: "Menu introuvable." }); return null; }
    return m;
  };

  // ----- Liste des menus et emplacements -----
  // Le même écran est l'entrée « Navigation » et « Apparence → Menus » du menu latéral
  const showList = (active) => (req, res) => {
    const q = String(req.query.q || "").trim().slice(0, 80), sort = Object.hasOwn(navigation.MENU_SORTS, req.query.sort) ? req.query.sort : "nom";
    const menus = navigation.listMenus({ siteId: req.navSite, q, sort });
    res.render("marketing/navigation", {
      title: "Menus", active, menus, q, sort, total: q ? navigation.listMenus({ siteId: req.navSite }).length : menus.length, locations: navigation.LOCATIONS, assigned: navigation.assignments({ siteId: req.navSite }), BASE, navSite: req.navSite,
      canWrite: req.mk.can("navigation.write"), canPublish: req.mk.can("navigation.publish"), canDelete: req.mk.can("navigation.delete"),
    });
  };
  router.get("/site-web/navigation", need("navigation.read"), showList("navigation"));
  router.get("/site-web/apparence/menus", need("navigation.read"), showList("apparence/menus"));

  router.post("/site-web/navigation/menus", need("navigation.write"), (req, res, next) => {
    try {
      const menu = navigation.create({ name: req.body.name, description: req.body.description, siteId: req.navSite, userId: req.session.user.id });
      flash(req, "ok", `Menu « ${menu.name} » créé.`);
      res.redirect(`${BASE}/menus/${menu.id}`);
    } catch (error) { fail(req, res, next, BASE, error); }
  });
  router.post("/site-web/navigation/importer", need("navigation.write"), (req, res, next) => {
    try {
      const made = navigation.importCurrentSite({ userId: req.session.user.id, siteId: req.navSite });
      flash(req, made.length ? "ok" : "error", made.length ? `${made.length} menu${made.length > 1 ? "s" : ""} créé${made.length > 1 ? "s" : ""} à partir du site actuel. Affectez-les à un emplacement pour les utiliser.` : "Les menus du site actuel existent déjà.");
      res.redirect(BASE);
    } catch (error) { fail(req, res, next, BASE, error); }
  });
  router.post("/site-web/navigation/emplacements", need("navigation.publish"), (req, res, next) => {
    try {
      // Formulaire d'un menu (cases à cocher) : décocher libère l'emplacement seulement s'il est occupé par CE menu ; liste des menus : choix direct
      const current = navigation.assignments({ siteId: req.navSite });
      const only = req.body.menu ? Number(req.body.menu) : null;
      for (const key of Object.keys(navigation.LOCATIONS)) {
        if (!Object.hasOwn(req.body, key)) continue;
        const value = [].concat(req.body[key]).filter(Boolean).pop();
        if (only && !value && current[key] !== only) continue;
        navigation.assign(key, value ? Number(value) : null, { siteId: req.navSite });
      }
      flash(req, "ok", "Emplacements enregistrés : le site utilise maintenant ces menus.");
      res.redirect(String(req.body.retour || "").startsWith(BASE) ? req.body.retour : BASE);
    } catch (error) { fail(req, res, next, BASE, error); }
  });

  // ----- Éditeur d'un menu -----
  router.get("/site-web/navigation/menus/:id(\\d+)", need("navigation.read"), (req, res) => {
    const menu = menuOr404(req, res);
    if (!menu) return;
    const flat = [];
    const walk = (nodes, parent) => nodes.forEach((n) => { flat.push({ id: n.id, parent, type: n.type, object_id: n.object_id, url: n.url, label: n.label, title_attr: n.title_attr, css_class: n.css_class, new_tab: Boolean(n.new_tab), rel: n.rel, visibility: n.visibility, status: n.status, resource: { title: n.resource.title, url: n.resource.url, state: n.resource.state }, stateLabel: n.stateLabel }); walk(n.children, n.id); });
    walk(navigation.tree(menu.id), null);
    const assigned = navigation.assignments({ siteId: req.navSite });
    const types = Object.fromEntries(Object.entries(navigation.TYPES).map(([k, d]) => [k, { label: d.label, needsObject: Boolean(d.needsObject) }]));
    const qs = req.navSite === null ? "" : `?site=${req.navSite}`;
    const data = {
      menu: { id: menu.id, name: menu.name, description: menu.description, status: menu.status, revision: menu.revision, updatedAt: menu.updated_at },
      items: flat, types, maxDepth: navigation.MAX_DEPTH, maxItems: navigation.MAX_ITEMS, rel: navigation.REL_ALLOWED.filter((r) => !["noopener", "external"].includes(r)),
      locations: Object.values(navigation.LOCATIONS).map((l) => ({ key: l.key, label: l.label, hint: l.hint, on: assigned[l.key] === menu.id, takenBy: assigned[l.key] && assigned[l.key] !== menu.id ? (navigation.menuRow(assigned[l.key]) || {}).name || "" : "" })),
      sources: navigation.sourcesFor(req.navSite),
      canWrite: req.mk.can("navigation.write"), canPublish: req.mk.can("navigation.publish"), canDelete: req.mk.can("navigation.delete"),
      urls: { save: `${BASE}/menus/${menu.id}/enregistrer${qs}`, resources: `${BASE}/ressources${qs}`, preview: `${BASE}/menus/${menu.id}/apercu${qs}`, list: `${BASE}${qs}` },
    };
    res.render("marketing/navigation-menu", {
      title: menu.name, active: "apparence/menus", menu, BASE, navSite: req.navSite, canWrite: data.canWrite, canDelete: data.canDelete, navJs: true,
      locNames: data.locations.filter((l) => l.on).map((l) => l.label),
      count: flat.length, broken: flat.filter((n) => n.resource.state !== "ok" && ["page", "article", "category", "tag"].includes(n.type)).length,
      dataJson: JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028|\u2029/g, ""),
    });
  });
  // Enregistrement de l'éditeur (JSON) : tout ou rien ; version périmée = 409 ; le site est celui du menu, vérifié plus haut
  router.post("/site-web/navigation/menus/:id(\\d+)/enregistrer", need("navigation.write"), express.json({ limit: "1mb" }), (req, res, next) => {
    if (!menuOr404(req, res, true)) return;
    try {
      const out = navigation.saveMenu(Number(req.params.id), req.body, { canPublish: req.mk.can("navigation.publish"), userId: req.session.user.id });
      try { recordAudit(db, { organizationId: req.mk.ctx.organizationId, userId: req.session.user.id, action: "menu.saved", resourceType: "menu", resourceId: String(out.menu.id), siteId: req.navSite, metadata: { items: out.count, created: out.created, removed: out.removed } }); } catch { /* la journalisation ne bloque jamais l'enregistrement */ }
      res.json({ ok: true, revision: out.menu.revision, name: out.menu.name, updatedAt: out.menu.updated_at, count: out.count, created: out.created, removed: out.removed, idMap: out.idMap });
    } catch (error) {
      if (!(error instanceof UserError)) return next(error);
      res.status(error.status || 400).json({ ok: false, error: error.message, conflict: error.status === 409 });
    }
  });
  // Aperçu : le rendu public du menu (même gabarit que l'en-tête), éléments masqués ou non publiés exclus ; rien n'est enregistré
  router.get("/site-web/navigation/menus/:id(\\d+)/apercu", need("navigation.read"), (req, res, next) => {
    const menu = menuOr404(req, res, true);
    if (!menu) return;
    res.render("partials/nav-menu", { items: navigation.preview(menu.id), level: 1, prefix: "pv", menuClass: "nav-menu--preview", menuLabel: "Aperçu du menu", navIsCurrent: () => false }, (err, html) => (err ? next(err) : res.json({ ok: true, html })));
  });

  router.post("/site-web/navigation/menus/:id(\\d+)", need("navigation.write"), (req, res, next) => {
    const back = `${BASE}/menus/${req.params.id}`;
    if (!menuOr404(req, res)) return;
    try {
      const m = navigation.update(Number(req.params.id), { name: req.body.name, description: req.body.description, status: req.body.status });
      flash(req, "ok", `Menu « ${m.name} » enregistré.`);
      res.redirect(back);
    } catch (error) { fail(req, res, next, back, error); }
  });
  router.post("/site-web/navigation/menus/:id(\\d+)/dupliquer", need("navigation.write"), (req, res, next) => {
    if (!menuOr404(req, res)) return;
    try {
      const copy = navigation.duplicate(Number(req.params.id), { userId: req.session.user.id });
      flash(req, "ok", `Copie créée : « ${copy.name} » (en brouillon, à vérifier avant de l'affecter).`);
      res.redirect(`${BASE}/menus/${copy.id}`);
    } catch (error) { fail(req, res, next, BASE, error); }
  });
  router.post("/site-web/navigation/menus/:id(\\d+)/supprimer", need("navigation.delete"), (req, res, next) => {
    if (!menuOr404(req, res)) return;
    try {
      const r = navigation.remove(Number(req.params.id));
      flash(req, "ok", `Menu « ${r.name} » supprimé${r.locations.length ? ` ; ${r.locations.map((l) => navigation.LOCATIONS[l].label.toLowerCase()).join(", ")} : retour à l'affichage d'origine` : ""}. Les pages et articles qu'il montrait ne sont pas touchés.`);
      res.redirect(BASE);
    } catch (error) { fail(req, res, next, BASE, error); }
  });

  // ----- Éléments -----
  router.post("/site-web/navigation/menus/:id(\\d+)/elements", need("navigation.write"), (req, res, next) => {
    const back = `${BASE}/menus/${req.params.id}`;
    if (!menuOr404(req, res)) return;
    try {
      const menuId = Number(req.params.id);
      const type = String(req.body.type || "");
      const ids = [].concat(req.body.object_id || []).flatMap((v) => String(v).split(",")).filter(Boolean);
      let added = 0;
      if (navigation.TYPES[type] && navigation.TYPES[type].needsObject) {
        if (!ids.length) throw new UserError("Sélectionnez au moins un élément à ajouter.");
        for (const oid of ids.slice(0, 50)) { navigation.add(menuId, { type, object_id: Number(oid), parent_id: req.body.parent_id }); added += 1; }
      } else { navigation.add(menuId, { type, url: req.body.url, label: req.body.label, new_tab: req.body.new_tab === "1" ? true : undefined, parent_id: req.body.parent_id }); added = 1; }
      flash(req, "ok", `${added} élément${added > 1 ? "s" : ""} ajouté${added > 1 ? "s" : ""} au menu.`);
      res.redirect(back);
    } catch (error) { fail(req, res, next, back, error); }
  });
  const itemRoute = (path, perm, run) => router.post(`/site-web/navigation/elements/:id(\\d+)${path}`, need(perm), (req, res, next) => {
    const it = navigation.itemRow(Number(req.params.id));
    const owner = it ? navigation.menuRow(it.menu_id) : null;
    if (!it || !owner || (owner.site_id ?? null) !== req.navSite) return res.status(404).render("error", { message: "Élément introuvable." });
    const back = `${BASE}/menus/${it.menu_id}`;
    try { flash(req, "ok", run(it, req)); res.redirect(back); } catch (error) { fail(req, res, next, back, error); }
  });
  itemRoute("", "navigation.write", (it, req) => {
    navigation.updateItem(it.id, { label: req.body.label, url: req.body.url, object_id: req.body.object_id || undefined, new_tab: req.body.new_tab === "1", rel: [].concat(req.body.rel || []).join(" "), visibility: req.body.visibility, status: req.body.status === "hidden" ? "hidden" : "published", icon: req.body.icon, description: req.body.description });
    return "Élément enregistré.";
  });
  itemRoute("/supprimer", "navigation.write", (it) => { navigation.removeItem(it.id); return "Élément retiré du menu (la ressource qu'il montrait n'est pas touchée)."; });
  itemRoute("/deplacer", "navigation.write", (it, req) => {
    if (req.body.direction) navigation.shift(it.id, String(req.body.direction));
    else navigation.move(it.id, { parentId: req.body.parent_id ? Number(req.body.parent_id) : null, index: req.body.index === undefined || req.body.index === "" ? null : Number(req.body.index) });
    return "Élément déplacé.";
  });
  // Glisser-déposer : la structure entière est envoyée et écrite d'un seul bloc (transaction)
  router.post("/site-web/navigation/menus/:id(\\d+)/organiser", need("navigation.write"), express.json({ limit: "512kb" }), (req, res, next) => {
    if (!menuOr404(req, res, true)) return;
    try {
      const n = navigation.reorder(Number(req.params.id), (req.body || {}).tree);
      res.json({ ok: true, count: n });
    } catch (error) {
      if (!(error instanceof UserError)) return next(error);
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  // ----- Recherche de ressources (jamais toute la liste dans le navigateur) -----
  router.get("/site-web/navigation/ressources", need("navigation.read"), (req, res) => {
    const type = String(req.query.type || ""), source = String(req.query.source || "");
    const offset = Math.max(0, Math.min(Number(req.query.offset) || 0, 500)), limit = 20;
    if (source) {
      const rows = navigation.searchSource(source, req.query.q, limit + 1 + offset, { siteId: req.navSite }).slice(offset);
      return res.json({ results: rows.slice(0, limit), hasMore: rows.length > limit });
    }
    if (!navigation.TYPES[type] || !navigation.TYPES[type].search) return res.status(400).json({ error: "Type inconnu." });
    const rows = navigation.search(type, req.query.q, limit, { siteId: req.navSite, offset });
    res.json({ results: rows.slice(0, limit), hasMore: rows.length > limit });
  });
  return router;
};
