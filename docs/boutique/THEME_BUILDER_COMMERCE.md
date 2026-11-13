# Theme Builder : modèles des pages commerce

Quatre types de modèles dans le groupe **Boutique** : **Panier**, **Validation de commande**, **Commande reçue**, **Compte client**.
Chacun a **100 modèles** (20 compositions × 5 identités). « Utiliser ce modèle » crée une copie **indépendante** (page du Page Builder + modèle en brouillon) ; modifier la copie ne change jamais le catalogue.

## Comment ça marche
- Chaque modèle contient un élément « page de boutique » (`shopcartpage`, `shopcheckoutpage`, `shoporderpage`, `shopaccountpage`) qui affiche la **VRAIE page** : mêmes formulaires, mêmes routes, mêmes contrôles côté serveur (prix, stock, taxes, paiement). Le modèle n'ajoute que titre, mise en page, consignes éditables et, selon le cas, de vrais produits mis en avant.
- Sans modèle publié, la page par défaut s'affiche **exactement comme avant** (repli garanti, y compris en cas d'erreur de rendu).
- Les parties communes sont des gabarits partagés (`views/boutique/_panier-body.ejs`, `_commande-body`, `_confirmation-body`, `_compte-body`, `_compte-connexion-body`) : la page par défaut et l'élément du Page Builder rendent le même code. Dans un modèle, le titre de la page par défaut est retiré (un seul `h1`).
- En-tête et pied de page : les conditions « panier, commande et autres pages de la boutique » et « toute la boutique » s'appliquent aussi aux nouvelles vues (aucune régression).
- Aperçus et vignettes du catalogue : cadre explicatif « Aperçu : … s'affiche ici » (jamais de fausses données).

## Contrôles de l'élément
Les éléments portent les réglages Style et Avancé communs de tous les éléments « boîte » du Page Builder (espacements, fond, bordure, ombre, visibilité par appareil, classes, ancre, mouvement). Le contenu de la page (champs, libellés) est celui de la boutique.

## Ajouter un modèle
`src/themeBuilder/catalog/commerce_pages.js` : une composition = un titre (4 façons) × un complément (5). Tests : `tests/boutique-theme-builder-pages.test.js`.
