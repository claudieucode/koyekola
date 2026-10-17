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

// R8 lot 6D — l'assistant est servi DEUX fois, avec la même logique : au niveau de l'organisation (/marketing/importer, équipe : import sans site) et dans l'espace d'un site
// (/marketing/site-web/sites/<id>/importer, import RATTACHÉ à ce site). Le site de l'import vient de l'adresse vérifiée (jamais du formulaire ni du fichier) ; les droits sont ceux de l'import
// (contacts.import) ; les lignes rejetées demandent en plus le droit de voir les données sensibles. Un import d'un autre site est « introuvable ».
module.exports = () => {
  const router = express.Router();

  // routes : prefix (chemin Express), contexte et adresse de base de la requête
  function mount(prefix, { siteMode }) {
    const spaceOf = (req, res) => {
      if (!siteMode) return null;
      const space = res.locals.siteSpace;
      return space && !space.principal && Number.isInteger(space.siteId) && req.mk.site && req.mk.site.id === space.siteId ? space : null;
    };
    // Garde commune : en mode site, un site vérifié est obligatoire (sinon la même réponse que les autres écrans de l'espace)
    const guard = (req, res, next) => {
      if (!siteMode) return next();
      if (spaceOf(req, res)) return next();
      const reason = req.mk.siteContext && !req.mk.siteContext.ok ? req.mk.siteContext.reason : "not_found";
      return res.status(reason === "forbidden" ? 403 : 404).render("error", { message: reason === "forbidden" ? "Vous n'avez pas accès à ce site." : "Site introuvable." });
    };
    const ctxOf = (req, res) => (siteMode ? { ...req.mk.ctx, importSite: spaceOf(req, res).siteId } : req.mk.ctx);
    const baseOf = (req, res) => (siteMode ? `${spaceOf(req, res).base}/importer` : "/marketing/importer");
    const sensitive = (req, res, next) => (!siteMode || req.mk.can("contacts.view_sensitive") ? next() : res.status(403).render("error", { message: "Vous n'avez pas la permission de voir les lignes rejetées (données sensibles)." }));
    const P = (tail = "") => `${prefix}${tail}`;
    const view = (req, res) => ({ importBase: baseOf(req, res), active: "import" });

    router.get(P(), guard, need("contacts.import"), (req, res) =>
      res.render("marketing/import-start", { title: "Importer", ...view(req, res), imports: imports.listImports(ctxOf(req, res)), maxMb: MAX_BYTES / 1048576, siteImport: siteMode }));

    router.post(P(), guard, need("contacts.import"), (req, res, next) => {
      const ctx = ctxOf(req, res), base = baseOf(req, res);
      uploader.single("file")(req, res, (uploadError) => {
        if (uploadError) {
          flashError(req, uploadError.code === "LIMIT_FILE_SIZE" ? `Fichier trop volumineux (${MAX_BYTES / 1048576} Mo au plus).` : "Envoi du fichier impossible.");
          return res.redirect(base);
        }
        let created = null;
        attempt(req, res, next, () => (created ? `${base}/${created.id}` : base), () => {
          if (!req.file) throw new MarketingError("invalid_csv", "Choisissez un fichier CSV à importer.");
          created = imports.previewImport(ctx, { filename: req.file.originalname, data: req.file.buffer });
          return "Fichier lu. Vérifiez la correspondance des colonnes ci-dessous.";
        });
      });
    });

    // Charge l'import (404 si inconnu, d'une autre organisation ou d'un autre site)
    const load = (req, res) => {
      const id = intOrNull(req.params.id);
      const imp = id ? imports.getImport(ctxOf(req, res), id) : null;
      if (!imp) res.status(404).render("error", { message: "Import introuvable." });
      return imp;
    };

    function show(req, res, imp, extra = {}, status = 200) {
      const ctx = ctxOf(req, res);
      const setup = imp.status === "previewed" ? imports.describeImport(ctx, imp.id) : null;
      // Listes proposées : celles du site de l'import (jamais celles d'un autre site)
      const listCtx = imp.site_id ? { ...ctx, siteScope: imp.site_id } : ctx;
      res.status(status).render("marketing/import", {
        title: `Import ${imp.filename}`, ...view(req, res), imp, setup, lists: audience.listLists(listCtx), analysis: null, error: null, siteImport: siteMode,
        canSeeRejects: !siteMode || req.mk.can("contacts.view_sensitive"),
        form: setup ? { mapping: setup.suggestedMapping, updateExisting: "fill", listId: "", tag: "", consentDeclared: false, consentText: "" } : null, ...extra,
      });
    }

    router.get(P("/:id"), guard, need("contacts.import"), (req, res) => {
      const imp = load(req, res);
      if (imp) show(req, res, imp);
    });

    router.post(P("/:id/analyser"), guard, need("contacts.import"), (req, res, next) => {
      const imp = load(req, res);
      if (!imp) return;
      const { mapping, options, values } = readForm(req.body, imp.headers.length);
      try {
        show(req, res, imp, { analysis: imports.analyzeImport(ctxOf(req, res), imp.id, { mapping, options }), form: values });
      } catch (error) {
        if (!(error instanceof MarketingError)) return next(error);
        show(req, res, imp, { error: error.message, form: values }, 400);
      }
    });

    router.post(P("/:id/lancer"), guard, need("contacts.import"), (req, res, next) => {
      const imp = load(req, res);
      if (!imp) return;
      const { mapping, options } = readForm(req.body, imp.headers.length);
      attempt(req, res, next, `${baseOf(req, res)}/${imp.id}`, () => {
        const ctx = ctxOf(req, res);
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

    router.post(P("/:id/reprendre"), guard, need("contacts.import"), (req, res, next) => {
      const imp = load(req, res);
      if (!imp) return;
      attempt(req, res, next, `${baseOf(req, res)}/${imp.id}`, () => {
        const ctx = ctxOf(req, res);
        imports.resumeImport(ctx, imp.id);
        enqueue(ctx.db, { organizationId: ctx.organizationId, type: "import.run", payload: { organizationId: ctx.organizationId, importId: imp.id, userId: ctx.userId }, idempotencyKey: `import:${imp.id}:resume:${Date.now()}` });
        return "Import repris.";
      });
    });

    router.get(P("/:id/rejets.csv"), guard, need("contacts.import"), sensitive, (req, res) => {
      const imp = load(req, res);
      if (!imp) return;
      res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="rejets-import-${imp.id}.csv"`, "Cache-Control": "no-store" });
      res.send(`\ufeff${imports.rejectsCsv(ctxOf(req, res), imp.id)}`);
    });
  }

  mount("/importer", { siteMode: false });
  mount("/site-web/sites/:sid(\\d+)/importer", { siteMode: true });
  return router;
};
