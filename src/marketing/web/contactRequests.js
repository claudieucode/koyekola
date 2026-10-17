// R7 (lot 5) — Demandes de rattachement de contacts entre sites : écran du DEMANDEUR (« Mes demandes », états « en attente » / « traitée » seulement) et écran de l'ÉQUIPE
// (permission dédiée `contacts.requests`, jamais accordée d'office aux administrateurs de site). Monté AVANT admin.js (« /contacts/:id »). Toute décision passe par contactcore/requests.
const express = require("express");
const requests = require("../contactcore/requests");
const { attempt, need } = require("./kit");
const { MarketingError } = require("../errors");

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);

module.exports = () => {
  const router = express.Router();
  // Équipe de l'organisation seulement : un accès limité à un site n'ouvre jamais l'écran de traitement, quelle que soit la permission qu'un rôle personnalisé lui donnerait
  const teamOnly = (req, res, next) => (req.mk.siteOnly ? res.status(403).render("error", { message: "Le traitement des demandes est réservé à l'équipe de l'organisation." }) : next());

  router.get("/contacts/demandes", need("contacts.read"), (req, res) => {
    if (!req.mk.siteOnly) return res.redirect("/marketing/contacts/demandes/traiter");
    res.render("marketing/contact-requests", { title: "Mes demandes", active: "contacts", items: requests.listMine(req.mk.ctx) });
  });

  router.get("/contacts/demandes/traiter", need("contacts.requests"), teamOnly, (req, res) => {
    res.render("marketing/contact-requests-team", { title: "Demandes de rattachement", active: "contacts", items: requests.listPending(req.mk.ctx) });
  });

  for (const [path, decision, ok] of [["accepter", "accept", "Demande acceptée : le site peut désormais lire ce contact (lecture seule)."], ["refuser", "refuse", "Demande refusée : le contact n'a pas été modifié."]]) {
    router.post(`/contacts/demandes/:id(\\d+)/${path}`, need("contacts.requests"), teamOnly, (req, res, next) => {
      attempt(req, res, next, "/marketing/contacts/demandes/traiter", () => {
        const id = intOrNull(req.params.id);
        if (!id) throw new MarketingError("not_found", "Demande introuvable.");
        const r = requests.decide(req.mk.ctx, id, decision, { note: req.body.note });
        return decision === "accept" && r.status === "refused" ? "Le contact n'existe plus : la demande est classée comme refusée." : ok;
      });
    });
  }
  return router;
};
