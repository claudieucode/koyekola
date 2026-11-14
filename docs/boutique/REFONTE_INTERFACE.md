# Refonte de l'interface d'administration de la boutique (novembre 2026)

Périmètre : présentation seulement (vues EJS `views/marketing/boutique/*`, feuille `public/css/shop-admin.css`, script `public/js/shop-admin.js`).
Aucune route, aucun champ (`id`, `name`), aucune validation, aucune règle fiscale, de livraison ou de paiement n'a changé.

## Causes des défauts observés (mesurées dans un vrai Chrome)
| Défaut | Cause |
|---|---|
| Champs et listes de 180 px de haut (Produits, Commandes, Clients, Livraison, Taxes) | `style.css` : `.mk-inline-form input, .mk-inline-form select { flex: 1 1 180px }`. Dans une colonne (`.field-group`, flex en colonne), la base flex devient une **hauteur**. La même règle existe pour d'autres écrans du CMS : elle n'a été corrigée que pour la boutique (`.mk-shop`). |
| Champs « nus » (Devise, Pays, Préfixe, Nom…) | 86 `<input>` sans attribut `type` : les styles du CMS ne ciblent que `input[type=text]`, etc. Corrigé dans les vues (`type="text"` = comportement identique) et protégé en CSS. |
| Navigation = liens soulignés | `<a>` sans la classe `.mk-tab`. |
| Écrans Taxes, Paiements, Factures… dans le menu « Marketing » | Clés de menu absentes du registre : rattachées à l'entrée « Boutique » la plus proche (`MENU_ACTIVE` dans `shopAdmin.js`), l'onglet exact reste marqué dans la navigation secondaire. |

## Ce qui a été fait
- **Navigation secondaire** (`_head.ejs`) : 14 onglets en 4 groupes (Catalogue · Ventes · Gestion · Configuration), défilement horizontal maîtrisé avec bords estompés, onglet actif toujours visible, jamais de débordement de page.
- **Champs** : échelle unique (36 px, 44 px au tactile, rayon 8), états normal / survol / focus / désactivé / invalide ; cases à cocher en lignes cliquables ; formulaires en grille adaptative (champs courts jamais étirés) ; formulaires « en ligne » (filtres) alignés.
- **Cartes** : filet 1 px, rayon 12, pas d'ombre (charte) ; Réglages regroupés en 4 cartes (Boutique, Commandes et avis, Taxes, Moyens de paiement) avec une seule action « Enregistrer les réglages » ; Taxes et expédition en cartes côte à côte ; zones de livraison en cartes avec ajout de méthode repliable ; Paiements en cartes par fournisseur avec état (Prêt / À configurer).
- **Composants partagés** : `_vide.ejs` (états vides : titre, aide, action utile), `_pager.ejs` (pagination commune, conserve la recherche).
- **Tableaux** : statuts en pastilles, montants alignés, actions en colonne séparée, repli en fiches étiquetées sous 720 px (`.mk-datatable` existant + `shop-admin.js`).
- **Animations** : uniquement celles de la charte (120 / 180 ms, couleur / opacité / transform) ; ouverture des sections repliables ; bouton « occupé » à l'envoi ; `prefers-reduced-motion` respecté.

## Preuves
- `tests/boutique-admin-refonte.test.js` (10 tests, serveur réel) : 17 écrans répondent avec le socle, 14 rubriques conservées et un seul onglet actif, aucun champ sans `type`, menu du site, états vides, filtres/recherche réels, pagination, Réglages (données restituées), taxes (création et suppression réelles).
- `tests/boutique-admin-navigateur.test.js` (5 tests, Chrome) : aucun champ de hauteur anormale ni débordement (7 écrans), mobile 390 px (navigation défilante, fiches étiquetées, une colonne), grille de champs sur bureau, formulaire réellement envoyé, recherche réelle, focus visible.
- Tests existants de la boutique (`boutique-*`, `cms-commerce`) : 144 / 145 réussis ; le seul échec (`boutique-charge` : « lecture sous charge, 150 requêtes ») échoue aussi sur `origin/main` sans cette refonte.
- Audits : `audit-interface` (1440 / 820 / 390), `audit-responsive` (320 / 390 / 768 / 1280 : 0 débordement), `audit-qualite` (clair + sombre : 0 focus invisible, 0 commande sans nom, 0 animation de mise en page issue de la boutique).

## Reste à faire / limites
- Fiche produit : longue page à formulaire unique (séparée par des filets) ; un découpage en onglets demanderait de changer la structure d'enregistrement : non fait.
- Logos des fournisseurs de paiement : aucun logo officiel n'est embarqué (icônes neutres) ; à ajouter si les visuels de marque sont fournis.
- Sélecteurs avec recherche (pays, produits, catégories) : les listes multiples gardent la liste native stylée ; un sélecteur à recherche est à prévoir si le catalogue grossit.
- La règle `.mk-inline-form input { flex: 1 1 180px }` de `style.css` reste défectueuse pour les autres modules (hors périmètre).
