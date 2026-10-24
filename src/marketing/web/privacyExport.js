// KOLAKISA CMS → Outils → Exporter les données personnelles (écrans d'administration). Mêmes droits que l'export du contenu (tools.export),
// site choisi par l'adresse vérifiée (jamais par un champ de formulaire), une demande n'est lisible que depuis SON site. Toute la logique est dans
// src/services/privacy/exportRequests.js ; ce fichier ne fait que lire la requête, appeler le service et afficher le résultat.
const express = require("express");
const requests = require("../../services/privacy/exportRequests");
const registry = require("../../services/privacy/exportEngine/registry");
const { UserError } = require("../../utils/errors");
const toolsAudit = require("../../services/tools/audit");
const { need } = require("./kit");

const SAFE_ACTIONS = new Set(["generer", "renvoyer", "envoyer", "relancer", "supprimer"]);

module.exports = ({ BASE, withSite, shell, flash, q }) => {
  const router = express.Router();
  const PAGE = `${BASE}/donnees`;
  const ctxOf = (req, siteId) => ({ db: req.mk.ctx.db, organizationId: req.mk.ctx.organizationId, siteId, userId: req.session.user.id, can: req.mk.can, orgLevel: !req.mk.siteOnly });
  const back = (req, res, siteId) => res.redirect(`${PAGE}${q(siteId)}`);
  const fail = (req, res, siteId, error, to) => {
    if (!(error instanceof UserError)) throw error;
    if (error.status === 403) return res.status(403).render("error", { message: error.message });
    flash(req, "error", error.message);
    return res.redirect(to || `${PAGE}${q(siteId)}`);
  };
  const log = (req, action, summary, details) => toolsAudit.log(req, `privacy_${action}`, summary, details);
  const qs = (siteId, extra = {}) => { const p = new URLSearchParams(); if (siteId) p.set("site", siteId); for (const [k, v] of Object.entries(extra)) if (v !== "" && v !== undefined && v !== null) p.set(k, v); const s = p.toString(); return s ? `?${s}` : ""; };

  // ----- Liste, formulaire, réglages -----
  router.get("/site-web/outils/donnees", need("tools.export"), (req, res) => withSite(req, res, (siteId) => {
    const ctx = ctxOf(req, siteId);
    let data;
    try { data = requests.list(ctx, { status: String(req.query.etat || ""), sort: String(req.query.tri || "sent"), dir: String(req.query.sens || "desc"), page: req.query.page, perPage: req.query.taille }); } catch (error) { return fail(req, res, siteId, error); }
    const url = (changes = {}) => `${PAGE}${qs(siteId, { etat: data.filter, tri: data.sort === "sent" ? "" : data.sort, sens: data.dir === "desc" ? "" : data.dir, taille: data.perPage === 20 ? "" : data.perPage, page: "", ...changes })}`;
    const sortUrl = (key) => url({ tri: key === "sent" ? "" : key, sens: data.sort === key && data.dir === "asc" ? "" : data.sort === key ? "asc" : key === "origin" ? "asc" : "", page: "" });
    res.render("marketing/tools-privacy", {
      title: "Exporter les données personnelles", active: "outils", ...shell(req, siteId, "donnees"), privacyExportJs: true, PAGE, data, url, sortUrl, STATUS_LABELS: requests.STATUS_LABELS, settings: requests.settingsOf(ctx.db, ctx.organizationId, siteId), SETTING_LABELS: requests.SETTING_LABELS,
      sourcesCount: registry.list().length, canWrite: req.mk.can("tools.export"), pager: { total: data.filter ? data.counts[data.filter] || 0 : data.total, page: data.page, pages: data.pages, pageSize: data.perPage },
    });
  }));

  router.post("/site-web/outils/donnees", need("tools.export"), (req, res) => withSite(req, res, (siteId) => {
    try {
      const out = requests.create(ctxOf(req, siteId), { input: req.body.identifiant, sendEmail: req.body.envoyer_email === "1", confirmAdmin: req.body.confirmer_admin === "1" });
      log(req, "create", "Demande d'export de données personnelles créée", { requestId: out.id, siteId, mode: out.mode });
      if (out.emailError) flash(req, "error", `Demande enregistrée, mais ${out.emailError.charAt(0).toLowerCase()}${out.emailError.slice(1)} Utilisez « Renvoyer l'e-mail de confirmation ».`);
      else flash(req, "ok", out.mode === "email" ? "Demande enregistrée. Un e-mail de confirmation est en cours d'envoi à la personne : l'export ne sera préparé qu'après sa confirmation." : "Demande enregistrée et confirmée par vous. Vous pouvez maintenant générer l'export.");
      return back(req, res, siteId);
    } catch (error) { return fail(req, res, siteId, error); }
  }));

  router.post("/site-web/outils/donnees/reglages", need("tools.export"), (req, res) => withSite(req, res, (siteId) => {
    try {
      const ctx = ctxOf(req, siteId);
      if (!ctx.can("tools.export")) throw new UserError("Vous n'avez pas la permission d'effectuer cette action.", 403);
      requests.saveSettings(ctx.db, ctx.organizationId, siteId, req.body);
      log(req, "settings", "Durées de l'export de données personnelles modifiées", { siteId });
      flash(req, "ok", "Durées enregistrées pour ce site.");
      return back(req, res, siteId);
    } catch (error) { return fail(req, res, siteId, error); }
  }));

  // Actualisation des statuts (sans rechargement tant que rien ne change) : seulement des états, jamais de donnée personnelle
  router.get("/site-web/outils/donnees/etat.json", need("tools.export"), (req, res) => withSite(req, res, (siteId) => {
    try {
      const data = requests.list(ctxOf(req, siteId), { perPage: 100 });
      res.set("Cache-Control", "no-store").json({ requests: data.rows.map((r) => ({ id: r.id, status: r.status, mail: (r.deliveryMail || r.confirmMail || {}).state || "" })) });
    } catch (error) { res.status(error.status || 500).json({ error: "indisponible" }); }
  }));

  // ----- Actions groupées : chaque demande est contrôlée individuellement par le service -----
  router.post("/site-web/outils/donnees/groupe", need("tools.export"), (req, res) => withSite(req, res, (siteId) => {
    const map = { renvoyer: "resend", generer: "generate", envoyer: "send", supprimer: "remove" };
    try {
      const action = map[String(req.body.action_groupee || "")];
      if (!action) throw new UserError("Choisissez une action groupée.");
      const out = requests.bulk(ctxOf(req, siteId), action, req.body.ids);
      log(req, "bulk", `Action groupée « ${action} » sur des demandes d'export`, { siteId, ok: out.done.length, ko: out.failed.length });
      const detail = out.failed.length ? out.failed.slice(0, 10).map((f) => `Demande n°${f.id} : ${f.reason}`) : undefined;
      flash(req, out.failed.length ? (out.done.length ? "ok" : "error") : "ok", `${out.done.length} demande(s) traitée(s), ${out.failed.length} refusée(s).`, detail && detail.join(" — "));
      return back(req, res, siteId);
    } catch (error) { return fail(req, res, siteId, error); }
  }));

  // ----- Détail et résultat d'une demande -----
  router.get("/site-web/outils/donnees/:id(\\d+)", need("tools.export"), (req, res) => withSite(req, res, (siteId) => {
    let item;
    try { item = requests.detail(ctxOf(req, siteId), req.params.id); } catch (error) { return error.status === 404 ? res.status(404).render("error", { message: "Demande introuvable." }) : fail(req, res, siteId, error); }
    res.render("marketing/tools-privacy-detail", { title: "Demande d'export", active: "outils", ...shell(req, siteId, "donnees"), privacyExportJs: true, PAGE, item, STATUS_LABELS: requests.STATUS_LABELS });
  }));

  router.get("/site-web/outils/donnees/:id(\\d+)/archive", need("tools.export"), (req, res) => withSite(req, res, (siteId) => {
    try {
      const file = requests.adminDownload(ctxOf(req, siteId), req.params.id);
      log(req, "download", "Archive d'export de données téléchargée par un administrateur", { requestId: file.row.id, siteId });
      res.set({ "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${file.name}"`, "Content-Length": String(file.data.length), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }).send(file.data);
    } catch (error) {
      if (!(error instanceof UserError)) throw error;
      return res.status(error.status || 400).render("error", { message: error.message });
    }
  }));

  router.post("/site-web/outils/donnees/:id(\\d+)/:action", need("tools.export"), (req, res) => withSite(req, res, (siteId) => {
    const action = String(req.params.action);
    if (!SAFE_ACTIONS.has(action)) return res.status(404).render("error", { message: "Action inconnue." });
    const ctx = ctxOf(req, siteId);
    const id = req.params.id;
    const detailUrl = `${PAGE}/${id}${q(siteId)}`;
    const toList = req.body.retour === "detail" && action !== "supprimer" ? detailUrl : `${PAGE}${q(siteId)}`;
    try {
      if (action === "generer") {
        const out = requests.generate(ctx, id);
        log(req, "generate", "Export de données personnelles généré", { requestId: Number(id), siteId, result: out.status });
        if (out.status === "ready") flash(req, "ok", out.report.summary.failed ? `Export prêt, mais incomplet : ${out.report.summary.failed} catégorie(s) en échec (voir le détail).` : "Export prêt : l'archive ZIP est disponible.");
        else if (out.status === "no_data") flash(req, "error", "Aucune donnée personnelle trouvée pour cette personne sur ce site : aucune archive n'a été créée.");
        else flash(req, "error", `L'export a échoué : ${out.error}`);
      } else if (action === "renvoyer") {
        requests.resendConfirmation(ctx, id);
        log(req, "resend", "E-mail de confirmation renvoyé", { requestId: Number(id), siteId });
        flash(req, "ok", "Un nouvel e-mail de confirmation est en cours d'envoi (l'ancien lien ne fonctionne plus).");
      } else if (action === "envoyer") {
        const out = requests.sendLink(ctx, id);
        log(req, "send", "Lien de téléchargement envoyé à la personne", { requestId: Number(id), siteId });
        flash(req, "ok", `Le lien de téléchargement est en cours d'envoi à l'adresse vérifiée. Il expire le ${out.linkExpiresAt.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" })}.`);
      } else if (action === "relancer") {
        const out = requests.restart(ctx, id, { confirmAdmin: req.body.confirmer_admin === "1" });
        log(req, "restart", "Demande d'export relancée", { requestId: Number(id), siteId, mode: out.mode });
        flash(req, "ok", out.mode === "email" ? "Demande relancée : un nouvel e-mail de confirmation est en cours d'envoi." : "Demande relancée et confirmée par vous : vous pouvez générer l'export.");
      } else {
        requests.remove(ctx, id);
        log(req, "delete", "Demande d'export supprimée (avec son archive)", { requestId: Number(id), siteId });
        flash(req, "ok", "Demande supprimée avec son archive. Les données sources ne sont pas modifiées.");
      }
      return res.redirect(toList);
    } catch (error) { return fail(req, res, siteId, error, toList); }
  }));

  return router;
};
