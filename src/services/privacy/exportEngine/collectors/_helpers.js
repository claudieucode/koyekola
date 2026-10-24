// Aides communes aux collecteurs (ce fichier ne déclare aucun collecteur).
const columnCache = new WeakMap();

// Colonnes réellement présentes dans la table (jamais supposées) : un collecteur ne sélectionne que celles qui existent
function columns(db, table) {
  let byTable = columnCache.get(db);
  if (!byTable) { byTable = new Map(); columnCache.set(db, byTable); }
  if (!byTable.has(table)) {
    let cols = [];
    try { cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name); } catch { cols = []; }
    byTable.set(table, new Set(cols));
  }
  return byTable.get(table);
}
const tableExists = (db, table) => columns(db, table).size > 0;
const hasColumn = (db, table, column) => columns(db, table).has(column);
// Colonnes demandées qui existent, dans l'ordre demandé
const pick = (db, table, wanted) => wanted.filter((c) => hasColumn(db, table, c));

// Date lisible (UTC, ISO 8601) depuis une chaîne SQLite, des secondes ou des millisecondes
function when(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") { const ms = value < 1e11 ? value * 1000 : value; return Number.isFinite(ms) ? new Date(ms).toISOString() : ""; }
  const text = String(value);
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text) ? `${text.replace(" ", "T")}Z` : text;
}

// Contact de CETTE personne dans l'organisation, selon la portée : un site n'obtient que les contacts qui lui sont rattachés (mk_contact_sites) ;
// le site principal (équipe de l'organisation) voit la fiche de l'organisation. Mis en cache dans ctx pour la durée d'un export.
function contactOf(ctx) {
  if (ctx._contact !== undefined) return ctx._contact;
  let row = null;
  if (tableExists(ctx.db, "mk_contacts")) {
    row = ctx.db.prepare("SELECT * FROM mk_contacts WHERE organization_id = ? AND email = ?").get(ctx.organizationId, ctx.subject.email) || null;
    if (row && ctx.siteId !== null) {
      const linked = ctx.db.prepare("SELECT 1 FROM mk_contact_sites WHERE contact_id = ? AND site_id = ? AND organization_id = ?").get(row.id, ctx.siteId, ctx.organizationId);
      if (!linked) row = null;
    }
  }
  ctx._contact = row;
  return row;
}

// Condition SQL « site » pour une colonne site_id (null = site principal)
const siteClause = (column, siteId) => (siteId === null ? { sql: `${column} IS NULL`, params: [] } : { sql: `${column} = ?`, params: [siteId] });

const section = (id, title, columnPairs, rows) => ({ id, title, columns: columnPairs, rows });

module.exports = { columns, tableExists, hasColumn, pick, when, contactOf, siteClause, section };
