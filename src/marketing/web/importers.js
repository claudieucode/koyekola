// KOLAKISA CMS → Outils → Importer : catalogue des importateurs (registre réel), parcours par importateur, détails, activation, reprise, rapport téléchargeable.
// Le moteur est celui de l'import natif (services/tools/exchange.js : analyse à blanc → confirmation → lots → rapport → annulation) ; ici, seulement les routes et les vues.
// Droits : tools.import (et ceux de chaque importateur), vérifiés pour le site choisi à chaque requête ; le site vient de l'adresse vérifiée par withSite (jamais d'un champ libre non contrôlé).
const express = require("express");
const multer = require("multer");
const registry = require("../../services/tools/importers/registry");
const converter = require("../../services/tools/importers/termConverter");
const exchange = require("../../services/tools/exchange");
const exporter = require("../../services/tools/exporter");
const importer = require("../../services/tools/importer");
const runs = require("../../services/tools/runs");
const toolsAudit = require("../../services/tools/audit");
const { need } = require("./kit");

const SLUG = "[a-z][a-z-]{1,30}";
const MAX_BYTES = importer.MAX_BYTES;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1, fields: 40 } });

// Comptes pouvant signer des articles : l'équipe (jamais un compte d'élève) ; aucun compte n'est jamais créé par un import
const eligibleAuthors = (db) => db.prepare("SELECT id, username FROM users WHERE role <> 'etudiant' AND deleted_at IS NULL ORDER BY username COLLATE NOCASE LIMIT 300").all();

module.exports = ({ BASE, withSite, shell, toolsCtx, q, flash, siteOf, typesOf, loadRun, publicRun }) => {
  const router = express.Router();
  const IMP = `${BASE}/importer`;
  const userErr = (message) => Object.assign(new Error(message), { user: true });
  const orgDb = (req) => req.mk.ctx.db;

  // Importateur demandé : connu, activé pour l'organisation, droits de la personne ; sinon message clair (jamais une page vide)
  const loadImporter = (req, res, { allowDisabled = false } = {}) => {
    const def = registry.get(req.params.id);
    if (!def) { res.status(404).render("error", { message: "Importateur introuvable." }); return null; }
    for (const p of def.permissions) if (!req.mk.can(p)) { res.status(403).render("error", { message: "Vous n'avez pas la permission d'utiliser cet importateur." }); return null; }
    if (!allowDisabled && !registry.enabled(orgDb(req), req.mk.ctx.organizationId, def.id)) { res.status(403).render("error", { message: "Cet importateur est désactivé pour votre organisation (Outils → Importer → Activer)." }); return null; }
    return def;
  };
  const publicDef = (req, def) => ({ id: def.id, name: def.name, description: def.description, kind: def.kind, version: def.version, formats: def.formats, supports: def.supports, limits: def.limits, dependencies: def.dependencies, permissions: def.permissions,
    state: registry.stateOf(orgDb(req), req.mk.ctx.organizationId, def, { ctx: req.mk.ctx }), usable: def.permissions.every((p) => req.mk.can(p)) });
  const typeChoices = (req, siteId, external) => {
    const allowed = exporter.allowedTypes(toolsCtx(req), { siteId, mode: "import", external });
    return exporter.ORDER.filter((t) => exporter.TYPES[t].write || (external && t === "comments")).map((t) => ({ key: t, label: exporter.TYPES[t].label, scope: exporter.TYPES[t].scope, allowed: allowed.includes(t) }));
  };

  // ----- Catalogue -----
  router.get("/site-web/outils/importer", need("tools.import"), (req, res) => withSite(req, res, (siteId) => {
    const ctx = toolsCtx(req);
    res.render("marketing/tools-import-catalog", { title: "Importer", active: "outils", ...shell(req, siteId, "importer"), importers: registry.all().map((d) => publicDef(req, d)), unsupported: registry.UNSUPPORTED,
      recent: runs.list(ctx.organizationId, "import", { limit: 8 }), canToggle: req.mk.can("tools.maintenance") && !req.mk.siteOnly });
  }));

  // ----- Détails d'un importateur -----
  router.get(`/site-web/outils/importer/:id(${SLUG})/details`, need("tools.import"), (req, res) => withSite(req, res, (siteId) => {
    const def = registry.get(req.params.id);
    if (!def) return res.status(404).render("error", { message: "Importateur introuvable." });
    res.render("marketing/tools-import-details", { title: `Importer · ${def.name}`, active: "outils", ...shell(req, siteId, "importer"), imp: publicDef(req, def), mime: def.mime || [], canToggle: req.mk.can("tools.maintenance") && !req.mk.siteOnly });
  }));
  // ----- Activation (vraie préférence de l'organisation : un importateur désactivé n'ouvre plus son parcours) -----
  for (const [name, value] of [["activer", true], ["desactiver", false]]) {
    router.post(`/site-web/outils/importer/:id(${SLUG})/${name}`, need("tools.maintenance"), (req, res, next) => withSite(req, res, (siteId) => {
      try {
        if (req.mk.siteOnly) throw userErr("L'activation des importateurs est réservée à l'équipe de l'organisation.");
        const def = registry.get(req.params.id);
        if (!def) throw userErr("Importateur introuvable.");
        registry.setEnabled(orgDb(req), req.mk.ctx.organizationId, def.id, value, req.session.user.id);
        toolsAudit.log(req, value ? "importer_enable" : "importer_disable", `Importateur « ${def.name} » ${value ? "activé" : "désactivé"}`, { importer: def.id });
        flash(req, "ok", `Importateur « ${def.name} » ${value ? "activé" : "désactivé"}.`);
      } catch (error) { if (!error.user) return next(error); flash(req, "error", error.message); }
      res.redirect(`${IMP}${q(siteId)}`);
    }));
  }

  // ----- Parcours : étape 1 (choix du fichier ou de la source) -----
  router.get(`/site-web/outils/importer/:id(${SLUG})`, need("tools.import"), (req, res) => withSite(req, res, (siteId) => {
    const def = loadImporter(req, res); if (!def) return;
    const ctx = toolsCtx(req);
    const common = { title: `Importer · ${def.name}`, active: "outils", ...shell(req, siteId, "importer"), imp: publicDef(req, def), maxMb: MAX_BYTES / 1048576, mime: def.mime || [] };
    if (def.id === "kolakisa") return res.render("marketing/tools-import", { ...common, types: typeChoices(req, siteId, false), STRATEGIES: importer.STRATEGIES, canOverwrite: req.mk.can("tools.overwrite"), recent: runs.list(ctx.organizationId, "import", { limit: 8 }) });
    if (def.id === "convertisseur") {
      if (!ctx.orgLevel) return res.status(403).render("error", { message: "Le convertisseur agit sur les catégories de l'organisation : réservé à son équipe." });
      const direction = converter.DIRECTIONS[req.query.sens] ? String(req.query.sens) : "category-tag";
      return res.render("marketing/tools-import-converter", { ...common, DIRECTIONS: converter.DIRECTIONS, direction, terms: converter.list(direction, siteId), plan: null, picked: [] });
    }
    return res.render("marketing/tools-import-wizard", { ...common, types: typeChoices(req, siteId, true), authorsOk: true, STRATEGIES: { duplicate: importer.STRATEGIES.duplicate, skip: importer.STRATEGIES.skip }, canPublish: req.mk.can("articles.publish"), canMedia: req.mk.can("media.upload") });
  }));

  // ----- Convertisseur : aperçu puis conversion confirmée -----
  router.post("/site-web/outils/importer/convertisseur", need("taxonomies.write"), (req, res, next) => withSite(req, res, (siteId) => {
    const ctx = toolsCtx(req);
    if (!registry.enabled(orgDb(req), ctx.organizationId, "convertisseur")) return res.status(403).render("error", { message: "Cet importateur est désactivé pour votre organisation." });
    if (!ctx.orgLevel || !req.mk.can("tools.import")) return res.status(403).render("error", { message: "Le convertisseur est réservé à l'équipe de l'organisation." });
    const direction = converter.DIRECTIONS[req.body.sens] ? String(req.body.sens) : "";
    try {
      if (!direction) throw userErr("Choisissez un sens de conversion.");
      const plan = converter.preview(direction, req.body.ids, siteId);
      if (req.body.confirm !== "1") {
        return res.render("marketing/tools-import-converter", { title: "Importer · Convertisseur", active: "outils", ...shell(req, siteId, "importer"), imp: publicDef(req, registry.get("convertisseur")), maxMb: 0, mime: [], DIRECTIONS: converter.DIRECTIONS, direction, terms: converter.list(direction, siteId), plan, picked: plan.map((p) => p.id) });
      }
      const out = converter.apply(direction, req.body.ids, siteId);
      toolsAudit.log(req, "term_convert", `Conversion ${converter.DIRECTIONS[direction].label}`, { siteId, converted: out.converted, merged: out.merged, contents: out.contents });
      flash(req, "ok", `Conversion terminée : ${out.converted} terme(s) converti(s), ${out.merged} fusionné(s) ; ${out.contents} contenu(s) ont conservé leurs associations.`);
    } catch (error) { if (!error.user) return next(error); flash(req, "error", error.message); }
    res.redirect(`${IMP}/convertisseur${q(siteId)}${direction ? `${siteId ? "&" : "?"}sens=${direction}` : ""}`);
  }));

  // ----- WordPress / Flux : envoi, validation du contenu réel, analyse à blanc -----
  const SNIFF = { xml: /^\s*(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*<(rss|feed|rdf:RDF)\b/i };
  const startFrom = (req, res, next, def, text, sourceLabel) => {
    const s = siteOf(req);
    try {
      const opts = { downloadMedia: req.body.download_media === "1" && def.options && def.options.includes("downloadMedia"), keepPublished: req.body.keep_published === "1" };
      if (opts.downloadMedia && req.body.consent_media !== "1") throw userErr("Cochez l'accord de téléchargement des médias, ou décochez le téléchargement.");
      const run = exchange.startExternalImport(toolsCtx(req), { siteId: s.siteId, source: def.id, text, types: typesOf(req), onConflict: String(req.body.on_conflict || "duplicate"), options: opts });
      toolsAudit.log(req, "import_analyse", `Import ${def.name} analysé (${sourceLabel})`, { runId: run.id, siteId: s.siteId, importer: def.id, bytes: Buffer.byteLength(text) });
      return res.redirect(`${IMP}/${run.id}${q(s.siteId)}`);
    } catch (error) {
      if (!error.user) return next(error);
      flash(req, "error", error.message);
      return res.redirect(`${IMP}/${def.id}${q(s.siteId)}`);
    }
  };
  const fileText = (req, def) => {
    if (!req.file) throw userErr(`Choisissez un fichier (${def.formats.join(", ")}).`);
    const name = String(req.file.originalname || "").toLowerCase();
    if (!def.formats.some((ext) => name.endsWith(ext))) throw userErr(`Format non pris en charge : ${def.formats.join(", ")} attendu.`);
    const mime = String(req.file.mimetype || "").toLowerCase();
    if (mime && !(def.mime || []).includes(mime) && mime !== "application/octet-stream") throw userErr(`Type de fichier refusé (${mime.slice(0, 40)}).`);
    if (!req.file.size) throw userErr("Le fichier est vide.");
    const buf = req.file.buffer;
    if (buf.includes(0)) throw userErr("Ce fichier n'est pas un fichier texte XML (contenu binaire refusé).");
    const text = buf.toString("utf8");
    if (/<!ENTITY/i.test(text) || /<!DOCTYPE[^>]*(\bSYSTEM\b|\bPUBLIC\b|\[)/i.test(text)) throw userErr("Fichier refusé : il déclare des entités ou des ressources externes (DOCTYPE). Un export légitime n'en contient pas.");
    if (!SNIFF.xml.test(text.slice(0, 4096))) throw userErr("Le contenu ne ressemble pas à un fichier XML RSS, Atom ou WordPress : ce n'est pas le bon fichier.");
    return text;
  };
  router.post(`/site-web/outils/importer/:id(wordpress|flux)`, need("tools.import"), (req, res, next) => {
    upload.single("file")(req, res, async (uploadError) => {
      const s = siteOf(req);
      if (s.missing) return res.status(404).render("error", { message: "Site introuvable." });
      const def = loadImporter(req, res); if (!def) return;
      const back = `${IMP}/${def.id}${q(s.siteId)}`;
      if (uploadError) { flash(req, "error", uploadError.code === "LIMIT_FILE_SIZE" ? `Fichier trop volumineux (${MAX_BYTES / 1048576} Mo au plus).` : "Envoi du fichier impossible."); return res.redirect(back); }
      try {
        let text, label;
        if (def.id === "flux" && !req.file && String(req.body.feed_url || "").trim()) {
          if (req.body.consent_fetch !== "1") throw userErr("Cochez l'accord : le serveur va télécharger ce flux depuis Internet.");
          const feed = require("../../marketing/rss/feed");
          const got = await feed.fetchBuffer(String(req.body.feed_url).trim(), { maxBytes: 10 * 1024 * 1024, timeoutMs: 15000, accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" }).catch((e) => { throw userErr(`Flux non récupéré : ${e.message}`); });
          text = got.buffer.toString("utf8");
          if (!SNIFF.xml.test(text.slice(0, 4096))) throw userErr("L'adresse ne renvoie pas un flux RSS ou Atom.");
          label = "adresse";
        } else { text = fileText(req, def); label = String(req.file.originalname).slice(0, 80); }
        return startFrom(req, res, next, def, text, label);
      } catch (error) { if (!error.user) return next(error); flash(req, "error", error.message); return res.redirect(back); }
    });
  });

  // ----- Étape 3/5 : correspondance des auteurs puis confirmation (route existante, enrichie pour les sources externes) -----
  router.post("/site-web/outils/importer/:id(\\d+)/confirmer", need("tools.import"), (req, res, next) => {
    const r = loadRun(req, res, "import");
    if (!r) return;
    const opts = r.run.options || {};
    if (!opts.source || opts.source === "kolakisa") return next(); // import natif : route d'origine
    try {
      if (req.body.confirm !== "1") throw userErr("Cochez la case de confirmation pour lancer l'import.");
      if (r.run.status !== "awaiting") throw userErr("Cet import n'attend pas de confirmation.");
      const eligible = new Set(eligibleAuthors(req.mk.ctx.db).map((a) => a.id));
      const mine = req.session.user.id;
      const pick = (v) => { const n = Number(v); if (!v) return null; if (!Number.isInteger(n) || (!eligible.has(n) && n !== mine)) throw userErr("Un auteur choisi n'est pas un compte autorisé à signer des articles."); return n; };
      const authorMap = {};
      for (let i = 0; i < 300; i++) { const key = req.body[`author_key_${i}`]; if (key === undefined) break; const id = pick(req.body[`author_${i}`]); if (id) authorMap[String(key).slice(0, 120)] = id; }
      const defaultAuthor = pick(req.body.default_author) || mine;
      const { db } = req.mk.ctx;
      runs.update(r.run.id, { options: JSON.stringify({ ...opts, authorMap, defaultAuthor }) });
      void db;
      exchange.confirmImport(toolsCtx(req), r.run.id);
      toolsAudit.log(req, "import_apply", `Import ${opts.source} confirmé`, { runId: r.run.id, siteId: r.run.site_id, importer: opts.source, authors: Object.keys(authorMap).length });
    } catch (error) { if (!error.user) return next(error); flash(req, "error", error.message); }
    res.redirect(`${IMP}/${r.run.id}${q(r.run.site_id)}`);
  });
  // ----- Reprise d'un import interrompu -----
  router.post("/site-web/outils/importer/:id(\\d+)/reprendre", need("tools.import"), (req, res, next) => {
    const r = loadRun(req, res, "import");
    if (!r) return;
    try {
      const next2 = exchange.resumeImport(toolsCtx(req), r.run.id);
      toolsAudit.log(req, "import_resume", "Import repris (nouvelle analyse du même fichier)", { runId: next2.id, of: r.run.id, siteId: r.run.site_id });
      flash(req, "ok", "Nouvelle analyse lancée : ce qui avait déjà été importé est reconnu et ne sera pas recréé.");
      return res.redirect(`${IMP}/${next2.id}${q(r.run.site_id)}`);
    } catch (error) { if (!error.user) return next(error); flash(req, "error", error.message); }
    res.redirect(`${IMP}/${r.run.id}${q(r.run.site_id)}`);
  });
  // ----- Rapport téléchargeable (sans le fichier source ni les e-mails) -----
  router.get("/site-web/outils/importer/:id(\\d+)/rapport.json", need("tools.import"), (req, res) => {
    const r = loadRun(req, res, "import");
    if (!r) return;
    const rep = r.run.report || {};
    const safe = JSON.stringify({ importId: r.run.id, status: r.run.status, finishedAt: r.run.finished_at, message: r.run.message, source: rep.source || null, totals: rep.per || null, warnings: rep.warnings || [], errors: rep.errors || null, results: (rep.results || []).map(({ type, ref, label, result, message }) => ({ type, ref, label, result, message })) }, null, 2);
    toolsAudit.log(req, "import_report", "Rapport d'import téléchargé", { runId: r.run.id });
    res.set({ "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="rapport-import-${r.run.id}.json"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }).send(safe);
  });
  void publicRun;
  return router;
};
module.exports.eligibleAuthors = eligibleAuthors;
