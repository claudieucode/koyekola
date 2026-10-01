// Centre de préférences : catégories d'envois que la personne peut accepter ou refuser une à une.
// Pas de ligne de préférence = catégorie ouverte. Choisir une catégorie ne réabonne JAMAIS un désinscrit.
const { createRepository } = require("../db/repository");
const { getContact } = require("../audience/contacts");
const { checkCtx, cleanText, audit, MarketingError } = require("../audience/shared");

const KEY = /^[a-z][a-z0-9_]{0,39}$/;

function createCategory(ctx, { key, label, description = "" } = {}) {
  checkCtx(ctx);
  if (typeof key !== "string" || !KEY.test(key)) throw new MarketingError("invalid_field", "Clé invalide : minuscules, chiffres et « _ », commençant par une lettre.");
  const cleanLabel = cleanText(label, { max: 100, field: "label" });
  if (!cleanLabel) throw new MarketingError("invalid_field", "Le libellé est obligatoire.");
  const repo = createRepository(ctx.db, ctx.organizationId).table("mk_preference_categories");
  if (repo.count({ key }) > 0) throw new MarketingError("duplicate", "Une catégorie porte déjà cette clé.");
  const row = repo.insert({ key, label: cleanLabel, description: cleanText(description, { max: 300, field: "description" }), position: repo.count() });
  audit(ctx, "preference_category.created", "preference_category", row.id, { key });
  return row;
}

const listCategories = (ctx) => (
  checkCtx(ctx),
  ctx.db.prepare("SELECT * FROM mk_preference_categories WHERE organization_id = ? ORDER BY position, id").all(ctx.organizationId)
);

function preferencesOf(ctx, contactId) {
  checkCtx(ctx);
  if (!getContact(ctx, contactId)) throw new MarketingError("not_found", "Contact introuvable.");
  return ctx.db
    .prepare(
      `SELECT k.key, k.label, k.description, COALESCE(p.subscribed, 1) AS subscribed FROM mk_preference_categories k
       LEFT JOIN mk_contact_preferences p ON p.category_id = k.id AND p.contact_id = ? AND p.organization_id = k.organization_id
       WHERE k.organization_id = ? ORDER BY k.position, k.id`
    )
    .all(contactId, ctx.organizationId)
    .map((r) => ({ ...r, subscribed: r.subscribed === 1 }));
}

function setPreference(ctx, contactId, categoryKey, subscribed) {
  checkCtx(ctx);
  if (!getContact(ctx, contactId)) throw new MarketingError("not_found", "Contact introuvable.");
  const category = ctx.db.prepare("SELECT id FROM mk_preference_categories WHERE organization_id = ? AND key = ?").get(ctx.organizationId, String(categoryKey));
  if (!category) throw new MarketingError("not_found", "Catégorie introuvable.");
  ctx.db
    .prepare(
      `INSERT INTO mk_contact_preferences (organization_id, contact_id, category_id, subscribed) VALUES (?, ?, ?, ?)
       ON CONFLICT (contact_id, category_id) DO UPDATE SET subscribed = excluded.subscribed, updated_at = datetime('now')`
    )
    .run(ctx.organizationId, contactId, category.id, subscribed ? 1 : 0);
  return { ok: true };
}

module.exports = { createCategory, listCategories, preferencesOf, setPreference };
