// Blocs enregistrés (« Mes blocs ») : un ou plusieurs blocs mis en forme, réutilisables dans tous les modèles de l'organisation.
// Le contenu est revalidé par le moteur à l'enregistrement du modèle qui l'utilise (rien n'est envoyé tel quel).
const { checkCtx, cleanText, audit, MarketingError } = require("../audience/shared");
const { TYPES } = require("./blocks");

const MAX_BLOCKS = 12, MAX_BYTES = 100000, MAX_SAVED = 200;

function parse(row) {
  return row ? { id: row.id, name: row.name, blocks: JSON.parse(row.blocks), created_at: row.created_at } : null;
}

function listSavedBlocks(ctx) {
  checkCtx(ctx);
  return ctx.db.prepare("SELECT id, name, blocks, created_at FROM mk_saved_blocks WHERE organization_id = ? ORDER BY name COLLATE NOCASE").all(ctx.organizationId).map(parse);
}

function createSavedBlock(ctx, input = {}) {
  checkCtx(ctx);
  const name = cleanText(input.name, { max: 80, field: "nom" });
  if (!name) throw new MarketingError("invalid_field", "Donnez un nom à ce bloc.");
  const list = Array.isArray(input.blocks) ? input.blocks : [];
  if (!list.length || list.length > MAX_BLOCKS) throw new MarketingError("invalid_field", `Un bloc enregistré contient de 1 à ${MAX_BLOCKS} blocs.`);
  const blocks = list.map((b) => {
    if (!b || typeof b !== "object" || Array.isArray(b) || !TYPES.includes(b.type)) throw new MarketingError("invalid_field", "Type de bloc inconnu.");
    const { id, snapshot, ...rest } = b; // l'identifiant est recréé à chaque insertion ; un instantané de formation est repris du catalogue
    return rest;
  });
  const json = JSON.stringify(blocks);
  if (json.length > MAX_BYTES) throw new MarketingError("invalid_field", "Ce bloc est trop volumineux pour être enregistré.");
  const count = ctx.db.prepare("SELECT COUNT(*) n FROM mk_saved_blocks WHERE organization_id = ?").get(ctx.organizationId).n;
  if (count >= MAX_SAVED) throw new MarketingError("invalid_field", `Limite atteinte : ${MAX_SAVED} blocs enregistrés au plus.`);
  if (ctx.db.prepare("SELECT 1 FROM mk_saved_blocks WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, name)) throw new MarketingError("duplicate", "Un bloc enregistré porte déjà ce nom.");
  const info = ctx.db.prepare("INSERT INTO mk_saved_blocks (organization_id, name, blocks, created_by) VALUES (?, ?, ?, ?)").run(ctx.organizationId, name, json, ctx.userId ?? null);
  audit(ctx, "saved_block.created", "saved_block", Number(info.lastInsertRowid), { blocks: blocks.length });
  return parse(ctx.db.prepare("SELECT id, name, blocks, created_at FROM mk_saved_blocks WHERE id = ?").get(info.lastInsertRowid));
}

function deleteSavedBlock(ctx, id) {
  checkCtx(ctx);
  const removed = Number.isInteger(id) && ctx.db.prepare("DELETE FROM mk_saved_blocks WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId).changes > 0;
  if (removed) audit(ctx, "saved_block.deleted", "saved_block", id, {});
  return removed;
}

module.exports = { listSavedBlocks, createSavedBlock, deleteSavedBlock, MAX_SAVED };
