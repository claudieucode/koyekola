// Export CSV des contacts (mêmes filtres que la liste). Par lots (jamais tout en mémoire), avec BOM UTF-8 pour Excel,
// neutralisation des formules (voir import/csv.js toCsv) et journalisation (sans adresse e-mail).
const { checkCtx, audit } = require("./shared");
const { filters } = require("./contacts");
const { tagsForContacts } = require("./tags");
const { toCsv } = require("../import/csv");

const HEADER = ["E-mail", "Prénom", "Nom", "Téléphone", "Société", "Pays", "Langue", "Statut", "Source", "Ajouté le", "Étiquettes", "Listes"];

function listsForContacts(ctx, ids) {
  const map = new Map();
  if (!ids.length) return map;
  const rows = ctx.db
    .prepare(`SELECT m.contact_id, l.name FROM mk_list_members m JOIN mk_lists l ON l.id = m.list_id WHERE m.organization_id = ? AND m.contact_id IN (${ids.map(() => "?").join(",")}) ORDER BY l.name COLLATE NOCASE`)
    .all(ctx.organizationId, ...ids);
  for (const r of rows) { if (!map.has(r.contact_id)) map.set(r.contact_id, []); map.get(r.contact_id).push(r.name); }
  return map;
}

// write(chunk) reçoit le texte au fur et à mesure ; renvoie le nombre de contacts exportés
function exportContacts(ctx, criteria, write, { batchSize = 1000 } = {}) {
  checkCtx(ctx);
  const { sql, params } = filters(ctx, criteria);
  write(`﻿${toCsv([HEADER])}`);
  let afterId = 0;
  let count = 0;
  for (;;) {
    const rows = ctx.db.prepare(`SELECT c.* FROM mk_contacts c WHERE ${sql} AND c.id > ? ORDER BY c.id ASC LIMIT ?`).all(...params, afterId, batchSize);
    if (!rows.length) break;
    const ids = rows.map((r) => r.id);
    const tags = tagsForContacts(ctx, ids);
    const lists = listsForContacts(ctx, ids);
    write(toCsv(rows.map((c) => [c.email, c.first_name, c.last_name, c.phone, c.company, c.country, c.language, c.status, c.source, c.created_at, (tags.get(c.id) ?? []).map((t) => t.name).join("; "), (lists.get(c.id) ?? []).join("; ")])));
    count += rows.length;
    afterId = rows[rows.length - 1].id;
    if (rows.length < batchSize) break;
  }
  audit(ctx, "contacts.exported", "contact", null, { count, filtered: Object.keys(criteria || {}).length > 0 });
  return count;
}

module.exports = { HEADER, exportContacts };
