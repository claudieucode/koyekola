// Liste de suppression : adresses qui ne reçoivent jamais de marketing. Liée à l'adresse, pas au contact.
const { createRepository } = require("../db/repository");
const { transaction } = require("../db/tx");
const { validateEmail } = require("../audience/email");
const { findByEmail } = require("../audience/contacts");
const { checkCtx, cleanText, audit, emit, MarketingError } = require("../audience/shared");

const REASONS = { bounced: "bounced", complained: "complained", manual: "suppressed" };
const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");

function addSuppression(ctx, { email, reason, note = "" } = {}) {
  checkCtx(ctx);
  const check = validateEmail(email);
  if (!check.ok) throw new MarketingError("invalid_email", check.reason);
  if (!Object.hasOwn(REASONS, reason)) throw new MarketingError("invalid_field", "Motif invalide (bounced, complained ou manual).");
  return transaction(ctx.db, () => {
    const added = ctx.db
      .prepare("INSERT OR IGNORE INTO mk_suppressions (organization_id, email, reason, note) VALUES (?, ?, ?, ?)")
      .run(ctx.organizationId, check.email, reason, cleanText(note, { max: 500, field: "note" })).changes > 0;
    if (!added) return { added: false };
    const contact = findByEmail(ctx, check.email);
    if (contact) {
      ctx.db.prepare("UPDATE mk_contacts SET status = ?, updated_at = ? WHERE id = ? AND organization_id = ?").run(REASONS[reason], now(), contact.id, ctx.organizationId);
      emit(ctx, "contact.suppressed", { contact, source: "marketing", idempotencyKey: `contact.suppressed:${contact.id}:${reason}`, metadata: { reason } });
    }
    audit(ctx, "suppression.added", "suppression", contact?.id ?? null, { reason });
    return { added: true };
  });
}

// Seul un blocage manuel peut être levé ; un rebond ou une plainte réels ne se lèvent pas.
// Le contact revient à « unsubscribed » : il devra redonner son consentement lui-même.
function removeSuppression(ctx, email) {
  checkCtx(ctx);
  const check = validateEmail(email);
  if (!check.ok) throw new MarketingError("invalid_email", check.reason);
  const row = ctx.db.prepare("SELECT * FROM mk_suppressions WHERE organization_id = ? AND email = ?").get(ctx.organizationId, check.email);
  if (!row) return { removed: false };
  if (row.reason !== "manual") throw new MarketingError("not_removable", "Un rebond ou une plainte ne peut pas être levé : l'adresse ne doit plus recevoir de marketing.");
  return transaction(ctx.db, () => {
    ctx.db.prepare("DELETE FROM mk_suppressions WHERE id = ? AND organization_id = ?").run(row.id, ctx.organizationId);
    const contact = findByEmail(ctx, check.email);
    if (contact && contact.status === "suppressed") {
      ctx.db.prepare("UPDATE mk_contacts SET status = 'unsubscribed', unsubscribed_at = ?, updated_at = ? WHERE id = ? AND organization_id = ?").run(now(), now(), contact.id, ctx.organizationId);
      ctx.db.prepare("INSERT OR IGNORE INTO mk_unsubscribes (organization_id, contact_id, scope, source) VALUES (?, ?, 'all', 'admin')").run(ctx.organizationId, contact.id);
    }
    audit(ctx, "suppression.removed", "suppression", contact?.id ?? null, {});
    return { removed: true };
  });
}

// mk_suppressions.reason stocke la CLÉ saisie (bounced/complained/manual), pas la valeur mappée sur
// mk_contacts.status (REASONS.manual = "suppressed" est le statut du CONTACT, jamais le motif de la ligne ici).
const REASON_KEYS = new Set(Object.keys(REASONS));

// `q` filtre par adresse (sous-chaîne) ; `reason` par motif exact (bounced/complained/suppressed) — cursor par id inchangé
function listSuppressions(ctx, { limit = 50, afterId, q, reason } = {}) {
  checkCtx(ctx);
  const where = {};
  const needle = typeof q === "string" ? q.trim() : "";
  if (needle) where.email = { op: "like", value: `%${needle}%` };
  if (reason && REASON_KEYS.has(reason)) where.reason = reason;
  return createRepository(ctx.db, ctx.organizationId).table("mk_suppressions").list({ limit, afterId, where });
}

module.exports = { addSuppression, removeSuppression, listSuppressions };
