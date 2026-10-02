// Réglages SMS par organisation : fournisseur, expéditeur, pays par défaut, heures de silence, débit, plafonds, identifiants.
// Valeurs par défaut SÛRES : fournisseur « console » (rien ne part), silence de 20 h à 8 h, 30 SMS/minute, 500 par jour,
// 3 segments au plus par SMS (un message plus long coûterait plus de 3 SMS : refusé).
const { transaction } = require("../db/tx");
const { checkCtx, audit, MarketingError } = require("../audience/shared");
const { SMS_PROVIDERS, parseSmsSender, createSmsProvider } = require("./providers");
const { ACCOUNT_SID } = require("./providers/twilio");
const { isCountry } = require("./phone");

const DEFAULTS = { provider: "console", defaultCountry: "CD", quietStart: 20, quietEnd: 8, ratePerMinute: 30, dailyLimit: 500, maxSegments: 3 };
const K = {
  provider: "sms.provider", sender: "sms.sender", country: "sms.default_country", quietStart: "sms.quiet_start", quietEnd: "sms.quiet_end",
  rate: "sms.rate_per_minute", daily: "sms.daily_limit", maxSegments: "sms.max_segments", accountSid: "sms.account_sid", authToken: "sms.auth_token",
  price: "sms.price_per_segment", currency: "sms.currency",
};
// Prix d'un SMS (d'un segment) chez votre fournisseur : sert UNIQUEMENT à estimer le coût d'une campagne avant l'envoi
const CURRENCIES = ["USD", "EUR", "CDF", "XAF"];
const PRICE = /^\d{1,4}(\.\d{1,4})?$/;
const bad = (message) => new MarketingError("invalid_field", message);

function need(ctx) {
  checkCtx(ctx);
  if (!ctx.settings) throw new Error("Contexte marketing sans réglages (settings).");
  return ctx.settings;
}
const isSet = (ctx, key) => Boolean(ctx.db.prepare("SELECT 1 FROM mk_settings WHERE organization_id = ? AND key = ?").get(ctx.organizationId, key));

function getSmsConfig(ctx) {
  const s = need(ctx);
  const org = ctx.organizationId;
  const int = (key, fallback, min = 1) => { const n = Number(s.get(org, key, fallback)); return Number.isInteger(n) && n >= min ? n : fallback; };
  const provider = s.get(org, K.provider, DEFAULTS.provider);
  const country = s.get(org, K.country, DEFAULTS.defaultCountry);
  return {
    provider: SMS_PROVIDERS.includes(provider) ? provider : DEFAULTS.provider,
    sender: s.get(org, K.sender, ""), defaultCountry: isCountry(country) ? country : DEFAULTS.defaultCountry,
    quietStart: int(K.quietStart, DEFAULTS.quietStart, 0), quietEnd: int(K.quietEnd, DEFAULTS.quietEnd, 0),
    ratePerMinute: int(K.rate, DEFAULTS.ratePerMinute), dailyLimit: int(K.daily, DEFAULTS.dailyLimit), maxSegments: int(K.maxSegments, DEFAULTS.maxSegments),
    accountSid: s.get(org, K.accountSid, ""), authTokenSet: isSet(ctx, K.authToken),
    pricePerSegment: s.get(org, K.price, ""), currency: CURRENCIES.includes(s.get(org, K.currency, "")) ? s.get(org, K.currency, "") : "USD",
  };
}

function integer(value, label, min, max) {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (!Number.isInteger(n) || n < min || n > max) throw bad(`${label} : un entier entre ${min} et ${max} est attendu.`);
  return n;
}

// Les champs non fournis restent inchangés ; un jeton vide conserve l'ancien ; clearAuthToken l'efface.
function saveSmsConfig(ctx, input = {}) {
  const s = need(ctx);
  const org = ctx.organizationId;
  const writes = [];
  if (input.provider !== undefined) {
    if (!SMS_PROVIDERS.includes(input.provider)) throw bad(`Fournisseur SMS inconnu (${SMS_PROVIDERS.join(", ")}).`);
    writes.push([K.provider, input.provider]);
  }
  if (input.sender !== undefined) {
    if (input.sender === "") writes.push([K.sender, ""]);
    else {
      const p = parseSmsSender(input.sender);
      if (!p) throw bad("Expéditeur invalide : un nom de 1 à 11 lettres ou chiffres sans accent (ex. KOYEKOLA), un numéro au format +…, ou un identifiant de service Twilio (MG…).");
      writes.push([K.sender, p.value]);
    }
  }
  if (input.defaultCountry !== undefined) {
    if (!isCountry(input.defaultCountry)) throw bad("Pays par défaut inconnu.");
    writes.push([K.country, input.defaultCountry]);
  }
  if (input.quietStart !== undefined) writes.push([K.quietStart, String(integer(input.quietStart, "Début du silence", 0, 23))]);
  if (input.quietEnd !== undefined) writes.push([K.quietEnd, String(integer(input.quietEnd, "Fin du silence", 0, 23))]);
  if (input.ratePerMinute !== undefined) writes.push([K.rate, String(integer(input.ratePerMinute, "SMS par minute", 1, 600))]);
  if (input.dailyLimit !== undefined) writes.push([K.daily, String(integer(input.dailyLimit, "Plafond quotidien", 1, 100000))]);
  if (input.maxSegments !== undefined) writes.push([K.maxSegments, String(integer(input.maxSegments, "Segments au plus par SMS", 1, 10))]);
  if (input.accountSid !== undefined) {
    const sid = String(input.accountSid).trim();
    if (sid && !ACCOUNT_SID.test(sid)) throw bad("Identifiant de compte Twilio invalide : il commence par « AC » et compte 34 caractères.");
    writes.push([K.accountSid, sid]);
  }
  if (input.pricePerSegment !== undefined) {
    const price = String(input.pricePerSegment).trim().replace(",", ".");
    if (price && !PRICE.test(price)) throw bad("Prix d'un SMS : un nombre comme 0.23 (4 décimales au plus).");
    writes.push([K.price, price]);
  }
  if (input.currency !== undefined) {
    if (!CURRENCIES.includes(input.currency)) throw bad(`Devise inconnue (${CURRENCIES.join(", ")}).`);
    writes.push([K.currency, input.currency]);
  }
  const secrets = [];
  if (typeof input.authToken === "string" && input.authToken.trim()) secrets.push([K.authToken, input.authToken.trim()]);
  const clearToken = Boolean(input.clearAuthToken);

  const value = (key, fallback) => writes.find(([k]) => k === key)?.[1] ?? s.get(org, key, fallback);
  const provider = value(K.provider, DEFAULTS.provider);
  if (provider !== "console") {
    if (!value(K.sender, "")) throw bad("Un expéditeur est obligatoire pour envoyer de vrais SMS.");
    if (!value(K.accountSid, "")) throw bad("L'identifiant de compte Twilio (AC…) est obligatoire.");
    if (clearToken || (!secrets.length && !isSet(ctx, K.authToken))) throw bad("Le jeton Twilio (Auth Token) est obligatoire.");
  }

  transaction(ctx.db, () => {
    for (const [key, v] of writes) s.set(org, key, v);
    for (const [key, v] of secrets) s.set(org, key, v, { secret: true }); // lève si ENCRYPTION_KEY est absente
    if (clearToken) s.remove(org, K.authToken);
    audit(ctx, "sms.configured", "organization", org, { provider, authTokenChanged: secrets.length > 0 || clearToken });
  });
  return getSmsConfig(ctx);
}

// Jeton en clair : usage interne du serveur UNIQUEMENT (jamais affiché, jamais journalisé)
function getSmsSecrets(ctx) {
  const s = need(ctx);
  return { authToken: s.get(ctx.organizationId, K.authToken) ?? undefined };
}

// Construit le fournisseur de l'organisation (fetch injectable pour les tests)
function createSmsProviderFor(ctx, deps = {}) {
  const cfg = getSmsConfig(ctx);
  return createSmsProvider({ provider: cfg.provider, accountSid: cfg.accountSid, authToken: getSmsSecrets(ctx).authToken }, deps);
}

module.exports = { CURRENCIES, DEFAULTS, getSmsConfig, saveSmsConfig, getSmsSecrets, createSmsProviderFor };
