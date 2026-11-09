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
const { useTemplate, siteFormId } = require("../../themeBuilder/catalog/use");
const Favoris = require("../../themeBuilder/favoris");

const STATUS = { not_found: 404, forbidden: 403, module_disabled: 403, conflict: 409, invalid_field: 422, duplicate: 409 };
const P = () => require("../pages");
module.exports = () => {
  const router = express.Router();
  // Deux entrées, UN SEUL jeu de routes : un site créé (/sites/:id/…) et le SITE PRINCIPAL (/principal/…, modèles à site_id NULL)
  for (const [B, principal] of [["/site-web/sites/:id(\\d+)/constructeur-de-theme", false], ["/site-web/principal/constructeur-de-theme", true]]) {
  const A = `${B}/api`;
  const sid = (req) => (principal ? null : Number(req.params.id)), body = (req) => (req.body && typeof req.body === "object" ? req.body : {});
  const spaceBase = (site) => (principal ? "/marketing/site-web/principal" : `/marketing/site-web/sites/${site.id}`);
  const run = (fn) => (req, res, next) => Promise.resolve().then(() => fn(req.mk.ctx, sid(req), req, res)).then((d) => { if (d !== undefined) res.set("Cache-Control", "no-store").json({ ok: true, ...d }); }).catch((e) => {
    if (e instanceof MarketingError || (e && e.code && STATUS[e.code])) return res.status(STATUS[e.code] || 400).set("Cache-Control", "no-store").json({ ok: false, error: e.message, code: e.code, conflicts: e.conflicts, needsScope: e.needsScope || undefined });
    next(e);
  });
  // Le composant s'ouvre AVEC l'identifiant du modèle : l'éditeur affiche et vérifie exactement ce modèle (jamais un autre qui partagerait la même source)
  const editUrl = (t) => (t.sourceKind === "page" ? `/marketing/pages/${t.sourceId}/editeur?modele=${t.id}&retour=tb` : `/marketing/site-web/composants/${t.sourceId}/editeur?modele=${t.id}&retour=tb`);
  // Aperçu réel : mêmes routes que l'éditeur (page enregistrée ou composant dans une page d'exemple) ; les miniatures filaires sont lues À LA DEMANDE (`/miniature`) pour ne pas ouvrir tous les documents à chaque liste.
  const previewUrl = (t) => (t.sourceKind === "page" ? `/marketing/pages/${t.sourceId}/apercu` : `/marketing/site-web/composants/${t.sourceId}/apercu`);
  const docOf = (ctx, t) => { try { return t.sourceKind === "page" ? P().getPage(ctx, t.sourceId).working : (() => { const c = P().getComponent(ctx, t.sourceId); return c ? (c.draft || c.section) : null; })(); } catch { return null; } };
  // Révision du DOCUMENT affiché (brouillon enregistré du composant / de la page) : change à chaque enregistrement, contrairement à celle du modèle ; clé de cache des vignettes
  const docRev = (ctx, t) => { try { const d = t.sourceKind === "page" ? P().getPage(ctx, t.sourceId) : P().getComponent(ctx, t.sourceId); return d ? `${d.revision}:${d.updated_at || d.updatedAt || ""}` : "0"; } catch { return "0"; } };
  // Origine bibliothèque d'un en-tête installé : la clé du modèle est gardée dans le premier conteneur du document (libraryKey) ; absente pour un en-tête créé autrement
  const originKey = (section) => { const first = section && Array.isArray(section.children) ? section.children[0] : null; return first && first.props && typeof first.props.libraryKey === "string" ? first.props.libraryKey : ""; };
  const stampKey = (section, key) => { const sec = JSON.parse(JSON.stringify(section)); const first = sec && Array.isArray(sec.children) ? sec.children[0] : null; if (first && first.type === "container") { first.props = { ...(first.props || {}), libraryKey: key }; } return sec; };
  const originOf = (ctx, t, doc) => {
    if (t.type === "footer" && t.sourceKind === "component") { try { const o = require("../../themeBuilder/revisions").originOfTemplate(ctx, t); return o ? { type: "footer", key: o.key, name: o.name, version: o.version, currentVersion: o.currentVersion } : null; } catch { return null; } }
    if (t.type !== "header" || t.sourceKind !== "component") return null;
    const key = originKey(doc); if (!key) return null;
    const m = Catalog.find("header", key); return m ? { type: "header", key, name: m.name } : null;
  };
  const card = (ctx, t, conflictIds, light = false) => {
    const base = { ...t, docRev: docRev(ctx, t), describe: TB.conditions.describe(t.conditions), editUrl: editUrl(t), previewUrl: previewUrl(t), previewNeedsPage: t.sourceKind !== "page", hasConflict: conflictIds.has(t.id), active: t.status === "published" };
    if (light) return { ...base, origin: t.type === "header" || t.type === "footer" ? originOf(ctx, t, t.type === "header" ? docOf(ctx, t) : null) : null };
    const doc = docOf(ctx, t), th = thumbnail(doc);
    return { ...base, thumb: th.svg, elements: th.elements, documentMissing: !doc, origin: originOf(ctx, t, doc) };
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
      return { key, label: d.label, group: d.group, count: counts[key] || 0, catalog: Catalog.types().includes(key) ? Catalog.PER_TYPE() : 0, live: all.filter((t) => t.type === key && t.status === "published").length, available: !off, reason: off ? `Module ${siteModules.MODULES[d.module].label} désactivé pour ce site.` : "" };
    });
    return { templates: shown, conflicts, types, groups: TB.types.GROUPS, total: all.filter((t) => t.status !== "archived").length, archived: all.filter((t) => t.status === "archived").length };
  };
  router.get(B, need("forms.read"), (req, res, next) => {
    try {
      const site = TB.store.site(req.mk.ctx, sid(req));
      // Retour : l'écran d'origine si la page d'appel l'a indiqué (chemin interne uniquement, jamais une adresse externe), sinon le tableau de bord du site
      const ret = String(req.query.retour || ""), safe = /^\/(?!\/)[A-Za-z0-9\-._~\/?=&%]{1,300}$/.test(ret) && !ret.includes("..") ? ret : "";
      res.set("Cache-Control", "no-store").render("marketing/theme-builder", { title: "Constructeur de thème", active: "sites", marketingShell: true, backUrl: safe || `${spaceBase(site)}/tableau-de-bord`, backIsCustom: !!safe, siteId: site.id, principal, siteName: site.name, base: `${spaceBase(site)}/constructeur-de-theme`, siteBase: spaceBase(site), perms: { write: req.mk.can("forms.write"), remove: req.mk.can("pages.delete") } });
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
  // Miniature RÉELLE d'un modèle du site : son document enregistré (copie de travail), rendu par le moteur public ; le site propriétaire est vérifié par TB.store.get
  router.get(`${T}/vignette`, need("forms.read"), (req, res, next) => {
    try {
      const ctx = req.mk.ctx, site = sid(req), t = TB.store.get(ctx, site, tid(req));
      let doc = null;
      if (t.sourceKind === "component") { const c = P().getComponent(ctx, t.sourceId); const sec = c && (c.draft || c.section); if (sec) doc = { kind: "component", section: sec }; }
      else { const pg = P().getPage(ctx, t.sourceId); if (pg && pg.working && pg.working.sections) doc = { kind: "page", sections: pg.working.sections }; }
      if (!doc) return res.status(404).type("text").send("Le document de ce modèle est introuvable.");
      require("./themeRender").previewDoc(req, res, { siteId: site, type: t.type, doc, thumb: true }, (html) => {
        if (html === null) return res.status(500).type("text").send("Aperçu indisponible.");
        res.set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }).type("html").send(html);
      });
    } catch (e) { if (e instanceof MarketingError || (e && STATUS[e.code])) return res.status(STATUS[e.code] || 400).type("text").send(e.message); next(e); }
  });
  router.post(`${T}/renommer`, need("forms.write"), run((ctx, id, req) => one(ctx, id, TB.store.rename(ctx, id, tid(req), body(req).name))));
  router.post(`${T}/conditions`, need("forms.write"), run((ctx, id, req) => { const r = TB.store.setConditions(ctx, id, tid(req), body(req).conditions || {}, { revision: body(req).revision ?? null }); return { ...one(ctx, id, r.template), conflicts: r.conflicts }; }));
  router.post(`${T}/publier`, need("forms.write"), run((ctx, id, req) => {
    const b = body(req);
    // Avec « strict » (l'écran l'envoie toujours) : la première publication exige une portée choisie (tout le site / conditions personnalisées). Sans : comportement d'origine.
    const r = TB.store.publishScoped(ctx, id, tid(req), { revision: b.revision ?? null, replace: b.replace === true, strict: b.strict === true, scope: b.scope ? String(b.scope) : null, conditions: b.conditions });
    return { ...one(ctx, id, r.template), version: r.version, conflicts: r.conflicts, replaced: r.replaced, summary: TB.publication.summary(ctx, id, r.template.conditions) };
  }));
  // Plan de publication (lecture seule) : « où afficher ? », résumé, conflits, chevauchements, effet sur les pages réelles. ?conditions=<JSON> pour simuler d'autres conditions.
  const parseConds = (req) => { if (req.query.conditions === undefined) return null; try { return JSON.parse(String(req.query.conditions).slice(0, 8000)); } catch { throw new MarketingError("invalid_field", "Conditions illisibles."); } };
  router.get(`${T}/plan-publication`, need("forms.read"), run((ctx, id, req) => { try { return { plan: TB.publication.plan(ctx, id, tid(req), { conditions: parseConds(req) }) }; } catch (e) { if (e instanceof MarketingError) throw e; if (e && e.code === "invalid_field") throw new MarketingError("invalid_field", e.message); throw e; } }));
  // « Ce modèle s'applique-t-il à cette adresse ? » (aucune écriture). visiteur=connecte|anonyme et role= pour tester les conditions de connexion.
  router.get(`${T}/s-applique`, need("forms.read"), run((ctx, id, req) => {
    const v = String(req.query.visiteur || ""), visitor = v === "connecte" ? { loggedIn: true, role: String(req.query.role || "").slice(0, 40) } : v === "anonyme" ? { loggedIn: false, role: "" } : null;
    let r; try { r = TB.publication.appliesToUrl(ctx, id, tid(req), String(req.query.url || ""), { visitor, conditions: parseConds(req) }); } catch (e) { if (e && e.code === "invalid_field" && !(e instanceof MarketingError)) throw new MarketingError("invalid_field", e.message); throw e; }
    if (!r.ok) throw new MarketingError("invalid_field", r.error);
    return r;
  }));
  // Sélecteurs de cibles avec recherche (pages, catégories, étiquettes, auteurs, produits, formations, rôles) du site de l'adresse
  router.get(`${A}/cibles`, need("forms.read"), run((ctx, id, req) => {
    try { return { items: TB.publication.targets(ctx, id, String(req.query.type || ""), String(req.query.q || "")) }; } catch (e) { if (e && e.code === "invalid_field" && !(e instanceof MarketingError)) throw new MarketingError("invalid_field", e.message); throw e; }
  }));
  router.post(`${T}/depublier`, need("forms.write"), run((ctx, id, req) => one(ctx, id, TB.store.unpublish(ctx, id, tid(req)))));
  router.post(`${T}/archiver`, need("forms.write"), run((ctx, id, req) => one(ctx, id, TB.store.archive(ctx, id, tid(req)))));
  router.post(`${T}/restaurer`, need("forms.write"), run((ctx, id, req) => one(ctx, id, TB.store.restore(ctx, id, tid(req)))));
  router.post(`${T}/dupliquer`, need("forms.write"), run((ctx, id, req) => one(ctx, id, TB.portable.duplicateTemplate(ctx, id, tid(req)))));
  router.post(`${T}/supprimer`, need("forms.write"), need("pages.delete"), run((ctx, id, req) => TB.store.remove(ctx, id, tid(req))));
  // « Revenir au modèle initial » : un en-tête installé depuis la bibliothèque retrouve exactement la composition d'origine (copie de travail du SEUL document de ce modèle ; rien n'est publié).
  // L'état avant le retour est gardé comme version (« Versions » › Restaurer) : l'opération est annulable.
  router.post(`${T}/revenir-au-modele`, need("forms.write"), run((ctx, id, req) => {
    const t = TB.store.get(ctx, id, tid(req));
    if (t.status === "archived") throw new MarketingError("conflict", "Ce modèle est archivé : restaurez-le avant de le modifier.");
    if (t.type === "footer") { const r = require("../../themeBuilder/revisions").revertToOrigin(ctx, id, t.id); return { ...one(ctx, id, r.template), version: r.revisionId, original: r.original }; } // pied : brouillon recréé depuis le catalogue, révision de sécurité avant
    if (t.type !== "header" || t.sourceKind !== "component") throw new MarketingError("invalid_field", "Seul un en-tête installé depuis la bibliothèque peut revenir à son modèle initial.");
    const key = originKey(docOf(ctx, t));
    if (!key) throw new MarketingError("invalid_field", "Cet en-tête n'a pas été installé depuis la bibliothèque : le modèle d'origine n'est pas connu.");
    const meta = Catalog.find("header", key); if (!meta) throw new MarketingError("not_found", "Le modèle d'origine n'existe plus dans la bibliothèque.");
    const fresh = Catalog.build("header", key, { formId: siteFormId(ctx, id) });
    if (!fresh || fresh.kind !== "component") throw new MarketingError("not_found", "Le modèle d'origine est introuvable.");
    return require("../../marketing/db/tx").transaction(ctx.db, () => {
      const version = TB.store.checkpoint(ctx, id, t.id);
      P().saveComponentDraft(ctx, t.sourceId, stampKey(fresh.section, key));
      return { ...one(ctx, id, TB.store.get(ctx, id, t.id)), version, original: { key, name: meta.name } };
    });
  }));
  router.get(`${T}/versions`, need("forms.read"), run((ctx, id, req) => ({ versions: TB.store.versions(ctx, id, tid(req)).map((v) => ({ ...v, describe: TB.conditions.describe(v.conditions) })) })));
  router.post(`${T}/versions/:n(\\d+)/restaurer`, need("forms.write"), run((ctx, id, req) => { const r = TB.store.restoreVersion(ctx, id, tid(req), Number(req.params.n)); return { ...one(ctx, id, r), conditionsRestored: r.conditionsRestored }; }));
  router.get(`${T}/instances`, need("forms.read"), run((ctx, id, req) => instances(ctx, id, tid(req))));
  router.get(`${T}/export.json`, need("forms.read"), (req, res, next) => {
    try { const d = TB.portable.exportTemplate(req.mk.ctx, sid(req), tid(req), { conditions: req.query.conditions === "1" }); res.set({ "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="modele-${tid(req)}.json"` }).type("application/json").send(JSON.stringify(d, null, 2)); }
    catch (e) { if (e instanceof MarketingError) return res.status(STATUS[e.code] || 400).json({ ok: false, error: e.message }); next(e); }
  });
  // Pieds de page : export de plusieurs pieds en une archive (?ids=1,2 ou tous), aperçu d'un fichier AVANT import (aucune écriture), import (un ou plusieurs, toujours en brouillon)
  router.get(`${A}/modeles/export-lot.json`, need("forms.read"), (req, res, next) => {
    try {
      const ids = String(req.query.ids || "").split(",").map((x) => Number(x)).filter((n) => Number.isInteger(n) && n > 0).slice(0, 60);
      const d = TB.portable.exportFooters(req.mk.ctx, sid(req), ids, { conditions: req.query.conditions === "1" });
      res.set({ "Cache-Control": "no-store", "Content-Disposition": 'attachment; filename="pieds-de-page.json"' }).type("application/json").send(JSON.stringify(d, null, 2));
    } catch (e) { if (e instanceof MarketingError) return res.status(STATUS[e.code] || 400).json({ ok: false, error: e.message }); next(e); }
  });
  router.post(`${A}/importer-apercu`, need("forms.write"), run((ctx, id, req) => ({ preview: TB.portable.previewImport(ctx, id, body(req).payload) })));
  router.post(`${A}/importer`, need("forms.write"), run((ctx, id, req) => {
    const payload = body(req).payload;
    if (payload && typeof payload === "object" && /^kolakisa-footer-/.test(String(payload.format || ""))) { const r = TB.portable.importPackage(ctx, id, payload); const cards = r.templates.map((t) => card(ctx, t, new Set())); return { template: cards[0], templates: cards, warnings: r.warnings }; }
    const t = TB.portable.importTemplate(ctx, id, payload); return { template: card(ctx, t, new Set()) };
  }));
  router.post(`${A}/importer-ancien`, need("forms.write"), run((ctx, id) => TB.legacy.importLegacy(ctx, id)));
  // Contenus réels proposés pour prévisualiser un modèle (« Aperçu avec ») : articles publiés (le plus récent d'abord). L'aperçu s'ouvre avec ?contenu=<id> sur les routes d'aperçu existantes.
  router.get(`${A}/contenus-apercu`, need("forms.read"), run((ctx, id, req) => {
    TB.store.site(ctx, id);
    const type = TB.types.has(req.query.type) ? req.query.type : null;
    if (type !== "single_post") return { items: [], note: "Aperçu avec un contenu choisi : disponible pour les modèles d'article." };
    const items = ctx.db.prepare("SELECT id, title, published_at FROM posts WHERE published = 1 ORDER BY published_at DESC, id DESC LIMIT 50").all().map((p) => ({ id: p.id, title: p.title, publishedAt: p.published_at }));
    return { items, param: "contenu" };
  }));
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
    // Pied de page seulement (catalogue « triable ») : tri, filtre « Favoris » et étoile par carte ; les autres types répondent exactement comme avant
    const fav = Favoris.TYPES.includes(type) && Number.isInteger(ctx.userId) ? Favoris.keys(ctx, id, type) : null;
    const res = Catalog.list(type, { q: String(q.q || "").slice(0, 80), tag: String(q.etiquette || "").slice(0, 40), skin: String(q.identite || "").slice(0, 20), layout: String(q.mise || "").slice(0, 40), page: q.page, limit: q.limite, tri: String(q.tri || "").slice(0, 20), favorites: fav, favOnly: String(q.favoris || "") === "1" });
    if (fav) { res.items = res.items.map((m) => ({ ...m, favorite: fav.has(m.key) })); res.favorites = { enabled: true, count: fav.size }; }
    return { type, available: !o.off, reason: o.reason, ...res };
  }));
  // Favoris (par utilisateur ET par site) : même droit que consulter la bibliothèque (forms.read) ; un identifiant inconnu est refusé, un ancien identifiant est suivi jusqu'à son remplaçant
  router.get(`${LIB}/favoris`, need("forms.read"), run((ctx, id, req) => ({ type: String(req.query.type || "footer"), keys: [...Favoris.keys(ctx, id, String(req.query.type || "footer"))] })));
  router.post(`${LIB}/favoris`, need("forms.read"), run((ctx, id, req) => { const b = body(req); return Favoris.add(ctx, id, String(b.type || ""), String(b.key || "")); }));
  router.delete(`${LIB}/favoris/:type/:key([a-z0-9.-]{3,80})`, need("forms.read"), run((ctx, id, req) => Favoris.remove(ctx, id, req.params.type, req.params.key)));
  router.get(`${LIB}/${keyOf}/miniature`, need("forms.read"), run((ctx, id, req) => {
    TB.store.site(ctx, id); libType(ctx, id, req.params.type);
    const doc = Catalog.thumbDoc(req.params.type, req.params.key, { formId: siteFormId(ctx, id) });
    if (!doc) throw Object.assign(new Error("Modèle introuvable."), { code: "not_found" });
    const th = thumbnail(doc.sections ? doc : doc);
    return { thumb: th.svg, elements: th.elements };
  }));
  // Aperçu complet (« apercu ») et miniature de carte (« vignette ») : même document du catalogue, même moteur de rendu public ; la miniature est mise en cache 2 min côté navigateur (elle ne dépend que du modèle et du site)
  const libPreview = (thumb) => (req, res, next) => {
    try {
      TB.store.site(req.mk.ctx, sid(req)); libType(req.mk.ctx, sid(req), req.params.type);
      const doc = Catalog.build(req.params.type, req.params.key, { formId: siteFormId(req.mk.ctx, sid(req)) });
      if (!doc) return res.status(404).type("text").send("Modèle introuvable.");
      require("./themeRender").previewDoc(req, res, { siteId: sid(req), type: req.params.type, doc, thumb, sampleMenu: true }, (html) => {
        if (html === null) return res.status(500).type("text").send("Aperçu indisponible.");
        res.set({ "Cache-Control": thumb ? "private, max-age=120" : "no-store", "X-Content-Type-Options": "nosniff" }).type("html").send(html);
      });
    } catch (e) { if (e instanceof MarketingError || (e && STATUS[e.code])) return res.status(STATUS[e.code] || 400).type("text").send(e.message); next(e); }
  };
  router.get(`${LIB}/${keyOf}/apercu`, need("forms.read"), libPreview(false));
  router.get(`${LIB}/${keyOf}/vignette`, need("forms.read"), libPreview(true));
  router.post(`${LIB}/utiliser`, need("forms.write"), run((ctx, id, req) => {
    const b = body(req); libType(ctx, id, String(b.type || ""));
    const t = useTemplate(ctx, id, String(b.type || ""), String(b.key || ""), { name: b.name ? String(b.name) : undefined });
    // En-tête : la clé du modèle d'origine est gardée dans le document (sert à « Revenir au modèle initial ») ; échec = installation sans cette fonction, jamais une erreur
    if (String(b.type) === "header" && t.sourceKind === "component") { try { const c = P().getComponent(ctx, t.sourceId); if (c) P().updateComponent(ctx, t.sourceId, { section: stampKey(c.section, String(b.key)) }); } catch { /* origine non mémorisée */ } }
    return { template: card(ctx, t, new Set()) };
  }));
  }
  return router;
};
