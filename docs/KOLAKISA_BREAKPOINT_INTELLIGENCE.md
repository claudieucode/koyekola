# KOLAKISA — Intelligence des points de rupture (22.8)

## État existant (conservé)
Trois seuils réglables PAR SITE (`siteSettings.layout.breakpoints`) : tablette (≤ 820–1279, défaut 1023), mobile (≤ 400–767, défaut 767), grand écran (≥ 1400–3000, défaut 1920). Bornes validées, mobile < tablette imposé. Un seul endroit écrit les `@media` : `nodes.pageCss` / `classCss`.

## Ajout 22.8 : `src/responsive/breakpoints.js`
Sept profils de RÉFÉRENCE (largeurs d'aperçu et d'audit, pas de nouveaux seuils CSS) :

| Profil | Largeur | Tactile |
|---|---|---|
| Mobile compact | 320 | oui |
| Mobile | 390 | oui |
| Grand mobile | 430 | oui |
| Tablette | 820 | oui |
| Portable | 1280 | non |
| Ordinateur | 1440 | non |
| Grand écran | 1920 | non |

* `deviceAt(largeur, seuils)` : écran natif réellement appliqué. Avec des seuils personnalisés (ex. mobile 400), « Grand mobile 430 » devient « tablette » : l'audit rattache donc chaque constat à l'écran où il se corrige.
* `check(seuils)` : signale mobile ≥ tablette, tablette ≥ grand écran, plage tablette < 100 px.
* `edgeWidths(seuils)` : largeurs pile sur chaque seuil et au pixel suivant (là où naissent les conflits de media queries).
* L'écran `/responsive` affiche les profils du site et les incohérences.

## Choix de ne pas ajouter de seuils
Les écarts documentés (`KOLAKISA_RESPONSIVE_GAP_ANALYSIS.md`) notent l'absence de points de rupture supplémentaires (parité Elementor). Multiplier les seuils exige une évolution du modèle de styles par écran et de l'inspecteur ; ce n'est pas fait ici, pour ne pas multiplier les `@media` ni casser les pages existantes.

## Limite connue
Le CSS du menu mobile (`landing.css`) et d'autres widgets fixent `767px` en dur : ils ne suivent pas un seuil mobile personnalisé. Documenté dans les restes à faire.
