// Configuration d'envoi par organisation : fournisseur, expéditeur, débit, plafond quotidien, clés (chiffrées).
// Valeurs par défaut SÛRES : fournisseur « console » (rien ne part), 60 messages/minute, 1 000 par jour.
const { transaction } = require("../db/tx");
const { validateEmail } = require("../audience/email");
const { checkCtx, audit, MarketingError } = require("../audience/shared");
const { PROVIDERS, parseSender, createProvider } = require("./providers");

const DEFAULTS = { provider: "console", ratePerMinute: 60, dailyLimit: 1000 };
const K = { provider: "email.provider", from: "email.from", replyTo: "email.reply_to", rate: "email.rate_per_minute", daily: "email.daily_limit", apiKey: "email.api_key", webhookSecret: "email.webhook_secret" };
const bad = (message) => new MarketingError("invalid_field", message);

function need(ctx) {
  checkCtx(ctx);
  if (!ctx.settings) throw new Error("Contexte marketing sans réglages (settings).");
  return ctx.settings;
}
const isSet = (ctx, key) => Boolean(ctx.db.prepare("SELECT 1 FROM mk_settings WHERE organization_id = ? AND key = ?").get(ctx.organizationId, key));

function getSendingConfig(ctx) {
  const s = need(ctx);
  const int = (key, fallback) => { const n = Number(s.get(ctx.organizationId, key, fallback)); return Number.isInteger(n) && n > 0 ? n : fallback; };
  const provider = s.get(ctx.organizationId, K.provider, DEFAULTS.provider);
  return {
    provider: PROVIDERS.includes(provider) ? provider : DEFAULTS.provider,
    from: s.get(ctx.organizationId, K.from, ""), replyTo: s.get(ctx.organizationId, K.replyTo, ""),
    ratePerMinute: int(K.rate, DEFAULTS.ratePerMinute), dailyLimit: int(K.daily, DEFAULTS.dailyLimit),
    apiKeySet: isSet(ctx, K.apiKey), webhookSecretSet: isSet(ctx, K.webhookSecret),
  };
}

// Secrets en clair : usage interne du serveur UNIQUEMENT (jamais affichés, jamais journalisés)
function getSecrets(ctx) {
  const s = need(ctx);
  return { apiKey: s.get(ctx.organizationId, K.apiKey) ?? undefined, webhookSecret: s.get(ctx.organizationId, K.webhookSecret) ?? undefined };
}

function integer(value, label, min, max) {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (!Number.isInteger(n) || n < min || n > max) throw bad(`${label} : un entier entre ${min} et ${max} est attendu.`);
  return n;
}

// Les champs non fournis restent inchangés ; une clé vide conserve l'ancienne ; clearApiKey / clearWebhookSecret l'effacent.
function saveSendingConfig(ctx, input = {}) {
  const s = need(ctx);
  const org = ctx.organizationId;
  const writes = [];
  if (input.provider !== undefined) {
    if (!PROVIDERS.includes(input.provider)) throw bad(`Fournisseur inconnu (${PROVIDERS.join(", ")}).`);
    writes.push([K.provider, input.provider]);
  }
  if (input.from !== undefined) {
    if (input.from === "") writes.push([K.from, ""]);
    else { const p = parseSender(input.from); if (!p) throw bad("Expéditeur invalide : « Nom <adresse@domaine.fr> » ou une adresse e-mail."); writes.push([K.from, p.formatted]); }
  }
  if (input.replyTo !== undefined) {
    if (input.replyTo === "") writes.push([K.replyTo, ""]);
    else { const c = validateEmail(input.replyTo); if (!c.ok) throw bad("Adresse de réponse invalide."); writes.push([K.replyTo, c.email]); }
  }
  if (input.ratePerMinute !== undefined) writes.push([K.rate, String(integer(input.ratePerMinute, "Débit par minute", 1, 6000))]);
  if (input.dailyLimit !== undefined) writes.push([K.daily, String(integer(input.dailyLimit, "Plafond quotidien", 1, 1000000))]);
  const secrets = [];
  if (typeof input.apiKey === "string" && input.apiKey.trim()) secrets.push([K.apiKey, input.apiKey.trim()]);
  if (typeof input.webhookSecret === "string" && input.webhookSecret.trim()) secrets.push([K.webhookSecret, input.webhookSecret.trim()]);
  const cleared = [];
  if (input.clearApiKey) cleared.push(K.apiKey);
  if (input.clearWebhookSecret) cleared.push(K.webhookSecret);
  const provider = input.provider ?? s.get(org, K.provider, DEFAULTS.provider);
  const from = writes.find(([k]) => k === K.from)?.[1] ?? s.get(org, K.from, "");
  if (provider !== "console" && !from) throw bad("Un expéditeur est obligatoire pour ce fournisseur.");

  transaction(ctx.db, () => {
    for (const [key, value] of writes) s.set(org, key, value);
    for (const [key, value] of secrets) s.set(org, key, value, { secret: true }); // lève si ENCRYPTION_KEY est absente
    for (const key of cleared) s.remove(org, key);
    audit(ctx, "sending.configured", "organization", org, { provider, apiKeyChanged: secrets.some(([k]) => k === K.apiKey) || cleared.includes(K.apiKey), webhookSecretChanged: secrets.some(([k]) => k === K.webhookSecret) });
  });
  return getSendingConfig(ctx);
}

// Construit le fournisseur de l'organisation (les dépendances — transport SMTP, fetch — sont injectables pour les tests)
function createProviderFor(ctx, deps = {}) {
  const cfg = getSendingConfig(ctx);
  const secrets = getSecrets(ctx);
  const transport = deps.transport !== undefined ? deps.transport : cfg.provider === "smtp" ? require("../../utils/mailer").buildTransport() : null;
  return createProvider({ provider: cfg.provider, apiKey: secrets.apiKey }, { ...deps, transport });
}

// Canal des e-mails de TEST (modèles, Réglages d'envoi) : le fournisseur choisi s'il s'agit d'une API (Resend), sinon le
// SMTP du serveur. → { provider } ou { transport } (+ from), ou null si rien n'est configuré.
function testChannel(ctx) {
  const cfg = getSendingConfig(ctx);
  const mailer = require("../../utils/mailer");
  if (cfg.provider === "resend") {
    try { return { name: "resend", provider: createProviderFor(ctx), from: cfg.from || mailer.fromAddress() }; } catch { return null; }
  }
  const transport = mailer.buildTransport();
  return transport ? { name: "smtp", transport, from: cfg.from || mailer.fromAddress() } : null;
}

module.exports = { DEFAULTS, getSendingConfig, getSecrets, saveSendingConfig, createProviderFor, testChannel };
