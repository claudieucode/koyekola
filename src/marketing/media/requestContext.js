// KOLAKISA Médias — la médiathèque VISÉE par une requête d'administration : toujours UN site, jamais « tous les sites » par défaut.
// Source de vérité unique pour la page, l'API JSON, l'éditeur de pages et le sélecteur partagé (avant MEDIA-ROUTING : l'équipe sans « ?site= » voyait les médias de tous les sites).
//   1. accès limité à un site : le site est imposé par le serveur (ctx.siteScope), jamais lu dans la requête ;
//   2. site explicite et VÉRIFIÉ par le serveur (adresse /sites/<id>/… ou « ?site= » validé, ou « principal ») : ctx.siteFilter ;
//   3. média désigné par son identifiant : la médiathèque DE CE média (chaque opération reste à l'intérieur d'un seul site) ;
//   4. vue d'ensemble de l'équipe : seulement sur demande explicite (?portee=tous | ?portee=site) ;
//   5. sinon : la médiathèque du SITE PRINCIPAL (le comportement historique des envois sans site), jamais celle de tous.
const media = require("./index");
const BY_ID = /\/(?:mediatheque|medias)\/(\d{1,12})(?:\.json|\/|$)/;

function mediaCtx(req, { overview = false } = {}) {
  const ctx = req.mk.ctx;
  if (Number.isInteger(ctx.siteScope) || Number.isInteger(ctx.siteFilter) || ctx.siteFilter === "principal") return ctx;
  const q = req.query || {};
  if (overview && (q.portee === "tous" || q.portee === "site")) return ctx;
  const m = BY_ID.exec(req.path || "");
  if (m) return forId(ctx, Number(m[1]));
  return media.forSite(ctx, null);
}
// Contexte d'une opération sur UN média (actions groupées comprises) : celui du site qui le possède
function forId(ctx, id) {
  if (Number.isInteger(ctx.siteScope) || Number.isInteger(ctx.siteFilter) || ctx.siteFilter === "principal") return ctx;
  const row = ctx.db.prepare("SELECT site_id FROM mk_media WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId);
  return media.forSite(ctx, row ? row.site_id : null);
}
module.exports = { mediaCtx, forId };
