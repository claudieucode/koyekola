// Pages des campagnes et des réglages d'envoi. Garde-fous de lancement : contrôle avant envoi visible, confirmation par
// saisie du NOMBRE de destinataires + case cochée, droit « campaigns.send » réservé aux administrateurs.
const express = require("express");
const sending = require("../sending");
const config = require("../sending/config");
const templates = require("../templates");
const segments = require("../segments");
const audience = require("../audience");
const compliance = require("../compliance");
const { parseKey } = require("../security/crypto");
const { MarketingError } = require("../errors");
const { STATUS_GROUPS } = require("../sending/list");
const { wizardSteps } = require("../sending/wizard");
const { sendTestEmail, teamRecipients } = require("../templates/testSend");
const { testChannel } = require("../sending/config");
const { buildTransport, fromAddress } = require("../../utils/mailer");
const { describeError, outboxOverview } = require("../../utils/outbox");
const { validateEmail } = require("../audience/email");
const { createRateLimiter } = require("../../middlewares/security");
const audit = require("../audit");
const { attempt, need } = require("./kit");
const { WORKER_DETAIL, workerHuman } = require("../workerNotice");

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
const STATUS = {
  draft: ["Brouillon", "badge-muted"], scheduled: ["Programmée", "badge"], sending: ["En cours d'envoi", "badge"], paused: ["En pause", "badge-warning"],
  sent: ["Envoyée", "badge-success"], cancelled: ["Annulée", "badge-muted"], failed: ["En échec", "mk-badge-danger"],
};
const workerOn = () => process.env.MARKETING_WORKER === "on";
const smtpAvailable = () => Boolean(process.env.SMTP_HOST);

// « list:3 » / « segment:2 » → { targetType, targetId }
function parseTarget(value) {
  const m = /^(list|segment):(\d{1,12})$/.exec(String(value ?? ""));
  if (!m) throw new MarketingError("invalid_field", "La cible d'une campagne est une liste ou un segment.");
  return { targetType: m[1], targetId: Number(m[2]) };
}

// Heure de programmation : « send_at_utc » (ISO, fournie par le navigateur) ou « send_at » lu comme UTC ; vide = tout de suite
function parseSchedule(body) {
  const raw = String(body.send_at_utc || body.send_at || "").trim();
  if (!raw) return undefined;
  const ms = Date.parse(/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw}Z`);
  if (!Number.isFinite(ms)) throw new MarketingError("invalid_field", "Date d'envoi invalide.");
  return ms;
}

const TABS = [["", "Toutes"], ["draft", "Brouillons"], ["scheduled", "Programmées"], ["running", "En cours"], ["sent", "Envoyées"], ["stopped", "Interrompues"]];
// Ancre de la section qui traite chaque étape du parcours d'un brouillon
const STEP_ANCHOR = { infos: "reglages", audience: "reglages", template: "reglages", tracking: "reglages", test: "etape-5", check: "etape-6", send: "etape-7" };

module.exports = ({ db }) => {
  const router = express.Router();
  const testLimiter = createRateLimiter(10, 60 * 60 * 1000); // 10 e-mails de test par heure et par utilisateur

  // ---------- Réglages d'envoi ----------
  router.get("/envoi", need("settings.read"), (req, res) => {
    const { ctx } = req.mk;
    let keyOk = true;
    try { parseKey(process.env.ENCRYPTION_KEY); } catch { keyOk = false; }
    res.render("marketing/send-settings", {
      title: "Réglages d'envoi", active: "sending", cfg: config.getSendingConfig(ctx), keyOk, smtpOk: smtpAvailable(), workerOn: workerOn(),
      baseUrl: String(process.env.SITE_URL || "").replace(/\/+$/, ""), orgId: ctx.organizationId, canEdit: req.mk.can("settings.write"),
      outbox: outboxOverview(db, { limit: 20 }), smtpFrom: fromAddress(), contactEmail: process.env.CONTACT_EMAIL || "",
    });
  });

  router.post("/envoi", need("settings.write"), (req, res, next) =>
    attempt(req, res, next, "/marketing/envoi", () => {
      const b = req.body;
      try {
        config.saveSendingConfig(req.mk.ctx, {
          provider: b.provider, from: typeof b.from === "string" ? b.from.trim() : undefined, replyTo: typeof b.reply_to === "string" ? b.reply_to.trim() : undefined,
          ratePerMinute: b.rate, dailyLimit: b.daily, apiKey: b.api_key, webhookSecret: b.webhook_secret,
          clearApiKey: b.clear_api_key === "on", clearWebhookSecret: b.clear_webhook_secret === "on",
        });
      } catch (error) {
        if (!(error instanceof MarketingError) && /ENCRYPTION_KEY/.test(error.message)) throw new MarketingError("invalid_field", error.message);
        throw error;
      }
      return "Réglages d'envoi enregistrés.";
    }));

  // E-mail de test depuis les réglages : texte FIXE (aucun usage comme relais), 10 par heure, administrateurs seulement.
  // canal « site » = SMTP du serveur (e-mails du site) ; « campagnes » = fournisseur choisi ci-dessus (Resend…).
  router.post("/envoi/test", need("settings.write"), (req, res, next) => {
    const back = "/marketing/envoi#test";
    const key = `envoi:${req.session.user.id}`;
    if (testLimiter.isLimited(key)) { req.session.mkFlash = { type: "error", text: "Trop d'e-mails de test : 10 par heure au plus." }; return res.redirect(back); }
    testLimiter.hit(key);
    const to = String(req.body.to || "").trim();
    if (!validateEmail(to).ok) { req.session.mkFlash = { type: "error", text: "Adresse e-mail invalide." }; return res.redirect(back); }
    const channel = req.body.channel === "campagnes" ? "campagnes" : "site";
    const { ctx } = req.mk;
    const cfg = config.getSendingConfig(ctx);
    const message = {
      to, subject: "[TEST] KOLAKISA : votre configuration e-mail fonctionne",
      text: `Bonjour,\n\nCet e-mail de test a été envoyé depuis KOLAKISA (Marketing → Réglages d'envoi), canal « ${channel === "site" ? "e-mails du site (SMTP)" : "campagnes (" + cfg.provider + ")"} ».\nS'il est arrivé dans votre boîte de réception (et non dans les indésirables), tout est en ordre.`,
      headers: { "X-KOYEKOLA-Test": "1" },
    };
    const done = (flash) => { req.session.mkFlash = flash; res.redirect(back); };
    (async () => {
      if (channel === "campagnes" && cfg.provider === "console") return done({ type: "error", text: "Fournisseur « console » : rien n'est envoyé. Choisissez Resend ou SMTP ci-dessus pour tester les campagnes." });
      const chan = channel === "campagnes" ? config.testChannel(ctx) : (() => { const t = buildTransport(); return t ? { name: "smtp", transport: t, from: fromAddress() } : null; })();
      if (!chan) return done({ type: "error", text: channel === "site" ? "SMTP non configuré : renseignez SMTP_HOST, SMTP_USER, SMTP_PASS et SMTP_FROM dans la configuration du serveur." : "Fournisseur incomplet : enregistrez la clé d'API." });
      if (!chan.from) return done({ type: "error", text: "Aucune adresse d'expéditeur : renseignez SMTP_FROM (ou l'expéditeur ci-dessus)." });
      try {
        if (chan.provider) await chan.provider.send({ ...message, from: chan.from });
        else await chan.transport.sendMail({ ...message, from: chan.from });
        audit.recordAudit(db, { organizationId: ctx.organizationId, userId: ctx.userId, action: "sending.test_sent", resourceType: "organization", resourceId: ctx.organizationId, metadata: { channel } });
        done({ type: "ok", text: `E-mail de test envoyé à ${to} par ${chan.name === "resend" ? "Resend" : "SMTP"}. Vérifiez aussi le dossier des indésirables.` });
      } catch (error) {
        done({ type: "error", text: `L'envoi a échoué : ${error.kind ? error.message : describeError(error)}.`, detail: "Vérifiez les identifiants, l'expéditeur (domaine authentifié chez le fournisseur) et le port (465 = SMTP_SECURE=true, 587 = false)." });
      }
    })().catch(next);
  });

  // ---------- Campagnes ----------
  router.get("/campagnes", need("campaigns.read"), (req, res) => {
    const { ctx } = req.mk;
    const cfg = config.getSendingConfig(ctx);
    const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const statut = typeof req.query.statut === "string" && Object.hasOwn(STATUS_GROUPS, req.query.statut) ? req.query.statut : "";
    const q = text(req.query.q, 100);
    const result = sending.searchCampaigns(ctx, { status: statut || undefined, q }, { sort: req.query.tri, dir: req.query.sens, page: req.query.page, pageSize: req.query.taille });
    const view = { ...(statut && { statut }), ...(q && { q }), ...(req.query.tri && { tri: result.sort, sens: result.dir }), ...(result.pageSize !== 25 && { taille: result.pageSize }) };
    const url = (changes = {}) => {
      const merged = { ...view, ...changes };
      const qs = new URLSearchParams(Object.entries(merged).filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => [k, String(v)])).toString();
      return `/marketing/campagnes${qs ? `?${qs}` : ""}`;
    };
    const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
    res.render("marketing/campaigns", {
      title: "Campagnes", active: "campaigns", result, rows: result.rows, tabs: TABS, counts: sending.campaignStatusCounts(ctx), statut, q, view, url, hasFilters: Boolean(statut || q),
      range: { from, to: from + result.rows.length - (result.total === 0 ? 0 : 1) }, provider: cfg.provider, workerOn: workerOn(),
    });
  });

  // Tests A/B : les campagnes qui comparent des versions, avec leur phase et leur gagnant
  router.get("/tests-ab", need("campaigns.read"), (req, res) => {
    const { ctx } = req.mk;
    const result = sending.searchCampaigns(ctx, { abOnly: true }, { sort: "created", dir: "desc", pageSize: 50, page: req.query.page });
    res.render("marketing/ab-tests", { title: "Tests A/B", active: "ab", rows: result.rows, result, letters: sending.LETTERS, workerOn: workerOn() });
  });

  const formData = (ctx) => ({
    templates: templates.listTemplates(ctx).filter((t) => t.kind === "marketing"), lists: audience.listLists(ctx), segments: segments.listSegments(ctx), categories: compliance.listCategories(ctx),
  });

  router.get("/campagnes/nouvelle", need("campaigns.write"), (req, res) => {
    const values = req.session.mkCampaignDraft ?? null; // saisie conservée après une erreur (affichée une seule fois)
    delete req.session.mkCampaignDraft;
    const abStart = req.query.ab === "1";
    res.render("marketing/campaign-new", { title: abStart ? "Nouveau test A/B" : "Nouvelle campagne", active: abStart ? "ab" : "campaigns", values, abStart, ...formData(req.mk.ctx) });
  });

  // Effectif de l'étape « Destinataires » (avant même la création du brouillon)
  router.post("/campagnes/apercu-cible", need("campaigns.write"), (req, res, next) => {
    try {
      const { ctx } = req.mk;
      const target = parseTarget(req.body.target);
      const category = typeof req.body.category === "string" ? req.body.category : "";
      if (category && !compliance.listCategories(ctx).some((k) => k.key === category)) throw new MarketingError("not_found", "Catégorie de préférences introuvable.");
      const found = target.targetType === "list" ? audience.getList(ctx, target.targetId) : segments.getSegment(ctx, target.targetId);
      if (!found) throw new MarketingError("not_found", target.targetType === "list" ? "Liste introuvable." : "Segment introuvable.");
      res.json(sending.audienceSummary(ctx, { targetType: target.targetType, targetId: target.targetId, category }));
    } catch (error) {
      if (error instanceof MarketingError) return res.status(400).json({ error: error.message });
      next(error);
    }
  });

  router.post("/campagnes", need("campaigns.write"), (req, res, next) => {
    let created = null;
    const abStart = req.body.ab === "1";
    attempt(req, res, next, () => (created ? `/marketing/campagnes/${created.id}${abStart ? "?ab=1#test-ab" : ""}` : `/marketing/campagnes/nouvelle${abStart ? "?ab=1" : ""}`), () => {
      const b = req.body;
      try {
        created = sending.createCampaign(req.mk.ctx, { name: b.name, templateId: intOrNull(b.template_id), ...parseTarget(b.target), category: b.category || "", trackClicks: b.track_clicks === "on", trackOpens: b.track_opens === "on" });
      } catch (error) {
        req.session.mkCampaignDraft = { name: String(b.name ?? "").slice(0, 100), template_id: String(b.template_id ?? ""), target: String(b.target ?? ""), category: String(b.category ?? ""), track_clicks: b.track_clicks === "on", track_opens: b.track_opens === "on" };
        throw error;
      }
      return abStart ? "Brouillon créé : réglez maintenant les versions de votre test A/B." : "Brouillon créé : complétez la liste de contrôle, puis envoyez.";
    });
  });

  const load = (req, res) => {
    const id = intOrNull(req.params.id);
    const campaign = id ? sending.getCampaign(req.mk.ctx, id) : null;
    if (!campaign) res.status(404).render("error", { message: "Campagne introuvable." });
    return campaign;
  };

  router.get("/campagnes/:id", need("campaigns.read"), (req, res) => {
    const campaign = load(req, res);
    if (!campaign) return;
    const { ctx } = req.mk;
    const draft = campaign.status === "draft";
    const template = templates.getTemplate(ctx, campaign.template_id);
    const target = campaign.target_type === "list" ? audience.getList(ctx, campaign.target_id) : segments.getSegment(ctx, campaign.target_id);
    const reasons = draft ? [] : db.prepare("SELECT status, reason, COUNT(*) n FROM mk_campaign_recipients WHERE campaign_id = ? AND status IN ('failed', 'skipped') GROUP BY status, reason ORDER BY n DESC").all(campaign.id);
    const check = draft ? sending.preflight(ctx, campaign.id, { workerOn: workerOn(), smtpAvailable: smtpAvailable() }) : null;
    const tested = draft && Boolean(db.prepare("SELECT 1 FROM mk_audit_logs WHERE organization_id = ? AND action = 'campaign.test_sent' AND resource_type = 'campaign' AND resource_id = ? LIMIT 1").get(ctx.organizationId, campaign.id));
    const wizard = draft ? wizardSteps(campaign, { check, tested }) : null;
    res.render("marketing/campaign", {
      title: campaign.name, active: "campaigns", campaign, template, targetName: target ? target.name : "(supprimée)", STATUS, reasons,
      check, wizard, stepAnchor: STEP_ANCHOR, recipients: draft && req.mk.can("campaigns.write") ? teamRecipients(ctx) : [], values: null,
      stats: draft ? null : sending.campaignStats(ctx, campaign.id), ...(draft ? formData(ctx) : {}),
      autoRefresh: ["scheduled", "sending"].includes(campaign.status), workerOn: workerOn(),
      sender: draft ? config.getSendingConfig(ctx) : null, tested,
      ab: { variants: sending.variantsOf(campaign), letters: sending.LETTERS, metrics: sending.METRICS, open: req.query.ab === "1" },
    });
  });

  router.post("/campagnes/:id", need("campaigns.write"), (req, res, next) => {
    const campaign = load(req, res);
    if (!campaign) return;
    attempt(req, res, next, `/marketing/campagnes/${campaign.id}`, () => {
      const b = req.body;
      sending.updateCampaign(req.mk.ctx, campaign.id, { name: b.name, templateId: intOrNull(b.template_id), ...parseTarget(b.target), category: b.category || "", trackClicks: b.track_clicks === "on", trackOpens: b.track_opens === "on" });
      return "Campagne mise à jour.";
    });
  });

  // Test A/B (brouillon) : versions A, B, C (objet + modèle), part testée, critère du gagnant, délai
  router.post("/campagnes/:id/test-ab", need("campaigns.write"), (req, res, next) => {
    const campaign = load(req, res);
    if (!campaign) return;
    attempt(req, res, next, `/marketing/campagnes/${campaign.id}#test-ab`, () => {
      const b = req.body;
      if (b.action === "retirer") {
        sending.saveAbTest(req.mk.ctx, campaign.id, { enabled: false });
        return "Test A/B retiré : la campagne partira comme un e-mail classique.";
      }
      const variants = ["a", "b", "c"].map((k) => ({ subject: typeof b[`subject_${k}`] === "string" ? b[`subject_${k}`] : "", templateId: intOrNull(b[`template_${k}`]) }));
      sending.saveAbTest(req.mk.ctx, campaign.id, { enabled: true, variants, percent: intOrNull(b.percent), metric: String(b.metric || ""), waitMinutes: intOrNull(b.wait) });
      return "Test A/B enregistré.";
    });
  });

  router.post("/campagnes/:id/gagnant", need("campaigns.send"), (req, res, next) => {
    const campaign = load(req, res);
    if (!campaign) return;
    attempt(req, res, next, `/marketing/campagnes/${campaign.id}#test-ab`, () => {
      const index = intOrNull(req.body.variant);
      const r = sending.chooseAbWinner(req.mk.ctx, campaign.id, index ?? -1);
      if (r.already) return "Le gagnant avait déjà été choisi.";
      return `Version ${sending.LETTERS[r.winner]} choisie : elle part maintenant au reste de la cible (${r.released} contact${r.released > 1 ? "s" : ""}).`;
    });
  });

  router.post("/campagnes/:id/lancer", need("campaigns.send"), (req, res, next) => {
    const campaign = load(req, res);
    if (!campaign) return;
    attempt(req, res, next, `/marketing/campagnes/${campaign.id}`, () => {
      const { ctx } = req.mk;
      if (campaign.status !== "draft") throw new MarketingError("invalid_state", "Cette campagne a déjà été lancée.");
      const check = sending.preflight(ctx, campaign.id, { workerOn: workerOn(), smtpAvailable: smtpAvailable() });
      const expected = check.audience ? check.audience.sendable : -1;
      if (String(req.body.confirm_count ?? "").trim() !== String(expected)) throw new MarketingError("confirmation", "Tapez exactement le nombre de destinataires affiché dans le contrôle avant envoi pour confirmer.");
      if (req.body.confirm_ok !== "on") throw new MarketingError("confirmation", "Cochez la case pour confirmer que ces personnes ont donné leur consentement à recevoir ce message.");
      const scheduledAt = parseSchedule(req.body);
      const r = sending.startCampaign(ctx, campaign.id, { scheduledAt });
      const abText = r.abTest ? ` Test A/B : ${r.abTest} contacts reçoivent les versions, les ${r.abHeld} autres recevront la gagnante.` : "";
      const text = (scheduledAt
        ? `Campagne programmée pour le ${new Date(scheduledAt).toISOString().slice(0, 16).replace("T", " ")} (UTC), ${r.recipients} destinataires.`
        : `Campagne lancée : ${r.recipients} destinataires. L'envoi démarre en arrière-plan.`) + abText;
      return workerOn() ? text : { text: `${text} ${workerHuman("l'envoi démarrera dès qu'il sera rétabli")}`, detail: WORKER_DETAIL };
    });
  });

  // Étape 5 : e-mail de test du modèle de la campagne, vers un membre de l'équipe uniquement
  router.post("/campagnes/:id/test", need("campaigns.write"), (req, res, next) => {
    const campaign = load(req, res);
    if (!campaign) return;
    const back = `/marketing/campagnes/${campaign.id}#etape-5`;
    const key = String(req.session.user.id);
    if (testLimiter.isLimited(key)) {
      req.session.mkFlash = { type: "error", text: "Trop d'envois de test : 10 par heure au plus. Réessayez plus tard." };
      return res.redirect(back);
    }
    testLimiter.hit(key); // compté à chaque tentative (y compris refusée) : on ne peut pas sonder les adresses
    const { ctx } = req.mk;
    sendTestEmail(ctx, campaign.template_id, { to: req.body.to, ...(testChannel(ctx) || {}) }).then(
      (r) => {
        if (r.sent) {
          audit.recordAudit(db, { organizationId: ctx.organizationId, userId: ctx.userId, action: "campaign.test_sent", resourceType: "campaign", resourceId: campaign.id, metadata: {} });
          req.session.mkFlash = { type: "ok", text: `E-mail de test envoyé à ${r.to} (pensez à vérifier le dossier des indésirables).` };
        } else {
          req.session.mkFlash = { type: "error", text: r.reason === "smtp_not_configured" ? "Aucun service d'envoi configuré : aucun e-mail n'a été envoyé. Choisissez Resend dans Réglages d'envoi, ou renseignez SMTP_HOST (et les variables SMTP_*) dans la configuration du serveur." : "L'envoi du test a échoué : vérifiez la configuration SMTP." };
        }
        res.redirect(back);
      },
      (error) => {
        if (!(error instanceof MarketingError)) return next(error);
        req.session.mkFlash = { type: "error", text: error.message };
        res.redirect(back);
      },
    );
  });

  router.post("/campagnes/:id/dupliquer", need("campaigns.write"), (req, res, next) => {
    const campaign = load(req, res);
    if (!campaign) return;
    let copy = null;
    attempt(req, res, next, () => (copy ? `/marketing/campagnes/${copy.id}` : `/marketing/campagnes/${campaign.id}`), () => {
      copy = sending.duplicateCampaign(req.mk.ctx, campaign.id);
      return `Campagne dupliquée : « ${copy.name} ». C'est un brouillon : rien n'a été envoyé.`;
    });
  });

  const control = (path, fn, message) =>
    router.post(`/campagnes/:id/${path}`, need("campaigns.send"), (req, res, next) => {
      const campaign = load(req, res);
      if (!campaign) return;
      attempt(req, res, next, `/marketing/campagnes/${campaign.id}`, () => { fn(req.mk.ctx, campaign.id); return message; });
    });
  control("pause", sending.pauseCampaign, "Campagne mise en pause : aucun nouveau message ne part.");
  control("reprendre", sending.resumeCampaign, "Campagne reprise.");
  control("annuler", sending.cancelCampaign, "Campagne annulée : les messages non envoyés ne partiront pas.");

  router.post("/campagnes/:id/supprimer", need("campaigns.write"), (req, res, next) => {
    const campaign = load(req, res);
    if (!campaign) return;
    attempt(req, res, next, () => (campaign.status === "draft" || ["cancelled", "failed"].includes(campaign.status) ? "/marketing/campagnes" : `/marketing/campagnes/${campaign.id}`), () => {
      sending.deleteCampaign(req.mk.ctx, campaign.id);
      return "Campagne supprimée.";
    });
  });

  return router;
};
