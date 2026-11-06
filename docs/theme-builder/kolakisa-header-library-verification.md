> **Document historique.** La bibliothèque décrite ici (100 compositions en rangées, 34 identités) a été remplacée par la bibliothèque « Atelier » : voir [HEADER_LIBRARY_100_MODELS_REPORT.md](HEADER_LIBRARY_100_MODELS_REPORT.md).

# Rapport de vérification — bibliothèque d'en-têtes (novembre 2026)

Outil : `scripts/audit-entetes.js` (Chrome + Playwright, serveur KOLAKISA de test réel). Reproductible : `node scripts/audit-entetes.js <dossier>`.

## 1. Résultat final

| Contrôle | Périmètre | Résultat |
|---|---|---|
| Rendu des aperçus de la bibliothèque | 100 modèles × 3 largeurs (1280 / 820 / 390 px) = **300 rendus** | 0 erreur, 0 rendu manquant |
| Débordement horizontal de la page | 300 rendus | **0** |
| Chevauchement d'éléments (rectangles qui se recouvrent de plus de 3 px) | 300 rendus | **0** |
| Éléments hors de l'écran | 300 rendus | **0** |
| Contraste texte/fond (WCAG, seuil 3) | 300 rendus (hors modèles superposés, dont le fond est la page) | **0** |
| Collant : `top` après défilement de 1 500 px | pages publiées : collant, verre dépoli, deux rangées | **0 px** (reste en haut) ; l'en-tête ordinaire défile (−1 500 px) |
| Superposé : position | page publiée | `absolute`, hauteur de flux 0, défile avec la page |
| Marge de colonne au-dessus de l'en-tête | page publiée | **0 px** (était 32 px) |
| Sous-menu au survol de « Services » | 5 pages publiées | visible |
| Bouton de menu mobile (390 px), défilement horizontal | 5 pages publiées | bouton visible, `scrollWidth` = 390 |

Tests automatisés : voir `kolakisa-header-library.md` §8. Sur le code final rebasé : **797 / 797** tests liés (Theme Builder, pages publiées, menus, apparence), dont 44 pour les en-têtes.

## 2. Défauts trouvés pendant la vérification, et corrigés

| # | Défaut | Détection | Correction |
|---|---|---|---|
| 1 | **Collant inopérant** sur les pages du Page Builder (`top` : 32 → −1 468 px) | mesure sur page publiée | position portée par l'enveloppe (`_sections.ejs`, `landing.css`) |
| 2 | Espace de 32 px au-dessus de tout en-tête de page publiée | mesure sur page publiée | `.lp-main:has(> .lp-site-header:first-child)` |
| 3 | Deux clés avec accent (`…liseré…`) : adresse de route cassée, modèle introuvable | audit : 2 modèles « manquants » | clés ASCII + test de forme des clés |
| 4 | Menu absent des aperçus (aucun menu affecté au site de test) : tous les modèles paraissaient vides | capture | menu d'exemple réservé à la bibliothèque |
| 5 | Bouton « Rechercher » coupé en deux lignes ; lien textuel plus haut que le bouton voisin (`.kw-link { align-self: flex-start }`) | capture | recherche à largeur fixe/pleine largeur sur mobile ; `alignSelf: center` |
| 6 | « Mon compte » + « Panier » en double avec le mini-panier | capture | le widget Compte n'affiche plus le panier (élément à part) |
| 7 | Écarts blancs entre rangées | capture | toutes les rangées dans un conteneur unique sans espace |
| 8 | Zone droite à base 0 qui retourne à la ligne quand le centre est un menu | capture | centre long : `space-between` |
| 9 | En-têtes superposés invisibles dans l'aperçu (texte blanc sur fond blanc) | capture | visuel sombre sous l'aperçu et la vignette |
| 10 | Rangée secondaire « marque » : texte blanc sur fond clair | mesure du contraste (2e passage) | teinte « encre » |
| 11 | Bouton contour orange sur bleu de marque (contraste 2,3) | mesure du contraste | texte et contour en couleur de premier plan |
| 12 | 16 modèles trop proches de leurs voisins (même arbre, valeurs différentes) ; « Menu seul » sans logo ; 9 modèles sans menu | test de distinction (84 formes sur 100) | 15 modèles recomposés, 6 ont reçu un menu ; il reste **3** modèles sans menu, assumés (recherche, icônes) |
| 13 | Mobile : bouton contour, lien, recherche compacte restaient affichés et passaient à la ligne | capture mobile | masqués sur mobile |

## 3. Modèles défectueux restants

**Aucun** sur les mesures ci-dessus. Limites qui ne sont pas des défauts de modèle (voir `kolakisa-header-library.md` §9) : aperçu de bibliothèque sans le script du menu mobile (menu déployé) ; collant d'un en-tête à plusieurs rangées en bloc.

## 4. Ce que ce contrôle ne prouve pas

* Il mesure des rectangles et des couleurs ; il ne juge pas l'esthétique. Une relecture humaine des 300 captures reste utile (`node scripts/audit-entetes.js` les génère).
* Il s'exécute avec le thème par défaut d'un site neuf : une charte de site très différente (polices, couleurs de marque) peut changer les proportions.
* Il n'a pas été exécuté sur un site déployé, ni avec Safari / Firefox (Chrome uniquement).
