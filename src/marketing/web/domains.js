// Paramètres → Domaines (point 11 de la parité Mailchimp) : ajouter un domaine d'envoi, voir les enregistrements DNS à
// publier, vérifier (vraies requêtes DNS, et Resend si c'est le fournisseur), sélecteur DKIM, suppression.
const express = require("express");
const domains = require("../domains");
const { MarketingError } = require("../errors");
const { need } = require("./kit");

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
// Version asynchrone de kit.attempt (les vérifications DNS et Resend sont des appels réseau)
function attemptAsync(req, res, next, back, action) {
  Promise.resolve()
    .then(action)
    .then((message) => { if (message) req.session.mkFlash = { type: "ok", text: message }; res.redirect(typeof back === "function" ? back() : back); })
    .catch((error) => {
      if (!(error instanceof MarketingError)) return next(error);
      req.session.mkFlash = { type: "error", text: error.message };
      res.redirect(typeof back === "function" ? back() : back);
    });
}
const STATE = { ok: ["mk-status-ok", "Valide"], warn: ["mk-status-warn", "À améliorer"], missing: ["mk-status-warn", "Absent"], error: ["mk-status-err", "Invalide"], unknown: ["", "Inconnu"] };

module.exports = () => {
  const router = express.Router();

  router.get("/domaines", need("settings.read"), (req, res) => {
    const { ctx } = req.mk;
    res.render("marketing/domains", { title: "Domaines", active: "domains", items: domains.listDomains(ctx), sender: domains.senderDomainStatus(ctx), STATUS_LABELS: domains.STATUS_LABELS, canWrite: req.mk.can("domains.manage") });
  });
  router.post("/domaines", need("domains.manage"), (req, res, next) => {
    let created = null;
    attemptAsync(req, res, next, () => (created ? `/marketing/domaines/${created.id}` : "/marketing/domaines"), async () => {
      const r = await domains.addDomain(req.mk.ctx, req.body.domain);
      created = r.domain;
      return `Domaine ${created.domain} ajouté : publiez les enregistrements ci-dessous chez votre hébergeur DNS, puis cliquez sur « Vérifier ».${r.note ? ` ${r.note}` : ""}`;
    });
  });

  const load = (req, res) => {
    const d = domains.getDomain(req.mk.ctx, intOrNull(req.params.id));
    if (!d) res.status(404).render("error", { message: "Domaine introuvable." });
    return d;
  };
  router.get("/domaines/:id(\\d+)", need("settings.read"), (req, res) => {
    const d = load(req, res);
    if (!d) return;
    const sender = domains.senderDomainStatus(req.mk.ctx);
    res.render("marketing/domain", { title: d.domain, active: "domains", d, records: domains.recordsToPublish(d), STATE, STATUS_LABELS: domains.STATUS_LABELS, isSender: Boolean(sender && sender.domain === d.domain), canWrite: req.mk.can("domains.manage") });
  });
  router.post("/domaines/:id(\\d+)/verifier", need("domains.manage"), (req, res, next) => {
    const d = load(req, res);
    if (!d) return;
    attemptAsync(req, res, next, `/marketing/domaines/${d.id}`, async () => {
      const r = await domains.checkDomain(req.mk.ctx, d.id);
      if (r.checks.dnsError) return "Vérification faite, mais certaines requêtes DNS n'ont pas abouti : réessayez dans un instant.";
      return r.status === "authenticated" ? `${r.domain} est authentifié : SPF, DKIM et DMARC sont en place.` : r.status === "verified" ? `Propriété de ${r.domain} vérifiée. Il reste à compléter l'authentification (voir ci-dessous).` : "Enregistrement de vérification pas encore visible : la propagation DNS peut prendre jusqu'à 48 h.";
    });
  });
  router.post("/domaines/:id(\\d+)/selecteur", need("domains.manage"), (req, res, next) => {
    const d = load(req, res);
    if (!d) return;
    attemptAsync(req, res, next, `/marketing/domaines/${d.id}`, () => { const s = domains.setSelector(req.mk.ctx, d.id, req.body.selector); return s ? `Sélecteur DKIM « ${s} » enregistré : cliquez sur « Vérifier ».` : "Sélecteur effacé : les sélecteurs courants seront essayés."; });
  });
  router.post("/domaines/:id(\\d+)/supprimer", need("domains.manage"), (req, res, next) => {
    const d = load(req, res);
    if (!d) return;
    attemptAsync(req, res, next, "/marketing/domaines", () => { domains.deleteDomain(req.mk.ctx, d.id); return `Domaine ${d.domain} retiré de la liste (vos enregistrements DNS ne sont pas touchés).`; });
  });
  return router;
};
