// Aperçu de l'Accueil : chiffres, croissance, campagnes récentes, alertes, préparation à l'envoi, activité.
// Lecture seule. Tout est calculé sur l'organisation du contexte ; aucun chiffre n'est inventé (pas d'envoi = pas de taux).
const { checkCtx } = require("../audience/shared");
const { sendableSql } = require("../compliance/sendable");
const { getSendingConfig } = require("../sending/config");
const { getOrgProfile } = require("../templates/context");
const { listTemplates } = require("../templates");
const { TRIGGERS } = require("../automations/catalog");
const { WORKER_DETAIL, workerHuman } = require("../workerNotice");

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const PERIOD_DAYS = 30;
// Périodes proposées par le sélecteur de l'Accueil (liste fermée : toute autre valeur retombe sur 30 jours)
const PERIODS = [7, 30, 90];
const periodOf = (v) => (PERIODS.includes(Number(v)) ? Number(v) : PERIOD_DAYS);
const WEEKS = 8;
const RECENT_CAMPAIGNS = 5;
const ACTIVITY_LIMIT = 10;
// Mêmes seuils que les statistiques d'une campagne (sending/stats.js)
const BOUNCE_ALERT = 2;
const COMPLAINT_ALERT = 0.1;
const MIN_FOR_ALERTS = 20;

const sqlDate = (ms) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");
const fromSql = (text) => { const t = Date.parse(`${String(text).replace(" ", "T")}Z`); return Number.isFinite(t) ? t : 0; };
const pct = (n, d) => (d > 0 ? Math.round((n / d) * 10000) / 100 : null);
const nowOf = (ctx) => (typeof ctx.now === "function" ? ctx.now() : Date.now());

function shortDate(ms) {
  const d = new Date(ms);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function contactFigures(ctx, now, days = PERIOD_DAYS) {
  const org = ctx.organizationId;
  const since = sqlDate(now - days * DAY);
  const byStatus = Object.fromEntries(ctx.db.prepare("SELECT status, COUNT(*) n FROM mk_contacts WHERE organization_id = ? GROUP BY status").all(org).map((r) => [r.status, r.n]));
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const { sql, params } = sendableSql("c");
  const sendable = ctx.db.prepare(`SELECT COUNT(*) n FROM mk_contacts c WHERE c.organization_id = ? AND ${sql}`).get(org, ...params).n;
  const newInPeriod = ctx.db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE organization_id = ? AND created_at >= ?").get(org, since).n;
  const unsubscribedInPeriod = ctx.db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE organization_id = ? AND status = 'unsubscribed' AND unsubscribed_at >= ?").get(org, since).n;
  const blocked = (byStatus.bounced || 0) + (byStatus.complained || 0) + (byStatus.suppressed || 0);
  return { total, byStatus, sendable, newInPeriod, unsubscribedInPeriod, blocked };
}

// Nouveaux contacts par semaine, la semaine en cours en dernier (regroupement fait par la base)
function growth(ctx, now) {
  const startSec = Math.floor((now - WEEKS * WEEK) / 1000);
  const counts = new Array(WEEKS).fill(0);
  const rows = ctx.db
    .prepare("SELECT CAST((strftime('%s', created_at) - ?) / 604800 AS INTEGER) AS b, COUNT(*) AS n FROM mk_contacts WHERE organization_id = ? AND strftime('%s', created_at) >= ? GROUP BY b")
    .all(startSec, ctx.organizationId, startSec);
  for (const r of rows) if (r.b >= 0 && r.b < WEEKS) counts[r.b] += r.n;
  return counts.map((count, i) => ({ label: shortDate(now - (WEEKS - i) * WEEK + 1), count }));
}

function campaignFigures(ctx, now, days = PERIOD_DAYS) {
  const org = ctx.organizationId;
  const since = now - days * DAY;
  const a = ctx.db
    .prepare(
      `SELECT COUNT(*) AS n, COALESCE(SUM(sent_count), 0) AS sent, COALESCE(SUM(unique_click_count), 0) AS clicks, COALESCE(SUM(bounced_count), 0) AS bounced,
              COALESCE(SUM(complained_count), 0) AS complained, COALESCE(SUM(unsubscribed_count), 0) AS unsub
       FROM mk_campaigns WHERE organization_id = ? AND kind = 'campaign' AND started_at IS NOT NULL AND started_at >= ?`
    )
    .get(org, since);
  const recent = ctx.db
    .prepare("SELECT id, name, status, started_at, sent_count, unique_click_count FROM mk_campaigns WHERE organization_id = ? AND kind = 'campaign' ORDER BY id DESC LIMIT ?")
    .all(org, RECENT_CAMPAIGNS)
    .map((c) => ({ id: c.id, name: c.name, status: c.status, when: c.started_at, sent: c.sent_count, clickRate: pct(c.unique_click_count, c.sent_count) }));
  return {
    sentInPeriod: a.n, messagesInPeriod: a.sent, clickRate: pct(a.clicks, a.sent), bounceRate: pct(a.bounced, a.sent), complaintRate: pct(a.complained, a.sent), unsubscribed: a.unsub, recent,
  };
}

function automationFigures(ctx) {
  const org = ctx.organizationId;
  const by = Object.fromEntries(ctx.db.prepare("SELECT status, COUNT(*) n FROM mk_automations WHERE organization_id = ? GROUP BY status").all(org).map((r) => [r.status, r.n]));
  const runs = Object.fromEntries(ctx.db.prepare("SELECT status, COUNT(*) n FROM mk_automation_runs WHERE organization_id = ? GROUP BY status").all(org).map((r) => [r.status, r.n]));
  return { active: by.active || 0, paused: by.paused || 0, draft: by.draft || 0, running: runs.running || 0, failedRuns: runs.failed || 0 };
}

function readinessOf(ctx, { workerOn, smtpAvailable, keyOk }, sendable) {
  const cfg = getSendingConfig(ctx);
  const provider = (() => {
    if (cfg.provider === "console") return { ok: false, detail: "Mode test : les messages sont écrits dans le journal du serveur, aucun message n'est réellement envoyé. Choisissez SMTP ou Resend pour envoyer." };
    if (cfg.provider === "smtp" && !smtpAvailable) return { ok: false, detail: "Fournisseur SMTP choisi, mais le serveur SMTP n'est pas configuré sur le serveur (variables SMTP_*)." };
    if (cfg.provider === "resend" && !cfg.apiKeySet) return { ok: false, detail: "Fournisseur Resend choisi, mais aucune clé d'API n'est enregistrée." };
    return { ok: true, detail: cfg.provider === "smtp" ? "Envoi par votre serveur SMTP." : "Envoi par Resend." };
  })();
  const address = getOrgProfile(ctx).address.trim();
  const items = [
    { key: "key", label: "Clé de chiffrement", ok: Boolean(keyOk), detail: keyOk ? "Définie." : "Absente : définissez ENCRYPTION_KEY dans la configuration du serveur (liens de désinscription et secrets).", href: null },
    { key: "provider", label: "Fournisseur d'envoi", ...provider, href: "/marketing/envoi", permission: "settings.read" },
    { key: "sender", label: "Adresse d'expédition", ok: Boolean(cfg.from), detail: cfg.from ? cfg.from : "Aucune adresse d'expédition n'est définie.", href: "/marketing/envoi", permission: "settings.read" },
    { key: "address", label: "Adresse postale de l'organisation", ok: address !== "", detail: address !== "" ? "Renseignée : elle figure au pied des e-mails." : "Absente : elle est exigée dans les e-mails marketing.", href: "/marketing/modeles#adresse", permission: "templates.read" },
    { key: "worker", label: "Traitement en arrière-plan", ok: Boolean(workerOn), detail: workerOn ? "Actif." : workerHuman("ni les campagnes ni les scénarios ne partent"), tech: workerOn ? null : WORKER_DETAIL, href: null },
    { key: "https", label: "Adresse publique du site en HTTPS", ok: String(ctx.baseUrl || "").startsWith("https://"), detail: String(ctx.baseUrl || "").startsWith("https://") ? "Les liens de désinscription et de suivi sont sécurisés." : "SITE_URL doit être une adresse https:// pour que les liens des e-mails fonctionnent.", href: null },
    { key: "template", label: "Au moins un modèle d'e-mail", ok: listTemplates(ctx).length > 0, detail: "", href: "/marketing/modeles", permission: "templates.read" },
    { key: "audience", label: "Au moins un contact joignable", ok: sendable > 0, detail: "", href: "/marketing/contacts", permission: "contacts.read" },
  ];
  for (const i of items) if (!i.detail) i.detail = i.ok ? "Prêt." : i.key === "template" ? "Aucun modèle : créez-en un dans Modèles." : "Aucun contact avec consentement prouvé : importez ou ajoutez des contacts en déclarant leur consentement.";
  const done = items.filter((i) => i.ok).length;
  return {
    items, done, total: items.length, ready: done === items.length,
    note: "Cette liste vérifie la configuration de l'application ; elle ne garantit pas la délivrabilité. Configurez aussi SPF, DKIM et DMARC pour votre domaine d'envoi auprès de votre hébergeur DNS, et testez dans de vrais clients de messagerie.",
  };
}

function alertsOf(ctx, { workerOn, keyOk, can }, { campaigns, automations, now }) {
  const org = ctx.organizationId;
  const alerts = [];
  if (!keyOk) alerts.push({ level: "error", text: "ENCRYPTION_KEY est absente : les liens de désinscription et l'enregistrement de secrets sont impossibles.", href: null });
  if (can("queue.manage")) {
    const dead = ctx.db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE organization_id = ? AND state = 'dead'").get(org).n;
    if (dead > 0) alerts.push({ level: "error", text: `${dead} travail${dead > 1 ? "x ont" : " a"} échoué définitivement (file d'arrière-plan). Consultez le journal du serveur.`, href: "/marketing/evenements" });
  }
  if (can("campaigns.read")) {
    const failed = ctx.db.prepare("SELECT id, name FROM mk_campaigns WHERE organization_id = ? AND kind = 'campaign' AND status = 'failed' AND COALESCE(finished_at, started_at, 0) >= ? ORDER BY id DESC LIMIT 3").all(org, now - PERIOD_DAYS * DAY);
    for (const c of failed) alerts.push({ level: "error", text: `La campagne « ${c.name} » a échoué.`, href: `/marketing/campagnes/${c.id}` });
  }
  if (campaigns.messagesInPeriod >= MIN_FOR_ALERTS) {
    if (campaigns.bounceRate > BOUNCE_ALERT) alerts.push({ level: "warn", text: `Taux de rebond de ${campaigns.bounceRate} % sur 30 jours (seuil ${BOUNCE_ALERT} %) : nettoyez vos listes, cela nuit à la réputation d'expédition.`, href: can("campaigns.read") ? "/marketing/campagnes" : null });
    if (campaigns.complaintRate > COMPLAINT_ALERT) alerts.push({ level: "warn", text: `Taux de plainte de ${campaigns.complaintRate} % sur 30 jours (seuil ${COMPLAINT_ALERT} %) : vérifiez que ces personnes attendaient vos messages.`, href: can("campaigns.read") ? "/marketing/campagnes" : null });
  }
  if (can("automations.read")) {
    const failing = ctx.db
      .prepare("SELECT a.id, a.name, COUNT(*) n FROM mk_automation_runs r JOIN mk_automations a ON a.id = r.automation_id WHERE r.organization_id = ? AND r.status = 'failed' GROUP BY a.id ORDER BY a.id LIMIT 3")
      .all(org);
    for (const f of failing) alerts.push({ level: "warn", text: `Scénario « ${f.name} » : ${f.n} passage${f.n > 1 ? "s" : ""} en échec.`, href: `/marketing/automatisations/${f.id}` });
  }
  if (!workerOn) {
    const waiting = ctx.db.prepare("SELECT COUNT(*) n FROM mk_campaigns WHERE organization_id = ? AND kind = 'campaign' AND status IN ('scheduled', 'sending')").get(org).n;
    // Message humain d'abord (§17 du cahier des charges refonte) : le détail technique reste disponible, replié,
    // pour l'administrateur qui doit vraiment agir dessus — jamais imposé en premier à un lecteur non technique.
    if (automations.active > 0 || waiting > 0) alerts.push({
      level: "warn", href: null,
      text: workerHuman("des envois ou des scénarios actifs attendent, rien ne partira tant qu'il n'est pas rétabli"),
      detail: WORKER_DETAIL,
    });
  }
  return alerts.sort((a, b) => (a.level === "error" ? 0 : 1) - (b.level === "error" ? 0 : 1));
}

function activityOf(ctx) {
  const org = ctx.organizationId;
  const items = [];
  for (const c of ctx.db.prepare("SELECT id, name, status, finished_at, sent_count FROM mk_campaigns WHERE organization_id = ? AND kind = 'campaign' AND status IN ('sent', 'failed') AND finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT ?").all(org, ACTIVITY_LIMIT)) {
    items.push({ at: c.finished_at, icon: "send", text: c.status === "sent" ? `Campagne « ${c.name} » terminée : ${c.sent_count} message${c.sent_count > 1 ? "s" : ""} envoyé${c.sent_count > 1 ? "s" : ""}.` : `Campagne « ${c.name} » en échec.`, href: `/marketing/campagnes/${c.id}`, permission: "campaigns.read" });
  }
  for (const i of ctx.db.prepare("SELECT id, filename, created_count, updated_count, created_at FROM mk_imports WHERE organization_id = ? AND status = 'done' ORDER BY id DESC LIMIT ?").all(org, ACTIVITY_LIMIT)) {
    items.push({ at: fromSql(i.created_at), icon: "upload", text: `Import « ${i.filename} » terminé : ${i.created_count} créé${i.created_count > 1 ? "s" : ""}, ${i.updated_count} mis à jour.`, href: `/marketing/importer/${i.id}`, permission: "contacts.import" });
  }
  for (const e of ctx.db.prepare("SELECT name, email, occurred_at FROM mk_events WHERE organization_id = ? ORDER BY occurred_at DESC, id DESC LIMIT ?").all(org, ACTIVITY_LIMIT)) {
    const label = TRIGGERS[e.name] ? TRIGGERS[e.name].label : e.name;
    items.push({ at: e.occurred_at, icon: "zap", text: `${label}${e.email ? ` — ${e.email}` : ""}`, href: null, permission: "contacts.read" });
  }
  return items.sort((a, b) => b.at - a.at).slice(0, ACTIVITY_LIMIT);
}

function getOverview(ctx, { workerOn = false, smtpAvailable = false, keyOk = true, can = () => true, days = PERIOD_DAYS } = {}) {
  checkCtx(ctx);
  const now = nowOf(ctx);
  const period = periodOf(days);
  const contacts = contactFigures(ctx, now, period);
  const campaigns = campaignFigures(ctx, now, period);
  const automations = automationFigures(ctx);
  return {
    period: { days: period, sinceMs: now - period * DAY, choices: PERIODS },
    contacts, growth: growth(ctx, now), campaigns, automations,
    readiness: readinessOf(ctx, { workerOn, smtpAvailable, keyOk }, contacts.sendable),
    alerts: alertsOf(ctx, { workerOn, keyOk, can }, { campaigns, automations, now }),
    activity: activityOf(ctx).filter((a) => can(a.permission)),
  };
}

module.exports = { getOverview, PERIOD_DAYS, PERIODS, periodOf, WEEKS };
