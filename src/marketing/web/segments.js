// Pages des segments : liste, éditeur (constructeur visuel + mode avancé JSON), aperçu (JSON), enregistrement.
const express = require("express");
const segments = require("../segments");
const audience = require("../audience");
const { fieldCatalog } = require("../segments/catalog");
const { MarketingError } = require("../errors");
const { attempt, need } = require("./kit");

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);

function parseDefinition(text) {
  try {
    return JSON.parse(String(text ?? ""));
  } catch {
    throw new MarketingError("invalid_field", "La définition est illisible (JSON invalide).");
  }
}

module.exports = () => {
  const router = express.Router();

  router.get("/segments", need("segments.read"), (req, res) => {
    res.render("marketing/segments", { title: "Segments", active: "segments", segments: segments.segmentOverview(req.mk.ctx) });
  });

  // Aperçu : total, effectif réellement envoyable et quelques lignes seulement (jamais la liste complète)
  router.post("/segments/apercu", need("segments.read"), (req, res, next) => {
    try {
      const preview = segments.previewSegment(req.mk.ctx, req.body.definition, { limit: 10 });
      res.json({
        total: preview.total, sendable: segments.countSegment(req.mk.ctx, req.body.definition, { sendableOnly: true }), totalContacts: audience.countContacts(req.mk.ctx, {}),
        rows: preview.rows.map((c) => ({ id: c.id, email: c.email, name: [c.first_name, c.last_name].filter(Boolean).join(" "), status: c.status })),
      });
    } catch (error) {
      if (error instanceof MarketingError) return res.status(400).json({ error: error.message });
      next(error);
    }
  });

  const form = (req, res, segment) => {
    const draft = req.session.mkDraft ?? null; // définition en cours de saisie, conservée après une erreur
    delete req.session.mkDraft;
    const initial = draft ?? (segment ? { name: segment.name, description: segment.description, definition: JSON.stringify(segment.definition, null, 2) } : { name: "", description: "", definition: "" });
    // Le catalogue est intégré dans une balise JSON : « < » échappé pour qu'aucun libellé ne puisse fermer la balise
    const catalog = JSON.stringify(fieldCatalog(req.mk.ctx)).replace(/</g, "\\u003c").replace(new RegExp("\\u2028", "g"), "\\u2028").replace(new RegExp("\\u2029", "g"), "\\u2029");
    res.render("marketing/segment-form", {
      title: segment ? segment.name : "Nouveau segment", active: "segments", segment, initial, catalog, readOnly: !req.mk.can("segments.write"),
      usage: segment ? segments.segmentUsage(req.mk.ctx, segment.id) : [],
    });
  };

  router.get("/segments/nouveau", need("segments.write"), (req, res) => form(req, res, null));

  router.get("/segments/:id", need("segments.read"), (req, res) => {
    const id = intOrNull(req.params.id);
    const segment = id ? segments.getSegment(req.mk.ctx, id) : null;
    if (!segment) return res.status(404).render("error", { message: "Segment introuvable." });
    form(req, res, segment);
  });

  const save = (req, res, next, id) => {
    let saved = null;
    const back = () => (saved ? `/marketing/segments/${saved.id}` : id ? `/marketing/segments/${id}` : "/marketing/segments/nouveau");
    attempt(req, res, next, back, () => {
      try {
        const definition = parseDefinition(req.body.definition);
        saved = id
          ? segments.updateSegment(req.mk.ctx, id, { name: req.body.name, description: req.body.description, definition })
          : segments.createSegment(req.mk.ctx, { name: req.body.name, description: req.body.description, definition, siteId: req.body.site });
        return "Segment enregistré.";
      } catch (error) {
        req.session.mkDraft = { name: String(req.body.name ?? ""), description: String(req.body.description ?? ""), definition: String(req.body.definition ?? "") };
        throw error;
      }
    });
  };

  router.post("/segments", need("segments.write"), (req, res, next) => save(req, res, next, null));
  router.post("/segments/:id", need("segments.write"), (req, res, next) => {
    const id = intOrNull(req.params.id);
    if (!id || !segments.getSegment(req.mk.ctx, id)) return res.status(404).render("error", { message: "Segment introuvable." });
    save(req, res, next, id);
  });
  router.post("/segments/:id/dupliquer", need("segments.write"), (req, res, next) => {
    const id = intOrNull(req.params.id);
    if (!id || !segments.getSegment(req.mk.ctx, id)) return res.status(404).render("error", { message: "Segment introuvable." });
    let copy = null;
    attempt(req, res, next, () => (copy ? `/marketing/segments/${copy.id}` : "/marketing/segments"), () => {
      copy = segments.duplicateSegment(req.mk.ctx, id);
      return `Segment dupliqué : « ${copy.name} ». Modifiez son nom et ses critères avant de l'utiliser.`;
    });
  });
  router.post("/segments/:id/supprimer", need("segments.write"), (req, res, next) =>
    attempt(req, res, next, "/marketing/segments", () => {
      const id = intOrNull(req.params.id);
      const used = id ? segments.segmentUsage(req.mk.ctx, id).length : 0;
      segments.deleteSegment(req.mk.ctx, id);
      return `Segment supprimé (les contacts ne sont pas touchés).${used ? ` ${used} campagne${used > 1 ? "s" : ""} le ciblai${used > 1 ? "ent" : "t"} encore : modifiez-${used > 1 ? "les" : "la"} avant tout envoi.` : ""}`;
    }));

  return router;
};
