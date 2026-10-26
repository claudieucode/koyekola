// Tests A/B des campagnes e-mail, comme Mailchimp : 2 ou 3 versions (A, B, C) qui diffèrent par l'objet et/ou le contenu.
//  - au lancement, une partie de la cible (10 à 50 %) est tirée au hasard et répartie à parts égales entre les versions ;
//    le reste est mis « en attente du gagnant » (held = 1) et ne part pas ;
//  - quand le test est envoyé, le choix du gagnant est programmé après le délai choisi (tâche « campaign.ab_decide ») ;
//  - gagnant = meilleur taux de clics (ou d'ouvertures) ; en mode manuel, c'est l'équipe qui choisit ;
//  - le reste de la cible reçoit alors la version gagnante, par le même circuit d'envoi (conformité revérifiée à chaque message).
const crypto = require("crypto");
const { transaction } = require("../db/tx");
const { MarketingError } = require("../errors");
const { audit } = require("../audience/shared");
const { enqueue } = require("../queue/jobs");
const templates = require("../templates");
const { requireCampaign } = require("./campaigns");
const stats = require("../pages/abstats");
const { variantRevenue } = require("../revenue");

const LETTERS = ["A", "B", "C"];
const METRICS = { clicks: "Taux de clics", opens: "Taux d'ouvertures", revenue: "Revenus générés", manual: "Choix manuel" };
const MIN_PERCENT = 10;
const MAX_PERCENT = 50;
const MIN_WAIT = 60; // minutes
const MAX_WAIT = 7 * 24 * 60;
const MIN_PER_VARIANT = 2; // destinataires par version, au minimum

const bad = (message) => new MarketingError("invalid_field", message);

// Variantes enregistrées sur la campagne ([] = pas de test)
function variantsOf(campaign) {
  if (!campaign || !campaign.ab_variants) return [];
  try {
    const list = JSON.parse(campaign.ab_variants);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

const isAbTest = (campaign) => variantsOf(campaign).length >= 2;

// Modèle d'une version : le sien, ou à défaut celui de la campagne
const templateIdOf = (campaign, variant) => (Number.isInteger(variant && variant.templateId) ? variant.templateId : campaign.template_id);

function intIn(value, label, min, max) {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (!Number.isInteger(n) || n < min || n > max) throw bad(`${label} : un nombre entier entre ${min} et ${max} est attendu.`);
  return n;
}

// Enregistre (ou retire, avec enabled = false) le test A/B d'un brouillon.
// input : { enabled, variants: [{ subject, templateId }], percent, metric, waitMinutes }
function saveAbTest(ctx, id, input = {}) {
  const campaign = requireCampaign(ctx, id);
  if (campaign.status !== "draft") throw new MarketingError("invalid_state", "Seul un brouillon peut être modifié.");
  if (!input.enabled) {
    ctx.db.prepare("UPDATE mk_campaigns SET ab_variants = '', updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
    audit(ctx, "campaign.ab_disabled", "campaign", id, {});
    return requireCampaign(ctx, id);
  }

  const raw = Array.isArray(input.variants) ? input.variants : [];
  const variants = [];
  for (const [i, v] of raw.entries()) {
    const subject = String((v && v.subject) ?? "").replace(/\s+/g, " ").trim();
    const templateId = v && Number.isInteger(v.templateId) ? v.templateId : null;
    if (!subject && templateId === null && i >= 2) continue; // version C laissée vide : pas de version C
    if (!subject) throw bad(`Version ${LETTERS[i] || i + 1} : l'objet est obligatoire.`);
    if (subject.length > 200) throw bad(`Version ${LETTERS[i]} : l'objet ne doit pas dépasser 200 caractères.`);
    if (templateId !== null && !templates.getTemplate(ctx, templateId)) throw bad(`Version ${LETTERS[i]} : modèle introuvable.`);
    variants.push({ subject, templateId });
  }
  if (variants.length < 2 || variants.length > 3) throw bad("Un test A/B compare 2 ou 3 versions.");
  const keys = variants.map((v) => `${v.subject.toLowerCase()}|${templateIdOf(campaign, v)}`);
  if (new Set(keys).size !== keys.length) throw bad("Deux versions sont identiques (même objet et même contenu) : changez l'objet ou le modèle de l'une d'elles.");

  const percent = intIn(input.percent, "Part de la cible testée (%)", MIN_PERCENT, MAX_PERCENT);
  const metric = Object.hasOwn(METRICS, input.metric) ? input.metric : null;
  if (!metric) throw bad("Critère du gagnant inconnu.");
  const waitMinutes = intIn(input.waitMinutes, "Délai avant le choix du gagnant (minutes)", MIN_WAIT, MAX_WAIT);

  ctx.db
    .prepare("UPDATE mk_campaigns SET ab_variants = ?, ab_test_percent = ?, ab_metric = ?, ab_wait_minutes = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?")
    .run(JSON.stringify(variants), percent, metric, waitMinutes, id, ctx.organizationId);
  audit(ctx, "campaign.ab_configured", "campaign", id, { variants: variants.length, percent, metric, waitMinutes });
  return requireCampaign(ctx, id);
}

// Taille du test pour une cible de `total` destinataires : au moins MIN_PER_VARIANT par version, et jamais toute la cible
function testSize(total, percent, count) {
  const wanted = Math.max(count * MIN_PER_VARIANT, Math.round((total * percent) / 100));
  return Math.min(wanted, total);
}

// Contrôles propres au test, ajoutés au contrôle avant envoi
function abPreflight(ctx, campaign, { sendable, error }) {
  const variants = variantsOf(campaign);
  if (variants.length < 2) return;
  variants.forEach((v, i) => {
    const template = templates.getTemplate(ctx, templateIdOf(campaign, v));
    if (!template) return error("ab_template", `Test A/B — version ${LETTERS[i]} : son modèle n'existe plus.`);
    const ready = templates.templateReadiness(ctx, template.id);
    if (!ready.ready) error("ab_template", `Test A/B — version ${LETTERS[i]} : le modèle « ${template.name} » n'est pas prêt (${ready.errors.map((e) => e.message).join(" ")}).`);
  });
  if (campaign.ab_metric === "opens" && !campaign.track_opens) error("ab_tracking", "Test A/B sur les ouvertures : activez le suivi des ouvertures (Paramètres et suivi), sinon aucun gagnant ne peut être désigné.");
  if (campaign.ab_metric === "revenue" && !campaign.track_clicks) error("ab_tracking", "Test A/B sur les revenus : activez le suivi des clics (Paramètres et suivi) : un achat est attribué au dernier e-mail cliqué.");
  if (campaign.ab_metric === "clicks" && !campaign.track_clicks) error("ab_tracking", "Test A/B sur les clics : activez le suivi des clics (Paramètres et suivi), sinon aucun gagnant ne peut être désigné.");
  if (typeof sendable === "number" && sendable > 0) {
    const size = testSize(sendable, campaign.ab_test_percent, variants.length);
    if (size >= sendable) error("ab_audience", `Test A/B : trop peu de contacts joignables (${sendable}). Il en faut plus de ${variants.length * MIN_PER_VARIANT} pour garder un reste qui recevra la version gagnante.`);
  }
}

// Au lancement (dans la transaction de startCampaign) : contenu figé de chaque version, tirage au hasard du groupe de test
function assignVariants(ctx, campaign, { snapshotOf, now }) {
  const variants = variantsOf(campaign).map((v) => {
    const template = templates.getTemplate(ctx, templateIdOf(campaign, v));
    if (!template) throw new MarketingError("preflight_failed", "Le modèle d'une version du test A/B n'existe plus.");
    return { subject: v.subject, templateId: template.id, snapshot: { ...snapshotOf(template), subject: v.subject } };
  });
  const ids = ctx.db.prepare("SELECT id FROM mk_campaign_recipients WHERE campaign_id = ? ORDER BY id").all(campaign.id).map((r) => r.id);
  // Mélange de Fisher-Yates avec un hasard cryptographique : le groupe de test n'est pas prévisible (ni « les premiers inscrits »)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const size = testSize(ids.length, campaign.ab_test_percent, variants.length);
  const setVariant = ctx.db.prepare("UPDATE mk_campaign_recipients SET variant = ?, held = 0, updated_at = ? WHERE id = ?");
  const hold = ctx.db.prepare("UPDATE mk_campaign_recipients SET variant = NULL, held = 1, updated_at = ? WHERE id = ?");
  ids.forEach((rid, i) => (i < size ? setVariant.run(i % variants.length, now, rid) : hold.run(now, rid)));
  ctx.db.prepare("UPDATE mk_campaigns SET ab_variants = ?, ab_winner = NULL, ab_decide_at = NULL, ab_decided_by = '' WHERE id = ? AND organization_id = ?").run(JSON.stringify(variants), campaign.id, ctx.organizationId);
  return { variants, testSize: size, held: ids.length - size };
}

const enqueueDecision = (ctx, campaignId, runAt) =>
  enqueue(ctx.db, { organizationId: ctx.organizationId, type: "campaign.ab_decide", payload: { organizationId: ctx.organizationId, campaignId }, runAt, priority: 5, maxAttempts: 5, idempotencyKey: `campaign:${campaignId}:ab_decide` });

// Appelé par l'envoi quand il ne reste plus que des destinataires en attente du gagnant : programme le choix (une seule fois)
function scheduleDecision(ctx, campaign, now) {
  if (campaign.ab_decide_at) return campaign.ab_decide_at;
  const at = now + campaign.ab_wait_minutes * 60000;
  ctx.db.prepare("UPDATE mk_campaigns SET ab_decide_at = ? WHERE id = ? AND organization_id = ? AND ab_decide_at IS NULL").run(at, campaign.id, ctx.organizationId);
  if (campaign.ab_metric !== "manual") enqueueDecision(ctx, campaign.id, at);
  audit(ctx, "campaign.ab_test_sent", "campaign", campaign.id, { decideAt: at, metric: campaign.ab_metric });
  return at;
}

// Résultats par version (taux en % des messages envoyés de la version)
function variantResults(ctx, campaign) {
  const variants = variantsOf(campaign);
  const rows = ctx.db
    .prepare(`SELECT variant, COUNT(*) sent, SUM(first_open_at IS NOT NULL) opens, SUM(first_click_at IS NOT NULL) clicks,
              SUM(status = 'delivered') delivered, SUM(unsubscribed_at IS NOT NULL) unsubscribed
              FROM mk_messages WHERE campaign_id = ? AND organization_id = ? AND sent_at IS NOT NULL AND variant IS NOT NULL GROUP BY variant`)
    .all(campaign.id, ctx.organizationId);
  const pct = (n, d) => (d > 0 ? Math.round((n / d) * 10000) / 100 : 0);
  const money = variantRevenue(ctx, campaign.id);
  return variants.map((v, i) => {
    const r = rows.find((x) => x.variant === i) || { sent: 0, opens: 0, clicks: 0, delivered: 0, unsubscribed: 0 };
    const rev = money.get(i) || { orders: 0, cents: 0 };
    const template = templates.getTemplate(ctx, templateIdOf(campaign, v));
    return {
      index: i, letter: LETTERS[i], subject: v.subject, templateName: template ? template.name : "(supprimé)",
      sent: r.sent, opens: r.opens, clicks: r.clicks, delivered: r.delivered, unsubscribed: r.unsubscribed,
      openRate: pct(r.opens, r.sent), clickRate: pct(r.clicks, r.sent), revenueCents: rev.cents, orders: rev.orders, winner: campaign.ab_winner === i,
    };
  });
}

// Meilleure version : critère choisi, puis taux de clics (ou d'ouvertures), puis la première (A) — jamais au hasard
function pickWinner(results, metric) {
  if (metric === "revenue") return [...results].sort((a, b) => b.revenueCents - a.revenueCents || b.clickRate - a.clickRate || a.index - b.index)[0].index;
  const main = metric === "opens" ? "openRate" : "clickRate";
  const other = main === "openRate" ? "clickRate" : "openRate";
  return [...results].sort((a, b) => b[main] - a[main] || b[other] - a[other] || a.index - b.index)[0].index;
}

// Valeur probante du résultat (audit : le gagnant n'était que le meilleur taux brut, sans seuil). Comparaison du gagnant à la meilleure AUTRE version par le
// test du Z sur deux proportions de pages/abstats.js (même méthode que les tests de pages). Elle ne bloque jamais l'envoi du reste de la cible : elle dit
// seulement si l'avantage observé est établi.
//  - ouvertures : mesure biaisée (protection de la vie privée des clients de messagerie, ouvertures automatiques) ; elle est signalée comme indicative ;
//  - revenu : distribution trop asymétrique pour un test de proportions, le chiffre est décrit, pas « prouvé ».
function evidence(results, metric, winnerIndex) {
  const base = { level: "not_tested", p: null, confidence: 95, caveat: "" };
  if (!Array.isArray(results) || results.length < 2 || !results[winnerIndex]) return base;
  if (metric === "revenue") return { ...base, caveat: "Le chiffre d'affaires est décrit, pas testé statistiquement : il est trop irrégulier pour une comparaison fiable sur de petits envois." };
  if (metric === "manual") return { ...base, caveat: "Version choisie par l'équipe." };
  const key = metric === "opens" ? "opens" : "clicks";
  const win = results[winnerIndex];
  const rival = results.filter((r) => r.index !== winnerIndex).sort((a, b) => (b[key] / (b.sent || 1)) - (a[key] / (a.sent || 1)))[0];
  const a = { views: rival.sent, conversions: rival[key] }, b = { views: win.sent, conversions: win[key] };
  const caveat = metric === "opens" ? "Les ouvertures sont une mesure indicative : certains clients de messagerie les déclenchent automatiquement." : "";
  if (!stats.approximationValid(a, b)) return { ...base, level: "insufficient", caveat: `Données insuffisantes : il faut au moins 5 ${key === "clicks" ? "clics" : "ouvertures"} et 5 messages sans, dans chaque version, pour conclure. ${caveat}`.trim() };
  const c = stats.compare(a, b, 95);
  return { level: c.significant && c.diff > 0 ? "significant" : "not_significant", p: c.p, confidence: 95, caveat: c.significant && c.diff > 0 ? caveat : `Écart non significatif au seuil de 95 % : la différence observée peut venir du hasard. ${caveat}`.trim() };
}

// Choix du gagnant (automatique : tâche programmée ; manuel : bouton de l'équipe). Le reste de la cible reçoit la version gagnante.
function decideWinner(ctx, id, { manualIndex, now = Date.now(), enqueueDispatch } = {}) {
  const campaign = requireCampaign(ctx, id);
  if (!isAbTest(campaign)) throw new MarketingError("invalid_state", "Cette campagne n'a pas de test A/B.");
  if (campaign.ab_winner !== null && campaign.ab_winner !== undefined) return { winner: campaign.ab_winner, already: true };
  if (!["sending", "paused"].includes(campaign.status)) throw new MarketingError("invalid_state", "Le gagnant ne peut plus être choisi : la campagne est terminée ou annulée.");
  const variants = variantsOf(campaign);
  const manual = manualIndex !== undefined;
  if (manual && !(Number.isInteger(manualIndex) && manualIndex >= 0 && manualIndex < variants.length)) throw bad("Version inconnue.");
  if (!manual) {
    if (campaign.ab_metric === "manual") return { winner: null, waiting: "manual" };
    if (!campaign.ab_decide_at || campaign.ab_decide_at > now) return { winner: null, waiting: "test" }; // test pas fini, ou délai pas écoulé
  }
  const results = variantResults(ctx, campaign);
  const winner = manual ? manualIndex : pickWinner(results, campaign.ab_metric);

  return transaction(ctx.db, () => {
    const set = ctx.db.prepare("UPDATE mk_campaigns SET ab_winner = ?, ab_decided_by = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ? AND ab_winner IS NULL").run(winner, manual ? "manual" : "auto", id, ctx.organizationId);
    if (!set.changes) return { winner: requireCampaign(ctx, id).ab_winner, already: true };
    const released = ctx.db.prepare("UPDATE mk_campaign_recipients SET variant = ?, held = 0, updated_at = ? WHERE campaign_id = ? AND held = 1 AND status = 'queued'").run(winner, now, id).changes;
    if (released && enqueueDispatch) enqueueDispatch(ctx, id, { runAt: now, key: `campaign:${id}:ab_winner` });
    audit(ctx, "campaign.ab_winner", "campaign", id, { winner: LETTERS[winner], by: manual ? "manual" : "auto", released, evidence: evidence(results, campaign.ab_metric, winner), results: results.map((r) => ({ v: r.letter, sent: r.sent, clicks: r.clicks, opens: r.opens })) });
    return { winner, released };
  });
}

// Résumé affiché dans le rapport
function abSummary(ctx, campaign) {
  if (!isAbTest(campaign)) return null;
  const held = ctx.db.prepare("SELECT COUNT(*) n FROM mk_campaign_recipients WHERE campaign_id = ? AND held = 1").get(campaign.id).n;
  const decided = campaign.ab_winner !== null && campaign.ab_winner !== undefined;
  const results = variantResults(ctx, campaign);
  const phase = decided ? "decided" : campaign.ab_decide_at ? "waiting" : "testing";
  return {
    phase, metric: campaign.ab_metric, metricLabel: METRICS[campaign.ab_metric] || campaign.ab_metric, percent: campaign.ab_test_percent,
    waitMinutes: campaign.ab_wait_minutes, decideAt: campaign.ab_decide_at, decidedBy: campaign.ab_decided_by,
    winner: decided ? campaign.ab_winner : null, winnerLetter: decided ? LETTERS[campaign.ab_winner] : null, held, results,
    evidence: decided ? evidence(results, campaign.ab_metric, campaign.ab_winner) : null,
  };
}

module.exports = {
  LETTERS, METRICS, MIN_PERCENT, MAX_PERCENT, MIN_WAIT, MAX_WAIT, MIN_PER_VARIANT,
  variantsOf, isAbTest, templateIdOf, saveAbTest, testSize, abPreflight, assignVariants, scheduleDecision, variantResults, pickWinner, evidence, decideWinner, abSummary,
};
