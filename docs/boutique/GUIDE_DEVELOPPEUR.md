# Guide développeur

- **Services** : `src/marketing/shop/` (catalog, cart, orders, payments, refunds, invoices, downloads, reports, privacy, abandoned, events, gateways/). Administration : `src/marketing/web/shopAdmin.js` (`route(méthode, chemin, permission, gestionnaire, { write })` — le site vient de l'adresse vérifiée). Public : `shopPublic.js`, webhooks : `shopWebhooks.js` (monté avant l'analyse du corps).
- **Nouvelle passerelle** : fichier `gateways/<nom>.js` exposant `key, label, fields, configured, start, verify, refund, identify`, puis l'ajouter à `gateways/index.js` (ADAPTERS, FIELDS, LABELS), à `store.METHODS` et à `payments.PROVIDERS`. Règle : `verify` relit TOUJOURS l'état chez le fournisseur.
- **Événements** : `shop/events.js` (déclencheur unique : `orders.addEvent`) ; noms déclarés dans `webhooks/catalog.js`.
- **API** : `api/shop.js` (monté par `api/router.js`).
- **Pages du Theme Builder** : types dans `themeBuilder/types.js`, catalogue `catalog/commerce_pages.js`, éléments `pages/widgets/shop.js` + gabarits `views/marketing-public/widgets/shop*.ejs`, corps de pages partagés `views/boutique/_*-body.ejs`.
- **Ajouter un élément de fiche produit** : `productWidget(...)` dans `shop.js` + gabarit EJS ; déclarer l'icône (liste de `nodes.iconNames()`), la racine seule dans `pages/parts.js` (ROOT_ONLY) et régénérer la référence : `UPDATE_FIXTURE=1 node --test tests/widgets-parts-regression.test.js` (ajouts seulement).
- **Migrations** : prochain numéro libre dans `src/marketing/migrations/` (vérifier `git fetch` : plusieurs chantiers en parallèle).
- Les gabarits EJS n'ont pas accès à `require` : tout passe par la route.
