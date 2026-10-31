# KOLAKISA — Audit de qualité responsive (22.8)

## Deux volets complémentaires
1. **Statique** (`audit.js`, instantané, dans l'écran Responsive) : `fixed-width`, `grid-narrow`, `flex-row-crowded`, `heading-too-large`, `text-too-small`, `negative-margin`, `tall-hero`, `spacing-excess`, `tablet-columns`, `image-alt`, `hidden-essential`. Chaque constat : page, section, élément, écran, gravité (bloquant / à corriger / amélioration), preuve (valeur résolue), correction proposée ou aucune (`image-alt`, `hidden-essential` : jamais automatiques).
2. **Navigateur** (`browser.js`, Chrome réel) : `overflow-x`, `element-out-of-view`, `text-clipped`, `tap-target`, `tiny-text`, `broken-image`, `narrow-column`, `zoom-blocked`, `viewport-meta`. Appliqué aux 7 profils du site.

## Preuves obtenues (tests de ce palier)
* Page fragile (largeur 640 px, 4 colonnes, titre 72 px) : **débordement horizontal mesuré avant correction à 390 px** ; après correction par l'assistant et republication : 0 px à 320, 390, 430 et 767 px ; titre mobile entre 28 et 60 px ; titre ordinateur inchangé.
* Page saine : 0 constat bloquant aux 7 profils ; 0 cible tactile < 32 px (avant correctif : 2 liens de 17 px, voir mobile).
## Limites
Chrome seul (pas Firefox/Safari), émulation de fenêtre (pas de téléphone réel, pas de rotation), pas de capture d'écran enregistrée. Un écran qui lance Chrome depuis l'administration n'existe pas.
