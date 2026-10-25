# KOLAKISA — Navigation principale (rail / barre en bas)

Composant unique : `views/partials/app-rail.ejs` (inclus par la coque Marketing / CMS `marketing/partials/top.ejs` et par la coque « Mon espace » / SEO `partials/dash-open.ejs`). Données : `dashboard.NAV` (routes, clés, badges, permissions inchangés).

## Icônes
Les **icônes d'origine** du CMS (`icon(it.icon)`, trait simple) : aucune tuile illustrée, aucune couleur ajoutée. Le redesign illustré du commit `5da6f0a3` a été abandonné (décision de l'utilisateur) ; `src/utils/dockIcons.js` n'est plus utilisé (fichier à supprimer).

## Disposition
| Contexte | Disposition |
|---|---|
| Grand écran (≥ 1280 px, pointeur précis) | **barre verticale à gauche par défaut (bouton de position pour la passer en bas)**, centrée sur la zone de contenu (jamais sur le menu latéral), compacte, mêmes couleurs marine que le rail ; l'infobulle s'affiche au-dessus de l'icône ; l'entrée active garde son fond et un point sous l'icône. Le bouton « Placer la barre à gauche » (mémorisé : `localStorage.kbDock = "left"`) ramène la colonne. |
| 961 – 1279 px | colonne à gauche, comme avant. |
| Tablette et téléphone (< 961 px ; < 761 px dans « Mon espace ») | le rail est un tiroir (inchangé) ; une barre rapide de 5 entrées (Accueil, Marketing, Messages avec badge, Gestion, Plus) reste sous le pouce, zone de sécurité iOS respectée ; « Plus » ouvre le menu complet. |

## Mouvement
Seul le **mouvement** du Dock est repris : icône survolée ou au focus clavier `scale(1.18)`, voisines `scale(1.07)`, `transform` seul (aucune dimension de mise en page), 140 ms, aucune boucle. Coupé en mouvement réduit, niveaux `lite` / `off` (`kb-motion.js`) et sur tactile (aucune fonction ne dépend du survol).

## Fichiers
`views/partials/app-rail.ejs` · `public/css/app-rail.css` · `public/js/kb-dock.js` · scripts de position dans `views/partials/header.ejs` et `views/marketing/partials/top.ejs` · `tests/dock-navigation-navigateur.test.js` (Chrome via Playwright, ignoré si absent).
