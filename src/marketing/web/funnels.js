// « Tunnels » dans l'Emailing : liste, création (vide ou depuis un modèle), construction étape par étape, statistiques.
// Les pages des étapes s'éditent dans le MÊME éditeur visuel que Site Web (/marketing/pages/:id/editeur).
// Droits (palier 18) : funnels.read / funnels.write pour le tunnel ; le contenu des pages reste « forms.write », leur mise en ligne « pages.publish »
// (on peut donc gérer un tunnel sans pouvoir modifier ses pages, et inversement).
const express = require("express");
const funnels = require("../funnels");
const { funnelReport, recommendation } = require("../funnels/analytics");
const pages = require("../pages");
const { listCourses } = require("../bridge/catalog");
const { attempt, need } = require("./kit");
const { MarketingError } = require("../errors");

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);

module.exports = () => {
  const router = express.Router();

  router.get("/tunnels", need("funnels.read"), (req, res) => {
    const archived = req.query.vue === "archives";
    const { ctx } = req.mk;
    const list = funnels.listFunnels(ctx, { archived }).map((f) => ({ ...f, report: funnelReport(ctx, funnels.getFunnel(ctx, f.id), { days: 30 }) }));
    res.render("marketing/funnels", { title: "Tunnels", active: "funnels", archived, list, templates: require("../funnels/templates").catalog(), hasCourse: listCourses(ctx).length > 0 });
  });
  router.post("/tunnels", need("funnels.write"), (req, res, next) => {
    let created = null;
    attempt(req, res, next, () => (created ? `/marketing/tunnels/${created.id}` : "/marketing/tunnels#nouveau"), () => {
      const template = typeof req.body.template === "string" && req.body.template ? req.body.template : null;
      created = funnels.createFunnel(req.mk.ctx, { name: req.body.name, description: req.body.description, template, siteId: req.body.site });
      return template ? `Tunnel créé avec ${created.steps.length} étapes (pages en brouillon) : complétez chaque page dans l'éditeur, puis mettez le tunnel en ligne.` : "Tunnel créé : ajoutez sa première étape.";
    });
  });

  const load = (req, res) => {
    const f = funnels.getFunnel(req.mk.ctx, intOrNull(req.params.id));
    if (!f) res.status(404).render("error", { message: "Tunnel introuvable." });
    return f;
  };
  router.get("/tunnels/:id(\\d+)", need("funnels.read"), (req, res) => {
    const f = load(req, res);
    if (!f) return;
    const { ctx } = req.mk;
    const days = [7, 30, 90].includes(Number(req.query.periode)) ? Number(req.query.periode) : 30;
    const report = funnelReport(ctx, f, { days });
    // Pages disponibles pour une étape : non archivées, pas déjà dans un autre tunnel actif
    const used = new Set(ctx.db.prepare("SELECT s.page_id FROM mk_funnel_steps s JOIN mk_funnels t ON t.id = s.funnel_id WHERE t.status = 'active' AND s.page_id IS NOT NULL AND t.organization_id = ?").all(ctx.organizationId).map((r) => r.page_id));
    res.render("marketing/funnel", {
      title: f.name, active: "funnels", f, days, report, advice: recommendation(report, f), canWrite: req.mk.can("funnels.write"), canEditPages: req.mk.can("forms.write"), canPublish: req.mk.can("pages.publish"),
      STEP_TYPES: funnels.STEP_TYPES, NEXT_URL: funnels.NEXT_URL, automations: funnels.linkedAutomations(ctx, f), canAutomate: req.mk.can("automations.write"), availablePages: pages.listPages(ctx).filter((p) => !used.has(p.id) && (p.site_id ?? null) === (f.site_id ?? null)), courses: listCourses(ctx),
    });
  });
  router.post("/tunnels/:id(\\d+)", need("funnels.write"), (req, res, next) => {
    const f = load(req, res);
    if (!f) return;
    attempt(req, res, next, `/marketing/tunnels/${f.id}`, () => { funnels.updateFunnel(req.mk.ctx, f.id, { name: req.body.name, description: req.body.description }); return "Tunnel enregistré."; });
  });

  router.post("/tunnels/:id(\\d+)/etapes", need("funnels.write"), (req, res, next) => {
    const f = load(req, res);
    if (!f) return;
    let added = null;
    attempt(req, res, next, () => (added ? `/marketing/tunnels/${f.id}#etape-${added.id}` : `/marketing/tunnels/${f.id}#ajouter`), () => {
      const b = req.body;
      const source = b.source === "existante" ? "existante" : "nouvelle";
      added = funnels.addStep(req.mk.ctx, f.id, { type: b.type, name: b.name, pageId: intOrNull(b.page_id), courseId: intOrNull(b.course_id), newPage: source === "nouvelle" });
      return added.created ? "Étape ajoutée avec une nouvelle page (brouillon) : ouvrez-la dans l'éditeur pour la compléter." : "Étape ajoutée.";
    });
  });
  const stepAction = (path, fn) => router.post(`/tunnels/:id(\\d+)/etapes/:sid(\\d+)${path}`, need("funnels.write"), (req, res, next) => {
    const f = load(req, res);
    if (!f) return;
    attempt(req, res, next, `/marketing/tunnels/${f.id}#etape-${req.params.sid}`, () => fn(req, f, Number(req.params.sid)));
  });
  stepAction("", (req, f, sid) => { funnels.renameStep(req.mk.ctx, f.id, sid, req.body.name); return "Étape renommée."; });
  stepAction("/monter", (req, f, sid) => { funnels.moveStep(req.mk.ctx, f.id, sid, -1); return null; });
  stepAction("/descendre", (req, f, sid) => { funnels.moveStep(req.mk.ctx, f.id, sid, 1); return null; });
  stepAction("/retirer", (req, f, sid) => {
    const s = funnels.removeStep(req.mk.ctx, f.id, sid);
    return s.pageId ? `Étape « ${s.name} » retirée. Sa page n'est pas effacée : elle reste dans Site Web → Pages.` : `Étape « ${s.name} » retirée.`;
  });

  // Palier 18 : une étape garde sa place ; sa PAGE CMS se remplace, se détache ou se crée (jamais copiée dans le tunnel)
  stepAction("/remplacer", (req, f, sid) => { funnels.replaceStepPage(req.mk.ctx, f.id, sid, intOrNull(req.body.page_id)); return "Page de l'étape remplacée. L'ancienne page n'est pas modifiée : elle reste dans Pages."; });
  stepAction("/detacher", (req, f, sid) => { funnels.detachStepPage(req.mk.ctx, f.id, sid); return "Page détachée : l'étape reste, sans page. La page n'est pas supprimée."; });
  stepAction("/reglages", (req, f, sid) => {
    // Le formulaire de l'offre additionnelle n'envoie que ses deux champs : les autres réglages de l'étape restent tels quels
    const raw = req.body.bumpCourseId !== undefined ? { bumpCourseId: req.body.bumpCourseId, bumpLabel: req.body.bumpLabel || "" } : { noindex: req.body.noindex === "on", hideFooter: req.body.hideFooter === "on", goal: req.body.goal || "" };
    funnels.updateStepSettings(req.mk.ctx, f.id, sid, raw);
    return "Réglages de l'étape enregistrés (propres au tunnel : la page elle-même n'est pas modifiée).";
  });
  // « Créer avec KOLAKISA CMS » : nouvelle page CMS associée à l'étape, puis l'éditeur visuel EXISTANT
  router.post("/tunnels/:id(\\d+)/etapes/:sid(\\d+)/creer-page", need("funnels.write"), (req, res, next) => {
    const f = load(req, res);
    if (!f) return;
    if (!req.mk.can("forms.write")) return res.status(403).render("error", { message: "Créer une page demande le droit de modifier les pages." });
    let made = null;
    attempt(req, res, next, () => (made ? `/marketing/pages/${made.pageId}/editeur` : `/marketing/tunnels/${f.id}#etape-${req.params.sid}`), () => { made = funnels.createStepPage(req.mk.ctx, f.id, Number(req.params.sid)); return "Page créée et associée à l'étape : construisez-la dans l'éditeur."; });
  });

  router.post("/tunnels/:id(\\d+)/publier", need("funnels.write"), need("pages.publish"), (req, res, next) => {
    const f = load(req, res);
    if (!f) return;
    attempt(req, res, next, `/marketing/tunnels/${f.id}`, () => {
      const r = funnels.publishFunnel(req.mk.ctx, f.id);
      if (r.failed.length) {
        const { MarketingError } = require("../errors");
        throw new MarketingError("preflight_failed", `${r.published.length ? `Mises en ligne : ${r.published.join(", ")}. ` : ""}Pas encore prêtes : ${r.failed.map((x) => `« ${x.name} » (${x.message})`).join(" ; ")}`);
      }
      return r.published.length ? `Mises en ligne : ${r.published.join(", ")}.` : "Toutes les étapes étaient déjà en ligne.";
    });
  });
  router.post("/tunnels/:id(\\d+)/dupliquer", need("funnels.write"), (req, res, next) => {
    const f = load(req, res);
    if (!f) return;
    let copy = null;
    attempt(req, res, next, () => (copy ? `/marketing/tunnels/${copy.id}` : `/marketing/tunnels/${f.id}`), () => {
      copy = funnels.duplicateFunnel(req.mk.ctx, f.id, { pages: req.body.pages === "none" ? "none" : "copy" });
      return req.body.pages === "none" ? `Copie créée : « ${copy.name} » (mêmes étapes, sans page : associez-en une à chacune).` : `Copie créée : « ${copy.name} » (nouvelles pages, en brouillon).`;
    });
  });
  router.post("/tunnels/:id(\\d+)/archiver", need("funnels.write"), (req, res, next) => {
    const f = load(req, res);
    if (!f) return;
    attempt(req, res, next, "/marketing/tunnels", () => {
      const r = funnels.archiveFunnel(req.mk.ctx, f.id);
      return `Tunnel « ${f.name} » archivé.${r.offline ? ` ${r.offline} page(s) créée(s) pour lui sont hors ligne.` : ""} Rien n'est effacé.`;
    });
  });
  router.post("/tunnels/:id(\\d+)/restaurer", need("funnels.write"), (req, res, next) => {
    const f = load(req, res);
    if (!f) return;
    attempt(req, res, next, `/marketing/tunnels/${f.id}`, () => { funnels.restoreFunnel(req.mk.ctx, f.id); return "Tunnel restauré. Ses pages restent hors ligne : mettez-le en ligne quand il est prêt."; });
  });
  return router;
};
