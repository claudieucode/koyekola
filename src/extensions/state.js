// État d'activation PAR SITE, lu dans mk_site_modules (déjà en production : aucune migration de données). Règles historiques conservées :
// pas de ligne = désactivé ; site principal (null) = jamais soumis pour une extension « always_on_primary » ; une extension inconnue du registre est toujours refusée.
// Cache : par connexion à la base, validé par une estampille (PRAGMA data_version : écriture d'UN AUTRE processus ; total_changes() : écriture de cette connexion) et invalidé explicitement à chaque activation.
// Aucune donnée d'un autre site n'est jamais lue pour répondre à un site : la clé de cache contient l'organisation ET le site.
const registry = require("./registry");

const caches = new WeakMap(); // db → { version, sites: Map("org:site" → Set(ids)) }
const stats = { hits: 0, misses: 0, invalidations: 0 };

// Estampille de la base : data_version (écritures d'UNE AUTRE connexion ou d'un autre processus) + total_changes() (écritures de CETTE connexion, y compris un UPDATE direct qui contournerait le moteur).
function stampOf(db) {
  try { return `${db.prepare("PRAGMA data_version").get().data_version}:${db.prepare("SELECT total_changes() AS c").get().c}`; } catch { return null; }
}
function cacheFor(db) {
  let c = caches.get(db);
  const version = stampOf(db);
  if (!c || c.version !== version || version === null) { c = { version, sites: new Map() }; caches.set(db, c); }
  return c;
}
function invalidate(db, organizationId, siteId) {
  const c = caches.get(db);
  stats.invalidations += 1;
  if (!c) return;
  if (siteId === undefined) c.sites.clear(); else c.sites.delete(`${organizationId}:${siteId}`);
  c.version = stampOf(db); if (c.version === null) caches.delete(db);
}

// Ensemble des extensions activées pour un site (jamais pour le principal : voir isEnabled).
function enabledSet(db, organizationId, siteId) {
  const c = cacheFor(db);
  const key = `${organizationId}:${siteId}`;
  const hit = c.sites.get(key);
  if (hit) { stats.hits += 1; return hit; }
  stats.misses += 1;
  let rows = [];
  try { rows = db.prepare("SELECT module FROM mk_site_modules WHERE site_id = ? AND organization_id = ? AND enabled = 1").all(siteId, organizationId); } catch { rows = []; }
  const set = new Set(rows.map((r) => r.module).filter((id) => registry.load().has(id)));
  c.sites.set(key, set);
  return set;
}

function isEnabled(db, organizationId, siteId, id) {
  const m = registry.load().get(id);
  if (!m) return false;
  if (siteId === null || siteId === undefined) return m.scope === "always_on_primary";
  if (!Number.isInteger(siteId) || siteId < 1 || !Number.isInteger(organizationId)) return false;
  return enabledSet(db, organizationId, siteId).has(id);
}
// Identifiants activés, pour construire le menu d'un site
const enabledIds = (db, organizationId, siteId) => [...enabledSet(db, organizationId, siteId)];

module.exports = { isEnabled, enabledIds, invalidate, stats };
