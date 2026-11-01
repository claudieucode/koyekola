// Theme Builder (programme 23.1) : écran /site-web/sites/:id/constructeur-de-theme + API JSON. Le site vient de l'ADRESSE (revérifié par le service) ; jamais du corps de la requête.
// Droits : forms.read (voir, simuler, exporter) · forms.write (créer, modifier, publier, archiver, importer) · pages.delete (supprimer définitivement). Rien n'est publié sans action explicite.
const express = require("express");
const TB = require("../../themeBuilder");
const { thumbnail } = require("../../themeBuilder/thumb");
const { instances } = require("../../themeBuilder/instances");
const { need } = require("./kit");
const { MarketingError } = require("../errors");
const siteModules = require("../siteModules");
const Catalog = require("../../themeBuilder/catalog");
const { useTemplate } = require("../../themeBuilder/catalog/use");

const STATUS = { not_found: 404, forbidden: 403, module_disabled: 403, conflict: 409, invalid_field: 422, duplicate: 409 };
const P = () => require("../pages");
module.exports = () => {
  const router = express.Router();
  const B = "/site-web/sites/:id(\\d+)/constructeur-de-theme", A = `${B}/api`;
  const sid = (req) => Number(req.params.id), body = (req) => (req.body && typeof req.body === "object" ? req.body : {});
  const run = (fn) => (req, res, next) => Promise.resolve().then(() => fn(req.mk.ctx, sid(req), req, res)).then((d) => { if (d !== undefined) res.set("Cache-Control", "no-store").json({ ok: true, ...d }); }).catch((e) => {
    if (e instanceof MarketingError || (e && e.code && STATUS[e.code])) return res.status(STATUS[e.code] || 400).set("Cache-Control", "no-store").json({ ok: false, error: e.message, code: e.code, conflicts: e.conflicts });
    next(e);
  });
  // Le composant s'ouvre AVEC l'identifiant du modèle : l'éditeur affiche et vérifie exactement ce modèle (jamais un autre qui partagerait la même source)
  const editUrl = (t) => (t.sourceKind === "page" ? `/marketing/pages/${t.sourceId}/editeur?modele=${t.id}&retour=tb` : `/marketing/site-web/composants/${t.sourceId}/editeur?modele=${t.id}&retour=tb`);
  // Aperçu réel : mêmes routes que l'éditeur (page enregistrée ou composant dans une page d'exemple) ; les miniatures filaires sont lues À LA DEMANDE (`/miniature`) pour ne pas ouvrir tous les documents à chaque liste.
  const previewUrl = (t) => (t.sourceKind === "page" ? `/marketing/pages/${t.sourceId}/apercu` : `/marketing/site-web/composants/${t.sourceId}/apercu`);
  const docOf = (ctx, t) => { try { return t.sourceKind === "page" ? P().getPage(ctx, t.sourceId).working : (P().getComponent(ctx, t.sourceId) || {}).section; } catch { return null; } };
  const card = (ctx, t, conflictIds, light = false) => {
    const base = { ...t, describe: TB.conditions.describe(t.conditions), editUrl: editUrl(t), previewUrl: previewUrl(t), previewNeedsPage: t.sourceKind !== "page", hasConflict: conflictIds.has(t.id), active: t.status === "published" };
    if (light) return base;
    const doc = docOf(ctx, t), th = thumbnail(doc);
    return { ...base, thumb: th.svg, elements: th.elements, documentMissing: !doc };
  };
  const listAll = (ctx, id, f = {}, light = false) => {
    TB.legacy.adoptSiteParts(ctx, id);
    const all = TB.store.list(ctx, id, { archived: true });
    const conflicts = TB.resolve.conflicts(all);
    const ids = new Set(conflicts.flatMap((c) => [c.a, c.b]));
    const live = all.filter((t) => t.status === "published");
    const sameConds = (a, b) => JSON.stringify(a.conditions) === JSON.stringify(b.conditions);
    const shown = TB.store.list(ctx, id, f).map((t) => { const c = card(ctx, t, ids, light); if (t.status === "draft") { const r = live.filter((o) => o.type === t.type && sameConds(o, t)); if (r.length) c.willReplace = r.map((o) => o.name); } return c; });
    const counts = {}; for (const t of all) if (t.status !== "archived") counts[t.type] = (counts[t.type] || 0) + 1;
    const types = Object.entries(TB.types.TYPES).map(([key, d]) => {
      const off = d.module && !siteModules.isEnabled(ctx.db, ctx.organizationId, id, d.module);
      return { key, label: d.label, group: d.group, count: counts[key] || 0, live: all.filter((t) => t.type === key && t.status === "published").length, available: !off, reason: off ? `Module ${siteModules.MODULES[d.module].label} désactivé pour ce site.` : "" };
    });
    return { templates: shown, conflicts, types, groups: TB.types.GROUPS, total: all.filter((t) => t.status !== "archived").length, archived: all.filter((t) => t.status === "archived").length };
  };
  router.get(B, need("forms.read"), (req, res, next) => {
    try {
      const site = TB.store.site(req.mk.ctx, sid(req));
      res.set("Cache-Control", "no-store").render("marketing/theme-builder", { title: "Constructeur de thème", active: "sites", marketingShell: true, siteId: site.id, siteName: site.name, base: `/marketing/site-web/sites/${site.id}/constructeur-de-theme`, siteBase: `/marketing/site-web/sites/${site.id}`, perms: { write: req.mk.can("forms.write"), remove: req.mk.can("pages.delete") } });
    } catch (e) { if (e instanceof MarketingError) return res.status(e.code === "not_found" ? 404 : 422).render("error", { message: e.message }); next(e); }
  });
  router.get(`${A}/modeles`, need("forms.read"), run((ctx, id, req) => listAll(ctx, id, { type: String(req.query.type || ""), status: String(req.query.statut || ""), q: String(req.query.q || ""), archived: req.query.archives === "1" }, req.query.leger === "1")));
  router.get(`${A}/options`, need("forms.read"), run((ctx, id) => {
    TB.store.site(ctx, id);
    const lists = { categories: [], tags: [] };
    try { lists.categories = ctx.db.prepare("SELECT DISTINCT category c FROM posts WHERE category IS NOT NULL AND category != '' AND deleted_at IS NULL ORDER BY 1 LIMIT 100").all().map((r) => r.c); } catch { /* blog absent */ }
    return { pages: P().sitePages(ctx, id).map((p) => ({ id: p.id, name: p.name })), ...lists, kinds: Object.entries(TB.conditions.KINDS).map(([key, k]) => ({ key, label: k.label, criteria: TB.conditions.CRITERIA[key], views: k.views })), subs: TB.conditions.SUBS };
  }));
  router.post(`${A}/modeles`, need("forms.write"), run((ctx, id, req) => { const b = body(req); const t = TB.store.create(ctx, id, { type: String(b.type || ""), name: b.name, conditions: b.conditions || {} }); return { template: card(ctx, t, new Set()) }; }));
  const T = `${A}/modeles/:tid(\\d+)`, tid = (req) => Number(req.params.tid);
  const one = (ctx, id, t) => ({ template: card(ctx, t, new Set(TB.resolve.conflicts(TB.store.list(ctx, id)).flatMap((c) => [c.a, c.b]))) });
  router.get(`${T}/miniature`, need("forms.read"), run((ctx, id, req) => {
    const t = TB.store.get(ctx, id, tid(req)); const doc = docOf(ctx, t), th = thumbnail(doc);
    return { thumb: th.svg, elements: th.elements, documentMissing: !doc };
  }));
  router.post(`${T}/renommer`, need("forms.write"), run((ctx, id, req) => one(ctx, id, TB.store.rename(ctx, id, tid(req), body(req).name))));
  router.post(`${T}/conditions`, need("forms.write"), run((ctx, id, req) => { const r = TB.store.setConditions(ctx, id, tid(req), body(req).conditions || {}, { revision: body(req).revision ?? null }); return { ...one(ctx, id, r.template), conflicts: r.conflicts }; }));
  router.post(`${T}/publier`, need("forms.write"), run((ctx, id, req) => { const r = TB.store.publish(ctx, id, tid(req), { revision: body(req).revision ?? null, replace: body(req).replace === true }); return { ...one(ctx, id, r.template), version: r.version, conflicts: r.conflicts, replaced: r.replaced }; }));
  router.post(`${T}/depublier`, need("forms.write"), run((ctx, id, req) => one(ctx, id, TB.store.unpublish(ctx, id, tid(req)))));
  router.post(`${T}/archiver`, need("forms.write"), run((ctx, id, req) => one(ctx, id, TB.store.archive(ctx, id, tid(req)))));
  router.post(`${T}/restaurer`, need("forms.write"), run((ctx, id, req) => one(ctx, id, TB.store.restore(ctx, id, tid(req)))));
  router.post(`${T}/dupliquer`, need("forms.write"), run((ctx, id, req) => one(ctx, id, TB.store.duplicate(ctx, id, tid(req)))));
  router.post(`${T}/supprimer`, need("forms.write"), need("pages.delete"), run((ctx, id, req) => TB.store.remove(ctx, id, tid(req))));
  router.get(`${T}/versions`, need("forms.read"), run((ctx, id, req) => ({ versions: TB.store.versions(ctx, id, tid(req)).map((v) => ({ ...v, describe: TB.conditions.describe(v.conditions) })) })));
  router.post(`${T}/versions/:n(\\d+)/restaurer`, need("forms.write"), run((ctx, id, req) => { const r = TB.store.restoreVersion(ctx, id, tid(req), Number(req.params.n)); return { ...one(ctx, id, r), conditionsRestored: r.conditionsRestored }; }));
  router.get(`${T}/instances`, need("forms.read"), run((ctx, id, req) => instances(ctx, id, tid(req))));
  router.get(`${T}/export.json`, need("forms.read"), (req, res, next) => {
    try { const d = TB.portable.exportTemplate(req.mk.ctx, sid(req), tid(req)); res.set({ "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="modele-${tid(req)}.json"` }).type("application/json").send(JSON.stringify(d, null, 2)); }
    catch (e) { if (e instanceof MarketingError) return res.status(STATUS[e.code] || 400).json({ ok: false, error: e.message }); next(e); }
  });
  router.post(`${A}/importer`, need("forms.write"), run((ctx, id, req) => { const t = TB.portable.importTemplate(ctx, id, body(req).payload); return { template: card(ctx, t, new Set()) }; }));
  router.post(`${A}/importer-ancien`, need("forms.write"), run((ctx, id) => TB.legacy.importLegacy(ctx, id)));
  // « Pourquoi ce modèle ? » : simulation d'un cas (aucune écriture)
  router.get(`${A}/resolution`, need("forms.read"), run((ctx, id, req) => {
    TB.store.site(ctx, id);
    const q = req.query, view = TB.types.VIEWS.includes(q.vue) ? q.vue : "page", type = TB.types.has(q.type) ? q.type : null;
    const list = (v) => String(v || "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 20);
    const num = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);
    const archKind = ["blog", "category", "tag", "author", "date", "search", "shop"].includes(q.archive) ? q.archive : "";
    const c = { siteId: id, view, id: num(q.id), authorId: num(q.auteur), parents: list(q.parents).map(Number).filter(Number.isInteger), categories: list(q.categories), categoryAncestors: list(q.parentes), tags: list(q.etiquettes), archive: archKind ? { kind: archKind, name: String(q.nom || "").slice(0, 80), ancestors: list(q.ancetres) } : undefined };
    const r = TB.resolve.resolve(TB.store.list(ctx, id, { archived: true }), c, { type });
    return { context: c, winner: r.winner ? { id: r.winner.id, name: r.winner.name } : null, explain: r.explain };
  }));
  // ── Bibliothèque de modèles (100 par type) : liste paginée (métadonnées seulement), miniature et aperçu À LA DEMANDE, « Utiliser » = copie indépendante dans CE site ──
  const LIB = `${A}/bibliotheque`, keyOf = ":type/:key([a-z0-9.-]{3,80})";
  const libType = (ctx, id, type) => {
    if (!Catalog.types().includes(type)) throw Object.assign(new Error("Ce type de modèle n'a pas de bibliothèque."), { code: "not_found" });
    const off = TB.types.TYPES[type].module && !siteModules.isEnabled(ctx.db, ctx.organizationId, id, TB.types.TYPES[type].module);
    return { off, reason: off ? `Module ${siteModules.MODULES[TB.types.TYPES[type].module].label} désactivé pour ce site.` : "" };
  };
  router.get(LIB, need("forms.read"), run((ctx, id, req) => {
    TB.store.site(ctx, id);
    const type = String(req.query.type || "");
    if (!type) return { types: Catalog.stats().map((t) => { const o = libType(ctx, id, t.type); return { ...t, available: !o.off, reason: o.reason }; }) };
    const o = libType(ctx, id, type), q = req.query;
    return { type, available: !o.off, reason: o.reason, ...Catalog.list(type, { q: String(q.q || "").slice(0, 80), tag: String(q.etiquette || "").slice(0, 40), skin: String(q.identite || "").slice(0, 20), layout: String(q.mise || "").slice(0, 40), page: q.page, limit: q.limite }) };
  }));
  router.get(`${LIB}/${keyOf}/miniature`, need("forms.read"), run((ctx, id, req) => {
    TB.store.site(ctx, id); libType(ctx, id, req.params.type);
    const doc = Catalog.thumbDoc(req.params.type, req.params.key);
    if (!doc) throw Object.assign(new Error("Modèle introuvable."), { code: "not_found" });
    const th = thumbnail(doc.sections ? doc : doc);
    return { thumb: th.svg, elements: th.elements };
  }));
  router.get(`${LIB}/${keyOf}/apercu`, need("forms.read"), (req, res, next) => {
    try {
      TB.store.site(req.mk.ctx, sid(req)); libType(req.mk.ctx, sid(req), req.params.type);
      const doc = Catalog.build(req.params.type, req.params.key, {});
      if (!doc) return res.status(404).type("text").send("Modèle introuvable.");
      require("./themeRender").previewDoc(req, res, { siteId: sid(req), type: req.params.type, doc }, (html) => {
        if (html === null) return res.status(500).type("text").send("Aperçu indisponible.");
        res.set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }).type("html").send(html);
      });
    } catch (e) { if (e instanceof MarketingError || (e && STATUS[e.code])) return res.status(STATUS[e.code] || 400).type("text").send(e.message); next(e); }
  });
  router.post(`${LIB}/utiliser`, need("forms.write"), run((ctx, id, req) => {
    const b = body(req); libType(ctx, id, String(b.type || ""));
    const t = useTemplate(ctx, id, String(b.type || ""), String(b.key || ""), { name: b.name ? String(b.name) : undefined });
    return { template: card(ctx, t, new Set()) };
  }));
  return router;
};
