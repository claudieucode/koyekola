// Onglet « SMS » (comme Mailchimp) : campagnes SMS (liste, éditeur, contrôle avant envoi, lancement, rapport) et
// abonnés SMS. Garde-fous de lancement identiques à l'e-mail : contrôle visible, confirmation en tapant le NOMBRE de
// destinataires, droit « campaigns.send » réservé aux administrateurs.
const express = require("express");
const sms = require("../sms");
const audience = require("../audience");
const segments = require("../segments");
const { MarketingError } = require("../errors");
const { createRateLimiter } = require("../../middlewares/security");
const { attempt, need } = require("./kit");
const { WORKER_DETAIL, workerHuman } = require("../workerNotice");

const workerOn = () => process.env.MARKETING_WORKER === "on";
const TABS = [["", "Toutes"], ["draft", "Brouillons"], ["scheduled", "Programmées"], ["running", "En cours"], ["sent", "Envoyées"], ["stopped", "Interrompues"]];
const STATUS = {
  draft: ["Brouillon", "badge-muted"], scheduled: ["Programmée", "badge"], sending: ["En cours d'envoi", "badge"], paused: ["En pause", "badge-warning"],
  sent: ["Envoyée", "badge-success"], cancelled: ["Annulée", "badge-muted"], failed: ["En échec", "mk-badge-danger"],
};
const REASONS = {
  not_subscribed: "pas d'accord SMS", unsubscribed: "désinscrit des SMS", suppressed: "numéro bloqué", no_consent: "pas de preuve d'accord", no_phone: "pas de numéro valide",
  phone_changed: "numéro modifié depuis le lancement", contact_removed: "contact supprimé", cancelled: "campagne annulée", too_long: "message trop long",
  invalid_number: "numéro refusé (inexistant ou fixe)", opted_out: "a répondu STOP", temporary_exhausted: "erreurs temporaires répétées", interrupted: "envoi interrompu",
  permanent: "refusé par le fournisseur", error: "erreur imprévue", quiet_hours: "heures de silence", undelivered: "non livré",
};
const reasonLabel = (r) => REASONS[r] || (/^code_\d+$/.test(r) ? `non livré (code opérateur ${r.slice(5)})` : r);
const intParam = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);

// « all » / « list:3 » / « segment:2 »
function parseTarget(value) {
  const m = /^(all)$|^(list|segment):(\d{1,12})$/.exec(String(value ?? ""));
  if (!m) throw new MarketingError("invalid_field", "Choisissez les destinataires.");
  return m[1] ? { targetType: "all", targetId: null } : { targetType: m[2], targetId: Number(m[3]) };
}
function parseSchedule(body) {
  const raw = String(body.send_at_utc || body.send_at || "").trim();
  if (!raw) return undefined;
  const ms = Date.parse(/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw}Z`);
  if (!Number.isFinite(ms)) throw new MarketingError("invalid_field", "Date d'envoi invalide.");
  return ms;
}

module.exports = () => {
  const router = express.Router();
  const testLimiter = createRateLimiter(10, 60 * 60 * 1000);

  const load = (req, res) => {
    const c = sms.getSmsCampaign(req.mk.ctx, intParam(req.params.id));
    if (!c) res.status(404).render("error", { message: "Campagne SMS introuvable." });
    return c;
  };
  const targetName = (ctx, c) => {
    if (c.target_type === "all") return "Tous les abonnés SMS";
    if (c.target_type === "list") return `Liste « ${audience.getList(ctx, c.target_id)?.name ?? "(supprimée)"} »`;
    return `Segment « ${segments.getSegment(ctx, c.target_id)?.name ?? "(supprimé)"} »`;
  };

  // ---------- Liste ----------
  router.get("/sms", need("campaigns.read"), (req, res) => {
    const { ctx } = req.mk;
    const tab = TABS.some(([k]) => k === req.query.statut) ? req.query.statut : "";
    const { rows, counts } = sms.listSmsCampaigns(ctx, { tab });
    const subscribers = ctx.db.prepare("SELECT COUNT(*) n FROM mk_contacts c WHERE c.organization_id = ? AND " + sms.smsSendableSql("c").sql).get(ctx.organizationId).n;
    res.render("marketing/sms-campaigns", {
      title: "Campagnes SMS", active: "smscampaigns", tabs: TABS, tab, counts, subscribers, cfg: sms.getSmsConfig(ctx), workerOn: workerOn(),
      rows: rows.map((c) => ({ ...c, st: STATUS[c.status], target: targetName(ctx, c), clickRate: c.sent_count ? Math.round((c.click_count / c.sent_count) * 1000) / 10 : null })),
    });
  });

  router.post("/sms/campagnes", need("campaigns.write"), (req, res, next) => {
    try {
      const c = sms.createSmsCampaign(req.mk.ctx, { name: req.body.name || "Campagne SMS sans titre" });
      res.redirect(`/marketing/sms/campagnes/${c.id}`);
    } catch (error) {
      if (!(error instanceof MarketingError)) return next(error);
      req.session.mkFlash = { type: "error", text: error.message };
      res.redirect("/marketing/sms");
    }
  });

  // ---------- Brouillon (éditeur) ou rapport ----------
  router.get("/sms/campagnes/:id", need("campaigns.read"), (req, res) => {
    const c = load(req, res);
    if (!c) return;
    const { ctx } = req.mk;
    const cfg = sms.getSmsConfig(ctx);
    if (c.status === "draft") {
      return res.render("marketing/sms-campaign", {
        title: c.name, active: "smscampaigns", c, cfg, check: sms.smsPreflight(ctx, c.id, { workerOn: workerOn() }),
        lists: audience.listLists(ctx), segmentsList: segments.listSegments(ctx), canWrite: req.mk.can("campaigns.write"), canSend: req.mk.can("campaigns.send"),
        baseUrl: String(process.env.SITE_URL || "").replace(/\/+$/, ""), targetLabel: targetName(ctx, c),
      });
    }
    const report = sms.smsCampaignReport(ctx, c.id);
    res.render("marketing/sms-report", {
      title: c.name, active: "smscampaigns", c, st: STATUS[c.status], report, targetLabel: targetName(ctx, c), canSend: req.mk.can("campaigns.send"), canWrite: req.mk.can("campaigns.write"),
      recipients: sms.smsRecipients(ctx, c.id, { limit: 200 }).map((r) => ({ ...r, masked: sms.maskPhone(r.phone), why: r.reason ? reasonLabel(r.reason) : "" })),
      reasons: report.reasons.map((r) => ({ ...r, label: reasonLabel(r.reason || r.status) })), workerOn: workerOn(),
    });
  });

  router.post("/sms/campagnes/:id", need("campaigns.write"), (req, res, next) => {
    const c = load(req, res);
    if (!c) return;
    attempt(req, res, next, `/marketing/sms/campagnes/${c.id}`, () => {
      const b = req.body;
      sms.updateSmsCampaign(req.mk.ctx, c.id, {
        name: b.name, body: typeof b.body === "string" ? b.body : undefined, ...(b.target ? parseTarget(b.target) : {}), trackClicks: b.track_clicks === "on",
      });
      return "Campagne enregistrée.";
    });
  });

  router.post("/sms/campagnes/:id/test", need("campaigns.write"), (req, res, next) => {
    const c = load(req, res);
    if (!c) return;
    const back = `/marketing/sms/campagnes/${c.id}#test`;
    const key = String(req.session.user.id);
    if (testLimiter.isLimited(key)) { req.session.mkFlash = { type: "error", text: "Trop de SMS de test : 10 par heure au plus." }; return res.redirect(back); }
    testLimiter.hit(key);
    sms.sendCampaignTest(req.mk.ctx, c.id, { to: req.body.to }).then(
      (r) => {
        req.session.mkFlash = r.ok
          ? { type: "ok", text: r.provider === "console" ? `Mode essai : aucun SMS réellement envoyé vers ${r.to} (${r.segments} SMS facturé(s) en vrai).` : `SMS de test envoyé à ${r.to} (${r.segments} SMS facturé(s)).` }
          : { type: "error", text: r.message, detail: r.code ? `Code d'erreur Twilio : ${r.code}.` : undefined };
        res.redirect(back);
      },
      (error) => {
        if (!(error instanceof MarketingError)) return next(error);
        req.session.mkFlash = { type: "error", text: error.message };
        res.redirect(back);
      },
    );
  });

  router.post("/sms/campagnes/:id/lancer", need("campaigns.send"), (req, res, next) => {
    const c = load(req, res);
    if (!c) return;
    attempt(req, res, next, () => `/marketing/sms/campagnes/${c.id}`, () => {
      const check = sms.smsPreflight(req.mk.ctx, c.id, { workerOn: workerOn() });
      const expected = check.audience ? check.audience.sendable : 0;
      if (String(req.body.confirm_count ?? "").trim() !== String(expected)) throw new MarketingError("confirmation", "Tapez exactement le nombre de destinataires affiché dans le contrôle avant envoi pour confirmer.");
      if (req.body.confirm_cost !== "on") throw new MarketingError("confirmation", "Cochez la case confirmant que vous avez vérifié le coût estimé.");
      const scheduledAt = parseSchedule(req.body);
      const r = sms.startSmsCampaign(req.mk.ctx, c.id, { scheduledAt, workerOn: workerOn() });
      const text = scheduledAt ? `Campagne SMS programmée : ${r.recipients} destinataires.` : `Campagne SMS lancée : ${r.recipients} destinataires. L'envoi démarre en arrière-plan.`;
      return workerOn() ? text : { text: `${text} ${workerHuman("l'envoi démarrera dès qu'il sera rétabli")}`, detail: WORKER_DETAIL };
    });
  });

  for (const [path, fn, text] of [["pause", sms.pauseSmsCampaign, "Campagne mise en pause."], ["reprendre", sms.resumeSmsCampaign, "Campagne reprise."], ["annuler", sms.cancelSmsCampaign, "Campagne annulée : les SMS non encore partis ne le seront pas."]]) {
    router.post(`/sms/campagnes/:id/${path}`, need("campaigns.send"), (req, res, next) => {
      const c = load(req, res);
      if (!c) return;
      attempt(req, res, next, `/marketing/sms/campagnes/${c.id}`, () => { fn(req.mk.ctx, c.id); return text; });
    });
  }

  router.post("/sms/campagnes/:id/dupliquer", need("campaigns.write"), (req, res, next) => {
    const c = load(req, res);
    if (!c) return;
    let copy = null;
    attempt(req, res, next, () => (copy ? `/marketing/sms/campagnes/${copy.id}` : "/marketing/sms"), () => { copy = sms.duplicateSmsCampaign(req.mk.ctx, c.id); return "Campagne dupliquée : voici la copie (brouillon)."; });
  });

  router.post("/sms/campagnes/:id/supprimer", need("campaigns.write"), (req, res, next) => {
    const c = load(req, res);
    if (!c) return;
    let done = false;
    attempt(req, res, next, () => (done ? "/marketing/sms" : `/marketing/sms/campagnes/${c.id}`), () => { sms.deleteSmsCampaign(req.mk.ctx, c.id); done = true; return "Campagne supprimée."; });
  });

  // ---------- Abonnés SMS ----------
  router.get("/sms/abonnes", need("contacts.read"), (req, res) => {
    const { ctx } = req.mk;
    const s = sms.smsSendableSql("c");
    const counts = {
      sendable: ctx.db.prepare(`SELECT COUNT(*) n FROM mk_contacts c WHERE c.organization_id = ? AND ${s.sql}`).get(ctx.organizationId).n,
      unsubscribed: ctx.db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE organization_id = ? AND sms_status = 'unsubscribed'").get(ctx.organizationId).n,
      withPhone: ctx.db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE organization_id = ? AND sms_status = 'none' AND phone <> ''").get(ctx.organizationId).n,
      blocked: ctx.db.prepare("SELECT COUNT(*) n FROM mk_sms_suppressions WHERE organization_id = ?").get(ctx.organizationId).n,
    };
    const filter = ["subscribed", "unsubscribed"].includes(req.query.statut) ? req.query.statut : "subscribed";
    const rows = ctx.db
      .prepare(`SELECT c.id, c.email, c.first_name, c.last_name, c.sms_phone, c.sms_unsubscribed_at,
                (SELECT k.created_at FROM mk_consents k WHERE k.contact_id = c.id AND k.purpose = 'sms' AND k.action = 'granted' ORDER BY k.id DESC LIMIT 1) AS consent_at,
                (SELECT k.source FROM mk_consents k WHERE k.contact_id = c.id AND k.purpose = 'sms' AND k.action = 'granted' ORDER BY k.id DESC LIMIT 1) AS consent_source
                FROM mk_contacts c WHERE c.organization_id = ? AND c.sms_status = ? ORDER BY c.id DESC LIMIT 500`)
      .all(ctx.organizationId, filter)
      .map((r) => ({ ...r, masked: sms.maskPhone(r.sms_phone) }));
    res.render("marketing/sms-audience", { title: "Abonnés SMS", active: "smsaudience", counts, rows, filter });
  });

  return router;
};
