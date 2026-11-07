// KOLAKISA CMS → Paramètres → Données de l'entreprise : écran simple (adresse, téléphones, e-mail, horaires, informations légales, paiements, livraison)
// qui alimente les widgets « Pied de page » et les étiquettes {{business.…}}. Aucune règle ici : validation et enregistrement viennent de pages/business.js.
// Droits : lecture « settings.read », écriture « settings.write » (mêmes permissions que les autres Paramètres). Le site vient de la barrière d'accès
// (siteTarget : accès limité = son site seulement), jamais d'un identifiant envoyé par le navigateur sans contrôle. Site archivé : lecture seule.
const express = require("express");
const db = require("../../config/database");
const target = require("./siteTarget");
const business = require("../pages/business");

const PATH = "/site-web/parametres/entreprise";
const BASE = "/marketing" + PATH;

module.exports = () => {
  const router = express.Router();
  const render = (req, res, t, view = {}) => {
    const saved = view.form || business.get(db, req.mk.ctx.organizationId, t.siteId);
    res.status(view.status || 200).render("marketing/business-settings", {
      title: "Paramètres · Données de l'entreprise", active: "parametres", T: t, F: business.formModel(saved), errors: view.errors || [],
      days: business.DAYS.map((d) => ({ key: d, label: business.DAY_LABELS[d] })), payments: Object.entries(business.PAYMENTS),
      action: `${BASE}${t.siteId ? `?site=${t.siteId}` : ""}`, writable: req.mk.can("settings.write") && !t.readOnly,
      back: t.siteId ? `/marketing/site-web/sites/${t.siteId}/reglages` : "/marketing/site-web/parametres",
    });
  };
  router.get(PATH, (req, res) => {
    if (!req.mk.can("settings.read")) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'ouvrir cet écran." });
    const t = target(req, res); if (!t) return;
    render(req, res, t);
  });
  router.post(PATH, (req, res, next) => {
    if (!req.mk.can("settings.write")) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });
    const t = target(req, res); if (!t) return;
    if (t.readOnly) return res.status(403).render("error", { message: "Ce site est archivé : ses données ne se modifient plus." });
    const raw = business.fromForm(req.body || {});
    try {
      business.save(db, req.mk.ctx.organizationId, t.siteId, raw, req.session && req.session.user ? req.session.user.id : null); // tout ou rien : validé avant toute écriture
    } catch (error) {
      if (error && error.code === "invalid_field") return render(req, res, t, { status: 422, form: raw, errors: [error.message] });
      return next(error);
    }
    req.session.mkFlash = { type: "ok", text: "Données de l'entreprise enregistrées.", noReopen: true };
    res.redirect(`${BASE}${t.siteId ? `?site=${t.siteId}` : ""}`);
  });
  return router;
};
