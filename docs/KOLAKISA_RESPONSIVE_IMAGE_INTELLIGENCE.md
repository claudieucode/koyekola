# Images responsives

## Existant
`srcset`/`sizes` générés par le rendu public à partir des variantes WebP ; masquage par écran (`hideOn`) ; hauteurs et proportions par point de rupture.

## Ajouté
`crop.perDevice` calcule, pour bureau/tablette/mobile, le cadrage (`objectPosition`), la part conservée et si une **variante dédiée** est conseillée (moins de 40 % conservés). Le fichier supplémentaire n'est donc créé que s'il est réellement nécessaire (règle : réutiliser avant de multiplier).

## Non fait / non vérifié
Pas de `<picture>` avec sources distinctes, pas de point focal enregistré par appareil dans la page, aucun rendu navigateur (Chrome absent : l'effet visuel n'a pas été constaté).
