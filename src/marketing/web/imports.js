// Assistant d'import CSV : envoi → correspondance des colonnes → analyse à blanc → exécution → rapport et rejets.
const express = require("express");
const multer = require("multer");
const imports = require("../import");
const audience = require("../audience");
const { enqueue } = require("../queue/jobs");
const { MarketingError } = require("../errors");
const { attempt, need, flashError } = require("./kit");
const { WORKER_DETAIL, workerHuman } = require("../workerNotice");

const MAX_BYTES = 10 * 1024 * 1024;
const INLINE_LIMIT = 5000; // au-delà, l'import passe par le worker (sinon il bloquerait le site)
const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
const uploader = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1 } });

// Lit le formulaire : correspondance colonne par colonne + options
function readForm(body, columns) {
  const mapping = Array.from({ length: columns }, (_, i) => (typeof body[`map_${i}`] === "string" && body[`map_${i}`] ? body[`map_${i}`] : "ignore"));
  const options = {
    updateExisting: body.update_existing || "fill",
    listId: intOrNull(body.list_id),
    tag: typeof body.tag === "string" ? body.tag : "",
    ...(body.consent_declared === "on" && { consent: { declared: true, confirm: true, text: body.consent_text } }),
  };
  return { mapping, options, values: { mapping, updateExisting: options.updateExisting, listId: options.listId ?? "", tag: options.tag, consentDeclared: body.consent_declared === "on", consentText: typeof body.consent_text === "string" ? body.consent_text : "" } };
}

module.exports = () => {
  const router = express.Router();

  router.get("/importer", need("contacts.import"), (req, res) =>
    res.render("marketing/import-start", { title: "Importer", active: "import", imports: imports.listImports(req.mk.ctx), maxMb: MAX_BYTES / 1048576 }));

  router.post("/importer", need("contacts.import"), (req, res, next) => {
    uploader.single("file")(req, res, (uploadError) => {
      if (uploadError) {
        flashError(req, uploadError.code === "LIMIT_FILE_SIZE" ? `Fichier trop volumineux (${MAX_BYTES / 1048576} Mo au plus).` : "Envoi du fichier impossible.");
        return res.redirect("/marketing/importer");
      }
      let created = null;
      attempt(req, res, next, () => (created ? `/marketing/importer/${created.id}` : "/marketing/importer"), () => {
        if (!req.file) throw new MarketingError("invalid_csv", "Choisissez un fichier CSV à importer.");
        created = imports.previewImport(req.mk.ctx, { filename: req.file.originalname, data: req.file.buffer });
        return "Fichier lu. Vérifiez la correspondance des colonnes ci-dessous.";
      });
    });
  });

  // Charge l'import (404 si inconnu ou d'une autre organisation)
  const load = (req, res) => {
    const id = intOrNull(req.params.id);
    const imp = id ? imports.getImport(req.mk.ctx, id) : null;
    if (!imp) res.status(404).render("error", { message: "Import introuvable." });
    return imp;
  };

  function show(req, res, imp, extra = {}, status = 200) {
    const setup = imp.status === "previewed" ? imports.describeImport(req.mk.ctx, imp.id) : null;
    res.status(status).render("marketing/import", {
      title: `Import ${imp.filename}`, active: "import", imp, setup, lists: audience.listLists(req.mk.ctx), analysis: null, error: null,
      form: setup ? { mapping: setup.suggestedMapping, updateExisting: "fill", listId: "", tag: "", consentDeclared: false, consentText: "" } : null, ...extra,
    });
  }

  router.get("/importer/:id", need("contacts.import"), (req, res) => {
    const imp = load(req, res);
    if (imp) show(req, res, imp);
  });

  router.post("/importer/:id/analyser", need("contacts.import"), (req, res, next) => {
    const imp = load(req, res);
    if (!imp) return;
    const { mapping, options, values } = readForm(req.body, imp.headers.length);
    try {
      show(req, res, imp, { analysis: imports.analyzeImport(req.mk.ctx, imp.id, { mapping, options }), form: values });
    } catch (error) {
      if (!(error instanceof MarketingError)) return next(error);
      show(req, res, imp, { error: error.message, form: values }, 400);
    }
  });

  router.post("/importer/:id/lancer", need("contacts.import"), (req, res, next) => {
    const imp = load(req, res);
    if (!imp) return;
    const { mapping, options } = readForm(req.body, imp.headers.length);
    attempt(req, res, next, `/marketing/importer/${imp.id}`, () => {
      const { ctx } = req.mk;
      const big = imp.total_rows > INLINE_LIMIT;
      if (big && imp.status === "previewed" && process.env.MARKETING_WORKER !== "on") {
        throw new MarketingError("worker_required", `Ce fichier compte ${imp.total_rows} lignes (plus de ${INLINE_LIMIT}) : il doit être traité en arrière-plan. ${workerHuman("réessayez quand il sera rétabli, ou découpez le fichier en parties plus petites")}`, WORKER_DETAIL);
      }
      imports.startImport(ctx, imp.id, { mapping, options });
      if (big) {
        enqueue(ctx.db, { organizationId: ctx.organizationId, type: "import.run", payload: { organizationId: ctx.organizationId, importId: imp.id, userId: ctx.userId }, idempotencyKey: `import:${imp.id}` });
        return "Import lancé en arrière-plan : actualisez cette page pour suivre l'avancement.";
      }
      let step;
      do step = imports.runImportSlice(ctx, imp.id, { maxRows: 1000 });
      while (!step.done);
      return "Import terminé.";
    });
  });

  router.post("/importer/:id/reprendre", need("contacts.import"), (req, res, next) => {
    const imp = load(req, res);
    if (!imp) return;
    attempt(req, res, next, `/marketing/importer/${imp.id}`, () => {
      imports.resumeImport(req.mk.ctx, imp.id);
      enqueue(req.mk.ctx.db, { organizationId: req.mk.ctx.organizationId, type: "import.run", payload: { organizationId: req.mk.ctx.organizationId, importId: imp.id, userId: req.mk.ctx.userId }, idempotencyKey: `import:${imp.id}:resume:${Date.now()}` });
      return "Import repris.";
    });
  });

  router.get("/importer/:id/rejets.csv", need("contacts.import"), (req, res) => {
    const imp = load(req, res);
    if (!imp) return;
    res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="rejets-import-${imp.id}.csv"` });
    res.send(`﻿${imports.rejectsCsv(req.mk.ctx, imp.id)}`);
  });

  return router;
};
