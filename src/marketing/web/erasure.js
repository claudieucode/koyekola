// KOLAKISA CMS → Outils → Effacer les données : écrans et actions d'administration (le moteur est dans services/privacy ; ici, seulement les routes).
// Monté par tools.js (même cadre, mêmes onglets, même choix de site). Droits : privacy.view / privacy.request / privacy.erase / privacy.force,
// vérifiés pour le site de l'adresse ET, pour chaque demande, pour LE SITE DE LA DEMANDE (jamais celui de l'URL). Protection CSRF : sameOriginOnly (toutes les écritures sont des POST).
const express = require("express");
const access = require("../../services/cmsAccess");
const erasure = require("../../services/privacy/erasure");
const requests = require("../../services/privacy/erasureRequests");
const toolsAudit = require("../../services/tools/audit");
const { need } = require("./kit");

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
const CONFIRM_WORD = "EFFACER";

module.exports = ({ BASE: TOOLS_BASE, withSite, shell, toolsCtx, q, flash }) => {
  const router = express.Router();
  const BASE = `${TOOLS_BASE}/effacer-donnees`;
  const back = (siteId, extra = "") => `${BASE}${siteId ? `?site=${siteId}` : ""}${extra}`;
  const detail = (r, extra = "") => `${BASE}/${r.id}${r.site_id ? `?site=${r.site_id}` : ""}${extra}`;
  const wantsJson = (req) => /application\/json/.test(req.get("accept") || "") || req.body.json === "1";

  // Demande + droits sur SON site : une demande d'une autre organisation ou d'un site non autorisé n'existe pas (404)
  const loadRequest = (req, res, perm = "privacy.view") => {
    const ctx = req.mk.ctx;
    const r = requests.get(ctx.db, ctx.organizationId, intOrNull(req.params.id));
    const perms = r ? access.effectivePermissions(req.session.user.id, { organizationId: ctx.organizationId, siteId: r.site_id }) : null;
    if (!r || !perms.has("privacy.view")) { res.status(404).render("error", { message: "Demande introuvable." }); return null; }
    if (!perms.has(perm)) { res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." }); return null; }
    return { r, perms };
  };
  const audit = (req, action, summary, r, extra = {}) => toolsAudit.log(req, action, summary, { requestId: r.id, siteId: r.site_id, subject: r.subject_label, ...extra });
  const mailReady = () => Boolean(process.env.SMTP_HOST);

  // Traitement : un lot (ou plusieurs, dans la limite de temps) ; à la fin, notifications et trace d'audit
  const runStep = (req, r, budgetMs = 1500) => {
    const ctx = toolsCtx(req);
    return erasure.step(ctx.db, ctx, r.id, { budgetMs, onFinish: (state, row) => {
      const p = erasure.progress(ctx.db, row);
      if (state === "completed") { requests.notifyCompleted(ctx, row); audit(req, "erasure_completed", "Effacement de données terminé", row, { erased: p.erased, anonymized: p.anonymized }); }
      else { requests.notifyFailure(ctx, row); audit(req, "erasure_failed", "Effacement de données incomplet", row, { erased: p.erased, anonymized: p.anonymized, failed: p.failed }); }
    } });
  };

  // ----- Page principale : formulaire + liste -----
  router.get("/site-web/outils/effacer-donnees", need("privacy.view"), (req, res) => withSite(req, res, (siteId) => {
    const ctx = toolsCtx(req);
    requests.sweep(ctx.db);
    const page = requests.list(ctx, { siteId, status: String(req.query.etat || ""), sort: String(req.query.tri || "date"), dir: String(req.query.ordre || "desc"), page: req.query.page });
    const site = requests.siteContext(ctx, { site_id: siteId, organization_id: ctx.organizationId });
    const rows = page.rows.map((r) => ({
      ...r, statusLabel: requests.STATUS_LABEL[r.status], failureLabel: r.failure_code ? requests.FAILURE_LABEL[r.failure_code] : "",
      actions: ["resend", "execute", "resume", "force", "complete", "remove"].filter((a) => requests.eligible(a, r) && (a === "resend" ? req.mk.can("privacy.request") : a === "force" ? req.mk.can("privacy.force") : req.mk.can("privacy.erase"))),
      mailState: r.mail ? { pending: "e-mail en attente d'envoi", sending: "e-mail en cours d'envoi", sent: "e-mail envoyé", failed: "e-mail NON envoyé", skipped: "e-mail NON envoyé (aucun serveur d'e-mail configuré)" }[r.mail.status] || r.mail.status : "",
      mailFailed: Boolean(r.mail && ["failed", "skipped"].includes(r.mail.status)),
    }));
    const templates = req.mk.siteOnly ? null : requests.TEMPLATE_KEYS.map((name) => ({ name, label: requests.TEMPLATE_LABELS[name], ...requests.templateOf(ctx.db, ctx.organizationId, site.locale, name), base: requests.TEMPLATES[site.locale][name] }));
    res.render("marketing/tools-erasure", {
      title: "Effacer les données", active: "outils", ...shell(req, siteId, "effacer-donnees"), BASE_ER: BASE, page, rows, STATUSES: requests.STATUSES, STATUS_LABEL: requests.STATUS_LABEL,
      canRequest: req.mk.can("privacy.request"), canErase: req.mk.can("privacy.erase"), mailReady: mailReady(), templates, locale: site.locale, VARS: requests.VARS, tokenHours: requests.TOKEN_HOURS, retentionDays: requests.RETENTION_DAYS, siteName: site.name,
    });
  }));

  // ----- Ajout d'une demande -----
  router.post("/site-web/outils/effacer-donnees", need("privacy.request"), (req, res, next) => withSite(req, res, (siteId) => {
    try {
      const ctx = toolsCtx(req);
      const sendEmail = req.body.send_email === "1";
      const r = requests.create(ctx, { siteId, identifier: req.body.identifier, sendEmail, actorId: req.session.user.id });
      audit(req, "erasure_request", sendEmail ? "Demande d'effacement ajoutée (confirmation par e-mail)" : "Demande d'effacement ajoutée (confirmée par l'administrateur)", r, { sendEmail });
      if (r.status === "failed") flash(req, "error", "Demande enregistrée, mais l'e-mail de confirmation n'a pas pu être mis en file : elle est « Échouée ». Vérifiez l'adresse et relancez la confirmation.");
      else flash(req, "ok", sendEmail ? "Demande ajoutée : un e-mail de confirmation a été mis en file d'envoi. Rien n'est effacé tant que la personne n'a pas confirmé et qu'un administrateur n'a pas lancé le traitement." : "Demande ajoutée comme confirmée. Rien n'est effacé : lancez le traitement depuis la liste, après vérification du récapitulatif.");
    } catch (error) { if (!error.user) return next(error); flash(req, "error", error.message); }
    res.redirect(back(siteId));
  }));

  // ----- Détail, récapitulatif et résultats -----
  router.get("/site-web/outils/effacer-donnees/:id(\\d+)", need("privacy.view"), (req, res) => {
    requests.syncMail(req.mk.ctx.db, req.mk.ctx.organizationId);
    const l = loadRequest(req, res); if (!l) return;
    const { r, perms } = l, ctx = toolsCtx(req);
    const open = r.status !== "completed";
    const rowShown = { ...r, statusLabel: requests.STATUS_LABEL[r.status], failureLabel: r.failure_code ? requests.FAILURE_LABEL[r.failure_code] : "" };
    res.render("marketing/tools-erasure-request", {
      title: "Demande d'effacement", active: "outils", ...shell(req, r.site_id, "effacer-donnees"), BASE_ER: BASE, r: rowShown,
      summary: (() => { try { return JSON.parse(r.summary || "{}"); } catch { return {}; } })(),
      pv: open ? erasure.preview(ctx.db, ctx, r) : null, prog: erasure.progress(ctx.db, r), CONFIRM_WORD, options: (() => { try { return JSON.parse(r.options || "{}"); } catch { return {}; } })(),
      can: { erase: perms.has("privacy.erase"), force: perms.has("privacy.force"), request: perms.has("privacy.request") },
      elig: Object.fromEntries(["resend", "execute", "resume", "force", "complete", "remove"].map((a) => [a, requests.eligible(a, r)])),
      mailState: r.mail_id ? (ctx.db.prepare("SELECT status FROM mail_outbox WHERE id = ?").get(r.mail_id) || {}).status || "" : "",
    });
  });
  router.get("/site-web/outils/effacer-donnees/:id(\\d+)/progression.json", need("privacy.view"), (req, res) => {
    const l = loadRequest(req, res); if (!l) return;
    const fresh = requests.get(req.mk.ctx.db, req.mk.ctx.organizationId, l.r.id);
    res.set("Cache-Control", "no-store").json({ status: fresh.status, failure: fresh.failure_code, progress: erasure.progress(req.mk.ctx.db, fresh), finished: fresh.status === "completed" || fresh.status === "failed" });
  });

  // ----- Lancement (récapitulatif relu + confirmation écrite) -----
  router.post("/site-web/outils/effacer-donnees/:id(\\d+)/executer", need("privacy.view"), (req, res, next) => {
    const l = loadRequest(req, res, "privacy.erase"); if (!l) return;
    const force = req.body.force === "1";
    try {
      if (force && !l.perms.has("privacy.force")) return res.status(403).render("error", { message: "Forcer un effacement exige une permission spécifique." });
      if (req.body.confirm !== "1" || String(req.body.confirm_word || "").trim() !== CONFIRM_WORD) throw Object.assign(new Error(`Pour lancer l'effacement, cochez « J'ai relu le récapitulatif » et saisissez ${CONFIRM_WORD}.`), { user: true });
      const ctx = toolsCtx(req);
      const armed = requests.arm(ctx, l.r, { force, options: { comments: req.body.comments } });
      audit(req, force ? "erasure_forced" : "erasure_start", force ? "Effacement forcé (sans confirmation de la personne)" : "Effacement lancé", armed, { comments: JSON.parse(armed.options).comments });
      const out = runStep(req, armed);
      if (wantsJson(req)) return res.json({ status: out.status, finished: Boolean(out.finished), progress: out.progress });
      flash(req, out.finished ? (out.status === "completed" ? "ok" : "error") : "ok", out.finished ? (out.status === "completed" ? "Effacement terminé." : "Effacement incomplet : voir le détail des catégories en échec.") : "Effacement en cours : la page continue le traitement lot par lot.");
    } catch (error) { if (!error.user) return next(error); if (wantsJson(req)) return res.status(422).json({ error: error.message }); flash(req, "error", error.message); }
    res.redirect(detail(l.r));
  });
  // Lot suivant (appelé par la page tant que le traitement n'est pas fini, ou à la main) : sans effet sur une demande non confirmée
  router.post("/site-web/outils/effacer-donnees/:id(\\d+)/traiter", need("privacy.view"), (req, res) => {
    const l = loadRequest(req, res, "privacy.erase"); if (!l) return;
    const out = runStep(req, l.r);
    if (wantsJson(req)) return res.set("Cache-Control", "no-store").json({ status: out.status || l.r.status, finished: Boolean(out.finished), busy: Boolean(out.busy), notRunnable: Boolean(out.notRunnable), progress: out.progress || erasure.progress(req.mk.ctx.db, l.r) });
    flash(req, "ok", out.finished ? "Traitement terminé." : out.busy ? "Un traitement est déjà en cours pour cette demande." : "Lot traité.");
    res.redirect(detail(l.r));
  });
  router.post("/site-web/outils/effacer-donnees/:id(\\d+)/reprendre", need("privacy.view"), (req, res, next) => {
    const l = loadRequest(req, res, "privacy.erase"); if (!l) return;
    try {
      if (!erasure.resumeFailed(req.mk.ctx.db, l.r.id)) throw Object.assign(new Error("Cette demande n'a pas de catégorie en échec à reprendre."), { user: true });
      audit(req, "erasure_resume", "Reprise des catégories en échec", l.r);
      runStep(req, requests.get(req.mk.ctx.db, req.mk.ctx.organizationId, l.r.id));
      flash(req, "ok", "Reprise lancée : seules les catégories en échec sont retraitées.");
    } catch (error) { if (!error.user) return next(error); flash(req, "error", error.message); }
    res.redirect(detail(l.r));
  });

  // ----- Actions individuelles -----
  const single = (name, perm, act, okText) => router.post(`/site-web/outils/effacer-donnees/:id(\\d+)/${name}`, need("privacy.view"), (req, res, next) => {
    const l = loadRequest(req, res, perm); if (!l) return;
    try { act(req, l.r); flash(req, "ok", okText); } catch (error) { if (!error.user) return next(error); flash(req, "error", error.message); }
    res.redirect(name === "supprimer" ? back(l.r.site_id) : detail(l.r));
  });
  single("renvoyer", "privacy.request", (req, r) => {
    if (!requests.resend(toolsCtx(req), r)) throw Object.assign(new Error("L'e-mail n'a pas pu être mis en file : la demande est « Échouée »."), { user: true });
    audit(req, "erasure_resend", "Confirmation renvoyée", r);
  }, "Un nouvel e-mail de confirmation est en file d'envoi (le lien précédent n'est plus valable).");
  single("terminer", "privacy.erase", (req, r) => { requests.markComplete(toolsCtx(req), r, { actor: req.session.user }); audit(req, "erasure_marked", "Demande marquée comme terminée à la main", r); },
    "Demande marquée comme terminée à la main. Kolakisa n'a effacé aucune donnée pour elle ; la trace le précise.");
  single("supprimer", "privacy.erase", (req, r) => { requests.remove(toolsCtx(req), r); audit(req, "erasure_removed", "Demande supprimée de la liste (aucune donnée effacée)", r); },
    "Demande supprimée de la liste. Cette action n'efface aucune donnée personnelle.");

  // ----- Actions groupées -----
  router.post("/site-web/outils/effacer-donnees/actions", need("privacy.view"), (req, res) => withSite(req, res, (siteId) => {
    const action = { renvoyer: "resend", terminer: "complete", supprimer: "remove" }[req.body.action];
    const ids = [...new Set([].concat(req.body.ids || []).flatMap((v) => String(v).split(",")).map(intOrNull).filter(Boolean))].slice(0, 100);
    if (!action) { flash(req, "error", "Choisissez une action groupée."); return res.redirect(back(siteId)); }
    if (!ids.length) { flash(req, "error", "Sélectionnez au moins une demande."); return res.redirect(back(siteId)); }
    const ctx = toolsCtx(req);
    const permNeeded = action === "resend" ? "privacy.request" : "privacy.erase";
    let ok = 0, skipped = 0, failed = 0;
    for (const id of ids) {
      const r = requests.get(ctx.db, ctx.organizationId, id);
      // Limites du site : une demande d'un autre site que celui de la page n'est jamais touchée ici
      const perms = r && (r.site_id ?? null) === (siteId ?? null) ? access.effectivePermissions(req.session.user.id, { organizationId: ctx.organizationId, siteId: r.site_id }) : null;
      if (!r || !perms || !perms.has(permNeeded) || !requests.eligible(action, r)) { skipped += 1; continue; }
      try {
        if (action === "resend") { if (!requests.resend(ctx, r)) throw new Error("mail"); }
        else if (action === "complete") requests.markComplete(ctx, r, { actor: req.session.user });
        else requests.remove(ctx, r);
        ok += 1;
      } catch { failed += 1; }
    }
    toolsAudit.log(req, "erasure_bulk", `Action groupée « ${req.body.action} » sur des demandes d'effacement`, { siteId, ok, skipped, failed });
    flash(req, failed ? "error" : "ok", `${ok} demande(s) traitée(s)${skipped ? `, ${skipped} ignorée(s) (état ou droits non éligibles)` : ""}${failed ? `, ${failed} en échec` : ""}.${action === "remove" ? " Aucune donnée personnelle n'a été effacée." : ""}`);
    res.redirect(back(siteId));
  }));

  // ----- Modèles d'e-mails (organisation) -----
  router.post("/site-web/outils/effacer-donnees/modeles", need("privacy.erase"), (req, res, next) => withSite(req, res, (siteId) => {
    try {
      if (req.mk.siteOnly) throw Object.assign(new Error("Les modèles d'e-mails sont communs à l'organisation : réservés à son équipe."), { user: true });
      const locale = requests.localeOf(req.body.locale);
      if (!requests.TEMPLATE_KEYS.includes(req.body.name)) throw Object.assign(new Error("Modèle inconnu."), { user: true });
      const reset = req.body.reset === "1";
      requests.saveTemplate(req.mk.ctx.db, req.mk.ctx.organizationId, locale, req.body.name, reset ? {} : { subject: req.body.subject, body: req.body.body });
      toolsAudit.log(req, "erasure_template", reset ? "Modèle d'e-mail d'effacement réinitialisé" : "Modèle d'e-mail d'effacement modifié", { name: req.body.name, locale });
      flash(req, "ok", reset ? "Modèle rétabli (texte d'origine)." : "Modèle enregistré.");
    } catch (error) { if (!error.user) return next(error); flash(req, "error", error.message); }
    res.redirect(back(siteId, "#er-modeles"));
  }));

  return router;
};
