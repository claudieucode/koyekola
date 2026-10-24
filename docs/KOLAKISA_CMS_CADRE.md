# KOLAKISA CMS — Cadre de l'administration d'un site (mission CADRE-CMS-01)

Branche `cadre-cms-hierarchie-01`. Correction de la hiérarchie des barres, de la hauteur du menu latéral et du logo en double.

## Audit (cause réelle)

Le cadre `is-cms` empilait **trois niveaux globaux fixes** : la barre d'administration (44 px), puis une **barre de chemin (fil d'Ariane) pleine largeur** (40 px, `position: fixed`) au-dessus du rail et du menu, puis la coque. Conséquences : le menu latéral ne commençait pas sous la barre globale mais 40 px plus bas ; le **rail « Mon espace »** (`position: sticky; top: 0; height: 100vh`) ignorait la barre globale et dépassait le bas de la fenêtre (ses actions de pied étaient hors écran) ; le **logo « K » du rail** doublait celui de la barre globale. Le bandeau « Vous êtes dans le site » était déjà dans la zone de contenu. La structure est **partagée** : `views/marketing/partials/top.ejs` sert tous les écrans du CMS (tous les sites).

## Correction (à la source)

- `top.ejs` : plus de barre de chemin globale. Le fil d'Ariane est rendu **dans le bandeau de contexte** de la zone de contenu (`site-banner.ejs`), ou dans la bande « Retour à Mes sites » (`navOnly`), ou en ligne de tête du contenu pour les écrans centraux sans site.
- `cms-crumbs.ejs` : ne rend plus que le chemin ; `cms-adminbar.ejs` reçoit le **bouton du menu** (tiroir sur écrans étroits).
- CSS : `--kab-crumb-h` vaut `0px` (adminbar.css, kola-compose.css, écrans étroits) ; tous les décalages calculés existants (`--kab-h + --kab-crumb-h`) restent valides sans valeur arbitraire. Rail : `top: var(--kab-h); height: calc(100dvh - var(--kab-h))` ; logo du rail masqué dans le CMS uniquement. Aucun `z-index`, aucune marge négative ni position absolue ajoutés.
- Fichiers : `top.ejs`, `cms-crumbs.ejs`, `site-banner.ejs`, `cms-adminbar.ejs`, `public/css/adminbar.css`, `kola-compose.css`, `cms.css`.

## Tests

`tests/cadre-cms-structure.test.js` (structure + mesures Chrome sur 9 pages réelles d'un site : barre en haut, menu et rail sous elle jusqu'au bas, bandeau collé sous la barre et à droite du menu, un seul logo, aucun débordement ; menu replié ; 1100 px ; défilement ; 390 px avec bouton de menu ; mode sombre et changement d'onglet). `barre-admin.test.js` et `grille-interface.test.js` adaptés à la nouvelle structure.

## Limites constatées

- La page Paramètres → Général déborde de 32 px à 1100 px de large (élément `.mk-sg-example`) : défaut de cette page, antérieur et sans rapport avec le cadre ; non corrigé ici.
- `grille-interface.test.js` échoue à l'identique sur `main` sans ces changements (marges modifiées par une autre session) : non traité.
