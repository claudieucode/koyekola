// Contact Core (palier 15) — écrans et actions : doublons, fusion contrôlée, cycle de vie, état de la fiche, journal d'événements.
// Monté AVANT admin.js (ses routes « /contacts/:id » ne doivent pas avaler « /contacts/doublons »). Chaque écriture passe par
// src/marketing/contactcore (jamais de SQL d'écriture ici) et vérifie la permission côté serveur.
const express = require("express");
const core = require("../contactcore");
const siteAccess = require("../contactcore/siteAccess");
const audience = require("../audience");
const { attempt, need } = require("./kit");

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);

module.exports = () => {
  const router = express.Router();

  // R7 : accès selon le site (contactcore/siteAccess) — lecture : contacts associés au site ; écriture (autre que GET) : contacts dont l'origine est ce site
  const inScope = (req, contact) => !req.mk.siteOnly || (req.method === "GET" ? siteAccess.canRead(req.mk.ctx, contact) : siteAccess.canWrite(req.mk.ctx, contact));
  const loadOr404 = (req, res, id) => {
    const contact = id ? audience.getContact(req.mk.ctx, id) : null;
    if (!contact || !inScope(req, contact)) { res.status(404).render("error", { message: "Contact introuvable." }); return null; }
    return contact;
  };

  // R7 : doublons et fusion = équipe de l'organisation seulement (un accès limité à un site ne peut pas parcourir ni fusionner les contacts des autres sites)
  const teamOnly = (req, res, next) => (req.mk.siteOnly ? res.status(403).render("error", { message: "La détection des doublons et la fusion sont réservées à l'équipe de l'organisation." }) : next());

  // ---------- Doublons ----------
  router.get("/contacts/doublons", need("contacts.merge"), teamOnly, (req, res) => {
    res.render("marketing/contacts-duplicates", { title: "Doublons", active: "contactdupes", groups: core.findDuplicates(req.mk.ctx, { limit: 100 }) });
  });

  // ---------- Fusion : aperçu puis confirmation ----------
  router.get("/contacts/fusion", need("contacts.merge"), teamOnly, (req, res) => {
    const master = intOrNull(req.query.maitre), source = intOrNull(req.query.source);
    let preview = null, error = null;
    try { if (master && source) preview = core.mergePreview(req.mk.ctx, master, source); } catch (e) { if (!e.code) throw e; error = e.message; }
    res.render("marketing/contacts-merge", { title: "Fusionner deux contacts", active: "contactdupes", preview, error, masterId: master, sourceId: source });
  });
  router.post("/contacts/fusion", need("contacts.merge"), teamOnly, (req, res, next) => {
    const master = intOrNull(req.body.maitre), source = intOrNull(req.body.source);
    let done = null;
    attempt(req, res, next, () => (done ? `/marketing/contacts/${done}` : `/marketing/contacts/fusion?maitre=${master || ""}&source=${source || ""}`), () => {
      if (req.body.confirmer !== "1") throw new (require("../errors").MarketingError)("not_confirmed", "Cochez la case de confirmation pour fusionner.");
      done = core.mergeContacts(req.mk.ctx, master, source).master.id;
      return "Contacts fusionnés. La fiche absorbée est conservée (archivée), rien n'a été supprimé.";
    });
  });

  // ---------- Cycle de vie et état de la fiche ----------
  router.post("/contacts/:id(\\d+)/cycle-de-vie", need("contacts.write"), (req, res, next) => {
    const contact = loadOr404(req, res, intOrNull(req.params.id));
    if (!contact) return;
    attempt(req, res, next, `/marketing/contacts/${contact.id}`, () => { core.setLifecycle(req.mk.ctx, contact.id, String(req.body.etape || "")); return "Étape du cycle de vie enregistrée."; });
  });
  router.post("/contacts/:id(\\d+)/etat", need("contacts.archive"), (req, res, next) => {
    const contact = loadOr404(req, res, intOrNull(req.params.id));
    if (!contact) return;
    attempt(req, res, next, `/marketing/contacts/${contact.id}`, () => {
      const next_ = ["active", "inactive", "archived"].includes(req.body.etat) ? req.body.etat : "";
      core.setRecordStatus(req.mk.ctx, contact.id, next_);
      return next_ === "archived" ? "Fiche archivée : elle n'est plus jamais jointe par le marketing." : next_ === "inactive" ? "Fiche désactivée." : "Fiche rétablie.";
    });
  });

  // ---------- Journal d'événements (pagination par curseur) ----------
  router.get("/contacts/:id(\\d+)/evenements.json", need("events.view"), (req, res) => {
    const contact = loadOr404(req, res, intOrNull(req.params.id));
    if (!contact) return;
    res.set("Cache-Control", "no-store");
    const page = core.eventsOf(req.mk.ctx, contact.id, { before: intOrNull(req.query.avant), limit: Number(req.query.limite) || 30, siteId: req.mk.siteOnly ? req.mk.siteId : intOrNull(req.query.site), type: typeof req.query.type === "string" ? req.query.type : null });
    // Sans le droit « données sensibles », les données associées (qui peuvent contenir adresses, numéros…) ne sont pas communiquées
    if (!req.mk.can("contacts.view_sensitive")) page.events = page.events.map((e) => ({ ...e, metadata: {} }));
    res.json(page);
  });

  return router;
};
