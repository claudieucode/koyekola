// Dépôt de données : TOUT accès aux tables marketing passe par ici.
// Il impose l'organisation à chaque requête (lecture, création, modification, suppression) : un module ne peut donc
// ni lire, ni modifier, ni supprimer la ligne d'une autre organisation, même par erreur.
//
// Sécurité contre l'injection SQL : les noms de tables et de colonnes sont vérifiés contre le schéma réel de la base
// (jamais concaténés tels quels), les opérateurs viennent d'une liste fermée, et TOUTES les valeurs sont liées (?).
const TABLE_NAME = /^mk_[a-z0-9_]+$/;
const OPERATORS = new Set(["=", "!=", "<", "<=", ">", ">=", "like"]);
const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 50;
const MAX_IN = 500;

// Colonnes d'une table (null si elle n'existe pas). Le résultat est gardé en mémoire (un import appelle le dépôt à chaque ligne) et
// recalculé dès que le schéma de la base change (PRAGMA schema_version : migration, colonne ajoutée) : la validation reste exacte.
const statements = new WeakMap(); // db -> Map(SQL -> requête préparée) : préparer une requête coûte plus cher que de l'exécuter
function prepared(db, sql) {
  let map = statements.get(db);
  if (!map) { map = new Map(); statements.set(db, map); }
  let st = map.get(sql);
  if (!st) { if (map.size > 500) map.clear(); st = db.prepare(sql); map.set(sql, st); }
  return st;
}
const schemaCache = new WeakMap(); // db -> { version, tables: Map(nom -> Set | null) }
function tableColumns(db, name) {
  const version = db.prepare("PRAGMA schema_version").get().schema_version;
  let entry = schemaCache.get(db);
  if (!entry || entry.version !== version) { entry = { version, tables: new Map() }; schemaCache.set(db, entry); }
  if (!entry.tables.has(name)) {
    const exists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name);
    entry.tables.set(name, exists ? new Set(db.prepare(`PRAGMA table_info(${name})`).all().map((c) => c.name)) : null);
  }
  return entry.tables.get(name);
}

function bindable(value) {
  if (value === null || typeof value === "string" || typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Uint8Array) return value;
  throw new Error("Valeur non prise en charge : une valeur doit être un texte, un nombre, un booléen ou null (sérialisez les objets explicitement).");
}

// siteScope (palier 16) : un numéro de site → TOUTES les lectures/écritures des tables qui ont une colonne site_id sont limitées à ce site
// (une personne dont l'accès est limité à un site ne peut ni voir, ni modifier, ni créer hors de son site). Absent = toute l'organisation.
// hiddenSites (R4) : sites dont la personne ne peut pas LIRE les éléments (visibility.js) — exclus des lectures en liste et des comptages, jamais des écritures.
function createRepository(db, organizationId, { siteScope, hiddenSites } = {}) {
  if (!Number.isInteger(organizationId) || organizationId < 1) throw new Error("Identifiant d'organisation invalide.");

  function table(name) {
    if (typeof name !== "string" || !TABLE_NAME.test(name)) throw new Error("Nom de table invalide : il doit commencer par mk_ et ne contenir que des minuscules, chiffres et « _ ».");
    const columns = tableColumns(db, name);
    if (!columns) throw new Error(`Table introuvable : ${name}.`);
    if (!columns.has("organization_id")) throw new Error(`${name} n'a pas de colonne organization_id : elle ne peut pas passer par le dépôt.`);
    if (!columns.has("id")) throw new Error(`${name} n'a pas de colonne id : elle ne peut pas passer par le dépôt.`);

    const scoped = Number.isInteger(siteScope) && columns.has("site_id");

    const column = (col) => {
      if (col === "organization_id") throw new Error("organization_id ne peut pas être utilisée ici : elle est imposée par le dépôt.");
      if (typeof col !== "string" || !columns.has(col)) throw new Error(`Colonne inconnue « ${String(col).slice(0, 40)} » pour ${name}.`);
      return col;
    };

    function buildWhere(where = {}) {
      const clauses = ["organization_id = ?"];
      const params = [organizationId];
      if (scoped) { clauses.push("site_id = ?"); params.push(siteScope); }
      if (!scoped && columns.has("site_id") && Array.isArray(hiddenSites) && hiddenSites.length) {
        const ids = hiddenSites.filter((n) => Number.isInteger(n));
        if (ids.length) { clauses.push(`(site_id IS NULL OR site_id NOT IN (${ids.map(() => "?").join(", ")}))`); params.push(...ids); }
      }
      for (const [key, condition] of Object.entries(where)) {
        const col = column(key);
        if (condition === null) clauses.push(`${col} IS NULL`);
        else if (Array.isArray(condition)) {
          if (condition.length > MAX_IN) throw new Error(`Liste de valeurs trop longue (${MAX_IN} au plus).`);
          if (!condition.length) clauses.push("0 = 1");
          else (clauses.push(`${col} IN (${condition.map(() => "?").join(", ")})`), params.push(...condition.map(bindable)));
        } else if (condition && typeof condition === "object" && !(condition instanceof Uint8Array)) {
          if (!OPERATORS.has(String(condition.op).toLowerCase())) throw new Error("Opérateur non autorisé.");
          const op = String(condition.op).toLowerCase();
          if (condition.value === null) clauses.push(`${col} IS ${op === "!=" ? "NOT " : ""}NULL`);
          else (clauses.push(`${col} ${op === "like" ? "LIKE" : op} ?`), params.push(bindable(condition.value)));
        } else {
          clauses.push(`${col} = ?`);
          params.push(bindable(condition));
        }
      }
      return { sql: clauses.join(" AND "), params };
    }

    function assignments(row, { forUpdate = false } = {}) {
      const keys = Object.keys(row);
      for (const key of keys) {
        if (key === "organization_id") throw new Error("organization_id est imposée par le dépôt : elle ne peut être ni fournie ni modifiée.");
        if (forUpdate && key === "id") throw new Error("La colonne id ne peut pas être modifiée.");
        column(key);
      }
      return { keys, values: keys.map((k) => bindable(row[k])) };
    }

    return {
      insert(row = {}) {
        if (scoped && row.site_id !== undefined && row.site_id !== siteScope) throw new Error("Cette création est limitée à votre site.");
        const { keys, values } = assignments(scoped ? { ...row, site_id: siteScope } : row);
        const cols = ["organization_id", ...keys];
        return prepared(db, `INSERT INTO ${name} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")}) RETURNING *`).get(organizationId, ...values);
      },
      get(id) {
        if (!Number.isInteger(id)) return null;
        return db.prepare(`SELECT * FROM ${name} WHERE id = ? AND organization_id = ?${scoped ? " AND site_id = ?" : ""}`).get(id, organizationId, ...(scoped ? [siteScope] : [])) ?? null;
      },
      list({ where, orderBy, limit = DEFAULT_LIMIT, afterId } = {}) {
        if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) throw new Error(`Limite invalide (entre 1 et ${MAX_LIMIT}).`);
        const { sql, params } = buildWhere(where);
        let order = "id ASC";
        let direction = "asc";
        if (orderBy) {
          const col = typeof orderBy === "string" ? orderBy : orderBy.column;
          direction = String((typeof orderBy === "object" && orderBy.direction) || "asc").toLowerCase();
          if (direction !== "asc" && direction !== "desc") throw new Error("Direction de tri invalide (asc ou desc).");
          order = col === "id" ? `id ${direction.toUpperCase()}` : `${column(col)} ${direction.toUpperCase()}, id ${direction.toUpperCase()}`;
        }
        let cursor = "";
        if (afterId !== undefined && afterId !== null) {
          if (order !== `id ${direction.toUpperCase()}`) throw new Error("afterId n'est utilisable qu'avec un tri par id.");
          cursor = ` AND id ${direction === "desc" ? "<" : ">"} ?`;
          params.push(bindable(afterId));
        }
        const rows = db.prepare(`SELECT * FROM ${name} WHERE ${sql}${cursor} ORDER BY ${order} LIMIT ?`).all(...params, limit + 1);
        const hasMore = rows.length > limit;
        const page = hasMore ? rows.slice(0, limit) : rows;
        return { rows: page, nextAfterId: hasMore ? page[page.length - 1].id : null };
      },
      count(where) {
        const { sql, params } = buildWhere(where);
        return db.prepare(`SELECT COUNT(*) AS n FROM ${name} WHERE ${sql}`).get(...params).n;
      },
      update(id, patch = {}) {
        if (!Number.isInteger(id)) return null;
        if (scoped && patch.site_id !== undefined && patch.site_id !== siteScope) throw new Error("Cette modification est limitée à votre site.");
        const { keys, values } = assignments(patch, { forUpdate: true });
        if (!keys.length) return this.get(id);
        return (
          db.prepare(`UPDATE ${name} SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ? AND organization_id = ?${scoped ? " AND site_id = ?" : ""} RETURNING *`).get(...values, id, organizationId, ...(scoped ? [siteScope] : [])) ?? null
        );
      },
      remove(id) {
        if (!Number.isInteger(id)) return false;
        return db.prepare(`DELETE FROM ${name} WHERE id = ? AND organization_id = ?${scoped ? " AND site_id = ?" : ""}`).run(id, organizationId, ...(scoped ? [siteScope] : [])).changes > 0;
      },
    };
  }

  return { organizationId, table };
}

module.exports = { createRepository, prepared };
