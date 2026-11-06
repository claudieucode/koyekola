# Entête — comportement responsive

Appareils d'aperçu : Ordinateur, Tablette, Mobile (sélecteur du personnalisateur). Les points de rupture sont ceux du site (`settings.layout.breakpoints`, 1023 px et 767 px par défaut).

| Mécanisme | Règle |
|---|---|
| Valeur par appareil | ordinateur = clé nue ; tablette = clé + `T` ; mobile = clé + `M`. Une valeur vide hérite de l'appareil plus grand (affichée en grisé dans le champ). Jamais d'écrasement entre appareils. |
| Visibilité | chaîne `dtm` (d ordinateur, t tablette, m mobile) ; un appareil absent reçoit `display:none`. |
| Menu hors-champ | `ocVis` liste les appareils où le panneau remplace le menu principal ; ailleurs le menu reste en ligne. Par défaut : aucun (un site existant ne change pas). |
| Entête transparent | `tpOn` : `desktop` / `mobile` (tablette incluse) / `both`. |
| Mouvement | `prefers-reduced-motion` coupe les transitions du panneau, du bouton et des sous-menus. |

Vérifié dans Chrome à 390 px (mobile), 900 px (tablette), 1280 px et 1600 px (ordinateur) : voir `HEADER_TEST_REPORT.md`.
