// AI Media Generator & Asset Manager (programme 21.7) : écran « Médias IA » d'un site. Le site vient de l'ADRESSE (/site-web/sites/:id/medias-ia), vérifié par le service.
// Droits : forms.read (voir) · forms.write (planifier, générer, affecter, décrire) · settings.write + équipe (autorisation de dépense). Toute génération passe par le serveur ; aucun fournisseur n'est appelé depuis le navigateur.
const express = require("express");
const am = require("../../aiMedia");
const { need } = require("./kit");
const { MarketingError } = require("../errors");

module.exports = () => {
  const router = express.Router();
  const W = (id) => `/marketing/site-web/sites/${id}/medias-ia`;
  const sid = (req) => Number(req.params.id);
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, detail }; };
  const opts = (req) => ({ credentials: undefined, now: undefined });
  const page = (fn) => (req, res, next) => { try { fn(req, res, next); } catch (e) { if (e instanceof MarketingError) return res.status(e.code === "not_found" ? 404 : e.code === "forbidden" ? 403 : 422).render("error", { message: e.message }); next(e); } };
  const act = (back, fn) => (req, res, next) => {
    try { const m = fn(req); if (m) flash(req, "ok", typeof m === "string" ? m : m.text, typeof m === "string" ? undefined : m.detail); }
    catch (e) { if (!(e instanceof MarketingError)) return next(e); flash(req, "error", e.message); }
    res.redirect(back(req));
  };
  const json = (fn) => (req, res, next) => { try { res.set("Cache-Control", "no-store").json(fn(req)); } catch (e) { if (!(e instanceof MarketingError)) return next(e); res.status(e.code === "not_found" ? 404 : e.code === "forbidden" ? 403 : 422).json({ error: e.message }); } };

  router.get("/site-web/sites/:id(\\d+)/medias-ia", need("forms.read"), page((req, res) => {
    const ctx = req.mk.ctx, id = sid(req);
    const q = { q: String(req.query.q || ""), source: String(req.query.source || ""), ai: req.query.ia === "1", unused: req.query.inutilises === "1", category: String(req.query.categorie || "") };
    res.set("Cache-Control", "no-store").render("marketing/site-ai-media", {
      title: "Médias IA", active: "sites", marketingShell: true, siteId: id, W: W(id), needs: am.listNeeds(ctx, id), providers: am.providerStatus(ctx, id), tasks: am.listTasks(ctx, id), library: am.library(ctx, id, q), q,
      history: am.historyList(ctx, id, 30), consumption: am.consumption(ctx, id), spend: am.spendAuthorized(ctx), canWrite: req.mk.can("forms.write"), isTeam: !req.mk.siteOnly && req.mk.can("settings.write"), SOURCES: am.SOURCES, RATIOS: am.providers.RATIOS,
    });
  }));
  router.post("/site-web/sites/:id(\\d+)/medias-ia/planifier", need("forms.write"), act((r) => W(sid(r)), (req) => { const n = am.plan(req.mk.ctx, sid(req)); return `${n.filter((x) => x.status === "needed").length} besoin(s) visuel(s) à pourvoir.`; }));
  router.post("/site-web/sites/:id(\\d+)/medias-ia/generer", need("forms.write"), act((r) => W(sid(r)), (req) => {
    const t = am.start(req.mk.ctx, sid(req), { needKeys: [].concat(req.body.besoins || []).flatMap((x) => String(x).split("|")), provider: req.body.fournisseur, model: req.body.modele, variants: req.body.variantes, ratio: req.body.ratio || undefined, prompt: req.body.consigne || undefined, regenerate: req.body.regenerer === "oui" }, opts(req));
    return `${t.filter((x) => !x.duplicate).length} génération(s) lancée(s) en arrière-plan${t.some((x) => x.duplicate) ? `, ${t.filter((x) => x.duplicate).length} déjà en cours ou terminée(s)` : ""}. Vous pouvez quitter cette page.`;
  }));
  router.get("/site-web/sites/:id(\\d+)/medias-ia/taches.json", need("forms.read"), json((req) => ({ tasks: am.listTasks(req.mk.ctx, sid(req)).slice(0, 30) })));
  router.post("/site-web/sites/:id(\\d+)/medias-ia/taches/:tid(\\d+)/annuler", need("forms.write"), act((r) => W(sid(r)), (req) => { am.cancel(req.mk.ctx, sid(req), Number(req.params.tid)); return "Génération annulée."; }));
  router.post("/site-web/sites/:id(\\d+)/medias-ia/taches/:tid(\\d+)/relancer", need("forms.write"), act((r) => W(sid(r)), (req) => { am.retry(req.mk.ctx, sid(req), Number(req.params.tid), opts(req)); return "Nouvelle tentative lancée."; }));
  router.post("/site-web/sites/:id(\\d+)/medias-ia/besoin", need("forms.write"), act((r) => W(sid(r)), (req) => { am.editNeed(req.mk.ctx, sid(req), req.body.besoin, { prompt: req.body.consigne, ratio: req.body.ratio || undefined }); return "Besoin mis à jour."; }));
  router.post("/site-web/sites/:id(\\d+)/medias-ia/affecter", need("forms.write"), act((r) => W(sid(r)), (req) => {
    const r = am.assign(req.mk.ctx, sid(req), { needKey: req.body.besoin, mediaId: Number(req.body.media), alt: req.body.alt === undefined || req.body.alt === "" ? null : req.body.alt, replace: req.body.remplacer === "oui", confirmManual: req.body.confirmer_manuel === "oui" });
    return r.verified ? (r.operation === "replace" ? "Image remplacée dans le brouillon de la page." : "Image placée dans le brouillon de la page.") : "Image enregistrée mais non retrouvée à la relecture : vérifiez la page.";
  }));
  router.post("/site-web/sites/:id(\\d+)/medias-ia/auto-affecter", need("forms.write"), act((r) => W(sid(r)), (req) => { const r = am.autoAssign(req.mk.ctx, sid(req)); return { text: `${r.done.length} emplacement(s) vide(s) rempli(s) ; aucune image existante remplacée.`, detail: r.skipped.map((s) => s.why).join("\n") || undefined }; }));
  router.post("/site-web/sites/:id(\\d+)/medias-ia/restaurer", need("forms.write"), act((r) => W(sid(r)), (req) => { am.restore(req.mk.ctx, sid(req), req.body.besoin, { confirm: req.body.confirmer === "oui" }); return "Image précédente restaurée."; }));
  router.post("/site-web/sites/:id(\\d+)/medias-ia/medias/:mid(\\d+)/metadonnees", need("forms.write"), act((r) => W(sid(r)), (req) => { am.describe(req.mk.ctx, sid(req), Number(req.params.mid), { alt: req.body.alt, caption: req.body.legende, description: req.body.description, tags: req.body.tags, category: req.body.categorie, license: req.body.licence, licenseNote: req.body.note_licence, author: req.body.auteur, focalX: req.body.focal_x, focalY: req.body.focal_y }); return "Métadonnées enregistrées."; }));
  router.post("/site-web/sites/:id(\\d+)/medias-ia/medias/:mid(\\d+)/importe", need("forms.write"), act((r) => W(sid(r)), (req) => { am.registerImport(req.mk.ctx, sid(req), Number(req.params.mid), { license: req.body.licence, licenseNote: req.body.note_licence, author: req.body.auteur }); return "Provenance de l'image importée enregistrée."; }));
  // 22.7 — intelligence visuelle (lecture seule, analyse de pixels) : diagnostic de la médiathèque, détail d'une image, recommandations pour un besoin, catalogue des sources
  const jsonAsync = (fn) => async (req, res, next) => { try { res.set("Cache-Control", "no-store").json(await fn(req)); } catch (e) { if (!(e instanceof MarketingError)) return next(e); res.status(e.code === "not_found" ? 404 : e.code === "forbidden" ? 403 : 422).json({ error: e.message }); } };
  const ii = () => require("../../imageIntel");
  router.get("/site-web/sites/:id(\\d+)/medias-ia/diagnostic.json", need("forms.read"), jsonAsync((req) => ii().siteDiagnostic(req.mk.ctx, sid(req), { limit: Number(req.query.limite) || 40 })));
  router.get("/site-web/sites/:id(\\d+)/medias-ia/medias/:mid(\\d+)/analyse.json", need("forms.read"), jsonAsync((req) => { const fx = Number(req.query.fx), fy = Number(req.query.fy); return ii().inspect(req.mk.ctx, sid(req), Number(req.params.mid), { ratio: String(req.query.ratio || "16:9"), focal: req.query.fx !== undefined && Number.isFinite(fx) && Number.isFinite(fy) ? { x: fx, y: fy } : null }); }));
  router.get("/site-web/sites/:id(\\d+)/medias-ia/recommandations.json", need("forms.read"), jsonAsync((req) => ii().recommend(req.mk.ctx, sid(req), String(req.query.besoin || ""), { proposals: Number(req.query.propositions) || 3 })));
  router.get("/site-web/sites/:id(\\d+)/medias-ia/sources.json", need("forms.read"), json((req) => { am.siteOf(req.mk.ctx, sid(req)); return { sources: ii().licenses.SOURCES, note: "Catalogue documentaire : aucune source externe n'est connectée ni testée." }; }));
  router.get("/site-web/sites/:id(\\d+)/medias-ia/medias.json", need("forms.read"), json((req) => ({ items: am.library(req.mk.ctx, sid(req), { q: String(req.query.q || ""), source: String(req.query.source || ""), ai: req.query.ia === "1", unused: req.query.inutilises === "1", category: String(req.query.categorie || "") }) })));
  router.get("/site-web/sites/:id(\\d+)/medias-ia/medias/:mid(\\d+).json", need("forms.read"), json((req) => ({ provenance: am.provenance(req.mk.ctx, sid(req), Number(req.params.mid)), usage: am.usageOf(req.mk.ctx, sid(req), Number(req.params.mid)), responsive: am.responsive(req.mk.ctx, sid(req), Number(req.params.mid)), alt: am.suggestAlt(req.mk.ctx, sid(req), Number(req.params.mid)) })));
  router.post("/site-web/sites/:id(\\d+)/medias-ia/depense", need("settings.write"), act((r) => W(sid(r)), (req) => {
    if (req.mk.siteOnly) throw new MarketingError("forbidden", "L'autorisation de dépense est réservée à l'équipe de l'organisation.");
    const on = am.setSpendAuthorized(req.mk.ctx, req.body.autoriser === "oui");
    return on ? "Dépense autorisée pour les fournisseurs payants (une clé et l'activation dans l'AI Core restent nécessaires)." : "Dépense non autorisée : seuls les visuels de démonstration sont possibles.";
  }));
  return router;
};
