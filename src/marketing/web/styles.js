// KOLAKISA CMS → Apparence → Styles : gestionnaire de styles globaux (système de design) d'UN site.
// UN écran partagé (comme Thèmes / Widgets) : le site vient de l'adresse vérifiée par le serveur (/sites/<id>/styles → ?site=<id>), jamais d'un état global ; sans site choisi,
// c'est le site principal (équipe seulement). Droits : appearance.read (voir) · appearance.styles (brouillon) · appearance.publish (publier).
// Ce n'est PAS un second moteur : l'écran lit et écrit par ses routes /site-web/styles/{rendu,brouillon,annuler,publier,restaurer} (brouillon dans cms_customizer_drafts,
// historique dans cms_customizer_versions) ; les valeurs vivent dans les moteurs du site (mk_sites.tokens / appearance_configs). Une seule valeur par réglage, jamais deux systèmes concurrents.
const express = require("express");
const siteStyles = require("../../services/siteStyles");
const pages = require("../pages");
const { recordAudit } = require("../audit");
const { MarketingError } = require("../errors");
const { UserError } = require("../../utils/errors");
const palettes = require("../../services/stylePalettes");
const tokensLib = require("../pages/tokens");
const target = require("./siteTarget");
const { need, safeJson } = require("./kit");

const BASE = "/marketing/site-web/styles";
// Les quatre familles de réglages de design affichées par l'écran
const PANELS = ["couleurs", "typographie", "mise-en-page", "boutons"];
const getPath = (obj, path) => path.split(".").reduce((n, k) => (n && typeof n === "object" ? n[k] : undefined), obj);

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
  router.get("/site-web/styles", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const can = (p) => req.mk.can(p);
    const st = siteStyles.state(req.mk.ctx, t.siteId, { can });
    const panels = st.panels.filter((p) => PANELS.includes(p.id));
    const ids = new Set(panels.flatMap((p) => p.controls.map((c) => c.id)));
    const pick = (o) => Object.fromEntries(Object.entries(o).filter(([id]) => ids.has(id)));
    // Valeurs d'origine de Kolakisa (jetons par défaut) : proposées par « Valeurs d'origine », jamais appliquées sans confirmation
    const defaults = {};
    for (const id of ids) { const v = getPath({ tokens: tokensLib.DEFAULT_TOKENS }, id); if (v !== undefined && typeof v !== "object") defaults[id] = v; }
    const fontStacks = {};
    for (const c of panels.flatMap((p) => p.controls)) if (c.id.startsWith("tokens.fonts.")) for (const [value] of c.options || []) { try { fontStacks[value] = tokensLib.fontStackOf(value); } catch { /* police inconnue : repli du navigateur */ } }
    const q = t.siteId ? `?site=${t.siteId}` : "";
    // L'aperçu de la page réelle part du brouillon enregistré (copie de travail de CETTE session, pour CE site seulement),
    const key = t.siteId === null ? "p" : String(t.siteId);
    req.session.kwStyleDraft = { ...(req.session.kwStyleDraft || {}) };
    if (Object.keys(st.changes).length) req.session.kwStyleDraft[key] = st.changes; else delete req.session.kwStyleDraft[key];
    const boot = {
      siteId: t.siteId, siteName: t.name, principal: t.principal, readOnly: t.readOnly, base: BASE, siteQuery: q,
      panels: panels.map((p) => ({ id: p.id, label: p.label, controls: p.controls })), values: pick(st.values), live: pick(st.live), changes: pick(st.changes), outside: Object.fromEntries(Object.entries(st.changes).filter(([id]) => !ids.has(id))), outsideChanges: Object.keys(st.changes).filter((id) => !ids.has(id)).length,
      draft: st.draft, revision: st.revision, stale: st.stale, pendingEngineDraft: st.pendingEngineDraft, perControl: st.can,
      can: { edit: can("appearance.styles") && !t.readOnly, publish: can("appearance.publish") && !t.readOnly },
      defaults, fontStacks, palettes: palettes.forScope(t.siteId), previews: previewTargets(req, t), history: siteStyles.history(t.siteId, 8),
      links: { designSystem: t.principal ? null : `/marketing/site-web/sites/${t.siteId}/reglages/design-system`, polices: `/marketing/site-web/polices${q}`, themes: `/marketing/site-web/themes${q}` },
    };
    res.set("Cache-Control", "no-store");
    // « < » et les séparateurs de ligne sont échappés : le JSON ne peut jamais fermer la balise qui le contient
    const bootJson = safeJson(boot);
    res.render("marketing/styles", { title: "Styles", active: "apparence/styles", T: t, BASE, bootJson, stylesJs: true, mediaSite: t.siteId ? String(t.siteId) : "principal" });
  });

  // ----- Aperçu en direct, brouillon, publication, versions (appelés par l'écran) -----
  const canOf = (req) => (perm) => req.mk.can(perm);
  const fail = (res, next, error) => {
    if (error instanceof UserError) return res.status(422).json({ error: { code: "invalid_field", message: error.message } });
    if (error instanceof MarketingError) return res.status(error.code === "not_found" ? 404 : error.code === "forbidden" ? 403 : error.code === "conflict" ? 409 : 422).json({ error: { code: error.code, message: error.message } });
    return next(error);
  };
  const changesOf = (body) => {
    const c = body && body.changes;
    if (!c || typeof c !== "object" || Array.isArray(c) || Object.keys(c).length > 200) throw new UserError("Réglages invalides.");
    return c;
  };
  const audit = (req, t, action, metadata) => {
    try { recordAudit(req.mk.ctx.db, { organizationId: req.mk.ctx.organizationId, userId: req.session.user.id, action, resourceType: "site", resourceId: t.siteId, metadata, siteId: t.siteId }); } catch { /* l'audit ne bloque jamais l'action */ }
  };
  const readOnlyMsg = "Ce site est archivé ou supprimé : restaurez-le avant de modifier ses styles.";
  const keyOf = (t) => (t.siteId === null ? "p" : String(t.siteId));
  const json = (res) => res.set("Cache-Control", "no-store");
  const writable = (t, res) => { if (t.readOnly) { res.status(409).json({ error: { code: "invalid_state", message: readOnlyMsg } }); return false; } return true; };
  router.post("/site-web/styles/rendu", need("appearance.styles"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t || !writable(t, res)) return;
    try {
      const p = siteStyles.previewFor(req.mk.ctx, t.siteId, changesOf(req.body), { can: canOf(req) });
      req.session.kwStyleDraft = { ...(req.session.kwStyleDraft || {}), [keyOf(t)]: p.changes };
      json(res).json({ ok: true, structural: p.structural, assets: p.assets, warnings: p.warnings, count: Object.keys(p.changes).length });
    } catch (error) { fail(res, next, error); }
  });
  router.post("/site-web/styles/brouillon", need("appearance.styles"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t || !writable(t, res)) return;
    try {
      const r = siteStyles.saveDraft(req.mk.ctx, t.siteId, changesOf(req.body), req.session.user.id, { rev: Number.isInteger(req.body.rev) ? req.body.rev : undefined, can: canOf(req) });
      audit(req, t, "styles.draft_saved", { count: r.count });
      json(res).json({ ok: true, draft: r });
    } catch (error) { fail(res, next, error); }
  });
  router.post("/site-web/styles/annuler", need("appearance.styles"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    try {
      siteStyles.discardDraft(t.siteId);
      if (req.session.kwStyleDraft) delete req.session.kwStyleDraft[keyOf(t)];
      audit(req, t, "styles.draft_discarded", {});
      json(res).json({ ok: true });
    } catch (error) { fail(res, next, error); }
  });
  // Publication : le succès n'est annoncé qu'après l'écriture réelle dans le moteur du site
  router.post("/site-web/styles/publier", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t || !writable(t, res)) return;
    try {
      const r = siteStyles.publish(req.mk.ctx, t.siteId, req.session.user.id, { rev: Number.isInteger(req.body.rev) ? req.body.rev : undefined, note: req.body.note, can: canOf(req) });
      if (req.session.kwStyleDraft) delete req.session.kwStyleDraft[keyOf(t)];
      audit(req, t, "styles.published", { settings: r.changed });
      json(res).json({ ok: true, changed: r.changed, values: r.state.values, live: r.state.live, revision: r.state.revision, draft: r.state.draft, history: siteStyles.history(t.siteId, 8) });
    } catch (error) { fail(res, next, error); }
  });
  router.post("/site-web/styles/restaurer", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t || !writable(t, res)) return;
    try {
      siteStyles.restoreVersion(req.mk.ctx, t.siteId, Number(req.body.version), req.session.user.id, { can: canOf(req) });
      audit(req, t, "styles.version_restored", { version: Number(req.body.version) });
      json(res).json({ ok: true });
    } catch (error) { fail(res, next, error); }
  });
  return router;
};
module.exports.BASE = BASE;
module.exports.previewTargets = previewTargets;
