# Refonte de l'interface d'administration de la boutique (novembre 2026)

Périmètre : présentation seulement (vues EJS `views/marketing/boutique/*`, feuille `public/css/shop-admin.css`, script `public/js/shop-admin.js`).
Aucune route, aucun champ (`id`, `name`), aucune validation, aucune règle fiscale, de livraison ou de paiement n'a changé.

## Causes des défauts observés (mesurées dans un vrai Chrome)
| Défaut | Cause |
|---|---|
| Champs et listes de 180 px de haut (Produits, Commandes, Clients, Livraison, Taxes) | `style.css` : `.mk-inline-form input, .mk-inline-form select { flex: 1 1 180px }`. Dans une colonne (`.field-group`, flex en colonne), la base flex devient une **hauteur**. La même règle existe pour d'autres écrans du CMS : elle n'a été corrigée que pour la boutique (`.mk-shop`). |
| Champs « nus » (Devise, Pays, Préfixe, Nom…) | 86 `<input>` sans attribut `type` : les styles du CMS ne ciblent que `input[type=text]`, etc. Corrigé dans les vues (`type="text"` = comportement identique) et protégé en CSS. |
| Navigation = liens soulignés | `<a>` sans la classe `.mk-tab` ; puis remplacée par la barre latérale (voir plus bas). Piège : la règle globale `marketing.css` `.mk-content :is(p, li…) a:not(.btn):not(.mk-tab)` souligne tout lien dans une liste : les liens de la barre la surclassent (`.bq-link.bq-link`). |
| Écrans Taxes, Paiements, Factures… dans le menu « Marketing » | Clés de menu absentes du registre : rattachées à l'entrée « Boutique » la plus proche (`MENU_ACTIVE` dans `shopAdmin.js`), l'onglet exact reste marqué dans la navigation secondaire. |

## Ce qui a été fait
- **Navigation secondaire** (`_head.ejs`) : **barre latérale verticale** à gauche du contenu (menu du CMS · barre de la boutique · contenu), 14 rubriques dans l'ordre d'origine, une ligne chacune avec icône, séparateurs entre familles (catalogue · ventes · gestion · configuration), états survolé / actif (filet d'accent + fond) / focus. Zone de contenu = grille à deux colonnes (`body.mk-shop .mk-content`) ; ≤ 1280 px : barre plus étroite ; ≤ 900 px : sélecteur compact « Boutique · Rubrique » qui déroule la liste (Échap et clic extérieur ferment). Les routes, permissions et liens sont ceux d'origine (vraies pages : rechargement et retour du navigateur fonctionnent) ; transition entre rubriques par `@view-transition` (fondu 140 ms, la barre reste fixe ; ignoré par les navigateurs sans cette fonction). Plus aucune navigation horizontale.
- **Champs** : échelle unique (36 px, 44 px au tactile, rayon 8), états normal / survol / focus / désactivé / invalide ; cases à cocher en lignes cliquables ; formulaires en grille adaptative (champs courts jamais étirés) ; formulaires « en ligne » (filtres) alignés.
- **Cartes** : filet 1 px, rayon 12, pas d'ombre (charte) ; Réglages regroupés en 4 cartes (Boutique, Commandes et avis, Taxes, Moyens de paiement) avec une seule action « Enregistrer les réglages » ; Taxes et expédition en cartes côte à côte ; zones de livraison en cartes avec ajout de méthode repliable ; Paiements en cartes par fournisseur avec état (Prêt / À configurer).
- **Composants partagés** : `_vide.ejs` (états vides : titre, aide, action utile), `_pager.ejs` (pagination commune, conserve la recherche).
- **Tableaux** : statuts en pastilles, montants alignés, actions en colonne séparée, repli en fiches étiquetées sous 720 px (`.mk-datatable` existant + `shop-admin.js`).
- **Animations** : uniquement celles de la charte (120 / 180 ms, couleur / opacité / transform) ; ouverture des sections repliables ; bouton « occupé » à l'envoi ; `prefers-reduced-motion` respecté.

## Preuves
- `tests/boutique-admin-refonte.test.js` (10 tests, serveur réel) : 17 écrans répondent avec le socle, 14 rubriques conservées et un seul onglet actif, aucun champ sans `type`, menu du site, états vides, filtres/recherche réels, pagination, Réglages (données restituées), taxes (création et suppression réelles).
- `tests/boutique-admin-navigateur.test.js` (8 tests, Chrome ; dont 3 pour la barre latérale : trois colonnes, **14 clics réels** avec adresse et rubrique active, rechargement, retour / avance du navigateur, sélecteur mobile) : aucun champ de hauteur anormale ni débordement (7 écrans), mobile 390 px (navigation défilante, fiches étiquetées, une colonne), grille de champs sur bureau, formulaire réellement envoyé, recherche réelle, focus visible.
- Tests existants de la boutique (`boutique-*`, `cms-commerce`) : 144 / 145 réussis ; le seul échec (`boutique-charge` : « lecture sous charge, 150 requêtes ») échoue aussi sur `origin/main` sans cette refonte.
- Audits : `audit-interface` (1440 / 820 / 390), `audit-responsive` (320 / 390 / 768 / 1280 : 0 débordement), `audit-qualite` (clair + sombre : 0 focus invisible, 0 commande sans nom, 0 animation de mise en page issue de la boutique).

## Reste à faire / limites
- Fiche produit : longue page à formulaire unique (séparée par des filets) ; un découpage en onglets demanderait de changer la structure d'enregistrement : non fait.
- Logos des fournisseurs de paiement : aucun logo officiel n'est embarqué (icônes neutres) ; à ajouter si les visuels de marque sont fournis.
- Sélecteurs avec recherche (pays, produits, catégories) : les listes multiples gardent la liste native stylée ; un sélecteur à recherche est à prévoir si le catalogue grossit.
- La règle `.mk-inline-form input { flex: 1 1 180px }` de `style.css` reste défectueuse pour les autres modules (hors périmètre).

---

# Passe « espacements, grilles et proportions » (14 novembre 2026)

## Inventaire des défauts (mesurés sur les 14 rubriques et leurs sous-écrans, à 1440 / 1024 / 390 px)
| Défaut | Où | Cause | Correction |
|---|---|---|---|
| Indicateurs dans un grand fond bleuté, 8 cartes puis 3 orphelines | Rapports | `dl.mk-stats` (conteneur partagé à filets) + styles en ligne | Composant `StatCard` : `.bq-stats` / `.bq-stat`, 3 groupes (Ventes 4 · Activité 4 · Frais et remises 3), grille adaptative, hauteurs égales ; sur 2 colonnes le 3ᵉ indicateur prend la ligne (requête de conteneur) ; aucune modification des calculs |
| Paniers abandonnés : champ, case et bouton mal équilibrés | Rapports | formulaire « en ligne » à trois contrôles hétérogènes | champ court, case sur sa ligne, bouton dessous (`.bq-cart-form`) |
| Bouton « Ajouter » collé en haut du formulaire de catégorie | Catégories, tous les formulaires à une rangée | `align-items: start` posé sur les formulaires-cartes | champs alignés en haut, boutons alignés sur le bas des champs (`align-self: end`) |
| Étiquettes de hauteurs différentes qui se désalignent | Fiche produit, Réglages | alignement en bas d'une grille aux étiquettes de 1 ou 2 lignes | alignement en haut ; grille de 4 colonnes pour la fiche produit |
| Cartes de réglages avec une ligne orpheline (3+1, 3+1, 2+1) | Réglages | colonnes automatiques sans lien avec le nombre de champs | modificateurs `.bq-cols-1 / -2 / -4` choisis selon le contenu |
| Grande carte vide « Enregistrer » | Réglages | barre d'enregistrement encadrée | barre plate, alignée à droite |
| Marges basses doublées dans les cartes (texte + padding) | Rapports, Réglages, Factures… | dernier paragraphe avec marge + padding de carte | `.mk-panel > :last-child:last-child { margin-bottom: 0 }` |
| Titre de page collé sous la barre du site | toutes | pas de marge haute | `.mk-head` : 8 px au-dessus, 24 px au-dessous |
| Fausse icône de tri « ⇅ » après chaque nom | tableaux | ma classe `.mk-datatable` (repli mobile) activait l'icône de tri du CMS | icône supprimée pour la boutique |
| Numéros et dates sur 2–3 lignes, montants non alignés | Commandes, Clients | colonnes sans `nowrap` | colonnes clés sur une ligne, en-tête aligné comme sa colonne (script) |
| Fiche commande : résumé en phrase, actions de statut éclatées, historique étiré | Fiche commande | `<p>` et `mk-inline-form` | faits en grille, totaux alignés, actions en cartes, historique en 4 colonnes |
| Liste de règles : nom à gauche, texte au centre, bouton à droite | Taxes, créneaux | `justify-content: space-between` sur trois blocs | contenu groupé à gauche, bouton à droite |
| Formulaires empilés collés | Accès membre | aucun écart entre deux formulaires consécutifs | écart de 16 px |

## Système d'espacement (jetons dans `shop-admin.css`, échelle de la charte 4 · 8 · 12 · 16 · 24 · 40)
`--bq-section-gap` 24 (entre cartes) · `--bq-card-pad` 24 · `--bq-title-gap` 8 · `--bq-block-gap` 16 · `--bq-field-gap-y` 16 / `-x` 24 · `--bq-label-gap` 6 · `--bq-inline-gap` 12. Aucun espacement de la boutique n'est écrit en dur hors de ces jetons.

## Preuves de cette passe
- `tests/boutique-admin-refonte.test.js` : 13 tests (dont Rapports : 11 cartes, 3 groupes 4 · 4 · 3, valeurs réelles ; paniers abandonnés ; fiche commande).
- `tests/boutique-admin-navigateur.test.js` : 10 tests Chrome (dont espacements mesurés : écart entre cartes 24 px, padding 24 px, étiquette à 6 px du champ sur 6 écrans ; indicateurs : hauteurs égales, aucun fond englobant, aucune carte orpheline à 1440 / 1024 / 390 px).
- Tests existants de la boutique : 168 / 168 (ce passage).
- Audits : `audit-responsive` 320 → 1920 px : 0 débordement, 0 cible tactile trop petite ; `audit-interface` : seuls restent le recouvrement du menu latéral du CMS (toutes les pages) et la barre du bas du mobile sur un champ ; `audit-qualite` : 0 focus invisible, 0 commande sans nom.
