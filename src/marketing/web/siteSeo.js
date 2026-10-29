// R8 lot 6C — SEO dans l'espace d'UN site : réglages SEO du site, redirections du site (lecture et écriture), erreurs 404 du site (lecture).
// Le site vient UNIQUEMENT de l'adresse vérifiée par le serveur (res.locals.siteSpace / req.mk.site) : aucun « site » reçu du navigateur n'est lu.
// Droits réels : seo.view / seo.edit (réglages), redirects.view / create / edit / delete / external (redirections). Les réglages globaux, l'audit, la surveillance, les intégrations,
// les règles et les redirections COMMUNES restent à l'équipe centrale (suite /formateur/seo) : ils n'ont aucune route ici.
const express = require("express");
const { need, flashError, flashOk } = require("./kit");
const nav = require("./cmsNav");
const settings = require("../../seo/settings");
const redirects = require("../../seo/redirects");
const notfound = require("../../seo/notfound");
const tools = require("../../seo/siteTools");

const BASE = nav.BASE;
// Réglages qu'un site peut modifier depuis son espace (les images passent par les réglages d'identité du site ; les clés restantes de SITE_KEYS sont gérées par l'équipe)
const FORM_KEYS = ["site_name", "title_separator", "title_template", "default_description", "og_locale", "org_type", "org_name", "org_description", "social_profiles", "org_phone", "org_email", "org_street", "org_postal_code", "org_city", "org_country", "robots_custom"];

// Le site de la requête : celui de l'adresse, vérifié ; sinon refus (jamais un repli)
function spaceOf(req, res) {
  const space = res.locals.siteSpace;
  if (!space || space.principal || !Number.isInteger(space.siteId) || !req.mk.site || req.mk.site.id !== space.siteId) return null;
  return space;
}
const writable = (space) => space.status !== "archived" && !space.deleted;
const deny = (res, status, message) => res.status(status).render("error", { message });

module.exports = () => {
  const router = express.Router({ mergeParams: true });
  const P = "/site-web/sites/:id(\\d+)";
  // Toutes les routes de ce module exigent un site vérifié ; sinon la même réponse que les autres écrans de l'espace
  router.use(`${P}/(seo|redirections)`, (req, res, next) => {
    const space = spaceOf(req, res);
    if (!space) {
      const reason = req.mk.siteContext && !req.mk.siteContext.ok ? req.mk.siteContext.reason : "not_found";
      return deny(res, reason === "forbidden" ? 403 : 404, reason === "forbidden" ? "Vous n'avez pas accès à ce site." : "Site introuvable.");
    }
    req.seoSpace = space;
    next();
  });
  const back = (req, tail = "") => `${req.seoSpace.base}${tail}`;
  const note = (space) => (writable(space) ? null : "Ce site est archivé : ses réglages sont en lecture seule. Restaurez-le depuis ses réglages pour les modifier.");

  // Chaque rubrique ne modifie QUE ses propres réglages (liste fermée) ; le site vient de l'adresse vérifiée
  const GROUPS = {
    meta: ["site_name", "title_separator", "title_template", "default_description"],
    schema: ["org_type", "org_name", "org_description", "social_profiles", "org_phone", "org_email", "org_street", "org_postal_code", "org_city", "org_country"],
    "open-graph": ["og_locale"],
  };
  const render = (req, res, mode, title, extra = {}) => res.render("marketing/site-seo/" + mode, { active: mode === "overview" ? "seo" : `seo/${mode === "notfound" ? "404" : mode}`, title, mode, space: req.seoSpace, note: note(req.seoSpace),
    canEdit: req.mk.can("seo.edit") && writable(req.seoSpace), seoSiteJs: true, query: req.query, ...extra });
  const saveGroup = (req, res, group, tail) => {
    const space = req.seoSpace;
    if (!writable(space)) { flashError(req, "Ce site est archivé : ses réglages ne peuvent pas être modifiés."); return res.redirect(back(req, tail)); }
    const input = {};
    for (const k of GROUPS[group]) {
      if (!Object.hasOwn(req.body, k)) continue;
      const raw = req.body[k];
      input[k] = String(raw ?? "").trim() === "" ? null : raw; // champ vide = retour à la valeur neutre du site
    }
    const r = settings.saveForSite(space.siteId, input, req.session.user.id);
    if (!r.ok) flashError(req, r.errors.join(" ")); else flashOk(req, "Réglages enregistrés pour ce site.");
    return res.redirect(back(req, tail));
  };
  const fieldList = (space, keys) => {
    const own = settings.storedFor(space.siteId), effective = settings.allFor(space.siteId);
    return keys.map((k) => ({ key: k, ...settings.FIELDS[k], own: Object.hasOwn(own, k), value: Object.hasOwn(own, k) ? own[k] : "", effective: effective[k] }));
  };
  const sid = (req) => req.seoSpace.siteId;

  // ---------- Vue générale ----------
  router.get(`${P}/seo`, need("seo.view"), (req, res) => {
    const ov = tools.overview(req, req.mk.ctx, sid(req));
    if (!ov) return deny(res, 404, "Site introuvable.");
    render(req, res, "overview", "SEO du site", { ov });
  });
  // Ancien formulaire unique (conservé pour les anciens signets et clients) : même liste de réglages qu'avant, enregistrés par site
  router.post(`${P}/seo`, need("seo.edit"), (req, res) => {
    const space = req.seoSpace;
    if (!writable(space)) { flashError(req, "Ce site est archivé : ses réglages ne peuvent pas être modifiés."); return res.redirect(back(req, "/seo")); }
    const input = {};
    for (const k of FORM_KEYS) {
      if (!Object.hasOwn(req.body, k)) continue;
      const raw = req.body[k];
      input[k] = String(raw ?? "").trim() === "" ? null : raw;
    }
    const r = settings.saveForSite(space.siteId, input, req.session.user.id);
    if (!r.ok) { flashError(req, r.errors.join(" ")); return res.redirect(back(req, "/seo")); }
    flashOk(req, "Réglages SEO du site enregistrés.");
    res.redirect(back(req, "/seo"));
  });

  // ---------- Analyse SEO ----------
  router.get(`${P}/seo/analyse`, need("seo.view"), (req, res) => {
    const v = tools.analysisView(req, req.mk.ctx, sid(req), { auditId: Number(req.query.analyse) || null, severity: String(req.query.gravite || ""), category: String(req.query.categorie || ""), rule: String(req.query.regle || "").replace(/[^a-z0-9_]/gi, "").slice(0, 60), q: String(req.query.q || "").slice(0, 120) });
    render(req, res, "analyse", "Analyse SEO", { v });
  });
  router.post(`${P}/seo/analyse`, need("seo.edit"), async (req, res, next) => {
    if (!writable(req.seoSpace)) { flashError(req, "Ce site est archivé : l'analyse n'est pas disponible."); return res.redirect(back(req, "/seo/analyse")); }
    try {
      const r = await tools.startAnalysis(req, sid(req), req.session.user.id, { force: req.body.force === "1" });
      if (!r.ok) flashError(req, r.error || "L'analyse n'a pas pu démarrer.");
      else if (r.reused) flashOk(req, "Aucune page n'a changé depuis la dernière analyse (moins de 15 minutes) : ses résultats sont affichés. Utilisez « Relancer quand même » pour forcer.");
      else flashOk(req, "Analyse lancée. La progression s'affiche ci-dessous.");
      res.redirect(back(req, `/seo/analyse${r.id ? `?analyse=${r.id}` : ""}`));
    } catch (error) { next(error); }
  });
  router.get(`${P}/seo/analyse/etat`, need("seo.view"), (req, res) => {
    const st = tools.analysisState(sid(req), Number(req.query.id));
    if (!st) return res.status(404).json({ error: "Analyse introuvable pour ce site." });
    res.set("Cache-Control", "no-store").json(st);
  });

  // ---------- Meta ----------
  router.get(`${P}/seo/meta`, need("seo.view"), (req, res) => {
    const v = tools.metaView(req, req.mk.ctx, sid(req));
    if (!v) return deny(res, 404, "Site introuvable.");
    render(req, res, "meta", "Meta", { v, fields: fieldList(req.seoSpace, GROUPS.meta) });
  });
  router.post(`${P}/seo/meta`, need("seo.edit"), (req, res) => saveGroup(req, res, "meta", "/seo/meta"));

  // ---------- Indexation ----------
  router.get(`${P}/seo/indexation`, need("seo.view"), (req, res) => {
    const v = tools.indexingView(req, req.mk.ctx, sid(req));
    if (!v) return deny(res, 404, "Site introuvable.");
    render(req, res, "indexation", "Indexation", { v });
  });
  router.post(`${P}/seo/indexation`, need("seo.edit"), (req, res) => {
    const space = req.seoSpace;
    if (!writable(space)) { flashError(req, "Ce site est archivé : son indexation ne peut pas être modifiée."); return res.redirect(back(req, "/seo/indexation")); }
    const noindex = req.body.noindex === "1";
    const follow = req.body.follow === "1";
    const current = tools.indexingView(req, req.mk.ctx, space.siteId);
    // Fermer tout le site aux moteurs de recherche est une action lourde : confirmation explicite obligatoire, jamais silencieuse
    if (noindex && current && !current.siteNoindex && req.body.confirm !== "1") { flashError(req, "Confirmez explicitement que tout le site doit être retiré des moteurs de recherche (case à cocher)."); return res.redirect(back(req, "/seo/indexation")); }
    try {
      const r = tools.saveSiteIndexing(req.mk.ctx, space.siteId, { noindex, follow, revision: Number(req.body.revision), userId: req.session.user.id });
      flashOk(req, r.changed ? (noindex ? "Le site entier est maintenant en noindex : les moteurs de recherche sont invités à ne pas l'indexer." : "Réglages d'indexation du site enregistrés.") : "Aucun changement.");
    } catch (error) { flashError(req, error && error.message ? error.message : "Enregistrement impossible."); }
    res.redirect(back(req, "/seo/indexation"));
  });

  // ---------- Sitemap ----------
  router.get(`${P}/seo/sitemap`, need("seo.view"), (req, res) => render(req, res, "sitemap", "Sitemap", { v: tools.sitemapView(req, sid(req)) }));
  router.post(`${P}/seo/sitemap/regenerer`, need("seo.edit"), (req, res) => {
    if (!writable(req.seoSpace)) { flashError(req, "Ce site est archivé."); return res.redirect(back(req, "/seo/sitemap")); }
    const r = tools.regenerateSitemap(req, sid(req), req.session.user.id);
    if (r.valid) flashOk(req, `Plan du site régénéré et contrôlé : ${r.urls} adresse(s), ${r.excluded} exclue(s).`); else flashError(req, `Plan du site régénéré mais invalide : ${r.problems.join(" ")}`);
    res.redirect(back(req, "/seo/sitemap"));
  });
  router.get(`${P}/seo/sitemap/apercu.xml`, need("seo.view"), (req, res) => {
    res.set({ "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-store" }).send(require("../../seo/sitemap").xmlForSite(req, sid(req)));
  });

  // ---------- Schema ----------
  router.get(`${P}/seo/schema`, need("seo.view"), (req, res) => {
    const v = tools.schemaView(req, req.mk.ctx, sid(req), Number(req.query.page) || null);
    if (!v) return deny(res, 404, "Site introuvable.");
    render(req, res, "schema", "Schema", { v, fields: fieldList(req.seoSpace, GROUPS.schema) });
  });
  router.post(`${P}/seo/schema`, need("seo.edit"), (req, res) => saveGroup(req, res, "schema", "/seo/schema"));

  // ---------- Open Graph ----------
  router.get(`${P}/seo/open-graph`, need("seo.view"), (req, res) => {
    const v = tools.ogView(req, req.mk.ctx, sid(req));
    if (!v) return deny(res, 404, "Site introuvable.");
    render(req, res, "open-graph", "Open Graph", { v, fields: fieldList(req.seoSpace, GROUPS["open-graph"]), library: tools.siteImages(req.mk.ctx, sid(req)) });
  });
  router.post(`${P}/seo/open-graph`, need("seo.edit"), (req, res) => {
    const space = req.seoSpace;
    if (!writable(space)) { flashError(req, "Ce site est archivé : ses réglages ne peuvent pas être modifiés."); return res.redirect(back(req, "/seo/open-graph")); }
    try {
      const l = settings.saveForSite(space.siteId, { og_locale: String(req.body.og_locale || "").trim() === "" ? null : req.body.og_locale }, req.session.user.id);
      if (!l.ok) { flashError(req, l.errors.join(" ")); return res.redirect(back(req, "/seo/open-graph")); }
      if (Object.hasOwn(req.body, "og_image")) {
        const image = String(req.body.og_image || "").trim();
        // L'image doit appartenir à la médiathèque de CE site (ou être une adresse https) : jamais le fichier d'un autre site
        if (image && !/^https:\/\//i.test(image) && !tools.siteImages(req.mk.ctx, space.siteId).some((m) => m.path === image)) throw new Error("Image de partage : choisissez une image de la médiathèque de ce site.");
        tools.saveSiteShareImage(req.mk.ctx, space.siteId, { image, revision: Number(req.body.revision), userId: req.session.user.id });
      }
      flashOk(req, "Paramètres de partage enregistrés pour ce site.");
    } catch (error) { flashError(req, error && error.message ? error.message : "Enregistrement impossible."); }
    res.redirect(back(req, "/seo/open-graph"));
  });

  // ---------- Robots ----------
  router.get(`${P}/seo/robots`, need("seo.view"), (req, res) => {
    const site = require("../pages").getSite(req.mk.ctx, sid(req));
    render(req, res, "robots", "Robots", { v: tools.robotsView(req, sid(req), site) });
  });
  router.post(`${P}/seo/robots/apercu`, need("seo.view"), (req, res) => res.set("Cache-Control", "no-store").json(tools.robotsPreview(req, sid(req), String((req.body || {}).robots_custom || "").slice(0, 8000))));
  router.post(`${P}/seo/robots`, need("seo.edit"), (req, res) => {
    const space = req.seoSpace;
    if (!writable(space)) { flashError(req, "Ce site est archivé : son robots.txt ne peut pas être modifié."); return res.redirect(back(req, "/seo/robots")); }
    const text = String(req.body.robots_custom || "").slice(0, 8000);
    const pv = tools.robotsPreview(req, space.siteId, text);
    if (!pv.valid) { flashError(req, pv.error || "Règles invalides."); return res.redirect(back(req, "/seo/robots")); }
    // Une règle qui bloque tout le site ou un grand nombre de pages demande une confirmation explicite ; les règles existantes ne sont jamais remplacées sans que le nouveau contenu soit celui affiché
    if (pv.needsConfirm && req.body.confirm !== "1") { flashError(req, "Cette règle peut bloquer tout le site ou un grand nombre de pages : cochez la confirmation pour l'enregistrer."); return res.redirect(back(req, "/seo/robots")); }
    const r = settings.saveForSite(space.siteId, { robots_custom: text.trim() === "" ? null : text }, req.session.user.id);
    if (!r.ok) flashError(req, r.errors.join(" ")); else flashOk(req, "robots.txt du site enregistré : il est servi immédiatement sur le domaine du site (le cache des moteurs peut garder l'ancien fichier quelques heures).");
    res.redirect(back(req, "/seo/robots"));
  });
  router.post(`${P}/seo/robots/restaurer`, need("seo.edit"), (req, res) => {
    if (!writable(req.seoSpace)) { flashError(req, "Ce site est archivé."); return res.redirect(back(req, "/seo/robots")); }
    const r = tools.robotsRestore(sid(req), Number(req.body.change), req.session.user.id);
    if (!r.ok) flashError(req, r.errors.join(" ")); else flashOk(req, "Version précédente de robots.txt rétablie.");
    res.redirect(back(req, "/seo/robots"));
  });

  // ---------- Erreurs 404 du site ----------
  router.get(`${P}/seo/404`, need("seo.view"), (req, res) => {
    const v = tools.notFoundView(sid(req), { state: String(req.query.etat || "open"), q: String(req.query.q || "").slice(0, 120), filter: req.query.filtre === "human" ? "human" : req.query.filtre === "bot" ? "bot" : "all" });
    render(req, res, "notfound", "Erreurs 404 du site", { v, canRedirect: req.mk.can("redirects.create") && writable(req.seoSpace) });
  });
  const nfWrite = (req, res) => {
    if (!writable(req.seoSpace)) { flashError(req, "Ce site est archivé : ses erreurs 404 ne peuvent pas être modifiées."); res.redirect(back(req, "/seo/404")); return false; }
    return true;
  };
  router.post(`${P}/seo/404/action`, need("seo.edit"), (req, res) => {
    if (!nfWrite(req, res)) return;
    const path = String(req.body.path || "").slice(0, 300);
    const action = String(req.body.action || "");
    const site = sid(req);
    let ok = false;
    if (action === "traitee") ok = notfound.setHandled(path, true, { site, userId: req.session.user.id });
    else if (action === "rouvrir") ok = notfound.setHandled(path, false, { site }) | notfound.setIgnored(path, false, { site }).changes;
    else if (action === "ignorer") ok = notfound.setIgnored(path, true, { site }).changes > 0;
    else if (action === "supprimer") ok = notfound.remove(path, { site });
    if (ok) flashOk(req, "Erreur 404 mise à jour."); else flashError(req, "Adresse introuvable pour ce site.");
    res.redirect(back(req, "/seo/404"));
  });
  router.post(`${P}/seo/404/rediriger`, async (req, res, next) => {
    if (!nfWrite(req, res)) return;
    if (!req.mk.can("redirects.create")) return deny(res, 403, "Vous n'avez pas la permission d'effectuer cette action.");
    try {
      const target = String(req.body.target || "").trim();
      if (/^https:\/\//i.test(target) && !req.mk.can("redirects.external")) { flashError(req, "Rediriger vers un site extérieur demande la permission « redirects.external »."); return res.redirect(back(req, "/seo/404")); }
      const chk = await tools.checkTarget(sid(req), target, req);
      if (!chk.ok) { flashError(req, chk.error); return res.redirect(back(req, "/seo/404")); }
      const r = redirects.createForSite(sid(req), { source: req.body.path, target, status: req.body.status === "302" ? 302 : 301, note: "Créée depuis les erreurs 404" }, req.session.user.id);
      if (!r.ok) flashError(req, r.errors.join(" "));
      else { notfound.setHandled(String(req.body.path || "").slice(0, 300), true, { site: sid(req), userId: req.session.user.id }); flashOk(req, `Redirection ${req.body.status === "302" ? "302" : "301"} créée${chk.note ? ` (${chk.note})` : ""}.`); }
      res.redirect(back(req, "/seo/404"));
    } catch (error) { next(error); }
  });
  router.post(`${P}/seo/404/verifier`, need("seo.edit"), async (req, res, next) => {
    if (!nfWrite(req, res)) return;
    try {
      const paths = [].concat(req.body.path || []).map((x) => String(x).slice(0, 300));
      const out = await tools.recheck(sid(req), paths.length ? paths : tools.notFoundView(sid(req), { state: "handled" }).rows.map((r) => r.path), req);
      flashOk(req, out.length ? `${out.filter((o) => o.recovered).length} adresse(s) répondent de nouveau sur ${out.length} vérifiée(s).` : "Aucune adresse à vérifier.");
      res.redirect(back(req, "/seo/404?etat=all"));
    } catch (error) { next(error); }
  });
  router.post(`${P}/seo/404/purger`, need("seo.edit"), (req, res) => {
    if (!nfWrite(req, res)) return;
    const n = notfound.purge({ site: sid(req), days: Number(req.body.days) || 180 });
    flashOk(req, `${n} ancienne(s) adresse(s) traitée(s) supprimée(s) du journal (les adresses encore à traiter sont conservées).`);
    res.redirect(back(req, "/seo/404"));
  });

  // ---------- Redirections du site ----------
  router.get(`${P}/redirections`, need("redirects.view"), (req, res) => {
    const space = req.seoSpace;
    const q = redirects.queryForSite(space.siteId, { q: String(req.query.q || ""), page: Number(req.query.page) || 1, perPage: 25 });
    res.render("marketing/site-seo", { active: "redirections", title: "Redirections du site", mode: "redirects", space, note: note(space), q, search: String(req.query.q || ""),
      can: { create: req.mk.can("redirects.create") && writable(space), edit: req.mk.can("redirects.edit") && writable(space), delete: req.mk.can("redirects.delete") && writable(space), external: req.mk.can("redirects.external") },
      prefill: String(req.query.source || "").slice(0, 300), query: req.query });
  });
  router.get(`${P}/redirections/export.csv`, need("redirects.view"), (req, res) => {
    res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="redirections-site-${req.seoSpace.siteId}.csv"`, "Cache-Control": "no-store" });
    res.send(`﻿${redirects.exportCsvForSite(req.seoSpace.siteId)}`);
  });
  const isExternal = (t) => redirects.isExternal(t);
  const guardWrite = (req, res, perm) => {
    if (!writable(req.seoSpace)) { flashError(req, "Ce site est archivé : ses redirections ne peuvent pas être modifiées."); res.redirect(back(req, "/redirections")); return false; }
    if (!req.mk.can(perm)) { deny(res, 403, "Vous n'avez pas la permission d'effectuer cette action."); return false; }
    return true;
  };
  const externalOk = (req, res, target) => {
    if (isExternal(target) && !req.mk.can("redirects.external")) { flashError(req, "Rediriger vers un site extérieur demande la permission « redirects.external »."); res.redirect(back(req, "/redirections")); return false; }
    return true;
  };
  router.post(`${P}/redirections`, (req, res) => {
    if (!guardWrite(req, res, "redirects.create") || !externalOk(req, res, req.body.target)) return;
    const r = redirects.createForSite(req.seoSpace.siteId, { source: req.body.source, target: req.body.target, status: req.body.status, note: req.body.note }, req.session.user.id); // le « site » du formulaire n'est jamais lu
    if (!r.ok) flashError(req, r.errors.join(" ")); else flashOk(req, "Redirection créée.");
    res.redirect(back(req, "/redirections"));
  });
  router.post(`${P}/redirections/import`, (req, res) => {
    if (!guardWrite(req, res, "redirects.create")) return;
    const text = String(req.body.csv || "").slice(0, 400000);
    if (!req.mk.can("redirects.external") && /(^|[,;])\s*"?https:\/\//im.test(text.split(/\r?\n/).map((l) => l.split(/[,;]/)[1] || "").join("\n"))) { flashError(req, "Le fichier contient des destinations extérieures : la permission « redirects.external » est nécessaire."); return res.redirect(back(req, "/redirections")); }
    const report = redirects.importCsvForSite(req.seoSpace.siteId, text, req.session.user.id);
    if (report.errors.length) flashError(req, `${report.created} créée(s) ; ${report.errors.length} ligne(s) refusée(s) : ${report.errors.slice(0, 5).join(" ")}`); else flashOk(req, `${report.created} redirection(s) créée(s).`);
    res.redirect(back(req, "/redirections"));
  });
  router.post(`${P}/redirections/:rid(\\d+)`, (req, res) => {
    if (!guardWrite(req, res, "redirects.edit") || !externalOk(req, res, req.body.target)) return;
    const r = redirects.updateForSite(req.seoSpace.siteId, Number(req.params.rid), { source: req.body.source, target: req.body.target, status: req.body.status, note: req.body.note, enabled: req.body.enabled === "1" ? "1" : "0" }, req.session.user.id);
    if (!r.ok) flashError(req, r.errors.join(" ")); else flashOk(req, "Redirection enregistrée.");
    res.redirect(back(req, "/redirections"));
  });
  router.post(`${P}/redirections/:rid(\\d+)/supprimer`, (req, res) => {
    if (!guardWrite(req, res, "redirects.delete")) return;
    if (redirects.removeForSite(req.seoSpace.siteId, Number(req.params.rid), req.session.user.id)) flashOk(req, "Redirection supprimée."); else flashError(req, "Redirection introuvable.");
    res.redirect(back(req, "/redirections"));
  });
  return router;
};
