// R7 (lot 1) — Accès aux contacts selon le site (décision D2 du 16/10/2026) : UNE seule règle, utilisée par les écrans, les actions groupées et les listes.
//   - Équipe de l'organisation (aucun ctx.siteScope) : tous les contacts (ctx.siteFilter n'est qu'un filtre d'affichage).
//   - Accès LIMITÉ à un site (ctx.siteScope, imposé par le serveur, jamais lu dans l'adresse) :
//       LECTURE  : seulement les contacts associés à CE site (origine ou événement) — table mk_contact_sites ;
//       ÉCRITURE : seulement les contacts dont l'ORIGINE est ce site (et la permission d'écriture, vérifiée par les routes).
//   - Un contact sans aucune association (historique du site principal) n'est visible que de l'équipe : jamais accessible « par défaut ».
//   - Fusion et détection de doublons : équipe seulement (voir contactcore/index.js).
const { MarketingError } = require("../errors");

const limited = (ctx) => ctx.siteScope !== undefined && ctx.siteScope !== null;

function linkOf(ctx, contactId) {
  if (!Number.isInteger(ctx.siteScope)) return null;
  const r = ctx.db.prepare("SELECT link FROM mk_contact_sites WHERE contact_id = ? AND site_id = ? AND organization_id = ?").get(contactId, ctx.siteScope, ctx.organizationId);
  return r ? r.link : null;
}
const canRead = (ctx, contact) => Boolean(contact) && (!limited(ctx) || linkOf(ctx, contact.id) !== null);
const canWrite = (ctx, contact) => Boolean(contact) && (!limited(ctx) || linkOf(ctx, contact.id) === "origin");

// Fragment SQL de lecture pour une liste (alias du contact : `c`) ; équipe : rien à ajouter
function readSql(ctx, alias = "c") {
  if (!limited(ctx)) return null;
  return { sql: `EXISTS (SELECT 1 FROM mk_contact_sites cs WHERE cs.contact_id = ${alias}.id AND cs.site_id = ? AND cs.organization_id = ${alias}.organization_id)`, params: [Number.isInteger(ctx.siteScope) ? ctx.siteScope : -1] };
}

// Action groupée : tout l'ensemble doit être modifiable, sinon rien n'est fait (aucun indice sur l'existence d'un contact hors périmètre)
function assertWritableIds(ctx, ids) {
  if (!limited(ctx)) return;
  for (const id of ids) {
    if (!Number.isInteger(id) || linkOf(ctx, id) !== "origin") throw new MarketingError("not_found", "Contact introuvable.");
  }
}
function assertTeam(ctx, what = "Cette opération") {
  if (limited(ctx)) throw new MarketingError("forbidden", `${what} est réservée à l'équipe de l'organisation.`);
}
module.exports = { canRead, canWrite, readSql, assertWritableIds, assertTeam, linkOf };
