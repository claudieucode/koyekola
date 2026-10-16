// Clés d'API (jalon M5 — Intégrations, partie 1). Une clé donne accès à /api/v1 pour UNE organisation, avec une
// portée « read » (lecture) ou « write » (lecture + écriture). La clé complète n'est JAMAIS stockée ni journalisée :
// seule son empreinte SHA-256 l'est (comme un mot de passe), avec un préfixe affiché pour la reconnaître.
const crypto = require("crypto");
const { checkCtx, cleanText, audit, resolveSite, MarketingError } = require("../audience/shared");

const PREFIX = "mk_live_";
const RAW_BYTES = 24; // 48 caractères hexadécimaux après le préfixe
const SCOPES = ["read", "write"];

const hashOf = (rawKey) => crypto.createHash("sha256").update(String(rawKey)).digest("hex");

function generateRawKey() {
  return PREFIX + crypto.randomBytes(RAW_BYTES).toString("hex");
}

// Portée de site (R2, décision D4) : une clé est « organization » (toute l'organisation, comportement historique des clés existantes)
// ou « site » (limitée à UN site). La portée est décidée ICI, côté serveur, à la création, puis figée (la base refuse de la modifier) ;
// jamais lue dans une requête d'API. Un utilisateur dont l'accès est limité à un site (ctx.siteScope) ne peut créer que des clés de CE site.
function resolveReach(ctx, siteId) {
  const asked = siteId === undefined || siteId === null || siteId === "" ? null : siteId;
  if (Number.isInteger(ctx.siteScope)) {
    if (asked !== null && Number(asked) !== ctx.siteScope) throw new MarketingError("not_found", "Site introuvable.");
    return { reach: "site", siteId: ctx.siteScope };
  }
  if (asked === null) return { reach: "organization", siteId: null };
  return { reach: "site", siteId: resolveSite(ctx, asked) }; // vérifie que le site existe dans l'organisation
}

// Une clé de site n'a de sens que tant que son site existe et est actif
const keyVisible = (ctx) => (Number.isInteger(ctx.siteScope) ? { sql: " AND site_id = ?", params: [ctx.siteScope] } : { sql: "", params: [] });

// Crée une clé et renvoie la clé COMPLÈTE une seule fois (jamais récupérable ensuite, ni par l'interface ni par l'API)
function createApiKey(ctx, { name, scope = "read", siteId } = {}) {
  checkCtx(ctx);
  const cleanName = cleanText(name, { max: 80, field: "name" });
  if (!cleanName) throw new MarketingError("invalid_field", "Le nom de la clé est obligatoire.");
  if (!SCOPES.includes(scope)) throw new MarketingError("invalid_field", "Portée invalide (lecture ou lecture/écriture attendue).");
  const { reach, siteId: keySite } = resolveReach(ctx, siteId);
  const raw = generateRawKey();
  let id;
  try {
    id = Number(
      ctx.db
        .prepare("INSERT INTO mk_api_keys (organization_id, name, prefix, key_hash, scope, created_by, reach, site_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(ctx.organizationId, cleanName, raw.slice(0, 12), hashOf(raw), scope, ctx.userId ?? null, reach, keySite).lastInsertRowid
    );
  } catch (error) {
    if (/UNIQUE/.test(error.message)) throw new MarketingError("duplicate", `Une clé nommée « ${cleanName} » existe déjà.`);
    throw error;
  }
  audit(ctx, "api_key.created", "api_key", id, { name: cleanName, scope, reach, site_id: keySite });
  return { id, name: cleanName, scope, reach, siteId: keySite, key: raw }; // `key` : à copier immédiatement, ne réapparaîtra plus
}

function listApiKeys(ctx) {
  checkCtx(ctx);
  const vis = keyVisible(ctx);
  return ctx.db
    .prepare(`SELECT k.id, k.name, k.prefix, k.scope, k.reach, k.site_id, s.name AS site_name, k.created_at, k.last_used_at, k.revoked_at FROM mk_api_keys k LEFT JOIN mk_sites s ON s.id = k.site_id WHERE k.organization_id = ?${vis.sql.replace("site_id", "k.site_id")} ORDER BY k.id DESC`)
    .all(ctx.organizationId, ...vis.params);
}

function revokeApiKey(ctx, id) {
  checkCtx(ctx);
  const vis = keyVisible(ctx);
  const key = ctx.db.prepare(`SELECT id, name, revoked_at, reach, site_id FROM mk_api_keys WHERE id = ? AND organization_id = ?${vis.sql}`).get(id, ctx.organizationId, ...vis.params);
  if (!key) throw new MarketingError("not_found", "Clé introuvable.");
  if (key.revoked_at) return `« ${key.name} » est déjà révoquée.`;
  ctx.db.prepare("UPDATE mk_api_keys SET revoked_at = datetime('now') WHERE id = ?").run(id);
  audit(ctx, "api_key.revoked", "api_key", id, { name: key.name, reach: key.reach, site_id: key.site_id });
  return `Clé « ${key.name} » révoquée : elle ne fonctionnera plus immédiatement.`;
}

// Authentifie une requête d'API : renvoie le contexte de la clé, ou null (clé absente, inconnue ou révoquée).
// N'écrit `last_used_at` que si la dernière écriture date de plus d'une minute (une clé très active n'écrit pas à chaque requête).
function authenticate(db, rawKey) {
  if (typeof rawKey !== "string" || !rawKey.startsWith(PREFIX) || rawKey.length > 200) return null;
  const row = db.prepare("SELECT id, organization_id, scope, reach, site_id, last_used_at FROM mk_api_keys WHERE key_hash = ? AND revoked_at IS NULL").get(hashOf(rawKey));
  if (!row) return null;
  // Clé limitée à un site : refusée si son site n'existe plus ou n'est plus actif (même effet que la révocation, sans rien modifier). Une portée inconnue est refusée par prudence.
  if (row.reach === "site") {
    const site = Number.isInteger(row.site_id) ? db.prepare("SELECT status, deleted_at FROM mk_sites WHERE id = ? AND organization_id = ?").get(row.site_id, row.organization_id) : null;
    if (!site || site.status !== "active" || site.deleted_at) return null;
  } else if (row.reach !== "organization") return null;
  const stale = !row.last_used_at || Date.now() - Date.parse(`${row.last_used_at.replace(" ", "T")}Z`) > 60_000;
  if (stale) db.prepare("UPDATE mk_api_keys SET last_used_at = datetime('now') WHERE id = ?").run(row.id);
  return { keyId: row.id, organizationId: row.organization_id, scope: row.scope, reach: row.reach, siteId: row.reach === "site" ? row.site_id : null };
}

module.exports = { SCOPES, createApiKey, listApiKeys, revokeApiKey, authenticate, hashOf, generateRawKey };
