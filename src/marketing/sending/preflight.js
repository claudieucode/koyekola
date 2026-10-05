// Contrôle avant envoi : tout ce qui ferait échouer ou compromettrait une campagne est signalé AVANT le lancement.
// « errors » bloque le lancement ; « warnings » informe (fournisseur console, adresse postale absente…).
const { parseKey } = require("../security/crypto");
const templates = require("../templates");
const { getOrgProfile } = require("../templates/context");
const { requireCampaign } = require("./campaigns");
const { audienceSummary } = require("./audience");
const { getSendingConfig } = require("./config");
const { getSecrets } = require("./config");
const { WORKER_DETAIL, workerHuman } = require("../workerNotice");
const { abPreflight } = require("./abtest");

const LOCAL_HTTP = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/i;

// postItems : articles injectés dans le bloc « Articles » au lancement (envoi d'une campagne RSS) — un bloc vide dans le
// modèle parent n'est alors pas un défaut (il sera rempli), toutes les autres vérifications restent identiques.
function preflight(ctx, campaignId, { workerOn = false, smtpAvailable = Boolean(process.env.SMTP_HOST), postItems = null } = {}) {
  const campaign = requireCampaign(ctx, campaignId);
  const errors = [];
  const warnings = [];
  const error = (code, message) => errors.push({ code, message });
  const warn = (code, message) => warnings.push({ code, message });

  // Modèle (version actuelle ; au lancement, son contenu est figé)
  const template = templates.getTemplate(ctx, campaign.template_id);
  if (!template) error("template_missing", "Le modèle de cette campagne n'existe plus.");
  else {
    const ready = templates.templateReadiness(ctx, template.id);
    const blocking = ready.errors.filter((e) => !(postItems && postItems.length && e.code === "posts_empty"));
    if (blocking.length) error("template_not_ready", `Le modèle n'est pas prêt : ${blocking.map((e) => e.message).join(" ")}`);
  }

  // Fournisseur
  const cfg = getSendingConfig(ctx);
  const secrets = getSecrets(ctx);
  if (cfg.provider === "console") warn("provider_console", "Fournisseur « console » : rien ne sera réellement envoyé. Choisissez SMTP ou Resend dans les réglages d'envoi.");
  else {
    if (!cfg.from) error("provider_incomplete", "Aucune adresse d'expédition n'est enregistrée (réglages d'envoi).");
    if (cfg.provider === "smtp" && !smtpAvailable) error("provider_incomplete", "SMTP n'est pas configuré sur le serveur (variables SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS).");
    if (cfg.provider === "resend" && !secrets.apiKey) error("provider_incomplete", "La clé d'API Resend n'est pas enregistrée (réglages d'envoi).");
  }

  // Liens de désinscription : adresse publique https du site, et clé de signature valide
  const base = String(ctx.baseUrl || "").replace(/\/+$/, "");
  const httpsOk = /^https:\/\/[^\s/]+/i.test(base);
  if (!httpsOk && !(cfg.provider === "console" && LOCAL_HTTP.test(base))) {
    error("base_url", "L'adresse publique du site (SITE_URL) doit être en https:// : les liens de désinscription et de suivi en dépendent.");
  }
  try { parseKey(ctx.tokenKey); } catch { error("token_key", "ENCRYPTION_KEY est absente ou invalide : les liens de désinscription ne peuvent pas être signés."); }

  // Audience
  let summary = null;
  try {
    summary = audienceSummary(ctx, { targetType: campaign.target_type, targetId: campaign.target_id, category: campaign.category });
    if (summary.sendable === 0) error("no_audience", "Aucun contact joignable dans cette cible (il faut un consentement prouvé, sans désinscription ni blocage).");
  } catch (e) {
    if (e.code !== "not_found") throw e;
    error("target_missing", "La liste ou le segment ciblé n'existe plus.");
  }

  // Test A/B : modèle de chaque version, suivi adapté au critère, cible assez grande pour garder un reste
  abPreflight(ctx, campaign, { sendable: summary ? summary.sendable : null, error });

  if (!getOrgProfile(ctx).address) warn("address_missing", "Aucune adresse postale dans le pied de page (page Modèles) : elle est exigée par plusieurs législations.");
  if (!workerOn) warnings.push({ code: "worker_off", message: workerHuman("aucune campagne ne partira tant qu'il n'est pas rétabli"), detail: WORKER_DETAIL });
  return { ready: errors.length === 0, errors, warnings, audience: summary };
}

module.exports = { preflight };
