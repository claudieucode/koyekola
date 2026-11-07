# Problèmes identifiés (vérifiés dans le code)

## P1 — En-tête / pied Theme Builder : fond limité à la colonne de 760 px (cause probable du problème A/B)
Le contenu de la pièce est dans un `.lp-main` (760 px, padding 16 px). Le fond ne traverse l'écran que si la pièce contient un conteneur **direct** `full` ou `band` (`bleedOf`). Un en-tête construit avec un conteneur normal, ou dont le drapeau est plus profond / sur la section elle-même, reste enfermé. *Un en-tête « fond large + contenu étroit » demande aujourd'hui d'utiliser le mode `band` sur le bon niveau ; rien ne l'impose ni ne le signale.*
Risque associé : `.lp-main` conserve 32 px en haut et 48 px en bas même en mode bleed (compensé à la main dans certains modèles : compose.js:263).

## P2 — Quatre mécanismes de largeur concurrents, sans jeton central
`.lp-main` codé en dur (760), réglages `siteSettings.layout`, `globalStyles.container`, `layoutFormat`, plus les packs. Seules variables : `--kw-band-w`, `--kw-fmt-pad`, `--pk-max`, `--pk-gutter`. Pas de variable unique réutilisée par header, contenu, footer.

## P3 — Les thèmes écrasent les réglages du site
`base.css:4` utilise `!important` : avec un pack, `--pk-max` (1280 par défaut) l'emporte sur `contentWidth` du site. Environ 28 packs ajoutent des colonnes de 760 px, 18 de 820 px, etc. Le réglage utilisateur de largeur peut donc être sans effet visible.

## P4 — Contenu étroit par défaut
Colonne 760 px (hors packs) ; conteneurs de 1100 px plafonnés par elle. C'est la cause du « contenu trop concentré au centre » sur les pages Page Builder sans pack.

## P5 — Vues EJS classiques : largeurs figées, pas d'usage de grand écran
900 / 1240 / 620 px codés en dur ; grilles plafonnées à 3-5 colonnes même à 2560 px ; aucune lecture des réglages de largeur du site (confirmé : le sous-agent n'a trouvé aucun lien). Boutique : 1120 px.

## P6 — Incohérence d'alignement header / contenu / footer
Header (pièce) : 760 ou pleine largeur ; contenu : 760 / 1100 / 1280 selon thème ; footer historique : 1240. Aucun alignement intérieur commun.

## P7 — Risque de défilement horizontal
`.lp-w-full` et `lp-part-bleed` utilisent `margin-inline:calc(50% - 50vw)` : `100vw` inclut la barre de défilement. Seul `.lp-body{overflow-x:clip}` protège (landing.css:25) ; le `<body>` des vues EJS classiques n'a pas cette protection. À mesurer, non constaté.

## Ce qui fonctionne déjà (à ne pas refaire)
Fond pleine largeur des en-tête/pied EJS historiques ; mode `band` et `full` ; contrôles « Largeur du contenu » de l'éditeur ; format guidé verrouillable ; isolation par site (pièces rendues par `site.id`).

## Origine : mélange de causes
(1) pièce dans `.lp-main` + bleed conditionnel ; (2) max-width codés en dur ; (3) thèmes en `!important` ; (4) absence de jeton central. Pas de problème de marges excessives isolé : les marges (16-24 px) sont raisonnables.
