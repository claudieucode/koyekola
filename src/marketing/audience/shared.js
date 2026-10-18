// Éléments communs de l'audience : contexte, nettoyage de texte, audit, événements.
const { MarketingError } = require("../errors");
const primarySite = require("../../services/primarySite"); // R9-4 : la ligne dédiée du site principal n'est pas un site ordinaire
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
  // R7 lot 4 : site de l'événement = site de la ressource relu en base ; à défaut, le site imposé à un accès LIMITÉ (ctx.siteScope, posé par le serveur)
  recordAudit(ctx.db, { organizationId: ctx.organizationId, userId: ctx.userId, action, resourceType, resourceId, metadata, fallbackSiteId: Number.isInteger(ctx.siteScope) ? ctx.siteScope : undefined });
}

function emit(ctx, name, { contact, metadata = {}, idempotencyKey = null, source = "marketing", siteId = null, objectType = null, objectId = null, actorUserId = null, occurredAt }) {
  if (!ctx.bus) return;
  ctx.bus.emit({ organizationId: ctx.organizationId, name, email: contact.email, contactId: contact.id, source, metadata, idempotencyKey, siteId, objectType, objectId, actorUserId, occurredAt });
}

// ---------- Contexte de site (palier 16) ----------
// ctx.siteScope (nombre) : accès LIMITÉ à ce site — imposé par le serveur, jamais par l'adresse ; ctx.siteFilter : simple filtre d'affichage de l'équipe de l'organisation
// ("principal" = données sans site). Les contacts, eux, restent dans le Contact Core.
function resolveSite(ctx, siteId) {
  if (Number.isInteger(ctx.siteScope)) return ctx.siteScope;
  if (siteId === undefined || siteId === null || siteId === "") return null;
  const id = Number(siteId);
  if (!Number.isInteger(id) || id < 1 || !ctx.db.prepare(`SELECT 1 FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(ctx.db)}`).get(id, ctx.organizationId)) throw new MarketingError("not_found", "Site introuvable.");
  return id;
}
// Fragment SQL de portée pour une table portant site_id (alias `a`)
const { notHiddenSql } = require("../visibility");
function siteSql(ctx, a) {
  if (Number.isInteger(ctx.siteScope)) return { sql: `${a}.site_id = ?`, params: [ctx.siteScope] };
  // R4 : sites dont la personne ne peut pas lire les éléments de cet écran (ctx.hiddenSites, posé par visibility.attach) : toujours exclus, avec ou sans filtre d'affichage
  const hid = notHiddenSql(ctx.hiddenSites, `${a}.site_id`);
  let base;
  if (ctx.siteFilter === "principal") base = { sql: `${a}.site_id IS NULL`, params: [] };
  else if (Number.isInteger(ctx.siteFilter)) base = { sql: `${a}.site_id = ?`, params: [ctx.siteFilter] };
  else return hid;
  return hid.params.length ? { sql: `${base.sql} AND ${hid.sql}`, params: [...base.params, ...hid.params] } : base;
}

module.exports = { checkCtx, cleanText, audit, emit, resolveSite, siteSql, MarketingError };
