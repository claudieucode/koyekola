# Palier 13 — Implémentation

Principe : corriger la cause réelle dans le code existant, sans nouveau composant, sans délai artificiel, sans toucher aux tokens de design ni aux couleurs globales.

| Défaut | Correction | Fichier |
|---|---|---|
| U1 « Règles et magnétisme » reste ouvert après un clic dans le canevas | Écouteur `window blur` qui ferme le menu (même mécanisme que le menu principal : un clic dans l'`iframe` retire le focus à la fenêtre de l'éditeur) | `public/js/page-builder-rules.js` |
| U2 « Qualité de la page » : Échap sans effet | Écouteur `keydown` sur la fenêtre non modale : Échap ferme, `stopPropagation`, focus rendu au bouton qualité (`aria-expanded` repasse à `false` via l'événement `close` existant) | `public/js/page-builder-quality.js` |
| U3 « Réglages du menu de navigation » : Échap sans effet | Même écouteur ; l'élément qui avait le focus à l'ouverture est mémorisé et récupère le focus | `public/js/page-builder-menu.js` |
| U4 Focus sur `<body>` après Échap d'un menu flottant | `showMenuEntries` mémorise `document.activeElement` quand le menu s'ouvre ; Échap (dans le menu ou au niveau du document) rend le focus à cet élément s'il existe encore. Le menu étant partagé (contextuel, principal, publication, historique), la mémorisation est par ouverture, pas par bouton | `public/js/page-builder.js` |

Une première version de U4 rendait le focus au seul bouton « Menu principal » : la mesure a montré que l'historique renvoyait alors le focus au mauvais bouton. Corrigée avant livraison par la mémorisation de l'élément d'origine.

## Outils ajoutés
- `scripts/ux/audit-editeur-navigateur.js` : audit mesuré dans Chrome (46 mesures). Il ne modifie rien en production.
- `tests/palier13-menus-clavier-navigateur.test.js` : 5 tests de non-régression. **4 échouent sans les correctifs, 5 réussissent avec.**

## Non modifié, volontairement
Tokens de design, couleurs, icônes, raccourcis, tailles de commandes (aucune < 24 px), moteur de sauvegarde (Palier 12), panneaux IA et Qualité (persistants par conception), barre du haut à petite largeur (Palier 14).
