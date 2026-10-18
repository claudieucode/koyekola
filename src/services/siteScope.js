// KOLAKISA — portée de site (palier 3, B1) : UNE seule façon d'écrire « les lignes de CE site » dans une requête SQL.
//
//   siteScope.where(siteId, "p")  →  { sql: " AND p.site_id IS NULL", params: [] }   (site principal)
//                                 →  { sql: " AND p.site_id = ?",     params: [12] } (un site)
//
// Convention (rappel) : site_id NULL = site principal. Le site passé ici doit venir du contexte vérifié de la requête
// (req.mk.siteId / req.mk.site), JAMAIS d'un champ ou d'un « ?site= » envoyé par le navigateur. Tout autre type est refusé
// (un identifiant forgé comme "1 OR 1=1" ou un tableau ne peut donc pas devenir une clause).
function assert(siteId) {
  if (siteId === null) return null;
  if (Number.isInteger(siteId) && siteId > 0) return siteId;
  throw new TypeError("Portée de site invalide : un nombre entier positif ou null (site principal) est attendu.");
}

function where(siteId, alias = "") {
  const id = assert(siteId);
  const column = `${alias ? `${String(alias).replace(/[^A-Za-z0-9_]/g, "")}.` : ""}site_id`;
  return id === null ? { sql: ` AND ${column} IS NULL`, params: [] } : { sql: ` AND ${column} = ?`, params: [id] };
}

// Compte les lignes d'une table de contenu pour un site (table et colonne choisies par le code, jamais par l'utilisateur)
function count(db, table, siteId, extra = "") {
  if (!/^[a-z_][a-z0-9_]*$/.test(table)) throw new TypeError("Nom de table invalide.");
  const w = where(siteId);
  return db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE 1 = 1${w.sql}${extra ? ` AND (${extra})` : ""}`).get(...w.params).n;
}

// R9-2 — vocabulaire commun de la portée « principal ou un site » (comportement INCHANGÉ : le principal reste NULL en base).
//   isPrimary(siteId)     : le site principal est représenté par null ou undefined (jamais par 0, jamais par un identifiant)
//   scopeKey(siteId)      : clé numérique de portée (0 = principal) — la même valeur que celle des index uniques COALESCE(site_id, 0)
//   sameScope("col")      : fragment SQL « cette ligne est dans la même portée que le paramètre » : COALESCE(col, 0) = COALESCE(?, 0)
//                           (à utiliser avec UN paramètre : l'identifiant du site, ou null pour le principal). Les index uniques (DDL) gardent leur expression COALESCE(site_id, 0) telle quelle.
// Quand le principal deviendra une ligne ordinaire (R9-3/R9-4), ces trois fonctions seront les SEULS points à adapter pour les requêtes d'égalité de portée.
const isPrimary = (siteId) => siteId === null || siteId === undefined;
const scopeKey = (siteId) => (isPrimary(siteId) ? 0 : Number(siteId));
function sameScope(column) {
  if (typeof column !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/.test(column)) throw new TypeError("Nom de colonne invalide.");
  return `COALESCE(${column}, 0) = COALESCE(?, 0)`;
}

module.exports = { assert, where, count, isPrimary, scopeKey, sameScope };
