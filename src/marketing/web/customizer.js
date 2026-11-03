// KOLAKISA CMS → Apparence → Personnaliser : écran plein cadre (panneau de réglages + aperçu réel du site), brouillon, aperçu en direct, publication, versions.
// UN écran partagé (comme Thèmes) : le site vient de l'adresse vérifiée par le serveur (« ?site=<id> » ou champ « site »), jamais d'un état global ; sans site choisi,
// c'est le site principal (équipe de l'organisation seulement). Un accès limité à un site ne peut agir que sur le sien : contrôlé ici ET par la garde de portée des routes.
// Droits : appearance.read (ouvrir, aperçu) · appearance.styles (brouillon) · appearance.publish (publier, restaurer) · pages.code (CSS additionnel) · seo.edit (slogan du site).
// Le moteur de rendu est le moteur public (aperçu = vraie page, jetons recalculés en mémoire) ; rien n'est publié avant la confirmation du serveur.
const express = require("express");
const customizer = require("../../services/customizer");
const pages = require("../pages");
const navigation = require("../../services/navigation");
const { recordAudit } = require("../audit");
const { MarketingError } = require("../errors");
const { UserError } = require("../../utils/errors");
const { need } = require("./kit");

const BASE = "/marketing/site-web/personnaliser";
const MAX_BODY_CHANGES = 200;

// Pages réelles à prévisualiser : l'accueil et ce que CE site contient vraiment
function previewTargets(req, t) {
  if (t.principal) {
    const db = req.mk.ctx.db;
    const out = [{ url: "/", label: "Accueil" }, { url: "/blog", label: "Blog" }, { url: "/catalogue", label: "Catalogue" }, { url: "/a-propos", label: "À propos" }];
    try {
      const post = db.prepare("SELECT slug, title FROM posts p WHERE p.published = 1 AND p.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM mk_content_sites cs WHERE cs.content_type = 'post' AND cs.content_id = p.id) ORDER BY COALESCE(published_at, created_at) DESC LIMIT 1").get();
      if (post) out.push({ url: require("../../services/urls").publicPath("post", post), label: `Article : ${post.title}` });
    } catch { /* pas d'article */ }
    return out;
  }
  const list = pages.listPages(req.mk.ctx, { siteId: t.siteId }).filter((p) => p.kind !== "step" && !p.archived_at).sort((a, b) => (a.id === (t.site && t.site.home_page_id) ? -1 : b.id === (t.site && t.site.home_page_id) ? 1 : a.id - b.id));
  return list.slice(0, 40).map((p) => ({ url: `/marketing/pages/${p.id}/apercu`, label: p.name + (p.id === (t.site && t.site.home_page_id) ? " (accueil)" : "") }));
}

module.exports = () => {
  const router = express.Router();
  const denied = (res, message, json) => (json ? res.status(403).json({ error: { code: "forbidden", message } }) : res.status(403).render("error", { message }));
  const missing = (res, json) => (json ? res.status(404).json({ error: { code: "not_found", message: "Site introuvable." } }) : res.status(404).render("error", { message: "Site introuvable." }));

  // Le site visé (même règle que Thèmes) : accès limité → le sien (jamais un autre) ; équipe → « ?site= » / champ « site », sinon le site principal. null = réponse déjà envoyée.
  function target(req, res, { json = false } = {}) {
    const ctx = req.mk.ctx;
    const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
    const asked = raw === undefined || raw === null || raw === "" ? undefined : /^\d{1,12}$/.test(String(raw)) ? Number(raw) : NaN;
    let siteId;
    if (ctx.siteScope !== undefined) {
      const own = Number.isInteger(ctx.siteScope) && ctx.siteScope > 0 ? ctx.siteScope : null;
      if (own === null || (asked !== undefined && asked !== own)) { denied(res, "Vous n'avez pas accès à ce site.", json); return null; }
      siteId = own;
    } else if (asked === undefined) siteId = null;
    else if (Number.isNaN(asked) || asked < 1) { missing(res, json); return null; }
    else siteId = asked;
    if (siteId === null) return { siteId: null, name: "Site principal", principal: true, readOnly: false };
    const site = pages.getSite(ctx, siteId);
    if (!site) { missing(res, json); return null; }
    return { siteId, name: site.name, principal: false, readOnly: site.status !== "active" || Boolean(site.deleted_at), site };
  }
  const canOf = (req) => (perm) => req.mk.can(perm);
  const key = (t) => (t.siteId === null ? "p" : String(t.siteId));
  const fail = (res, next, error) => {
    if (error instanceof UserError) return res.status(422).json({ error: { code: "invalid_field", message: error.message } });
    if (error instanceof MarketingError) return res.status(error.code === "not_found" ? 404 : error.code === "forbidden" ? 403 : error.code === "conflict" ? 409 : 422).json({ error: { code: error.code, message: error.message } });
    return next(error);
  };
  const changesOf = (body) => {
    const c = body && body.changes;
    if (!c || typeof c !== "object" || Array.isArray(c) || Object.keys(c).length > MAX_BODY_CHANGES) throw new UserError("Réglages invalides.");
    return c;
  };
  const audit = (req, t, action, metadata) => {
    try { recordAudit(req.mk.ctx.db, { organizationId: req.mk.ctx.organizationId, userId: req.session.user.id, action, resourceType: "site", resourceId: t.siteId, metadata, siteId: t.siteId }); } catch { /* la journalisation ne fait jamais échouer l'action */ }
  };
  const readOnlyMsg = "Ce site est archivé ou supprimé : restaurez-le avant de le personnaliser.";

  // ----- L'écran -----
  router.get("/site-web/personnaliser", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const can = canOf(req);
    try { customizer.runDue({ organizationId: req.mk.ctx.organizationId }); } catch { /* une planification en échec ne bloque jamais l'écran (elle est annulée et signalée) */ }
    const st = customizer.state(req.mk.ctx, t.siteId, { can });
    const menus = navigation.listMenus({ siteId: t.siteId }).map((m) => ({ id: m.id, name: m.name, items: m.items, locations: m.locations, broken: m.broken }));
    const q = t.siteId ? `?site=${t.siteId}` : "";
    // L'aperçu du cadre part du brouillon enregistré (copie de travail de CETTE session, pour CE site seulement)
    req.session.kwCustomizer = { ...(req.session.kwCustomizer || {}) };
    if (Object.keys(st.changes).length) req.session.kwCustomizer[key(t)] = st.changes; else delete req.session.kwCustomizer[key(t)];
    const boot = {
      siteId: t.siteId, siteName: t.name, principal: t.principal, readOnly: t.readOnly, base: BASE, siteQuery: q,
      panels: st.panels, values: st.values, live: st.live, changes: st.changes, draft: st.draft, revision: st.revision, stale: st.stale, pendingEngineDraft: st.pendingEngineDraft, unsupported: st.unsupported,
      can: { edit: can("appearance.styles") && !t.readOnly, publish: can("appearance.publish") && !t.readOnly, css: can("pages.code"), seo: can("seo.edit") }, perControl: st.can,
      previews: previewTargets(req, t), menus, history: customizer.history(t.siteId, 8),
      links: {
        back: t.principal ? "/marketing" : `/marketing/site-web/sites/${t.siteId}/tableau-de-bord`,
        menus: t.principal ? "/marketing/site-web/navigation" : `/marketing/site-web/navigation?site=${t.siteId}`,
        themes: `/marketing/site-web/themes${q}`, pageBuilder: t.principal ? null : `/marketing/site-web/sites/${t.siteId}/constructeur-de-theme?type=header`,
      },
    };
    res.set("Cache-Control", "no-store");
    // JSON intégré à la page : « < » et les séparateurs de ligne sont échappés (aucune balise ne peut s'y glisser)
    const bootJson = JSON.stringify(boot).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    res.render("marketing/customizer", { title: `Personnaliser — ${t.name}`, T: t, boot, bootJson, mediaSite: t.siteId ? String(t.siteId) : "principal" });
  });

  // ----- Aperçu en direct : valide, garde la copie de travail de CETTE session pour CE site, renvoie le CSS recalculé -----
  router.post("/site-web/personnaliser/rendu", need("appearance.styles"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    if (t.readOnly) return res.status(409).json({ error: { code: "invalid_state", message: readOnlyMsg } });
    try {
      const p = customizer.previewFor(req.mk.ctx, t.siteId, changesOf(req.body), { can: canOf(req) });
      req.session.kwCustomizer = { ...(req.session.kwCustomizer || {}), [key(t)]: p.changes };
      res.set("Cache-Control", "no-store").json({ ok: true, structural: p.structural, assets: p.assets, warnings: p.warnings, count: Object.keys(p.changes).length });
    } catch (error) { fail(res, next, error); }
  });
  // ----- Brouillon -----
  router.post("/site-web/personnaliser/brouillon", need("appearance.styles"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    if (t.readOnly) return res.status(409).json({ error: { code: "invalid_state", message: readOnlyMsg } });
    try {
      const r = customizer.saveDraft(req.mk.ctx, t.siteId, changesOf(req.body), req.session.user.id, { rev: Number.isInteger(req.body.rev) ? req.body.rev : undefined, can: canOf(req) });
      audit(req, t, "customizer.draft_saved", { count: r.count });
      res.set("Cache-Control", "no-store").json({ ok: true, draft: r });
    } catch (error) { fail(res, next, error); }
  });
  router.post("/site-web/personnaliser/annuler", need("appearance.styles"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    try {
      customizer.discardDraft(t.siteId);
      if (req.session.kwCustomizer) delete req.session.kwCustomizer[key(t)];
      audit(req, t, "customizer.draft_discarded", {});
      res.set("Cache-Control", "no-store").json({ ok: true });
    } catch (error) { fail(res, next, error); }
  });
  // ----- Publication : le succès n'est annoncé qu'après l'écriture réelle dans le moteur du site -----
  router.post("/site-web/personnaliser/publier", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    if (t.readOnly) return res.status(409).json({ error: { code: "invalid_state", message: readOnlyMsg } });
    try {
      const r = customizer.publish(req.mk.ctx, t.siteId, req.session.user.id, { rev: Number.isInteger(req.body.rev) ? req.body.rev : undefined, note: req.body.note, can: canOf(req) });
      if (req.session.kwCustomizer) delete req.session.kwCustomizer[key(t)];
      audit(req, t, "customizer.published", { settings: r.changed });
      res.set("Cache-Control", "no-store").json({ ok: true, changed: r.changed, values: r.state.values, live: r.state.live, revision: r.state.revision, draft: r.state.draft, history: customizer.history(t.siteId, 8) });
    } catch (error) { fail(res, next, error); }
  });
  router.post("/site-web/personnaliser/restaurer", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    if (t.readOnly) return res.status(409).json({ error: { code: "invalid_state", message: readOnlyMsg } });
    try {
      customizer.restoreVersion(req.mk.ctx, t.siteId, Number(req.body.version), req.session.user.id, { can: canOf(req) });
      audit(req, t, "customizer.version_restored", { version: Number(req.body.version) });
      res.set("Cache-Control", "no-store").json({ ok: true });
    } catch (error) { fail(res, next, error); }
  });
  // ----- Publication planifiée -----
  router.post("/site-web/personnaliser/planifier", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    if (t.readOnly) return res.status(409).json({ error: { code: "invalid_state", message: readOnlyMsg } });
    try {
      const r = customizer.schedule(t.siteId, req.session.user.id, req.body.at, { rev: Number.isInteger(req.body.rev) ? req.body.rev : undefined });
      audit(req, t, "customizer.scheduled", { at: r.publishAt });
      res.set("Cache-Control", "no-store").json({ ok: true, publishAt: r.publishAt });
    } catch (error) { fail(res, next, error); }
  });
  router.post("/site-web/personnaliser/deplanifier", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    try { customizer.unschedule(t.siteId); audit(req, t, "customizer.unscheduled", {}); res.set("Cache-Control", "no-store").json({ ok: true }); } catch (error) { fail(res, next, error); }
  });
  // ----- Lien d'aperçu partageable (sites seulement) -----
  router.post("/site-web/personnaliser/partager", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    if (t.readOnly) return res.status(409).json({ error: { code: "invalid_state", message: readOnlyMsg } });
    try {
      const home = t.site && t.site.home_page_id;
      const row = req.mk.ctx.db.prepare("SELECT slug FROM mk_landing_pages WHERE site_id = ? AND status = 'published' AND archived_at IS NULL ORDER BY (id = ?) DESC, id LIMIT 1").get(t.siteId, home || 0);
      if (!row) throw new UserError("Publiez au moins une page de ce site : le lien d'aperçu s'appuie sur une page publiée.");
      const r = customizer.createShare(t.siteId, req.session.user.id, { days: Number(req.body.days) || 7 });
      audit(req, t, "customizer.share_created", { days: r.days });
      res.set("Cache-Control", "no-store").json({ ok: true, days: r.days, url: `${req.protocol}://${req.get("host")}/p/${row.slug}?kwshare=${r.token}` });
    } catch (error) { fail(res, next, error); }
  });
  router.post("/site-web/personnaliser/revoquer-partage", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    try { const n = customizer.revokeShares(t.siteId); audit(req, t, "customizer.share_revoked", { count: n }); res.set("Cache-Control", "no-store").json({ ok: true, revoked: n }); } catch (error) { fail(res, next, error); }
  });
  return router;
};
module.exports.BASE = BASE;
module.exports.previewTargets = previewTargets; // partagé avec Apparence → Styles (mêmes pages réelles à prévisualiser)
