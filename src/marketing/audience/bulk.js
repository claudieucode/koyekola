// Actions groupées sur une sélection de contacts (interface). Tout ou rien : un identifiant inconnu ou d'une autre
// organisation annule l'opération entière. Ces actions ne touchent jamais au statut ni au consentement.
const { transaction } = require("../db/tx");
const { checkCtx, MarketingError } = require("./shared");
const { tagContact, untagContact } = require("./tags");

const MAX_SELECTION = 200;

function checkSelection(ctx, ids) {
  checkCtx(ctx);
  if (!Array.isArray(ids) || ids.length === 0) throw new MarketingError("invalid_field", "Sélectionnez au moins un contact.");
  if (!ids.every((id) => Number.isInteger(id) && id > 0)) throw new MarketingError("invalid_field", "Sélection invalide.");
  const unique = [...new Set(ids)];
  if (unique.length > MAX_SELECTION) throw new MarketingError("invalid_field", `Sélectionnez ${MAX_SELECTION} contacts au plus à la fois.`);
  const found = ctx.db.prepare(`SELECT COUNT(*) AS n FROM mk_contacts WHERE organization_id = ? AND id IN (${unique.map(() => "?").join(",")})`).get(ctx.organizationId, ...unique).n;
  if (found !== unique.length) throw new MarketingError("not_found", "Un des contacts sélectionnés est introuvable.");
  return unique;
}

function bulkTag(ctx, ids, name) {
  const unique = checkSelection(ctx, ids);
  return transaction(ctx.db, () => {
    let changed = 0;
    for (const id of unique) if (tagContact(ctx, id, name).added) changed++;
    return { processed: unique.length, changed };
  });
}

function bulkUntag(ctx, ids, name) {
  const unique = checkSelection(ctx, ids);
  return transaction(ctx.db, () => {
    let changed = 0;
    for (const id of unique) if (untagContact(ctx, id, name)) changed++;
    return { processed: unique.length, changed };
  });
}

module.exports = { MAX_SELECTION, bulkTag, bulkUntag };
