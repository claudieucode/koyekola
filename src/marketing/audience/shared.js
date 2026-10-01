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

function emit(ctx, name, { contact, metadata = {}, idempotencyKey = null, source = "marketing" }) {
  if (!ctx.bus) return;
  ctx.bus.emit({ organizationId: ctx.organizationId, name, email: contact.email, contactId: contact.id, source, metadata, idempotencyKey });
}

module.exports = { checkCtx, cleanText, audit, emit, MarketingError };
