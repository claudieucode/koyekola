// Listes : regroupements de contacts. Appartenir à une liste ne donne AUCUN consentement.
const { createRepository } = require("../db/repository");
const { transaction } = require("../db/tx");
const { checkCtx, cleanText, audit, emit, MarketingError } = require("./shared");
const { sendableSql } = require("../compliance/sendable");

const MAX_BATCH = 5000;

function createList(ctx, { name, description = "" } = {}) {
  checkCtx(ctx);
  const cleanName = cleanText(name, { max: 100, field: "name" });
  if (!cleanName) throw new MarketingError("invalid_field", "Le nom de la liste est obligatoire.");
  const repo = createRepository(ctx.db, ctx.organizationId).table("mk_lists");
  if (repo.count({ name: cleanName }) > 0) throw new MarketingError("duplicate", "Une liste porte déjà ce nom.");
  const list = repo.insert({ name: cleanName, description: cleanText(description, { max: 500, field: "description" }) });
  audit(ctx, "list.created", "list", list.id, { name: cleanName });
  return list;
}

const getList = (ctx, id) => (checkCtx(ctx), createRepository(ctx.db, ctx.organizationId).table("mk_lists").get(id));

function requireList(ctx, id) {
  const list = getList(ctx, id);
  if (!list) throw new MarketingError("not_found", "Liste introuvable.");
  return list;
}

function listLists(ctx) {
  checkCtx(ctx);
  return ctx.db
    .prepare(
      `SELECT l.*, (SELECT COUNT(*) FROM mk_list_members m WHERE m.list_id = l.id AND m.organization_id = l.organization_id) AS member_count
       FROM mk_lists l WHERE l.organization_id = ? ORDER BY l.name COLLATE NOCASE`
    )
    .all(ctx.organizationId);
}

// Colonnes de tri autorisées pour la page « Listes » (clé de l'URL → champ réel de la ligne)
const SORT_FIELDS = { name: "name", contacts: "member_count", sendable: "sendable_count", created: "created_at" };

// Listes avec leur effectif ET le nombre de contacts réellement joignables pour cette liste (désinscription par liste comprise).
// `q` filtre par nom/description (insensible à la casse) ; `sort`/`dir` trient le résultat — sans rien changer au
// comportement par défaut (tri par nom) quand ces options ne sont pas fournies.
function listListsWithStats(ctx, { q, sort, dir } = {}) {
  checkCtx(ctx);
  let rows = listLists(ctx).map((l) => {
    const { sql, params } = sendableSql("c", { listId: l.id });
    const sendable = ctx.db.prepare(`SELECT COUNT(*) AS n FROM mk_list_members m JOIN mk_contacts c ON c.id = m.contact_id WHERE m.list_id = ? AND m.organization_id = ? AND ${sql}`).get(l.id, ctx.organizationId, ...params).n;
    return { ...l, sendable_count: sendable };
  });
  const needle = typeof q === "string" ? q.trim().toLowerCase() : "";
  if (needle) rows = rows.filter((l) => l.name.toLowerCase().includes(needle) || (l.description || "").toLowerCase().includes(needle));
  const field = SORT_FIELDS[sort];
  if (field) {
    const sign = dir === "desc" ? -1 : 1;
    rows = rows.slice().sort((a, b) => {
      const av = a[field], bv = b[field];
      return typeof av === "string" ? av.localeCompare(bv, "fr", { sensitivity: "base" }) * sign : (av - bv) * sign;
    });
  }
  return rows;
}

function deleteList(ctx, id) {
  checkCtx(ctx);
  const removed = createRepository(ctx.db, ctx.organizationId).table("mk_lists").remove(id);
  if (removed) audit(ctx, "list.deleted", "list", id, {});
  return removed;
}

function addToList(ctx, listId, contactIds) {
  checkCtx(ctx);
  requireList(ctx, listId);
  if (!Array.isArray(contactIds) || contactIds.length > MAX_BATCH) throw new MarketingError("invalid_field", `Fournir de 0 à ${MAX_BATCH} contacts à la fois.`);
  return transaction(ctx.db, () => {
    const check = ctx.db.prepare("SELECT id, email FROM mk_contacts WHERE id = ? AND organization_id = ?");
    const insert = ctx.db.prepare("INSERT OR IGNORE INTO mk_list_members (organization_id, list_id, contact_id) VALUES (?, ?, ?)");
    let added = 0;
    let alreadyMembers = 0;
    for (const id of contactIds) {
      const contact = Number.isInteger(id) ? check.get(id, ctx.organizationId) : null;
      if (!contact) throw new MarketingError("not_found", `Contact introuvable (${String(id).slice(0, 20)}).`);
      if (insert.run(ctx.organizationId, listId, id).changes) {
        added++;
        emit(ctx, "list.member_added", { contact, idempotencyKey: `list.member_added:${listId}:${id}`, metadata: { listId } });
      } else alreadyMembers++;
    }
    if (added) audit(ctx, "list.members_added", "list", listId, { added });
    return { added, alreadyMembers };
  });
}

function removeFromList(ctx, listId, contactIds) {
  checkCtx(ctx);
  requireList(ctx, listId);
  if (!Array.isArray(contactIds) || contactIds.length > MAX_BATCH) throw new MarketingError("invalid_field", `Fournir de 0 à ${MAX_BATCH} contacts à la fois.`);
  const del = ctx.db.prepare("DELETE FROM mk_list_members WHERE list_id = ? AND contact_id = ? AND organization_id = ?");
  return transaction(ctx.db, () => contactIds.reduce((n, id) => n + del.run(listId, id, ctx.organizationId).changes, 0));
}

function listMembers(ctx, listId, { limit = 50, afterId } = {}) {
  checkCtx(ctx);
  requireList(ctx, listId);
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) throw new MarketingError("invalid_field", "Limite invalide (entre 1 et 200).");
  const rows = ctx.db
    .prepare(
      `SELECT c.* FROM mk_list_members m JOIN mk_contacts c ON c.id = m.contact_id
       WHERE m.list_id = ? AND m.organization_id = ? AND c.id > ? ORDER BY c.id LIMIT ?`
    )
    .all(listId, ctx.organizationId, afterId ? Number(afterId) : 0, limit + 1);
  const more = rows.length > limit;
  const page = more ? rows.slice(0, limit) : rows;
  return { rows: page, nextAfterId: more ? page[page.length - 1].id : null };
}

module.exports = { listListsWithStats, createList, getList, requireList, listLists, deleteList, addToList, removeFromList, listMembers };
