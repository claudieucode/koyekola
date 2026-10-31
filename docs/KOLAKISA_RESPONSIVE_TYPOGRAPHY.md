# KOLAKISA — Typographie responsive (22.8)

* Existant : `fontSize`, `lineHeight`, `letterSpacing` par écran ; jetons typographiques du site (`token:h1-size`…) ; le transformateur 22.3 réduit les titres > 40 px (× 0,8 tablette, × 0,58 mobile, plancher 28 px).
* **Nouveau** : taille fluide `fluid:min-max` (voir `KOLAKISA_RESPONSIVE_WIDGET_PROPERTIES.md`). `Fluid.forHeading(px, niveau)` propose des bornes : plancher 30 / 26 / 20 px selon le niveau, ≈ 55–68 % de la taille ordinateur.
* L'assistant propose, pour un titre > 40 px sans valeur mobile, un `fluid:` sur l'écran mobile (jamais sur l'ordinateur). Les textes courants < 14 px reçoivent 16 px sur mobile.
* Mesuré dans Chrome : 28 px à 320 px, 56 px à 1440 px, croissant entre les deux, plafonné au-delà, suit le zoom du texte.
* Non traité : largeur de paragraphe maximale (`ch`), `text-wrap: balance`, tailles fluides du Design System (jetons restent fixes).
