// Notes d'un contact : texte libre horodaté (chronologie du contact). Écrites par l'action de scénario « Ajouter une note » :
// un passage et une étape ne produisent jamais deux fois la même note (rejouer une étape est sans effet).
const { checkCtx, audit } = require("./shared");
const { MarketingError } = require("../errors");

const MAX_NOTE = 2000;

// → { id, created } ; created = false si cette étape de ce passage avait déjà écrit sa note
function addNote(ctx, contactId, { body, source = "manual", automationId = null, runId = null, stepIndex = null } = {}) {
  checkCtx(ctx);
  const text = typeof body === "string" ? body.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim() : "";
  if (!text) throw new MarketingError("invalid_field", "La note est vide.");
  if (text.length > MAX_NOTE) throw new MarketingError("invalid_field", `Note trop longue (${MAX_NOTE} caractères au plus).`);
  if (!["manual", "automation"].includes(source)) throw new MarketingError("invalid_field", "Source de note invalide.");
  if (!ctx.db.prepare("SELECT 1 FROM mk_contacts WHERE id = ? AND organization_id = ?").get(contactId, ctx.organizationId)) throw new MarketingError("not_found", "Contact introuvable.");
  const info = ctx.db
    .prepare("INSERT OR IGNORE INTO mk_contact_notes (organization_id, contact_id, body, source, automation_id, run_id, step_index) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(ctx.organizationId, contactId, text, source, automationId, runId, stepIndex);
  if (!info.changes) return { id: null, created: false };
  audit(ctx, "contact.note_added", "contact", contactId, { source });
  return { id: Number(info.lastInsertRowid), created: true };
}

function listNotes(ctx, contactId, { limit = 50 } = {}) {
  checkCtx(ctx);
  const cap = Math.min(Math.max(Number(limit) || 50, 1), 200);
  return ctx.db.prepare("SELECT id, body, source, automation_id, created_at FROM mk_contact_notes WHERE contact_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?").all(contactId, ctx.organizationId, cap);
}

module.exports = { addNote, listNotes, MAX_NOTE };
