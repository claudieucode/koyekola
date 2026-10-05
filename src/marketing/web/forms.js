// Route « Formulaires » (/marketing/formulaires, jalon M5 — Capture, partie 1) : créer, éditer, publier, supprimer.
const express = require("express");
const forms = require("../forms");
const { listListsWithStats } = require("../audience/lists");
const { listProperties } = require("../audience/properties");
const { listTags } = require("../audience/tags");
const { attempt, need, flashError } = require("./kit");
const { MarketingError } = require("../errors");

module.exports = ({ db }) => {
  const router = express.Router();

  router.get("/formulaires", need("forms.read"), (req, res) => {
    res.render("marketing/forms", { title: "Formulaires", active: "forms", items: forms.listForms(req.mk.ctx) });
  });

  router.post("/formulaires", need("forms.write"), (req, res, next) => {
    try {
      const created = forms.createForm(req.mk.ctx, { name: req.body.name, fields: [], consentText: req.body.consentText, listId: null, doubleOptin: true });
      res.redirect(`/marketing/formulaires/${created.id}`);
    } catch (error) {
      if (!(error instanceof MarketingError)) return next(error);
      flashError(req, error.message);
      res.redirect("/marketing/formulaires");
    }
  });

  router.get("/formulaires/:id", need("forms.read"), (req, res, next) => {
    try {
      const item = forms.getForm(req.mk.ctx, Number(req.params.id));
      res.render("marketing/form", {
        title: item.name, active: "forms", item, fieldCatalog: forms.FIELD_CATALOG, lists: listListsWithStats(req.mk.ctx), baseUrl: process.env.SITE_URL || "",
        popupTriggers: forms.POPUP_TRIGGERS, properties: listProperties(req.mk.ctx), existingTags: listTags(req.mk.ctx),
      });
    } catch (error) {
      if (error instanceof MarketingError) return res.status(404).render("error", { message: error.message });
      next(error);
    }
  });

  router.post("/formulaires/:id", need("forms.write"), (req, res, next) => {
    const id = Number(req.params.id);
    try {
      const fields = Array.isArray(req.body.fields) ? req.body.fields : req.body.fields ? [req.body.fields] : [];
      const listId = /^\d+$/.test(String(req.body.listId || "")) ? Number(req.body.listId) : null;
      const propertyFields = Array.isArray(req.body.propertyFields) ? req.body.propertyFields : req.body.propertyFields ? [req.body.propertyFields] : [];
      forms.updateForm(req.mk.ctx, id, {
        name: req.body.name, fields, consentText: req.body.consentText, listId, thankYouText: req.body.thankYouText,
        popupEnabled: req.body.popupEnabled === "1", popupTrigger: req.body.popupTrigger, popupTriggerValue: Number(req.body.popupTriggerValue), popupFrequencyDays: Number(req.body.popupFrequencyDays),
        propertyFields, tags: req.body.tags ?? "", redirectUrl: req.body.redirectUrl ?? "",
        doubleOptin: req.body.doubleOptinShown ? req.body.doubleOptin === "1" : undefined, // case absente du formulaire envoyé = inchangé
        smsConsentText: req.body.smsConsentText, // absent (ancien envoi) = inchangé
      });
      req.session.mkFlash = { type: "ok", text: "Formulaire enregistré." };
      res.redirect(`/marketing/formulaires/${id}`);
    } catch (error) {
      if (!(error instanceof MarketingError)) return next(error);
      flashError(req, error.message);
      res.redirect(`/marketing/formulaires/${id}`);
    }
  });

  router.post("/formulaires/:id/publier", need("forms.write"), (req, res, next) => {
    attempt(req, res, next, () => `/marketing/formulaires/${req.params.id}`, () => forms.setStatus(req.mk.ctx, Number(req.params.id), "published"));
  });
  router.post("/formulaires/:id/depublier", need("forms.write"), (req, res, next) => {
    attempt(req, res, next, () => `/marketing/formulaires/${req.params.id}`, () => forms.setStatus(req.mk.ctx, Number(req.params.id), "draft"));
  });
  router.post("/formulaires/:id/supprimer", need("forms.write"), (req, res, next) => {
    attempt(req, res, next, "/marketing/formulaires", () => forms.deleteForm(req.mk.ctx, Number(req.params.id)));
  });

  return router;
};
