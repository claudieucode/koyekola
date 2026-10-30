# KOLAKISA — Audit de la diversité des designs générés (programme 22.1)

## Question

Les sites générés à partir de briefs différents se ressemblent-ils trop ? Kolakisa sait-il proposer plusieurs directions artistiques pour un même brief ? (La diversité n'est pas l'incohérence : on mesure l'écart **entre** sites, pas la qualité **dans** un site.)

## Méthode

Trois mesures sur les 15 scénarios :

1. **Direction artistique** : les 2 à 3 propositions du Design Generator (parcours réel du studio : texte = brief complet, catégorie = type de site) — teinte principale (HSL), association typographique, densité, arrondis.
2. **Structure rendue de l'accueil** : suite des blocs de la page publiée (dans Chrome).
3. **Structure planifiée** : sections prévues par page.

Les plans de référence sont **écrits à la main** : la diversité de **planification** (nombre et choix de pages) ne mesure donc pas le planificateur, seulement celle de mes plans ; elle n'est pas interprétée.

## Résultats

### Structure rendue de l'accueil

<!--TABLE:Diversité des résultats rendus-->
| Scénario | blocs de l'accueil (ordre) | mots | H1 | bouton(s) | image(s) |
| --- | --- | ---: | --- | ---: | ---: |
| entreprise | div.lp-block > div.lp-block > div.lp-block | 41 | Accueil | 0 | 1 |
| immobilier | div.lp-block > div.lp-block | 30 | Accueil | 0 | 1 |
| construction | div.lp-block > div.lp-block > div.lp-block | 41 | Accueil | 0 | 1 |
| tech | div.lp-block > div.lp-block | 30 | Accueil | 0 | 1 |
| photo | header.lp-hero | 1 | Accueil | 0 | 1 |
| portfolio | header.lp-hero | 1 | Accueil | 0 | 1 |
| institution | div.lp-block > div.lp-block | 30 | Accueil | 0 | 1 |
| restaurant | header.lp-hero | 1 | Accueil | 0 | 1 |
| blog | header.lp-hero | 1 | Accueil | 0 | 1 |
| boutique | div.lp-block > div.lp-block | 30 | Accueil | 0 | 0 |
| mode | div.lp-block > div.lp-block | 30 | Accueil | 0 | 0 |
| informatique | div.lp-block > div.lp-block | 30 | Accueil | 0 | 0 |
| services | div.lp-block > div.lp-block > div.lp-block | 41 | Accueil | 0 | 1 |
| education | div.lp-block > div.lp-block > div.lp-block | 41 | Accueil | 0 | 1 |
| sante | div.lp-block > div.lp-block | 30 | Accueil | 0 | 1 |

Signatures distinctes : 3 sur 15 sites (accueil).
<!--/TABLE-->

### Sections du plan conservées par le générateur de pages

<!--TABLE:Sections du plan-->
| Scénario | sections prévues | sections générées | perdues | exemple (page : prévu → généré) |
| --- | ---: | ---: | ---: | --- |
| entreprise | 13 | 11 | 2 | Accueil : hero+features+testimonials+cta → hero+features+testimonials |
| immobilier | 12 | 11 | 1 | Accueil : hero+features+cta → hero+features |
| construction | 14 | 11 | 3 | Accueil : hero+features+testimonials+cta → hero+features+testimonials |
| tech | 13 | 11 | 2 | Accueil : hero+features+video+cta → hero+features |
| photo | 11 | 7 | 4 | Accueil : hero+image+cta → hero |
| portfolio | 10 | 6 | 4 | Accueil : hero+image+text → hero |
| institution | 13 | 11 | 2 | Accueil : hero+features+cta → hero+features |
| restaurant | 13 | 8 | 5 | Accueil : hero+text+image+cta → hero |
| blog | 10 | 7 | 3 | Accueil : hero+text+cta → hero |
| services | 11 | 10 | 1 | Accueil : hero+features+testimonials+cta → hero+features+testimonials |
| education | 13 | 12 | 1 | Accueil : hero+features+testimonials+cta → hero+features+testimonials |
| sante | 12 | 9 | 3 | Accueil : hero+features+cta → hero+features |
<!--/TABLE-->

### Direction artistique (test déterministe `D-V1`)

| Mesure | Résultat |
|---|---|
| Scénarios dont la couleur principale est bleue (teinte 190°–240°) | **au moins 12 sur 15** (test) ; 14 sur 15 mesurés le 2026-10-30 (seul « immobilier » reçoit un rouge profond, déclenché par le mot « élégant ») |
| Palettes principales distinctes (1re proposition) | 7 couleurs hexadécimales différentes sur 15, toutes dans un camaïeu de bleus |
| Associations typographiques utilisées (1re proposition) | **2** (« neutre », « moderne ») sur 5 possibles |
| Propositions par brief | 3, toujours distinctes entre elles (au moins 2 couleurs principales différentes) — mais **de la même famille de teintes** |
| Contraste AA des propositions | 15/15 conformes |

## Constats

- **Les sites générés se ressemblent beaucoup** : même gabarit de blocs (image, titre, cartes, témoignage), même habillage arrondi, même camaïeu bleu. Les différences visibles viennent surtout du **nom** du site et du visuel d'attente (teinte tirée au sort selon le contenu).
- **Plusieurs directions pour un même brief : oui, mais peu contrastées** (3 variantes de bleu). Le moteur sait **respecter une couleur citée** (« bleu marine », « bordeaux », « vert »…) ; sans mot de couleur il retombe sur le bleu.
- **Cause** : l'analyseur de direction (`src/designGen/analyzer.js`) reçoit le **type** de site (vitrine, boutique, blog…), pas le **secteur** ; `SECTOR_HUE` ne connaît que 12 catégories de l'assistant de création ; tout autre cas = « Teinte bleue (215°) par défaut ». Les ambiances (corporate, luxe, créatif…) sont choisies par mots-clés du brief, d'où seulement 2 associations typographiques utilisées en pratique.
- **Cohérence préservée** : la diversité à produire est celle de la **teinte, de la typographie, de la densité et du rythme des blocs**, sans casser le contraste ni les jetons du Design System.
- Le bleu marine est l'**identité de l'application Kolakisa** (charte), pas une obligation pour les sites générés : un site de restaurant ou de photographe n'a aucune raison d'hériter du bleu de l'interface d'administration.

## Recommandations

P1 (22.4) : passer secteur et ton à l'analyseur ; table de secteurs étendue ; au moins 6 teintes de départ et 4 associations typographiques ; trois directions volontairement **contrastées** (teinte, densité, typographie) pour un même brief ; ajouter au laboratoire un **indice de diversité** (nombre de teintes distinctes, de typographies, de signatures de blocs sur 15 scénarios) à améliorer à chaque palier. P2 : recettes de blocs par secteur (un restaurant n'a pas la même accueil qu'un cabinet).

## Limites

Pas de modèle de langage : l'interprétation de mots comme « chaleureux » reste par mots-clés. Le visuel d'attente (fournisseur « démonstration ») n'est pas une image de marque. Pas de mesure perceptive (distance de couleur, similarité visuelle) : on compte des attributs.
