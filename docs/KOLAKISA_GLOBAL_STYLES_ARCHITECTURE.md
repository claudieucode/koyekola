# Architecture des styles globaux

```
mk_sites.tokens  ──tokensToCss──►  style="--kw-primary:…; --kw-font-heading:…; --kw-space-md:…; …" sur <body class="lp-site">  (pages d'un site)
mk_sites.settings.classes ─classCss─► .carte{…} @media…                                           (feuille du thème du site)
élément : styles / states / classes  ─pageCss─►  .kw-n-<id>{…}  @media…                           (feuille de la page)
         valeurs « token:… » ──colorCss / lenTokenOut──► var(--kw-clé, valeur d'origine)
```

## Règles
* **Une valeur est soit une référence (`token:…`), soit une valeur locale.** Aucune conversion automatique de l'une en l'autre : copier / dupliquer / recharger conserve la référence.
* **Repli** : toute référence porte la valeur d'origine du système (`var(--kw-primary, #0277b6)`), sauf une couleur personnalisée `c-…` (propre au site). Hors site, la valeur d'origine s'applique ; dans un site, la variable du site l'emporte.
* **Ordre** : défauts → thème du site (jetons, classes) → éléments → CSS du site → CSS de la page. Les classes sont donc au-dessous des styles propres.
* **Intégrité** : une couleur personnalisée ne peut pas être supprimée si une page, un composant ou un réglage du site (classe, bouton, lien, liste, champ, fond) la référence ; une même révision protège l'ensemble des réglages (conflit 409).
* **Portée** : jetons et classes sont ceux du **site** ; les pages hors site n'ont ni jetons ni classes (repli d'origine seulement).

## Fondations pour le Theme Builder (mission 9)
* Les modèles (en-tête, pied de page, article, archive, 404…) devront être **rattachés à un site** pour hériter des jetons et des classes : le mécanisme existe (variables sur le `<body class="lp-site">`).
* **Collision d'identifiants** : le CSS d'un élément est `.kw-n-<id>`. Un modèle réutilisé sur plusieurs pages et une page qui l'inclut doivent avoir des identifiants distincts (à garantir à l'insertion).
* **Styles d'un en-tête sur le contenu** : aucune règle globale ne cible `header` ; le CSS d'un élément ne cible que son identifiant. Les classes globales s'appliquent partout où elles sont portées : à utiliser avec des noms propres au modèle.
* **Chargement** : le thème du site est livré une fois par page (une feuille), les feuilles d'éléments sont par page ; un modèle partagé devra fournir ses propres règles `.kw-n-<id>` dans la page qui l'affiche.
