// Éléments communs de l'audience : contexte, nettoyage de texte, audit, événements.
const { MarketingError } = require("../errors");
const { recordAudit } = require("../audit");

function checkCtx(ctx) {
  if (!ctx || !ctx.db || !Number.isInteger(ctx.organizationId) || ctx.organizationId < 1) throw new Error("Contexte marketing invalide (db et organizationId requis).");
  return ctx;
}

// Texte court : type vérifié, caractères de contrôle retirés, espaces rognés, longueur bornée
function cleanText(value, { max, field }) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new MarketingError("invalid_field", `Le champ « ${field} » doit être un texte.`);
  return value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").trim().slice(0, max);
}

// Journal d'audit des actions d'un utilisateur (jamais d'adresse e-mail : l'audit est en écriture seule, donc non effaçable)
function audit(ctx, action, resourceType, resourceId, metadata) {
  if (ctx.userId == null || ctx.audit === false) return;
  recordAudit(ctx.db, { organizationId: ctx.organizationId, userId: ctx.userId, action, resourceType, resourceId, metadata });
}

function emit(ctx, name, { contact, metadata = {}, idempotencyKey = null, source = "marketing", siteId = null, objectType = null, objectId = null, actorUserId = null }) {
  if (!ctx.bus) return;
  ctx.bus.emit({ organizationId: ctx.organizationId, name, email: contact.email, contactId: contact.id, source, metadata, idempotencyKey, siteId, objectType, objectId, actorUserId });
}

// ---------- Contexte de site (palier 16) ----------
// ctx.siteScope (nombre) : accès LIMITÉ à ce site — imposé par le serveur, jamais par l'adresse ; ctx.siteFilter : simple filtre d'affichage de l'équipe de l'organisation
// ("principal" = données sans site). Les contacts, eux, restent dans le Contact Core.
function resolveSite(ctx, siteId) {
  if (Number.isInteger(ctx.siteScope)) return ctx.siteScope;
  if (siteId === undefined || siteId === null || siteId === "") return null;
  const id = Number(siteId);
  if (!Number.isInteger(id) || id < 1 || !ctx.db.prepare("SELECT 1 FROM mk_sites WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId)) throw new MarketingError("not_found", "Site introuvable.");
  return id;
}
// Fragment SQL de portée pour une table portant site_id (alias `a`)
function siteSql(ctx, a) {
  if (Number.isInteger(ctx.siteScope)) return { sql: `${a}.site_id = ?`, params: [ctx.siteScope] };
  if (ctx.siteFilter === "principal") return { sql: `${a}.site_id IS NULL`, params: [] };
  if (Number.isInteger(ctx.siteFilter)) return { sql: `${a}.site_id = ?`, params: [ctx.siteFilter] };
  return { sql: "1 = 1", params: [] };
}

module.exports = { checkCtx, cleanText, audit, emit, resolveSite, siteSql, MarketingError };
