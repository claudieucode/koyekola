# Architecture du moteur responsive

```
Contrôle (inspecteur) ──setStyles──► styles[appareil][clé]  (appareil affiché = « device », état = « styleState »)
        │                                │ valeur vide → la clé disparaît (hérite)
        │                                ▼
        │                      aperçu immédiat (previewStyles) à la largeur de l'appareil affiché
        ▼
 PUT /brouillon (un seul enregistrement par geste)           POST /rendu → pageCss(sections, breakpoints du site)
                                                                      │
                  ┌───────────────────────────────────────────────────┴───────────────┐
                  ▼                                                                     ▼
   canevas : iframe de la largeur de l'appareil                         page publiée : mêmes règles @media
```

## Appareils et ordre CSS
`desktop` (règle de base) → `wide` `(min-width: B.wide)` → `tablet` `(max-width: B.tablet)` → `mobile` `(max-width: B.mobile)`. Les écrans plus petits sont écrits **après** les plus grands : à largeur égale le plus petit l'emporte, ce qui donne l'héritage mobile ← tablette ← ordinateur. `wide` n'est jamais atteint par un écran ≤ 1919 : il hérite donc de l'ordinateur uniquement.

## Visibilité par appareil (`hideOn`)
| Appareil | Plage masquée |
|---|---|
| mobile | `max-width: B.mobile` |
| tablette | `B.mobile+1 … B.tablet` |
| ordinateur | `min-width: B.tablet+1` (sans borne haute : couvre aussi le grand écran, par compatibilité — choix documenté) |
| grand écran | `min-width: B.wide` |
Les plages mobile / tablette / ordinateur sont disjointes ; « ordinateur » recouvre « grand écran » à dessein (pages créées avant l'écran « Grand écran »).

## Points de rupture
Valeurs par défaut dans `nodes.js` et `siteSettings.js` ; réglés par site (bornes validées) ; transmis à `pageCss`, `classCss` et à la règle de visibilité ; le canevas recale la largeur « ordinateur » sur `tablette + 1`.

## Aperçu immédiat
Réutilise le mécanisme de la mission 3 (`PREVIEW` + `PREVIEW_ENUM`) : aucune duplication. Il s'applique à l'appareil affiché, dont l'iframe a exactement la largeur : la valeur aperçue est celle que les `@media` donneront.
