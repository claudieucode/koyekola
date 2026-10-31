# KOLAKISA — Propriétés responsive des widgets (22.8)

Audit : une propriété n'est offerte par écran que si le moteur la rend. Les propriétés par écran sont celles de `STYLE_PROPS` (`nodes.js`), toutes rendues par `declarations()` pour chacun des 4 écrans.

| Famille | Propriétés présentes (par écran) | Absentes / limites |
|---|---|---|
| Dimensions | width, maxWidth, minWidth, height, minHeight, maxHeight | — |
| Espacements | margin*, padding*, gap, rowGap, columnGap (valeurs ou jetons `token:space-*`) | — |
| Typographie | fontSize (**22.8 : + `fluid:min-max`**), lineHeight, letterSpacing, textAlign, lineClamp, columnCount | `clamp()`/`calc()` saisis : refusés (sécurité) |
| Disposition | flexDirection, flexWrap, justify/align, columns, gridTemplate, placements de grille | `order` : non exposé (accessibilité : ordre du DOM conservé) |
| Affichage | display, overflow, position, aspectRatio, visibilité par écran (`hideOn`) | — |
| Images | objectFit, objectPosition, tailles adaptatives `srcset` (système `media/variants`, taille « auto ») | Point focal par écran et `<picture>` : non |

## Typographie fluide (nouveau)
Valeur `fluid:28-56` sur `fontSize` : 28 px à 320 px de viewport, 56 px à 1440 px, interpolée entre les deux, exprimée en `rem` (le zoom du texte est respecté). Validée : entiers 8–200, min ≤ max. Rendue `clamp(1.75rem, 1.25rem + 2.5vw, 3.5rem)`, calculée côté serveur depuis deux nombres ; `calc()`, `clamp()` ou toute expression saisie restent refusés.
Pas de contrôle dédié dans l'inspecteur : la valeur est posée par l'assistant (écran mobile) ; la saisie manuelle dans le champ « Taille » est acceptée par le normaliseur. L'aperçu immédiat de l'éditeur ne connaît pas cette forme : il s'actualise au rendu serveur.
