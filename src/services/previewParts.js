// Aperçu de l'en-tête et du pied d'un site (Personnaliser) : le rendu public lit l'en-tête/pied du site dans pages.withSiteParts, bien avant la vue.
// Pour l'aperçu, la requête s'exécute dans un contexte asynchrone qui porte { <siteId>: { header, footer } } (identifiants de composants) : seulement CETTE requête.
const { AsyncLocalStorage } = require("node:async_hooks");
const als = new AsyncLocalStorage();
module.exports = {
  run: (store, fn) => als.run(store, fn),
  // null = aucun remplacement pour ce site
  of: (siteId) => { const s = als.getStore(); return s && siteId && s[String(siteId)] ? s[String(siteId)] : null; },
};
