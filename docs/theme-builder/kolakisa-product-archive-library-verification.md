# Rapport de vérification — bibliothèque d'archives produits (novembre 2026)

Outil : `scripts/audit-archives-produits.js` (Chrome + Playwright, serveur KOLAKISA de test réel). Reproductible : `NODE_PATH=…/node_modules node scripts/audit-archives-produits.js <dossier>`.

## 1. Résultat

| Contrôle | Périmètre | Résultat |
|---|---|---|
| Rendu des aperçus de la bibliothèque | 100 modèles × 3 largeurs (1280 / 820 / 390 px) = **300 rendus** | 0 erreur, aucune carte manquante |
| Débordement horizontal | 300 rendus | **0** |
| Chevauchement d'éléments (> 3 px) | 300 rendus | **0** |
| Éléments hors écran | 300 rendus | **0** |
| Contraste texte / fond (WCAG, seuil 3) | 300 rendus | **0** (après correction n° 2) |
| Cartes d'une même rangée de largeur égale, images non écrasées | 300 rendus | **0** défaut |
| Tests automatisés | voir `kolakisa-product-archive-library.md` §10 | catalogue 13, utilisation 3, moteur 14, rendu 6, `/boutique` publiée 9 |
| Page `/boutique` réelle (modèle du catalogue appliqué par le serveur) | filtres par l'interface (tri), pagination par clic, ajout au panier par clic, colonne de filtres collante, mobile sans défilement horizontal | voir §3 |

## 2. Défauts trouvés pendant la vérification, et corrigés

| # | Défaut | Détection | Correction |
|---|---|---|---|
| 1 | Les filtres des modèles ne filtraient rien ; pas de pagination ; compteur faux | audit du code | grille « Suit la page » : prix, stock, promotion, tri, étiquette, page ; route : tout le contexte transmis |
| 2 | Liens « Panier » / « Mon compte » illisibles sur l'identité « marque » et « nuit » (contraste 1,8 à 2,0), 6 modèles | mesure du contraste | couleur du texte posée sur les parties du widget |
| 3 | Bouton « Choisir les options » : texte de la même couleur que le fond (produit à variantes) | capture de la vraie page | règle CSS pour les liens-boutons |
| 4 | Pastille « Rupture de stock » de la même couleur que « Promo » | capture | la partie « pastille » n'est plus colorée par le modèle |
| 5 | Liste « grandes vignettes » : image de 180 px malgré le format large | relecture des captures | colonne d'image de 300 px pour 4:3 et 16:9 |
| 6 | Champ de recherche écrasé dans une colonne latérale étroite | relecture des captures | le bouton passe à la ligne |
| 7 | Prix et boutons non alignés entre cartes de hauteurs différentes | relecture des captures | boutons ancrés en bas de carte, prix collé au titre |
| 8 | Régression hors périmètre : « Utiliser » un en-tête plantait après la fusion de la Page 404 | test des en-têtes | `catalog/index.js`, poussé séparément (`37cf9572`) |

## 3. Passe interactive sur la vraie page `/boutique`

Voir `live.json` du dossier de sortie : tri par le formulaire du modèle (URL `?tri=price_desc`, premier produit = le plus cher), pagination par clic (`?page=2`, 12 cartes), ajout au panier (message « Ajouté au panier. » et compteur de panier à 1), colonne collante (reste visible à 900 px de défilement).

## 4. Ce que ce contrôle ne prouve pas

* Il mesure des rectangles et des couleurs ; il ne juge pas l'esthétique. La relecture visuelle a été faite sur des planches de captures (surtout bureau) ; une relecture humaine des 300 captures reste utile.
* Les aperçus ont des produits **d'exemple sans image** : le rendu avec de vraies photos (formats variés) n'est pas couvert par les mesures.
* Chrome uniquement (ni Safari ni Firefox).
* Les audits d'interface d'administration (`audit-interface.js`, `audit-qualite.js`, `audit-editeurs.js`) n'ont pas été relancés : aucun écran d'administration n'est modifié (seules la CSS et les gabarits des sites créés le sont).

## 5. Contrôles automatisés après reconstruction (5 novembre 2026)

Le dossier de travail a été perdu avant publication et reconstruit à partir de la trace du développement. Ont ensuite été relancés, tous verts : `tests/theme-builder-archives-produits-bibliotheque.test.js` (43/43, vrai serveur, `/boutique` publiée, panier, filtres, pagination, étiquette, isolation), `theme-builder-catalogue(-public)`, `theme-builder-stabilisation`, `programme20-5-boutique-builder`, `theme-builder-noyau`, `theme-builder-entetes-bibliotheque`, `programme20-4-import-enregistrement` (31/31), et le filet de sécurité `widgets-parts-regression`.
Les 300 rendus Chrome du §1 ont été mesurés **avant** la reconstruction ; l'outil `scripts/audit-archives-produits.js` n'a pas pu être relancé ici (Playwright absent). À relancer pour confirmer.
