// AI SECURITY LAYER : qui peut utiliser l'IA, qui peut la configurer, sur quel site. Aucun secret n'est géré ici (voir providers.js et le centre de connecteurs).
// `actor` est fourni par le code serveur appelant (jamais lu d'une requête HTTP brute) :
//   { userId, organizationId, siteScope (null/undefined = accès à tous les sites, entier = limité à ce site), can(permission) → booléen }
// Permissions : ai.use (utiliser), ai.site_admin (régler un site), ai.admin (administration centrale : fournisseurs, modèles, quotas, routage).
const { AiError } = require("./errors");

const deny = (m = "Vous n'avez pas le droit d'utiliser cette fonction.") => new AiError("not_authorized", m);
function checkActor(actor) {
  if (!actor || !Number.isInteger(actor.organizationId) || typeof actor.can !== "function") throw deny("Contexte d'utilisateur invalide.");
  return actor;
}
const limitedToSite = (actor) => actor.siteScope !== undefined && actor.siteScope !== null;

function createSecurity({ db }) {
  const siteBelongs = (organizationId, siteId) => Boolean(db.prepare("SELECT 1 FROM mk_sites WHERE id = ? AND organization_id = ?").get(siteId, organizationId));
  const api = {
    // Utilisation : permission + site de l'organisation + (accès limité) site identique
    authorizeUse(actor, siteId) {
      checkActor(actor);
      if (!actor.can("ai.use")) throw deny();
      if (siteId !== null && siteId !== undefined) {
        if (!Number.isInteger(siteId) || !siteBelongs(actor.organizationId, siteId)) throw deny("Site introuvable.");
        if (limitedToSite(actor) && actor.siteScope !== siteId) throw deny("Cet accès est limité à un autre site.");
      } else if (limitedToSite(actor)) throw deny("Cet accès est limité à un site : précisez-le.");
    },
    assertGlobalAdmin(actor) { checkActor(actor); if (!actor.can("ai.admin") || limitedToSite(actor)) throw deny("Réservé à l'administration centrale de Kolakisa."); },
    assertSiteAdmin(actor, siteId) {
      checkActor(actor);
      if (!actor.can("ai.site_admin") && !actor.can("ai.admin")) throw deny();
      if (!Number.isInteger(siteId) || !siteBelongs(actor.organizationId, siteId)) throw deny("Site introuvable.");
      if (limitedToSite(actor) && actor.siteScope !== siteId) throw deny("Cet accès est limité à un autre site.");
    },
    siteBelongs,
  };
  return api;
}
module.exports = { createSecurity, limitedToSite };
