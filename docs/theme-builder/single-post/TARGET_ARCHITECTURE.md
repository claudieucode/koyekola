# Architecture cible Article individuel

**Principe : aucun nouveau moteur.** Tout passe par les briques existantes (voir `KOLAKISA_EXISTING_ARCHITECTURE.md`).

## Ce qui ne change pas
Moteur de rendu `render.js`, grammaire fermée `nodes.js`, étiquettes `{{post.*}}`, moteur de commentaires du CMS, `querylist`, conditions et priorités, copie indépendante par site, JSON-LD produit par le blog.

## Ajouts envisagés (chacun sera soumis à validation, un par étape)
| # | Ajout | Où | Pourquoi |
|---|---|---|---|
| 1 | Étiquette de champ personnalisé `{{post.field.<nom>}}` + repli | `dynamic.js` | parité « champs personnalisés » ; n'existe que si le CMS stocke de tels champs (à vérifier d'abord) |
| 2 | Options de `postmeta` : heure, ordre, icônes | `widgets/site.js` | parité Post Info |
| 3 | `toc` : exclusions, repli | `widgets/site.js` | parité Table of Contents |
| 4 | `postnav` : flèches, bordure | `widgets/site.js` | parité Post Navigation |
| 5 | Colonne latérale branchée sur le type `sidebar` | `render.js` | exploiter les sidebars centrales sans seconde architecture |
| 6 | Nouvelles mises en page `single_post/partN.js` | catalogue | voir plan des 100 concepts |

## Données
Aucune nouvelle table prévue. Un modèle reste : 1 page du Page Builder + 1 ligne `mk_tb_templates`. Aucune migration d'articles.

## Garde-fous
Audit `scripts/audit-article-individuel.js` (100 exactement, similarité < 80 %, grammaire, responsive) + tests existants ; ajout d'un contrôle de diversité par profil de 13 champs (voir plan).
