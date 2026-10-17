// Points d'accès de webhook sortant : création (secret généré et chiffré), liste (jamais le secret en clair),
// révélation à la demande (auditée), modification, suppression.
const crypto = require("crypto");
const { checkCtx, cleanText, audit, resolveSite, MarketingError } = require("../audience/shared");
const { encryptSecret, decryptSecret, parseKey } = require("../security/crypto");
const { isKnownEvent } = require("./catalog");
const { transaction } = require("../db/tx");

const MAX_URL = 2048;
const SECRET_BYTES = 24;

const secretContext = (organizationId, id) => `${organizationId}:webhook:${id}`;

// http(s) uniquement, aucun identifiant dans l'adresse (user:pass@host, souvent une erreur de copier-coller
// dangereuse) ; le blocage des adresses privées/locales se fait à l'ENVOI (delivery.js), où le nom est résolu.
function validateUrl(value) {
  let parsed;
  try {
    parsed = new URL(String(value ?? ""));
  } catch {
    throw new MarketingError("invalid_field", "Adresse invalide.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) throw new MarketingError("invalid_field", "L'adresse doit commencer par http:// ou https://.");
  if (parsed.username || parsed.password) throw new MarketingError("invalid_field", "L'adresse ne doit pas contenir d'identifiants.");
  if (String(value).length > MAX_URL) throw new MarketingError("invalid_field", "Adresse trop longue.");
  return parsed.toString();
}

function validateEvents(input) {
  const list = Array.isArray(input) ? input : typeof input === "string" && input ? [input] : [];
  const clean = [...new Set(list.map((v) => String(v).trim()).filter(Boolean))];
  if (!clean.length) throw new MarketingError("invalid_field", "Choisissez au moins un événement (ou « Tous »).");
  for (const name of clean) if (!isKnownEvent(name)) throw new MarketingError("invalid_field", `Événement inconnu : « ${name} ».`);
  return clean.includes("*") ? ["*"] : clean;
}

function rowToEndpoint(row) {
  return { id: row.id, name: row.name, url: row.url, events: JSON.parse(row.events), enabled: Boolean(row.enabled), reach: row.reach || "organization", siteId: row.site_id ?? null, siteName: row.site_name ?? null, created_at: row.created_at, updated_at: row.updated_at };
}

// Portée de site (R2, décision D4) : un point d'arrivée est « organization » (reçoit les événements de toute l'organisation, comportement historique) ou
// « site » (ne reçoit que les événements de CE site). Décidée ici, côté serveur, à la création, puis figée (la base refuse de la modifier).
// Un utilisateur dont l'accès est limité à un site (ctx.siteScope) ne peut créer que des points d'arrivée de CE site, et ne voit que ceux-là.
function resolveReach(ctx, siteId) {
  const asked = siteId === undefined || siteId === null || siteId === "" ? null : siteId;
  if (Number.isInteger(ctx.siteScope)) {
    if (asked !== null && Number(asked) !== ctx.siteScope) throw new MarketingError("not_found", "Site introuvable.");
    return { reach: "site", siteId: ctx.siteScope };
  }
  if (asked === null) return { reach: "organization", siteId: null };
  return { reach: "site", siteId: resolveSite(ctx, asked) };
}
const visible = (ctx, a = "") => (Number.isInteger(ctx.siteScope) ? { sql: ` AND ${a}site_id = ?`, params: [ctx.siteScope] } : { sql: "", params: [] });

function createEndpoint(ctx, { name, url, events, encryptionKey, siteId }) {
  checkCtx(ctx);
  const cleanName = cleanText(name, { max: 80, field: "name" });
  if (!cleanName) throw new MarketingError("invalid_field", "Le nom est obligatoire.");
  const cleanUrl = validateUrl(url);
  const cleanEvents = validateEvents(events);
  const { reach, siteId: endpointSite } = resolveReach(ctx, siteId);
  parseKey(encryptionKey); // vérifié AVANT toute écriture : sans clé valide, aucune ligne ne doit rester en base avec un secret vide
  const secret = "whsec_" + crypto.randomBytes(SECRET_BYTES).toString("hex");
  // Transaction : si le chiffrement (après coup, car son contexte a besoin de l'identifiant généré par l'INSERT)
  // échouait malgré tout, la ligne créée serait annulée avec lui — jamais de webhook au secret vide en base.
  const id = transaction(ctx.db, () => {
    let newId;
    try {
      newId = Number(
        ctx.db
          .prepare("INSERT INTO mk_webhook_endpoints (organization_id, name, url, secret, events, created_by, reach, site_id) VALUES (?, ?, ?, '', ?, ?, ?, ?)")
          .run(ctx.organizationId, cleanName, cleanUrl, JSON.stringify(cleanEvents), ctx.userId ?? null, reach, endpointSite).lastInsertRowid
      );
    } catch (error) {
      if (/UNIQUE/.test(error.message)) throw new MarketingError("duplicate", `Un point d'accès nommé « ${cleanName} » existe déjà.`);
      throw error;
    }
    ctx.db.prepare("UPDATE mk_webhook_endpoints SET secret = ? WHERE id = ?").run(encryptSecret(secret, encryptionKey, secretContext(ctx.organizationId, newId)), newId);
    return newId;
  });
  audit(ctx, "webhook.created", "webhook_endpoint", id, { name: cleanName, url: cleanUrl, events: cleanEvents, reach, site_id: endpointSite });
  return { id, name: cleanName, url: cleanUrl, events: cleanEvents, reach, siteId: endpointSite, secret }; // `secret` : à copier dans le système qui reçoit les webhooks
}

function listEndpoints(ctx) {
  checkCtx(ctx);
  const vis = visible(ctx, "w.");
  return ctx.db
    .prepare(`SELECT w.*, s.name AS site_name FROM mk_webhook_endpoints w LEFT JOIN mk_sites s ON s.id = w.site_id WHERE w.organization_id = ?${vis.sql} ORDER BY w.id DESC`)
    .all(ctx.organizationId, ...vis.params)
    .map(rowToEndpoint);
}

function requireEndpoint(ctx, id) {
  const vis = visible(ctx);
  const row = ctx.db.prepare(`SELECT * FROM mk_webhook_endpoints WHERE id = ? AND organization_id = ?${vis.sql}`).get(id, ctx.organizationId, ...vis.params);
  if (!row) throw new MarketingError("not_found", "Point d'accès introuvable.");
  return row;
}

function getEndpoint(ctx, id) {
  checkCtx(ctx);
  return rowToEndpoint(requireEndpoint(ctx, id));
}

// Révèle le secret en clair : action distincte, journalisée (le secret ne doit pas apparaître dans une page affichée par défaut)
function revealSecret(ctx, id, { encryptionKey }) {
  checkCtx(ctx);
  const row = requireEndpoint(ctx, id);
  audit(ctx, "webhook.secret_revealed", "webhook_endpoint", id, { name: row.name });
  return decryptSecret(row.secret, encryptionKey, secretContext(ctx.organizationId, id));
}

function setEnabled(ctx, id, enabled) {
  checkCtx(ctx);
  const row = requireEndpoint(ctx, id);
  ctx.db.prepare("UPDATE mk_webhook_endpoints SET enabled = ?, updated_at = datetime('now') WHERE id = ?").run(enabled ? 1 : 0, id);
  audit(ctx, enabled ? "webhook.enabled" : "webhook.disabled", "webhook_endpoint", id, { name: row.name });
  return `« ${row.name} » ${enabled ? "activé" : "mis en pause"}.`;
}

function deleteEndpoint(ctx, id) {
  checkCtx(ctx);
  const row = requireEndpoint(ctx, id);
  ctx.db.prepare("DELETE FROM mk_webhook_endpoints WHERE id = ?").run(id);
  audit(ctx, "webhook.deleted", "webhook_endpoint", id, { name: row.name });
  return `« ${row.name} » supprimé.`;
}

// Points d'accès actifs abonnés à un événement donné (utilisé par le distributeur, index.js).
// `siteId` = site de l'événement (null : événement sans site, du site principal ou de l'organisation). Un point d'arrivée d'organisation reçoit tout
// (comportement historique inchangé) ; un point d'arrivée de site ne reçoit QUE les événements de son site — jamais ceux d'un autre site ni ceux sans site.
function endpointsFor(db, organizationId, eventName, siteId = null) {
  return db
    .prepare("SELECT * FROM mk_webhook_endpoints WHERE organization_id = ? AND enabled = 1")
    .all(organizationId)
    .filter((row) => (row.reach || "organization") === "organization" || (row.reach === "site" && Number.isInteger(row.site_id) && row.site_id === siteId))
    .filter((row) => { const events = JSON.parse(row.events); return events.includes("*") || events.includes(eventName); })
    .map(rowToEndpoint);
}

module.exports = { createEndpoint, listEndpoints, getEndpoint, revealSecret, setEnabled, deleteEndpoint, endpointsFor, validateUrl, validateEvents, secretContext };
