// R9-4 — la LIGNE DÉDIÉE du site principal (mk_sites.is_primary = 1, créée seulement par la migration explicite R9-3) vue par l'application.
// Convention conservée : les contenus du site principal gardent site_id NULL. La ligne dédiée ne sert qu'à IDENTIFIER le principal dans le gestionnaire (nom, adresse lisible, description) :
// elle n'est donc jamais proposée comme un site ordinaire (listes, sélecteurs, compteurs) ni ouvrable par son identifiant (aucun contenu ne doit jamais lui être rattaché par erreur).
// Sans la migration (colonne absente) : tout se comporte exactement comme avant — aucune requête ne référence is_primary.
const cache = new WeakMap();   // base → { version, has } ; PRAGMA schema_version change à chaque modification de structure (migration, retour arrière)

function hasColumn(db) {
  let version;
  try { version = Object.values(db.prepare("PRAGMA schema_version").get())[0]; } catch { return false; }
  const hit = cache.get(db);
  if (hit && hit.version === version) return hit.has;
  let has = false;
  try { has = db.prepare("SELECT 1 x FROM pragma_table_info('mk_sites') WHERE name = 'is_primary'").get() !== undefined; } catch { has = false; }
  cache.set(db, { version, has });
  return has;
}
// La ligne dédiée de l'organisation, ou null (colonne absente ou ligne non créée)
function row(db, organizationId) {
  if (!hasColumn(db)) return null;
  return db.prepare("SELECT * FROM mk_sites WHERE is_primary = 1 AND organization_id = ? LIMIT 1").get(organizationId) || null;
}
// Fragment SQL « n'est pas la ligne dédiée » (vide si la colonne n'existe pas) ; alias = alias de mk_sites dans la requête
function excludeSql(db, alias = "") {
  return hasColumn(db) ? ` AND ${alias ? `${String(alias).replace(/[^A-Za-z0-9_]/g, "")}.` : ""}is_primary = 0` : "";
}
module.exports = { hasColumn, row, excludeSql };
