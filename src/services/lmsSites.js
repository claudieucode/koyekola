// Titan XXIII — LMS multi-sites : UN moteur de formations, des données rattachées à un site (table mk_course_sites, migration 119).
// Convention (comme les articles, voir mk_content_sites) : formation SANS ligne = site principal ; site_id n'est JAMAIS lu depuis la requête du navigateur,
// seulement déduit côté serveur (domaine résolu, droits de la personne). Sections, leçons, inscriptions, progression, quiz, avis, certificats héritent du site par leur formation.
const { MarketingError } = require("../marketing/errors");
const primarySite = require("./primarySite");
const siteModules = require("../marketing/siteModules");

const isSiteId = (v) => Number.isInteger(v) && v >= 1;
const hasTable = (db) => { try { return db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'mk_course_sites'").get() !== undefined; } catch { return false; } };

// Site d'une formation : id de site, ou null (= site principal). Formation inexistante → undefined.
function siteOfCourse(db, courseId) {
  if (!Number.isInteger(courseId)) return undefined;
  const course = db.prepare("SELECT id FROM courses WHERE id = ?").get(courseId);
  if (!course) return undefined;
  if (!hasTable(db)) return null;
  const row = db.prepare("SELECT site_id FROM mk_course_sites WHERE course_id = ?").get(courseId);
  return row ? row.site_id : null;
}

// Fragment SQL « la formation <alias> appartient à ce site » : null/undefined = site principal (aucune ligne). À combiner avec les autres filtres, jamais à la place.
// Renvoie { sql, params } à insérer dans un WHERE (le site est lié par paramètre, jamais concaténé).
function scopeSql(siteId, alias = "courses") {
  const a = String(alias).replace(/[^A-Za-z0-9_]/g, "");
  if (siteId === null || siteId === undefined) return { sql: `NOT EXISTS (SELECT 1 FROM mk_course_sites cs WHERE cs.course_id = ${a}.id)`, params: [] };
  if (!isSiteId(siteId)) return { sql: "0", params: [] }; // identifiant invalide : rien, jamais « tout »
  return { sql: `EXISTS (SELECT 1 FROM mk_course_sites cs WHERE cs.course_id = ${a}.id AND cs.site_id = ?)`, params: [siteId] };
}

// La formation est-elle visible dans ce contexte de site ? (utilisé par chaque route qui reçoit un identifiant de formation)
function belongsTo(db, courseId, siteId) {
  const owner = siteOfCourse(db, courseId);
  if (owner === undefined) return false;
  return (siteId ?? null) === owner;
}

// Rattache une formation à un site (équipe ou administrateur de CE site). Le site doit exister, ne pas être supprimé, avoir le module « lms » activé ;
// une formation déjà rattachée à un autre site n'est pas déplacée silencieusement (déplacement explicite : moveCourse).
function assignCourse(ctx, courseId, siteId) {
  if (!isSiteId(siteId)) throw new MarketingError("invalid_field", "Site invalide.");
  const site = ctx.db.prepare(`SELECT id, deleted_at FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(ctx.db)}`).get(siteId, ctx.organizationId);
  if (!site || site.deleted_at) throw new MarketingError("not_found", "Site introuvable.");
  if (ctx.siteScope !== undefined && ctx.siteScope !== null && ctx.siteScope !== siteId) throw new MarketingError("forbidden", "Cette personne n'est pas autorisée sur ce site.");
  if (!siteModules.isEnabled(ctx.db, ctx.organizationId, siteId, "lms")) throw new MarketingError("module_disabled", "Le module « Formations » n'est pas activé pour ce site.");
  const owner = siteOfCourse(ctx.db, courseId);
  if (owner === undefined) throw new MarketingError("not_found", "Formation introuvable.");
  if (owner === siteId) return { changed: false };
  if (owner !== null) throw new MarketingError("conflict", "Cette formation appartient déjà à un autre site.");
  ctx.db.prepare("INSERT INTO mk_course_sites (course_id, organization_id, site_id, created_by) VALUES (?, ?, ?, ?)").run(courseId, ctx.organizationId, siteId, ctx.userId ?? null);
  return { changed: true };
}

// Sites proposés pour y publier des formations : de l'organisation, non supprimés, module « lms » activé (jamais la ligne dédiée du site principal)
function siteChoices(db, organizationId) {
  if (!Number.isInteger(organizationId)) return [];
  return db.prepare(`SELECT s.id, s.name FROM mk_sites s JOIN mk_site_modules m ON m.site_id = s.id AND m.module = 'lms' AND m.enabled = 1
    WHERE s.organization_id = ? AND s.deleted_at IS NULL${primarySite.excludeSql(db, "s")} ORDER BY s.name COLLATE NOCASE`).all(organizationId).map((r) => ({ id: r.id, name: r.name }));
}

// Lignes dont la formation n'existe plus (aucune donnée de formation n'est touchée).
function purgeOrphans(db) {
  if (!hasTable(db)) return 0;
  return Number(db.prepare("DELETE FROM mk_course_sites WHERE course_id NOT IN (SELECT id FROM courses)").run().changes);
}

// Contexte de site d'une requête, déduit du DOMAINE résolu côté serveur (req.kwSite), jamais d'un paramètre : null = site principal ;
// identifiant = site dont le module « lms » est activé ; 0 = domaine de site SANS module actif (aucune formation visible, refus de tout accès : fermé par défaut).
function contextFor(db, kwSite) {
  if (!kwSite) return null;
  const siteId = Number(kwSite.id);
  if (!isSiteId(siteId)) return 0;
  try {
    const row = db.prepare("SELECT organization_id FROM mk_sites WHERE id = ? AND deleted_at IS NULL").get(siteId);
    return row && siteModules.isEnabled(db, row.organization_id, siteId, "lms") ? siteId : 0;
  } catch { return 0; }
}
function attach(db) {
  return (req, res, next) => { req.lmsSite = contextFor(db, req.kwSite); next(); };
}

module.exports = { contextFor, attach, siteOfCourse, scopeSql, belongsTo, assignCourse, siteChoices, purgeOrphans, hasTable };
