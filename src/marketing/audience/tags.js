// Étiquettes : mots-clés libres posés sur les contacts (créés à la volée, insensibles à la casse).
const { createRepository } = require("../db/repository");
const { transaction } = require("../db/tx");
const { checkCtx, cleanText, audit, emit, MarketingError } = require("./shared");

function cleanName(name) {
  if (typeof name !== "string") throw new MarketingError("invalid_field", "Le nom de l'étiquette doit être un texte.");
  const text = name.replace(/[\x00-\x1f\x7f]/g, "").trim();
  if (!text) throw new MarketingError("invalid_field", "Le nom de l'étiquette est obligatoire.");
  if (text.length > 64) throw new MarketingError("invalid_field", "Nom d'étiquette trop long (64 caractères au plus).");
  return text;
}

function ensureTag(ctx, name) {
  checkCtx(ctx);
  const text = cleanName(name);
  const found = ctx.db.prepare("SELECT * FROM mk_tags WHERE organization_id = ? AND name = ?").get(ctx.organizationId, text);
  return found ?? createRepository(ctx.db, ctx.organizationId).table("mk_tags").insert({ name: text });
}

function tagContact(ctx, contactId, name) {
  checkCtx(ctx);
  const text = cleanName(name);
  return transaction(ctx.db, () => {
    const contact = Number.isInteger(contactId) ? ctx.db.prepare("SELECT id, email FROM mk_contacts WHERE id = ? AND organization_id = ?").get(contactId, ctx.organizationId) : null;
    if (!contact) throw new MarketingError("not_found", "Contact introuvable.");
    const tag = ensureTag(ctx, text);
    const added = ctx.db.prepare("INSERT OR IGNORE INTO mk_contact_tags (organization_id, contact_id, tag_id) VALUES (?, ?, ?)").run(ctx.organizationId, contactId, tag.id).changes > 0;
    if (added) emit(ctx, "tag.added", { contact, idempotencyKey: `tag.added:${contactId}:${tag.id}`, metadata: { tag: tag.name } });
    return { tag, added };
  });
}

function untagContact(ctx, contactId, name) {
  checkCtx(ctx);
  const tag = ctx.db.prepare("SELECT id FROM mk_tags WHERE organization_id = ? AND name = ?").get(ctx.organizationId, cleanName(name));
  if (!tag) return false;
  return ctx.db.prepare("DELETE FROM mk_contact_tags WHERE contact_id = ? AND tag_id = ? AND organization_id = ?").run(contactId, tag.id, ctx.organizationId).changes > 0;
}

const tagsOf = (ctx, contactId) => (
  checkCtx(ctx),
  ctx.db
    .prepare("SELECT t.id, t.name FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE ct.contact_id = ? AND ct.organization_id = ? ORDER BY t.name COLLATE NOCASE")
    .all(contactId, ctx.organizationId)
);

const listTags = (ctx) => (
  checkCtx(ctx),
  ctx.db
    .prepare(
      `SELECT t.*, (SELECT COUNT(*) FROM mk_contact_tags ct WHERE ct.tag_id = t.id AND ct.organization_id = t.organization_id) AS contact_count
       FROM mk_tags t WHERE t.organization_id = ? ORDER BY t.name COLLATE NOCASE`
    )
    .all(ctx.organizationId)
);

function deleteTag(ctx, id) {
  checkCtx(ctx);
  const removed = createRepository(ctx.db, ctx.organizationId).table("mk_tags").remove(id);
  if (removed) audit(ctx, "tag.deleted", "tag", id, {});
  return removed;
}

// Étiquettes de plusieurs contacts en une seule requête : Map contactId → [{ id, name }]
function tagsForContacts(ctx, contactIds) {
  checkCtx(ctx);
  const map = new Map();
  const ids = [...new Set(contactIds)].filter((id) => Number.isInteger(id));
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    const rows = ctx.db
      .prepare(`SELECT ct.contact_id, t.id, t.name FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE ct.organization_id = ? AND ct.contact_id IN (${chunk.map(() => "?").join(",")}) ORDER BY t.name COLLATE NOCASE`)
      .all(ctx.organizationId, ...chunk);
    for (const r of rows) {
      if (!map.has(r.contact_id)) map.set(r.contact_id, []);
      map.get(r.contact_id).push({ id: r.id, name: r.name });
    }
  }
  return map;
}

module.exports = { tagsForContacts, ensureTag, tagContact, untagContact, tagsOf, listTags, deleteTag };
