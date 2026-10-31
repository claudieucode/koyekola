// Connexion Mailchimp d'une organisation : la clé d'API est chiffrée (AES-256-GCM, lié à l'organisation et au nom du réglage) dans mk_settings, jamais renvoyée,
// jamais journalisée. Un jeton secret par organisation protège l'adresse du webhook entrant (Mailchimp ne signe pas ses webhooks).
const crypto = require("node:crypto");
const { checkCtx, audit } = require("../audience/shared");
const { MarketingError } = require("../errors");
const { createClient, parseApiKey, MailchimpError } = require("./client");

const K = { apiKey: "mailchimp.api_key", token: "mailchimp.webhook_token", account: "mailchimp.account", mandrill: "mailchimp.transactional_key", syncOn: "mailchimp.sync_enabled" };
const LOG_RETENTION_DAYS = 30;

function need(ctx) {
  checkCtx(ctx);
  if (!ctx.settings) throw new Error("Contexte marketing sans réglages (settings).");
  return ctx.settings;
}
const isSet = (ctx, key) => Boolean(ctx.db.prepare("SELECT 1 FROM mk_settings WHERE organization_id = ? AND key = ?").get(ctx.organizationId, key));
const toMarketing = (error) => (error instanceof MailchimpError ? new MarketingError(error.code, error.message, error.detail || undefined) : error);

// Journal des appels sortants (mk_mc_requests) ; purge opportuniste des lignes trop anciennes
function logger(ctx) {
  let counter = 0;
  return (entry) => {
    try {
      ctx.db.prepare("INSERT INTO mk_mc_requests (organization_id, method, path, status, duration_ms, attempts, error_code) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(ctx.organizationId, entry.method, entry.path, entry.status, entry.durationMs, entry.attempts, entry.errorCode);
      if (++counter % 50 === 1) ctx.db.prepare("DELETE FROM mk_mc_requests WHERE organization_id = ? AND created_at < datetime('now', ?)").run(ctx.organizationId, `-${LOG_RETENTION_DAYS} days`);
    } catch { /* le journal ne doit jamais faire échouer l'appel */ }
  };
}

// Clé en clair : usage interne du serveur UNIQUEMENT
function secretKey(ctx) { return need(ctx).get(ctx.organizationId, K.apiKey); }

// Client prêt à l'emploi ; erreur claire si aucune clé n'est enregistrée
function clientFor(ctx, options = {}) {
  const apiKey = secretKey(ctx);
  if (!apiKey) throw new MarketingError("not_connected", "Mailchimp n'est pas connecté : enregistrez votre clé d'API dans Marketing → Mailchimp → Connexion.");
  return createClient({ apiKey, env: ctx.env || process.env, onLog: logger(ctx), limiterKey: `mc:${ctx.organizationId}`, ...(ctx.mailchimp || {}), ...options });
}

function status(ctx) {
  const s = need(ctx);
  const raw = s.get(ctx.organizationId, K.account);
  let account = null;
  if (raw) { try { account = JSON.parse(raw); } catch { account = null; } }
  return {
    connected: isSet(ctx, K.apiKey), account, webhookTokenSet: isSet(ctx, K.token), transactionalKeySet: isSet(ctx, K.mandrill),
    syncEnabled: s.get(ctx.organizationId, K.syncOn, "1") !== "0",
    encryptionReady: (() => { try { require("../security/crypto").parseKey(process.env.ENCRYPTION_KEY); return true; } catch { return false; } })(),
  };
}

// Valide la clé EN DIRECT (/ping puis la racine de l'API) avant de l'enregistrer : une clé refusée n'est jamais stockée.
async function connect(ctx, apiKey) {
  const s = need(ctx);
  const key = typeof apiKey === "string" ? apiKey.trim() : "";
  if (!parseApiKey(key)) throw new MarketingError("key_format", "Format de clé invalide : une clé Mailchimp ressemble à « 0123456789abcdef0123456789abcdef-us21 » (32 caractères, un tiret, le centre de données).");
  try { require("../security/crypto").parseKey(process.env.ENCRYPTION_KEY); } catch { throw new MarketingError("encryption_missing", "ENCRYPTION_KEY est absente ou invalide sur le serveur : la clé ne peut pas être enregistrée de façon chiffrée."); }
  let account;
  try {
    const client = createClient({ apiKey: key, env: ctx.env || process.env, onLog: logger(ctx), limiterKey: `mc:${ctx.organizationId}`, ...(ctx.mailchimp || {}) });
    await client.ping();
    account = await client.get("/", { fields: "account_id,account_name,email,first_name,last_name,role,pro_enabled,total_subscribers,industry_stats,contact" });
  } catch (error) { throw toMarketing(error); }
  s.set(ctx.organizationId, K.apiKey, key, { secret: true });
  if (!isSet(ctx, K.token)) s.set(ctx.organizationId, K.token, crypto.randomBytes(24).toString("hex"), { secret: true });
  const view = { accountId: String(account.account_id || ""), name: String(account.account_name || ""), email: String(account.email || ""), role: String(account.role || ""), proEnabled: Boolean(account.pro_enabled), totalSubscribers: Number(account.total_subscribers) || 0, dc: parseApiKey(key).dc, connectedAt: new Date().toISOString() };
  s.set(ctx.organizationId, K.account, JSON.stringify(view));
  audit(ctx, "mailchimp.connected", "mailchimp", null, { dc: view.dc });
  return view;
}

// Déconnexion : clé et jeton effacés (les anciens webhooks Mailchimp cessent d'être acceptés). Les miroirs locaux sont conservés.
function disconnect(ctx) {
  const s = need(ctx);
  for (const key of [K.apiKey, K.token, K.account]) s.remove(ctx.organizationId, key);
  audit(ctx, "mailchimp.disconnected", "mailchimp", null, {});
  return { ok: true };
}

function setSyncEnabled(ctx, enabled) {
  need(ctx).set(ctx.organizationId, K.syncOn, enabled ? "1" : "0");
  audit(ctx, "mailchimp.sync_toggled", "mailchimp", null, { enabled: Boolean(enabled) });
}

// Jeton du webhook entrant (usage interne : comparé à temps constant, jamais journalisé)
function webhookToken(ctx) { return need(ctx).get(ctx.organizationId, K.token); }
function tokenMatches(ctx, candidate) {
  const real = webhookToken(ctx);
  if (!real || typeof candidate !== "string") return false;
  const a = Buffer.from(real), b = Buffer.from(candidate);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
// Adresse publique du webhook : SITE_URL (HTTPS) + chemin avec jeton ; null si le site n'a pas d'adresse HTTPS publique
function webhookUrl(ctx, env = process.env) {
  const base = String(env.SITE_URL || "").replace(/\/+$/, "");
  const token = webhookToken(ctx);
  if (!/^https:\/\//.test(base) || !token) return null;
  return `${base}/webhooks/mailchimp/${ctx.organizationId}/${token}`;
}
function rotateWebhookToken(ctx) {
  need(ctx).set(ctx.organizationId, K.token, crypto.randomBytes(24).toString("hex"), { secret: true });
  audit(ctx, "mailchimp.token_rotated", "mailchimp", null, {});
}

function saveTransactionalKey(ctx, key) {
  const s = need(ctx);
  const value = typeof key === "string" ? key.trim() : "";
  if (!value) { s.remove(ctx.organizationId, K.mandrill); return { cleared: true }; }
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(value)) throw new MarketingError("key_format", "Format de clé Mandrill invalide (16 à 80 caractères : lettres, chiffres, « - » et « _ »).");
  s.set(ctx.organizationId, K.mandrill, value, { secret: true });
  audit(ctx, "mailchimp.transactional_key_saved", "mailchimp", null, {});
  return { cleared: false };
}
const transactionalKey = (ctx) => need(ctx).get(ctx.organizationId, K.mandrill);

function recentRequests(ctx, limit = 100) {
  checkCtx(ctx);
  return ctx.db.prepare("SELECT id, method, path, status, duration_ms AS durationMs, attempts, error_code AS errorCode, created_at AS createdAt FROM mk_mc_requests WHERE organization_id = ? ORDER BY id DESC LIMIT ?")
    .all(ctx.organizationId, Math.min(Math.max(Number(limit) || 100, 1), 500));
}

module.exports = { K, clientFor, status, connect, disconnect, setSyncEnabled, webhookToken, tokenMatches, webhookUrl, rotateWebhookToken, saveTransactionalKey, transactionalKey, recentRequests, toMarketing, logger, secretKey };
