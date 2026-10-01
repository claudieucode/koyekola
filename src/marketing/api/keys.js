// Clés d'API (jalon M5 — Intégrations, partie 1). Une clé donne accès à /api/v1 pour UNE organisation, avec une
// portée « read » (lecture) ou « write » (lecture + écriture). La clé complète n'est JAMAIS stockée ni journalisée :
// seule son empreinte SHA-256 l'est (comme un mot de passe), avec un préfixe affiché pour la reconnaître.
const crypto = require("crypto");
const { checkCtx, cleanText, audit, MarketingError } = require("../audience/shared");

const PREFIX = "mk_live_";
const RAW_BYTES = 24; // 48 caractères hexadécimaux après le préfixe
const SCOPES = ["read", "write"];

const hashOf = (rawKey) => crypto.createHash("sha256").update(String(rawKey)).digest("hex");

function generateRawKey() {
  return PREFIX + crypto.randomBytes(RAW_BYTES).toString("hex");
}

// Crée une clé et renvoie la clé COMPLÈTE une seule fois (jamais récupérable ensuite, ni par l'interface ni par l'API)
function createApiKey(ctx, { name, scope = "read" } = {}) {
  checkCtx(ctx);
  const cleanName = cleanText(name, { max: 80, field: "name" });
  if (!cleanName) throw new MarketingError("invalid_field", "Le nom de la clé est obligatoire.");
  if (!SCOPES.includes(scope)) throw new MarketingError("invalid_field", "Portée invalide (lecture ou lecture/écriture attendue).");
  const raw = generateRawKey();
  let id;
  try {
    id = Number(
      ctx.db
        .prepare("INSERT INTO mk_api_keys (organization_id, name, prefix, key_hash, scope, created_by) VALUES (?, ?, ?, ?, ?, ?)")
        .run(ctx.organizationId, cleanName, raw.slice(0, 12), hashOf(raw), scope, ctx.userId ?? null).lastInsertRowid
    );
  } catch (error) {
    if (/UNIQUE/.test(error.message)) throw new MarketingError("duplicate", `Une clé nommée « ${cleanName} » existe déjà.`);
    throw error;
  }
  audit(ctx, "api_key.created", "api_key", id, { name: cleanName, scope });
  return { id, name: cleanName, scope, key: raw }; // `key` : à copier immédiatement, ne réapparaîtra plus
}

function listApiKeys(ctx) {
  checkCtx(ctx);
  return ctx.db
    .prepare("SELECT id, name, prefix, scope, created_at, last_used_at, revoked_at FROM mk_api_keys WHERE organization_id = ? ORDER BY id DESC")
    .all(ctx.organizationId);
}

function revokeApiKey(ctx, id) {
  checkCtx(ctx);
  const key = ctx.db.prepare("SELECT id, name, revoked_at FROM mk_api_keys WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId);
  if (!key) throw new MarketingError("not_found", "Clé introuvable.");
  if (key.revoked_at) return `« ${key.name} » est déjà révoquée.`;
  ctx.db.prepare("UPDATE mk_api_keys SET revoked_at = datetime('now') WHERE id = ?").run(id);
  audit(ctx, "api_key.revoked", "api_key", id, { name: key.name });
  return `Clé « ${key.name} » révoquée : elle ne fonctionnera plus immédiatement.`;
}

// Authentifie une requête d'API : renvoie le contexte de la clé, ou null (clé absente, inconnue ou révoquée).
// N'écrit `last_used_at` que si la dernière écriture date de plus d'une minute (une clé très active n'écrit pas à chaque requête).
function authenticate(db, rawKey) {
  if (typeof rawKey !== "string" || !rawKey.startsWith(PREFIX) || rawKey.length > 200) return null;
  const row = db.prepare("SELECT id, organization_id, scope, last_used_at FROM mk_api_keys WHERE key_hash = ? AND revoked_at IS NULL").get(hashOf(rawKey));
  if (!row) return null;
  const stale = !row.last_used_at || Date.now() - Date.parse(`${row.last_used_at.replace(" ", "T")}Z`) > 60_000;
  if (stale) db.prepare("UPDATE mk_api_keys SET last_used_at = datetime('now') WHERE id = ?").run(row.id);
  return { keyId: row.id, organizationId: row.organization_id, scope: row.scope };
}

module.exports = { SCOPES, createApiKey, listApiKeys, revokeApiKey, authenticate, hashOf, generateRawKey };
