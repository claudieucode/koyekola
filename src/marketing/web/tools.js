// KOLAKISA CMS → Outils (palier 13) : santé du site, import, export, diagnostic, informations système, maintenance, caches, outils de contenu.
// Chaque écran appelle les services existants (src/services/tools/*, qui eux-mêmes passent par les services du CMS). Droits : tools.* (palier 9),
// vérifiés à chaque route ET à chaque opération, dans le contexte du site choisi (?site=) — un compte limité à un site ne voit jamais un autre site.
const express = require("express");
const multer = require("multer");
const access = require("../../services/cmsAccess");
const runs = require("../../services/tools/runs");
const exchange = require("../../services/tools/exchange");
const exporter = require("../../services/tools/exporter");
const importer = require("../../services/tools/importer");
const health = require("../../services/tools/health");
const integrity = require("../../services/tools/integrity");
const content = require("../../services/tools/content");
const caches = require("../../services/tools/caches");
const maintenance = require("../../services/tools/maintenance");
const system = require("../../services/tools/system");
const toolsAudit = require("../../services/tools/audit");
const pages = require("../pages");
const { need } = require("./kit");

const BASE = "/marketing/site-web/outils";
const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: importer.MAX_BYTES, files: 1 } });
const TABS = [
  ["", "Santé du site", "tools.view"], ["importer", "Importer", "tools.import"], ["exporter", "Exporter", "tools.export"], ["sauvegarde-site", "Sauvegarde du site", "tools.export"], ["sauvegardes", "Sauvegardes", "tools.view"],
  ["diagnostic", "Diagnostic", "tools.view"], ["systeme", "Informations système", "tools.view"], ["maintenance", "Maintenance", "tools.maintenance"],
  ["cache", "Caches", "tools.cache"], ["contenu", "Outils de contenu", "tools.content"], ["effacer-donnees", "Effacer les données", "privacy.view"], ["logs", "Journal d'activité", "tools.view"],
];

module.exports = () => {
  const router = express.Router();
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, ...(detail ? { detail } : {}), noReopen: true }; };

  // Site choisi : jamais un identifiant d'une autre organisation ; null = site principal
  const siteOf = (req) => {
    const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
    if (raw === undefined || raw === "" || raw === null) return { siteId: null };
    const id = intOrNull(raw);
    const ok = id && pages.listSites(req.mk.ctx).some((s) => s.id === id);
    return ok ? { siteId: id } : { missing: true };
  };
  const typesOf = (req) => [].concat(req.body.types || []).flatMap((v) => String(v).split(",")).map((v) => v.trim()).filter(Boolean);
  const toolsCtx = (req) => ({ ...req.mk.ctx, can: req.mk.can, orgLevel: !req.mk.siteOnly });
  const withSite = (req, res, fn) => {
    const s = siteOf(req);
    if (s.missing) return res.status(404).render("error", { message: "Site introuvable." });
    return fn(s.siteId);
  };
  const q = (siteId) => (siteId ? `?site=${siteId}` : "");
  // Sites proposés : tous pour l'équipe ; seulement les siens pour un accès limité à certains sites
  const sitesFor = (req) => {
    const all = pages.listSites(req.mk.ctx).filter((s) => s.status === "active").map((s) => ({ id: s.id, name: s.name }));
    if (!req.mk.siteOnly) return all;
    const mine = new Set(access.siteMemberships(req.session.user.id).map((m) => m.site_id));
    return all.filter((s) => mine.has(s.id));
  };
  const shell = (req, siteId, tab) => ({ BASE, TABS: TABS.filter(([, , perm]) => req.mk.can(perm) || perm === "tools.view"), tab, sites: sitesFor(req), siteId, q: q(siteId), siteOnly: req.mk.siteOnly, can: req.mk.can, toolsJs: true });

  // Droits sur une opération : dans le contexte de SON site (jamais celui de l'URL) ; une autre organisation ne la voit pas (IDOR)
  const loadRun = (req, res, kind) => {
    const run = runs.get(req.mk.ctx.organizationId, intOrNull(req.params.id), { heavy: true });
    const perms = run ? access.effectivePermissions(req.session.user.id, { organizationId: req.mk.ctx.organizationId, siteId: run.site_id }) : null;
    if (!run || (kind && run.kind !== kind) || !perms.has("tools.view")) { res.status(404).render("error", { message: "Opération introuvable." }); return null; }
    return { run, perms };
  };
  const publicRun = (run) => {
    const total = run.total || 0;
    const finished = ["done", "failed", "cancelled"].includes(run.status);
    const worked = (run.done || 0) + (run.failed || 0) + (run.skipped || 0);
    return { id: run.id, kind: run.kind, status: run.status, phase: run.phase, total, done: run.done, failed: run.failed, skipped: run.skipped, conflicts: run.conflicts, message: run.message, finished,
      percent: finished && run.status === "done" ? 100 : total ? Math.min(99, Math.round((100 * worked) / total)) : 0, awaiting: run.status === "awaiting" };
  };

  router.get("/site-web/outils/operations/:id(\\d+).json", need("tools.view"), (req, res) => {
    const r = loadRun(req, res);
    if (r) res.set("Cache-Control", "no-store").json(publicRun(r.run));
  });
  router.post("/site-web/outils/operations/:id(\\d+)/annuler", need("tools.view"), (req, res) => {
    const r = loadRun(req, res);
    if (!r) return;
    if (r.run.user_id !== req.session.user.id && !r.perms.has("tools.maintenance")) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });
    runs.requestCancel(req.mk.ctx.organizationId, r.run.id);
    flash(req, "ok", "Annulation demandée : elle prend effet à la fin du lot en cours, sans laisser de donnée à moitié écrite.");
    res.redirect(String(req.body.retour || "").startsWith(BASE) ? req.body.retour : BASE);
  });

  // ----- Santé du site -----
  router.get("/site-web/outils", need("tools.view"), (req, res) => withSite(req, res, (siteId) => {
    const ctx = req.mk.ctx;
    require("../../services/tools/runner").recoverStuck();
    const last = runs.latest(ctx.organizationId, "health", siteId);
    const full = last ? runs.get(ctx.organizationId, last.id) : null;
    res.render("marketing/tools-health", { title: "Santé du site", active: "outils", ...shell(req, siteId, ""), last: full, CATEGORIES: health.CATEGORIES, STATUS: health.STATUS, canRun: req.mk.can("tools.health") });
  }));
  router.post("/site-web/outils/sante", need("tools.health"), (req, res) => withSite(req, res, (siteId) => {
    const run = health.start(toolsCtx(req), { siteId, port: req.socket.localPort });
    res.redirect(`${BASE}${q(siteId)}${siteId ? "&" : "?"}analyse=${run.id}`);
  }));

  // ----- Export -----
  router.get("/site-web/outils/exporter", need("tools.export"), (req, res) => withSite(req, res, (siteId) => {
    const ctx = toolsCtx(req);
    const allowed = exporter.allowedTypes(ctx, { siteId, mode: "export" });
    const types = exporter.ORDER.map((t) => ({ key: t, label: exporter.TYPES[t].label, scope: exporter.TYPES[t].scope, sensitive: Boolean(exporter.TYPES[t].sensitive), allowed: allowed.includes(t), count: allowed.includes(t) ? exporter.count(ctx, t, siteId) : null }));
    res.render("marketing/tools-export", { title: "Exporter", active: "outils", ...shell(req, siteId, "exporter"), types, recent: runs.list(ctx.organizationId, "export", { limit: 8 }) });
  }));
  router.post("/site-web/outils/exporter", need("tools.export"), (req, res) => withSite(req, res, (siteId) => {
    const list = typesOf(req);
    try {
      const run = exchange.startExport(toolsCtx(req), { siteId, types: list });
      toolsAudit.log(req, "export_start", `Export lancé (${list.join(", ")})`, { runId: run.id, siteId });
      res.redirect(`${BASE}/exporter/${run.id}${q(siteId)}`);
    } catch (error) {
      if (!error.user) throw error;
      flash(req, "error", error.message);
      res.redirect(`${BASE}/exporter${q(siteId)}`);
    }
  }));
  router.get("/site-web/outils/exporter/:id(\\d+)", need("tools.export"), (req, res) => {
    const r = loadRun(req, res, "export");
    if (!r) return;
    res.render("marketing/tools-run", { title: "Export", active: "outils", ...shell(req, r.run.site_id, "exporter"), run: r.run, run_pub: publicRun(r.run), mode: "export", STRATEGIES: importer.STRATEGIES, TYPES: exporter.TYPES });
  });
  router.get("/site-web/outils/exporter/:id(\\d+)/fichier", need("tools.export"), (req, res) => {
    const r = loadRun(req, res, "export");
    if (!r || !r.perms.has("tools.export")) return;
    if (!r.run.result) return res.status(410).render("error", { message: "Ce fichier d'export n'est plus disponible (il est conservé 24 heures). Relancez l'export." });
    const site = r.run.site_id ? (pages.getSite(req.mk.ctx, r.run.site_id) || {}).name : "site-principal";
    const slug = String(site || "site").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "site";
    toolsAudit.log(req, "export_download", `Export téléchargé (${slug})`, { runId: r.run.id });
    res.set({ "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="kolakisa-${slug}-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }).send(r.run.result);
  });

  // ----- Import -----
  router.get("/site-web/outils/importer", need("tools.import"), (req, res) => withSite(req, res, (siteId) => {
    const ctx = toolsCtx(req);
    const allowed = exporter.allowedTypes(ctx, { siteId, mode: "import" });
    const types = exporter.ORDER.filter((t) => exporter.TYPES[t].write).map((t) => ({ key: t, label: exporter.TYPES[t].label, scope: exporter.TYPES[t].scope, allowed: allowed.includes(t) }));
    res.render("marketing/tools-import", { title: "Importer", active: "outils", ...shell(req, siteId, "importer"), types, STRATEGIES: importer.STRATEGIES, maxMb: importer.MAX_BYTES / 1048576, canOverwrite: req.mk.can("tools.overwrite"), recent: runs.list(ctx.organizationId, "import", { limit: 8 }) });
  }));
  router.post("/site-web/outils/importer", need("tools.import"), (req, res, next) => {
    upload.single("file")(req, res, (uploadError) => {
      const s = siteOf(req);
      if (s.missing) return res.status(404).render("error", { message: "Site introuvable." });
      const back = `${BASE}/importer${q(s.siteId)}`;
      if (uploadError) { flash(req, "error", uploadError.code === "LIMIT_FILE_SIZE" ? `Fichier trop volumineux (${importer.MAX_BYTES / 1048576} Mo au plus).` : "Envoi du fichier impossible."); return res.redirect(back); }
      if (!req.file) { flash(req, "error", "Choisissez un fichier d'export KOLAKISA (.json)."); return res.redirect(back); }
      const buf = req.file.buffer;
      if (buf.includes(0)) { flash(req, "error", "Ce fichier n'est pas un fichier JSON (contenu binaire refusé)."); return res.redirect(back); }
      try {
        const run = exchange.startImport(toolsCtx(req), { siteId: s.siteId, text: buf.toString("utf8"), types: typesOf(req), onConflict: String(req.body.on_conflict || "skip") });
        toolsAudit.log(req, "import_analyse", `Import analysé (${req.file.originalname.slice(0, 80)})`, { runId: run.id, siteId: s.siteId, bytes: buf.length });
        res.redirect(`${BASE}/importer/${run.id}${q(s.siteId)}`);
      } catch (error) {
        if (!error.user) return next(error);
        flash(req, "error", error.message);
        res.redirect(back);
      }
    });
  });
  router.get("/site-web/outils/importer/:id(\\d+)", need("tools.import"), (req, res) => {
    const r = loadRun(req, res, "import");
    if (!r) return;
    const undone = Boolean(require("../../config/database").prepare("SELECT 1 FROM cms_tool_runs WHERE kind = 'import-undo' AND organization_id = ? AND options LIKE ?").get(req.mk.ctx.organizationId, `%"of":${r.run.id}%`));
    res.render("marketing/tools-run", { title: "Import", active: "outils", ...shell(req, r.run.site_id, "importer"), run: r.run, run_pub: publicRun(r.run), mode: "import", STRATEGIES: importer.STRATEGIES, TYPES: exporter.TYPES, undone });
  });
  router.post("/site-web/outils/importer/:id(\\d+)/confirmer", need("tools.import"), (req, res, next) => {
    const r = loadRun(req, res, "import");
    if (!r) return;
    try {
      if (req.body.confirm !== "1") throw Object.assign(new Error("Cochez la case de confirmation pour lancer l'import."), { user: true });
      const opts = r.run.options || {};
      if (opts.onConflict === "update" && !req.mk.can("tools.overwrite")) throw Object.assign(new Error("Mettre à jour l'existant exige la permission « tools.overwrite »."), { user: true });
      exchange.confirmImport(toolsCtx(req), r.run.id);
      toolsAudit.log(req, "import_apply", "Import confirmé", { runId: r.run.id, siteId: r.run.site_id });
    } catch (error) { if (!error.user) return next(error); flash(req, "error", error.message); }
    res.redirect(`${BASE}/importer/${r.run.id}${q(r.run.site_id)}`);
  });
  router.post("/site-web/outils/importer/:id(\\d+)/defaire", need("tools.import"), (req, res, next) => {
    const r = loadRun(req, res, "import");
    if (!r) return;
    try {
      if (req.body.confirm !== "1") throw Object.assign(new Error("Cochez la case de confirmation pour annuler l'import."), { user: true });
      exchange.startUndo(toolsCtx(req), r.run.id);
      toolsAudit.log(req, "import_undo", "Annulation d'un import", { runId: r.run.id });
      flash(req, "ok", "Annulation lancée : les éléments créés par cet import vont à la corbeille ou sont retirés.");
    } catch (error) { if (!error.user) return next(error); flash(req, "error", error.message); }
    res.redirect(`${BASE}/importer/${r.run.id}${q(r.run.site_id)}`);
  });

  // ----- Sauvegarde d'un site avec ses médias (R5) : télécharger un paquet, l'analyser (rien n'est écrit), le restaurer -----
  // Le paquet analysé est gardé dans un dossier privé du serveur (jamais public) sous un jeton aléatoire lié à l'organisation ET à la personne ; il est effacé après la restauration ou au bout de 2 h.
  const bundle = require("../../services/tools/siteBundle");
  const fs = require("node:fs");
  const nodePath = require("node:path");
  const crypto = require("node:crypto");
  const BUNDLE_DIR = nodePath.join(require("../../config/paths").dataDir, "tmp", "site-bundles");
  const bundleUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: bundle.MAX_TOTAL + 64 * 1024 * 1024, files: 1 } });
  const bundleFile = (req, token) => (/^[a-f0-9]{32}$/.test(String(token)) ? nodePath.join(BUNDLE_DIR, `${req.mk.ctx.organizationId}-${req.session.user.id}-${token}.kksite`) : null);
  const sweepBundles = () => { try { for (const f of fs.readdirSync(BUNDLE_DIR)) { const full = nodePath.join(BUNDLE_DIR, f); if (Date.now() - fs.statSync(full).mtimeMs > 2 * 3600e3) fs.unlinkSync(full); } } catch { /* dossier absent */ } };
  const bundleBack = (siteId) => `${BASE}/sauvegarde-site${q(siteId)}`;
  const bundlePage = (req, res, siteId, extra = {}) => res.render("marketing/tools-site-bundle", { title: "Sauvegarde du site", active: "outils", ...shell(req, siteId, "sauvegarde-site"), STRATEGIES: importer.STRATEGIES, canOverwrite: req.mk.can("tools.overwrite"), canExport: req.mk.can("tools.export"), canImport: req.mk.can("tools.import"), maxMb: Math.round(bundle.MAX_TOTAL / 1048576), report: null, ...extra });
  router.get("/site-web/outils/sauvegarde-site", need("tools.view"), (req, res) => withSite(req, res, (siteId) => bundlePage(req, res, siteId)));
  router.post("/site-web/outils/sauvegarde-site/telecharger", need("tools.export"), (req, res, next) => withSite(req, res, async (siteId) => {
    try {
      const out = await bundle.build(toolsCtx(req), { siteId });
      const site = (pages.getSite(req.mk.ctx, siteId) || {}).name;
      const slug = String(site || "site").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "site";
      toolsAudit.log(req, "site_bundle_export", `Paquet du site téléchargé (${slug})`, { siteId, files: out.files, bytes: out.buffer.length });
      res.set({ "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="kolakisa-site-${slug}-${new Date().toISOString().slice(0, 10)}.kksite"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }).send(out.buffer);
    } catch (error) {
      if (!error.user) return next(error);
      flash(req, "error", error.message);
      res.redirect(bundleBack(siteId));
    }
  }));
  router.post("/site-web/outils/sauvegarde-site/analyser", need("tools.import"), (req, res, next) => {
    bundleUpload.single("file")(req, res, (uploadError) => {
      const s = siteOf(req);
      if (s.missing) return res.status(404).render("error", { message: "Site introuvable." });
      if (!Number.isInteger(s.siteId)) { flash(req, "error", "Choisissez le site à restaurer."); return res.redirect(bundleBack(null)); }
      if (uploadError) { flash(req, "error", "Envoi du paquet impossible (fichier trop volumineux ou illisible)."); return res.redirect(bundleBack(s.siteId)); }
      if (!req.file) { flash(req, "error", "Choisissez un paquet de sauvegarde (.kksite)."); return res.redirect(bundleBack(s.siteId)); }
      try {
        const pl = bundle.plan(toolsCtx(req), req.file.buffer, { siteId: s.siteId });
        if (!pl.ok) { toolsAudit.log(req, "site_bundle_refused", "Paquet de site refusé à l'analyse", { siteId: s.siteId, errors: pl.errors.length }); return bundlePage(req, res, s.siteId, { report: { ok: false, errors: pl.errors.slice(0, 30), warnings: pl.warnings } }); }
        sweepBundles();
        fs.mkdirSync(BUNDLE_DIR, { recursive: true, mode: 0o700 });
        const token = crypto.randomBytes(16).toString("hex");
        fs.writeFileSync(bundleFile(req, token), req.file.buffer, { flag: "wx", mode: 0o600 });
        toolsAudit.log(req, "site_bundle_analyse", "Paquet de site analysé", { siteId: s.siteId, files: pl.mapping.length });
        bundlePage(req, res, s.siteId, { report: { ok: true, token, errors: [], warnings: pl.warnings, source: pl.source, counts: pl.counts, files: pl.mapping.length, reuse: pl.mapping.filter((m) => m.action === "reuse").length, bytes: pl.ins.totalBytes } });
      } catch (error) { next(error); }
    });
  });
  router.post("/site-web/outils/sauvegarde-site/restaurer", need("tools.import"), (req, res, next) => withSite(req, res, async (siteId) => {
    const back = bundleBack(siteId);
    try {
      if (!Number.isInteger(siteId)) throw Object.assign(new Error("Choisissez le site à restaurer."), { user: true });
      if (req.body.confirm !== "1") throw Object.assign(new Error("Cochez la case de confirmation pour lancer la restauration."), { user: true });
      const onConflict = String(req.body.on_conflict || "skip");
      if (onConflict === "update" && !req.mk.can("tools.overwrite")) throw Object.assign(new Error("Mettre à jour l'existant exige la permission « tools.overwrite »."), { user: true });
      const file = bundleFile(req, req.body.token);
      if (!file || !fs.existsSync(file)) throw Object.assign(new Error("Ce paquet n'est plus disponible : analysez-le de nouveau."), { user: true });
      const out = await bundle.restore(toolsCtx(req), fs.readFileSync(file), { siteId, onConflict });
      fs.unlinkSync(file);
      toolsAudit.log(req, "site_bundle_restore", "Site restauré depuis un paquet", { siteId, runId: out.run && out.run.id, files: out.created.files, reused: out.created.reused });
      flash(req, "ok", `Site restauré : ${out.created.files} fichier(s) créé(s), ${out.created.reused} réutilisé(s). Les pages arrivent en brouillon.`);
      res.redirect(out.run ? `${BASE}/importer/${out.run.id}${q(siteId)}` : back);
    } catch (error) {
      if (!error.user) return next(error);
      toolsAudit.log(req, "site_bundle_failed", "Restauration de paquet refusée ou échouée", { siteId });
      flash(req, "error", error.message);
      res.redirect(back);
    }
  }));

  // ----- Diagnostic : intégrité, orphelins, file de travaux -----
  router.get("/site-web/outils/diagnostic", need("tools.view"), (req, res) => withSite(req, res, (siteId) => {
    const ctx = req.mk.ctx;
    // Le rapport d'intégrité concerne toute l'organisation (noms de menus, d'adresses d'autres sites) : jamais montré à un accès limité à un site
    const last = req.mk.siteOnly ? null : runs.latest(ctx.organizationId, "integrity", null);
    res.render("marketing/tools-diagnostic", { title: "Diagnostic", active: "outils", ...shell(req, siteId, "diagnostic"), last: last ? runs.get(ctx.organizationId, last.id) : null, jobs: system.jobsDiagnostic(), canFix: req.mk.can("tools.content"), canRun: req.mk.can("tools.health"), FIXES: integrity.FIXES });
  }));
  router.post("/site-web/outils/diagnostic/integrite", need("tools.health"), (req, res) => withSite(req, res, (siteId) => {
    if (req.mk.siteOnly) return res.status(403).render("error", { message: "Le contrôle d'intégrité concerne toute l'organisation." });
    const run = integrity.start(toolsCtx(req), null);
    res.redirect(`${BASE}/diagnostic${q(siteId)}${siteId ? "&" : "?"}analyse=${run.id}`);
  }));
  router.post("/site-web/outils/diagnostic/corriger", need("tools.content"), (req, res, next) => withSite(req, res, (siteId) => {
    try {
      if (req.mk.siteOnly) throw Object.assign(new Error("Réservé à l'équipe de l'organisation."), { user: true });
      const key = String(req.body.key || "");
      if (!Object.hasOwn(integrity.FIXES, key)) throw Object.assign(new Error("Correction inconnue."), { user: true });
      const dry = req.body.confirm !== "1";
      const r = integrity.fix(key, { dry });
      if (dry) flash(req, "ok", `Simulation : ${r.count} ${r.label} seraient supprimé(e)s. Rien n'a été modifié. Cochez la confirmation pour appliquer.`);
      else { toolsAudit.log(req, "integrity_fix", `Nettoyage : ${r.count} ${r.label}`, { key, count: r.count }); flash(req, "ok", `${r.count} ${r.label} supprimé(e)s.`); }
    } catch (error) { if (!error.user) return next(error); flash(req, "error", error.message); }
    res.redirect(`${BASE}/diagnostic${q(siteId)}`);
  }));

  // ----- Informations système -----
  router.get("/site-web/outils/systeme", need("tools.view"), (req, res) => withSite(req, res, (siteId) => {
    res.render("marketing/tools-system", { title: "Informations système", active: "outils", ...shell(req, siteId, "systeme"), info: system.info({ siteId, req }) });
  }));

  // ----- Maintenance (par site) -----
  router.get("/site-web/outils/maintenance", need("tools.maintenance"), (req, res) => withSite(req, res, (siteId) => {
    res.render("marketing/tools-maintenance", { title: "Maintenance", active: "outils", ...shell(req, siteId, "maintenance"), state: maintenance.get(siteId), others: maintenance.all().filter((m) => m.enabled && m.scope !== maintenance.scopeOf(siteId)), DEFAULT_MESSAGE: maintenance.DEFAULT_MESSAGE, MAX: maintenance.MAX_MESSAGE });
  }));
  router.post("/site-web/outils/maintenance", need("tools.maintenance"), (req, res) => withSite(req, res, (siteId) => {
    const enable = req.body.enabled === "1";
    if (enable && req.body.confirm !== "1") { flash(req, "error", "Cochez la case de confirmation : les visiteurs verront la page de maintenance (l'équipe connectée n'est jamais bloquée)."); return res.redirect(`${BASE}/maintenance${q(siteId)}`); }
    maintenance.set(siteId, { enabled: enable, message: req.body.message }, req);
    flash(req, "ok", enable ? "Mode maintenance activé pour ce site : les visiteurs reçoivent la page de maintenance (HTTP 503)." : "Mode maintenance désactivé : le site est de nouveau visible.");
    res.redirect(`${BASE}/maintenance${q(siteId)}`);
  }));

  // ----- Caches -----
  router.get("/site-web/outils/cache", need("tools.cache"), (req, res) => withSite(req, res, (siteId) => {
    res.render("marketing/tools-cache", { title: "Caches", active: "outils", ...shell(req, siteId, "cache"), list: caches.inspect() });
  }));
  router.post("/site-web/outils/cache", need("tools.cache"), (req, res, next) => withSite(req, res, (siteId) => {
    try {
      const key = String(req.body.key || "");
      if (key === "all") {
        if (req.body.confirm !== "1") throw Object.assign(new Error("Cochez la confirmation pour invalider tous les caches (ils se rechargent seuls)."), { user: true });
        caches.invalidateAll();
        toolsAudit.log(req, "cache_all", "Tous les caches invalidés");
        flash(req, "ok", "Tous les caches ont été invalidés : ils se rechargent à la prochaine demande.");
      } else {
        const r = caches.invalidate(key);
        toolsAudit.log(req, "cache_clear", `Cache invalidé : ${r.label}`, { key });
        flash(req, "ok", `Cache « ${r.label} » invalidé.`);
      }
    } catch (error) { if (!error.user && error.message !== "Cache inconnu.") return next(error); flash(req, "error", error.message); }
    res.redirect(`${BASE}/cache${q(siteId)}`);
  }));

  // ----- Outils de contenu : rechercher / remplacer, régénérations, nettoyages -----
  router.get("/site-web/outils/contenu", need("tools.content"), (req, res) => withSite(req, res, (siteId) => {
    const ctx = req.mk.ctx;
    const last = runs.latest(ctx.organizationId, "content", siteId);
    const full = last ? runs.get(ctx.organizationId, last.id) : null;
    const actions = Object.entries(content.ACTIONS).map(([key, a]) => { let dry = null; try { dry = a.dry(); } catch { dry = null; } return { key, group: a.group, label: a.label, description: a.description, dry }; });
    res.render("marketing/tools-content", { title: "Outils de contenu", active: "outils", ...shell(req, siteId, "contenu"), actions, last: full, canArticles: !req.mk.siteOnly && req.mk.can("articles.write") });
  }));
  router.post("/site-web/outils/contenu/simuler", need("tools.content"), (req, res, next) => withSite(req, res, (siteId) => {
    try {
      const run = content.startReplace(toolsCtx(req), { siteId, options: { search: req.body.search, replace: req.body.replace, pages: req.body.pages === "1", articles: req.body.articles === "1", caseSensitive: req.body.case === "1", wholeWord: req.body.word === "1", includeLive: req.body.live === "1" } });
      res.redirect(`${BASE}/contenu${q(siteId)}${siteId ? "&" : "?"}analyse=${run.id}`);
    } catch (error) { if (!error.user) return next(error); flash(req, "error", error.message); res.redirect(`${BASE}/contenu${q(siteId)}`); }
  }));
  router.post("/site-web/outils/contenu/remplacer/:id(\\d+)", need("tools.content"), (req, res, next) => {
    const r = loadRun(req, res, "content");
    if (!r) return;
    try {
      if (req.body.confirm !== "1") throw Object.assign(new Error("Cochez la confirmation pour appliquer le remplacement."), { user: true });
      if (r.run.status !== "awaiting") throw Object.assign(new Error("Cette simulation n'attend pas de confirmation."), { user: true });
      content.startReplace(toolsCtx(req), { siteId: r.run.site_id, options: r.run.options, phase: "apply", parent: r.run });
      toolsAudit.log(req, "replace_apply", "Remplacement confirmé", { runId: r.run.id, siteId: r.run.site_id });
    } catch (error) { if (!error.user) return next(error); flash(req, "error", error.message); }
    res.redirect(`${BASE}/contenu${q(r.run.site_id)}${r.run.site_id ? "&" : "?"}analyse=${r.run.id}`);
  });
  router.post("/site-web/outils/contenu/action", need("tools.content"), (req, res, next) => withSite(req, res, (siteId) => {
    try {
      const a = content.ACTIONS[String(req.body.key || "")];
      if (!a) throw Object.assign(new Error("Action inconnue."), { user: true });
      if (req.mk.siteOnly) throw Object.assign(new Error("Réservé à l'équipe de l'organisation."), { user: true });
      if (req.body.confirm !== "1") {
        const d = a.dry();
        flash(req, "ok", `Simulation — ${a.label} : ${d.detail}. Rien n'a été modifié. Cochez la confirmation pour appliquer.`);
      } else {
        const r = a.run();
        toolsAudit.log(req, "content_action", `${a.label} : ${r.detail}`, { key: req.body.key, count: r.count });
        flash(req, "ok", `${a.label} : ${r.detail}.`);
      }
    } catch (error) { if (!error.user) return next(error); flash(req, "error", error.message); }
    res.redirect(`${BASE}/contenu${q(siteId)}`);
  }));

  router.use(require("./erasure")({ BASE, withSite, shell, toolsCtx, q, flash })); // Outils → Effacer les données (demandes d'effacement de données personnelles)

  return router;
};
module.exports.BASE = BASE;
module.exports.TABS = TABS;
