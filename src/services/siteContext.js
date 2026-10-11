// KOLAKISA — contexte de site (palier 2) : UNE seule fonction décide « quel site, pour qui, avec quels droits ».
//
//   identité vérifiée (session) + identifiant de site demandé (adresse, formulaire…) ─► resolve() ─► { ok, site, perms } | { ok: false, reason }
//
// Principes :
//  - Aucun état global : le contexte est calculé À CHAQUE requête à partir de la base (un retrait d'accès, un archivage ou une suppression
//    sont immédiats) et rattaché à la requête (req.mk.site), jamais à une variable partagée entre utilisateurs.
//  - Un identifiant de site envoyé par le navigateur n'est qu'une DEMANDE : il n'est accepté que si le site existe dans l'organisation,
//    n'est pas supprimé (ni archivé, sauf demande explicite) et si la personne y a accès (équipe de l'organisation ou rôle sur CE site).
//  - « null » désigne le site principal (contenus sans site_id) : réservé à l'équipe de l'organisation, jamais à un accès limité à un site.
//  - Les droits sont ceux de cmsAccess.effectivePermissions (rôle d'équipe + rôle sur le site).
const access = require("./cmsAccess");

const REASONS = {
  invalid: "Identifiant de site invalide.",
  not_found: "Site introuvable.",
  deleted: "Ce site a été supprimé.",
  archived: "Ce site est archivé : restaurez-le d'abord.",
  forbidden: "Vous n'avez pas accès à ce site.",
};

const parseId = (raw) => (raw === null || raw === undefined || raw === "" ? null : /^\d{1,12}$/.test(String(raw)) ? Number(raw) : NaN);

// → { ok: true, site: null | { id, name, slug, status, deleted_at }, siteId, perms, orgMember } | { ok: false, reason, message }
function resolve(db, { userId, organizationId }, rawSiteId, { allowArchived = false, allowDeleted = false } = {}) {
  const fail = (reason) => ({ ok: false, reason, message: REASONS[reason] });
  const siteId = parseId(rawSiteId);
  if (Number.isNaN(siteId)) return fail("invalid");
  const orgMember = Boolean(access.membershipOf(userId, organizationId));
  const perms = access.effectivePermissions(userId, { organizationId, siteId });
  if (siteId === null) return orgMember && perms.size ? { ok: true, site: null, siteId: null, perms, orgMember } : fail("forbidden");
  const site = db.prepare("SELECT id, name, slug, status, deleted_at FROM mk_sites WHERE id = ? AND organization_id = ?").get(siteId, organizationId);
  // Sans accès, on ne révèle pas si le site existe (même réponse qu'un site inconnu)
  const hasAccess = orgMember || Boolean(access.siteRoleOf(userId, siteId));
  if (!site || !hasAccess || !perms.size) return fail(!site && orgMember ? "not_found" : hasAccess ? "forbidden" : "not_found");
  if (site.deleted_at && !allowDeleted) return fail("deleted");
  if (site.status === "archived" && !allowArchived) return fail("archived");
  return { ok: true, site, siteId: site.id, perms, orgMember };
}

// Peut-on faire cette action DANS ce site (autre que celui de la requête en cours) ? Sert aux opérations qui touchent deux sites (déplacer une page…)
function canOn(db, { userId, organizationId }, siteId, permission) {
  const r = resolve(db, { userId, organizationId }, siteId, { allowArchived: false });
  return r.ok && r.perms.has(permission);
}

module.exports = { resolve, canOn, REASONS };
