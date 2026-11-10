# Elementor et Elementor Pro — catégorie Single Post (lecture des pages officielles, 10 novembre 2026)

Lecture réelle (corps de page obtenu) : single-post-site-part, conditions, site-settings, global-custom-css, elementor-pro-vs-free, breadcrumbs-widget-pro, progress-tracker, intro-to-dynamic-content, developers.elementor.com (global-style, condition-group-type). Lues seulement par résumé de recherche : design-your-single-post-template, selector en CSS personnalisé, loop-grid, breakpoints, kits. Illisibles : single-post-widgets (corps tronqué), global-colors, global-controls (404), « Preview Settings ».

## Natif ou tiers
| Fonction | Statut | Note |
|---|---|---|
| Theme Builder (Single Post) | **Pro** | Création : Theme Builder > « + » > modèle > widgets dynamiques > Publish > conditions. |
| Post Content, Featured Image, Post Excerpt, Post Comments, Post Info, Author Box, Post Navigation, Table of Contents, Share Buttons, Posts | **Pro** | Comparatif officiel. Post Title : non confirmé dans le tableau. |
| Reading Progress Bar | **Pro** (« Progress Tracker ») | Horizontal ou circulaire, cible page ou contenu de l'article. |
| Breadcrumbs | **Pro** mais dépend de **Yoast SEO** | Aucune mention de Rank Math. |
| Reading Time | non confirmé | Aucun widget officiel trouvé. |
| ACF / Pods / Toolset | **tiers** (plans Advanced+) | Champs personnalisés. |
| Loop Grid « related » | résumé de recherche | Requête « Related » (même taxonomie), « Exclude current post » conseillé. |

## Conditions
Par défaut « Entire Site ». Include/Exclude ; sous *Singular* : Posts (tous ou précis), In Category, In Child Categories, In Tag, Posts by Author, Direct/Any child of. Plusieurs conditions possibles. **Aucune règle de priorité documentée** entre deux modèles qui correspondent ; un conflit avec une autre partie du site déclenche un avertissement. Le modèle ne s'applique que si l'article utilise « Default Template » (Canvas et Full Width l'ignorent) et exige des widgets dynamiques.

## Indépendance de style : ce qu'Elementor fait (et ne fait pas)
Aucune page lue ne décrit d'isolation propre à un modèle. Ce qui est sourcé : couleurs et polices globales (Site Settings > Design System, 4 + 4 par défaut), héritables ou remplaçables par une valeur locale par contrôle (icône globe) ; le « Theme Style » ne sert que de repli ; CSS personnalisé global (Pro, Advanced+) et par widget (`selector`). **Un modèle Elementor est donc indépendant seulement en posant des valeurs locales widget par widget ; il n'existe pas de « bac à sable de style » par modèle.** Kolakisa v3 va plus loin (racine isolée + trois modes).

## Écarts avec le dépôt (à corriger dans `elementor-single-post-reference.md`)
Statuts Pro sous-estimés ; priorité 100/80/60/40/20/10 = choix maison, pas une règle Elementor ; Breadcrumbs automatique mais dépendant de Yoast ; Progress Tracker confirmé ; Reading Time = extension propre à Kolakisa ; caveat « Default Template » absent ; breakpoints 1024 / 767 (jusqu'à 6 depuis 3.4) non documentés dans le dépôt.
