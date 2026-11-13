// KOLAKISA CMS → Site Web → Redirections / Liens cassés / Permaliens et adresses (palier 12).
// Un seul moteur de redirections (src/seo/redirects.js, aussi utilisé par l'Espace SEO) ; ici, son gestionnaire dans le CMS avec les droits du palier 9 :
//   redirects.view (voir, tester, analyser les liens), redirects.create, redirects.edit (modifier, activer / désactiver),
//   redirects.delete (supprimer), redirects.external (rediriger vers un site extérieur : protège contre les redirections malveillantes).
// Toute destination est validée par le moteur (chemin du site ou https://), jamais une adresse fournie par un visiteur.
const express = require("express");
const redirects = require("../../seo/redirects");
const probe = require("../../seo/probe");
const urls = require("../../services/urls");
const brokenLinks = require("../../services/brokenLinks");
const taxonomy = require("../../services/taxonomy");
const pages = require("../pages");
const { need } = require("./kit");
const { siteBase } = require("../../utils/seo");

const BASE = "/marketing/site-web";
const PER_PAGE = 25;
const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
// Options avancées du formulaire (correspondance, groupe, priorité, période, paramètres) : le moteur les valide toutes
const advanced = (b) => ({ matchType: b.match_type || undefined, groupId: b.group_id === undefined ? undefined : b.group_id || null, priority: b.priority === undefined ? undefined : b.priority,
  startsAt: b.starts_at === undefined ? undefined : b.starts_at, endsAt: b.ends_at === undefined ? undefined : b.ends_at, queryMode: b.query_mode || undefined });
const denied = (res) => res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });

module.exports = () => {
  const db = require("../../config/database");
  const router = express.Router();
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, ...(detail ? { detail } : {}), noReopen: true }; };
  const sitesOf = (ctx) => pages.listSites(ctx).filter((s) => s.status === "active").map((s) => ({ id: s.id, name: s.name }));
  const back = (req) => (/^\/marketing\/site-web\/redirections(\?[^#\s]*)?$/.test(String(req.body.retour || "")) ? req.body.retour : `${BASE}/redirections`);
  // Un site doit appartenir à l'organisation de la personne (jamais d'identifiant d'un autre espace)
  const siteIdOf = (ctx, raw) => { const id = intOrNull(raw); return id && sitesOf(ctx).some((s) => s.id === id) ? id : null; };

  // ----- Liste -----
  router.get("/site-web/redirections", need("redirects.view"), (req, res) => {
    const { ctx } = req.mk;
    const sites = sitesOf(ctx);
    const f = {
      q: String(req.query.q || "").trim().slice(0, 100),
      type: redirects.STATUSES.map(String).includes(String(req.query.type)) ? String(req.query.type) : "",
      groupe: /^\d+$/.test(String(req.query.groupe || "")) || req.query.groupe === "none" ? String(req.query.groupe) : "",
      corr: redirects.MATCH_TYPES.includes(String(req.query.corr)) ? String(req.query.corr) : "",
      etat: ["active", "inactive"].includes(String(req.query.etat)) ? String(req.query.etat) : "",
      site: req.query.site === "none" || sites.some((s) => String(s.id) === String(req.query.site)) ? String(req.query.site) : "",
      tri: Object.hasOwn(redirects.SORTS, req.query.tri) ? req.query.tri : "recent",
    };
    const result = redirects.query({ q: f.q, status: f.type, state: f.etat, site: f.site, sort: f.tri, page: req.query.page, perPage: PER_PAGE, siteIds: sites.map((s) => s.id), group: f.groupe, match: f.corr });
    const groups = require("../../seo/redirectTools").listGroups({ siteId: null, visible: sites.map((s) => s.id) });
    res.render("marketing/redirects", {
      title: "Redirections", active: "redirections", f, rows: result.rows, total: result.total, page: result.page, pages: result.pages, sites, groups, MATCHES: redirects.MATCH_LABELS, QUERY_MODES: redirects.QUERY_MODES,
      chains: redirects.chains().length, can: { create: req.mk.can("redirects.create"), edit: req.mk.can("redirects.edit"), del: req.mk.can("redirects.delete"), external: req.mk.can("redirects.external") },
      urlsJs: true, rdJs: true,
    });
  });

  // ----- Création -----
  router.post("/site-web/redirections", need("redirects.create"), (req, res) => {
    const { ctx } = req.mk;
    const input = { source: req.body.source, target: req.body.target, status: req.body.status, note: req.body.note, siteId: req.body.site_id ? siteIdOf(ctx, req.body.site_id) : null, ...advanced(req.body) };
    if (req.body.site_id && input.siteId === null) { flash(req, "error", "Site introuvable."); return res.redirect(back(req)); }
    if (/^https?:\/\//i.test(String(req.body.target || "").trim()) && !req.mk.can("redirects.external")) {
      flash(req, "error", "Rediriger vers un site extérieur est réservé aux administrateurs (permission « redirects.external »).");
      return res.redirect(back(req));
    }
    const r = redirects.create(input, req.session.user.id, { source: "cms" });
    if (!r.ok) flash(req, "error", r.errors.join(" ")); else flash(req, "ok", "Redirection créée.");
    res.redirect(back(req));
  });

  // ----- Modification, activation -----
  router.post("/site-web/redirections/:id(\\d+)", need("redirects.edit"), (req, res) => {
    const { ctx } = req.mk;
    const before = redirects.get(Number(req.params.id));
    if (!before || (before.site_id && !siteIdOf(ctx, before.site_id))) { flash(req, "error", "Redirection introuvable."); return res.redirect(back(req)); }
    const wantsExternal = /^https?:\/\//i.test(String(req.body.target || "").trim()) || redirects.isExternal(before.target);
    if (wantsExternal && !req.mk.can("redirects.external")) { flash(req, "error", "Une redirection vers un site extérieur ne peut être modifiée que par un administrateur (permission « redirects.external »)."); return res.redirect(back(req)); }
    const siteId = req.body.site_id === undefined ? undefined : (req.body.site_id ? siteIdOf(ctx, req.body.site_id) : null);
    if (req.body.site_id && siteId === null) { flash(req, "error", "Site introuvable."); return res.redirect(back(req)); }
    const r = redirects.update(before.id, { source: req.body.source, target: req.body.target, status: req.body.status, note: req.body.note, enabled: before.enabled ? "1" : "0", siteId, ...advanced(req.body) }, req.session.user.id);
    if (!r.ok) flash(req, "error", r.errors.join(" ")); else flash(req, "ok", "Redirection enregistrée.");
    res.redirect(back(req));
  });
  router.post("/site-web/redirections/:id(\\d+)/etat", need("redirects.edit"), (req, res) => {
    const before = redirects.get(Number(req.params.id));
    if (!before) { flash(req, "error", "Redirection introuvable."); return res.redirect(back(req)); }
    if (redirects.isExternal(before.target) && !req.mk.can("redirects.external")) { flash(req, "error", "Seul un administrateur peut changer l'état d'une redirection vers un site extérieur."); return res.redirect(back(req)); }
    const enable = req.body.enabled === "1";
    // Réactiver peut recréer une boucle (une autre redirection a changé entre-temps) : la validation du moteur la refuse
    const r = redirects.update(before.id, { source: before.source_path, target: before.target, status: before.status, note: before.note, enabled: enable ? "1" : "0" }, req.session.user.id);
    if (!r.ok) flash(req, "error", r.errors.join(" ")); else flash(req, "ok", enable ? "Redirection activée." : "Redirection désactivée.");
    res.redirect(back(req));
  });
  router.post("/site-web/redirections/:id(\\d+)/supprimer", need("redirects.delete"), (req, res) => {
    const before = redirects.get(Number(req.params.id));
    if (!before) flash(req, "error", "Redirection introuvable."); else { redirects.remove(before.id, req.session.user.id); flash(req, "ok", "Redirection supprimée."); }
    res.redirect(back(req));
  });
  router.post("/site-web/redirections/:id(\\d+)/raccourcir", need("redirects.edit"), (req, res) => {
    const r = redirects.fixChain(Number(req.params.id), req.session.user.id);
    if (!r.ok) flash(req, "error", r.errors.join(" ")); else flash(req, "ok", "Chaîne raccourcie : la redirection mène directement à la destination finale.");
    res.redirect(back(req));
  });

  // ----- Test d'une redirection : le vrai serveur est interrogé (aucun résultat simulé) -----
  router.post("/site-web/redirections/tester", need("redirects.view"), async (req, res, next) => {
    try {
      const { ctx } = req.mk;
      const source = redirects.normalizePath(req.body && req.body.source);
      if (!source) return res.status(422).json({ error: { message: "Adresse invalide : un chemin du site, par exemple /ancienne-page." } });
      const siteId = req.body && req.body.siteId ? siteIdOf(ctx, req.body.siteId) : null;
      const info = siteId ? urls.siteInfo(siteId) : null;
      if (req.body && req.body.siteId && (!info || !info.host)) return res.status(422).json({ error: { message: "Ce site n'a pas de domaine propre : le test se fait sur le site principal." } });
      const query = String(req.body.query || "").replace(/[^A-Za-z0-9=&_.%-]/g, "").slice(0, 100);
      const t = await probe.trace(req.socket.localPort, `${source}${query ? `?${query}` : ""}`, { host: info ? info.host : null });
      const last = t.steps[t.steps.length - 1];
      const verdict = t.loop ? "boucle" : t.final.external ? "externe" : t.final.status === 200 ? "ok" : t.final.status === 404 ? "404" : "erreur";
      res.set("Cache-Control", "no-store").json({ source, host: info ? info.host : null, steps: t.steps, final: { status: last.status, url: last.url, external: Boolean(t.final.external), location: last.location }, hops: t.steps.filter((s) => s.status >= 300 && s.status < 400).length, verdict });
    } catch (error) { next(error); }
  });

  // ----- Liens cassés -----
  const REPORT_KEY = "broken_links_report";
  const loadReport = () => { try { const r = db.prepare("SELECT value FROM seo_settings WHERE key = ?").get(REPORT_KEY); return r ? JSON.parse(r.value) : null; } catch { return null; } };
  router.get("/site-web/liens-casses", need("redirects.view"), (req, res) => {
    const report = loadReport();
    res.render("marketing/broken-links", { title: "Liens cassés", active: "redirections", report, canScan: req.mk.can("redirects.view"), urlsJs: true });
  });
  router.post("/site-web/liens-casses/analyser", need("redirects.view"), async (req, res, next) => {
    try {
      const r = await brokenLinks.scan({ port: req.socket.localPort });
      const keep = { ...r, issues: r.issues.slice(0, 500), truncated: r.issues.length > 500 };
      db.prepare("INSERT INTO seo_settings (key, value, updated_by) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now'), updated_by = excluded.updated_by")
        .run(REPORT_KEY, JSON.stringify(keep), req.session.user.id);
      flash(req, "ok", r.issues.length ? `Analyse terminée : ${r.issues.length} lien${r.issues.length > 1 ? "s" : ""} à corriger.` : "Analyse terminée : aucun lien cassé.");
      res.redirect(`${BASE}/liens-casses`);
    } catch (error) { next(error); }
  });

  // ----- Permaliens et adresses : structure réelle, domaines des sites, ce qui se passe pour une adresse donnée -----
  router.get("/site-web/permaliens", need("redirects.view"), async (req, res, next) => {
    try {
      const { ctx } = req.mk;
      const tx = taxonomy;
      const structure = [
        { label: "Page du CMS", pattern: "/p/<adresse>", example: "/p/formation-photoshop", note: "Sur le domaine propre d'un site : /<adresse> (« / » pour son accueil)." },
        { label: "Article", pattern: "/blog/<adresse>", example: "/blog/mon-article", note: "L'ancienne adresse redirige (301) après un changement." },
        { label: "Formation", pattern: "/cours/<adresse>", example: "/cours/ma-formation", note: "L'ancienne adresse redirige (301) après un changement." },
        ...Object.values(tx.TAXONOMIES).map((t) => ({ label: t.label, pattern: `${tx.baseOf(t.key)}/<adresse>`, example: `${tx.baseOf(t.key)}/exemple`, note: "L'ancienne adresse redirige (301) après un changement ou une fusion." })),
        { label: "Archive du blog", pattern: "/blog?page=2", example: "/blog?page=2", note: "La pagination utilise ?page=N ; les tris et filtres ne créent pas de page indexable." },
      ];
      const sites = pages.listSites(ctx).filter((s) => s.status === "active").map((s) => { const i = urls.siteInfo(s.id); return { id: s.id, name: s.name, host: i && i.host, base: i && i.base, noindex: i && i.noindex, home: i && i.homePageId ? (db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(i.homePageId) || {}).slug : null }; });
      const address = String(req.query.adresse || "").trim().slice(0, 300);
      let check = null;
      if (address) {
        const path = urls.cleanPath(address.replace(/^https?:\/\/[^/]+/i, ""));
        if (!path) check = { error: "Adresse invalide." };
        else {
          const siteId = req.query.site ? siteIdOf(ctx, req.query.site) : null;
          const info = siteId ? urls.siteInfo(siteId) : null;
          const known = urls.resolve(path, { hostSite: info && info.host ? info : null });
          const t = await probe.trace(req.socket.localPort, path, { host: info && info.host ? info.host : null });
          check = { path, known: { type: known.type, state: known.state, path: known.path, title: known.row && (known.row.title || known.row.name || known.row.slug) }, steps: t.steps, final: t.steps[t.steps.length - 1], host: info && info.host };
        }
      }
      const { indexingAllowed } = require("../../middlewares/siteHost");
      res.render("marketing/permalinks", { title: "Permaliens et adresses", active: "redirections", structure, sites, check, query: { adresse: address, site: String(req.query.site || "") }, indexing: indexingAllowed(req), base: siteBase(req), history: db.prepare("SELECT COUNT(*) n FROM cms_url_history").get().n, urlsJs: true });
    } catch (error) { next(error); }
  });

  return router;
};
