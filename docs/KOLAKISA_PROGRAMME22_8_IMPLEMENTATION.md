# KOLAKISA — Programme 22.8 : responsive et expérience mobile (journal d'implémentation)

## État initial
Moteur natif à 4 écrans avec héritage, seuils par site, transformateur 22.3, audits antérieurs (14, 22.1B). Constats : typographie fluide impossible (`clamp()` refusé), liens de pied de page de 17 px, menu mobile sans Échap ni gestion du focus, aucun audit mesuré des sites publics, aucun assistant de correction.

## Réalisé
`src/responsive/` (fluid, breakpoints, audit, browser, apply, index) ; écran `/site-web/sites/:id/responsive` (route, vue, JS, CSS) ; `fontSize` accepte `fluid:min-max` (`nodes.js`) ; correctifs `landing.css` (cibles tactiles) et `landing.js` (menu). Aucune migration (table `mk_responsive_proposals` créée à la demande, comme 22.3). Détails par sujet : les autres documents `KOLAKISA_*RESPONSIVE*` / `MOBILE*`.

## Tests (exécutés)
* `programme22-8-responsive.test.js` : 15/15. `programme22-8-responsive-navigateur.test.js` : 4/4 (Chrome, émulation de fenêtre).
* Régression ciblée (≈ 156 fichiers : responsive, éditeur, menus, pages, apparence, 22.3) : tous verts sauf
  * `moteur-pages-navigateur` (6) et `site-menu-c1-navigateur` (4) : échecs identiques sur `main` sans ces changements (connus avant 22.8) ;
  * `apparence-styles-navigateur` (1 échec, 2 sur `main`) et `editeur-canvas-containers-navigateur` (1, identique sur `main`) : préexistants ;
  * `editeur-blocs-editeur-gutenberg` et `editeur-fluidite-navigateur` : 1 échec pendant le run chargé, 17/17 et 10/10 au rerun seul.
* Pas de lint, typecheck ni build dans ce dépôt : seulement `node --check`. Suite complète non exécutée.

## Points de rupture / viewports testés
Seuils par défaut 1023 / 767 / 1920. Viewports : 320, 390, 430, 767, 820, 1280, 1440, 1920 ; fluide : 320, 390, 600, 767, 900, 1100, 1440, 2000.

## Restes
`KOLAKISA_PROGRAMME22_8_REMAINING_ISSUES.md`.
