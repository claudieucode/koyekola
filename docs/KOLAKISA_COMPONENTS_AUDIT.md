# KOLAKISA — Audit du système de composants réutilisables (LOT 0)

Date : 2026-10-10. Périmètre : table `mk_web_components`, service `src/marketing/pages/index.js`, routes `siteWeb.js` / `landing.js`, éditeur `public/js/page-builder.js`.

## État avant la refonte
| Sujet | Constat |
|---|---|
| Modèle | Un composant = UNE section JSON (`section`). `site_id NULL` = utilisable par tous les sites (c'est une **portée**, pas une nature). |
| Nature | Aucune distinction standard / global. « Global » voulait dire « tous les sites ». |
| Enregistrement | Seulement depuis un bloc unique, par un formulaire dans l'inspecteur ; pas d'aperçu, pas de choix de nature. |
| Insertion | Copie (`reId(clone)`) ou instance synchronisée `{type:"component", componentId}` ; choix flou. |
| Modification | Toute modification de la source était **immédiatement** diffusée à toutes les pages (aucun « Mettre à jour » explicite, aucun brouillon). |
| Détachement | Présent mais seulement pour une section simple, dans l'inspecteur. |
| Suppression | Refusée tant qu'une page l'utilise (message), sans issue pour l'utilisateur. |
| Compteur d'usage | Approximatif. |
| Renommage | Possible (`updateComponentMeta`). |
| Isolation | Par organisation et par site : correcte, conservée. |

## Défauts relevés
1. Aucun moyen d'enregistrer plusieurs blocs.
2. Aucune différence réelle entre modèle et référence partagée.
3. Mise à jour non maîtrisée (diffusion immédiate).
4. Suppression bloquante, sans conversion des instances.
5. Risque de référence orpheline (le rendu d'une section `component` dont le composant manque lève une erreur).
6. Un composant d'en-tête / pied de page / variante partage la même table : à ne pas casser.

## Décisions
- Nouvelle colonne `kind` (standard | global) = nature ; la portée « tous les sites » reste séparée.
- Colonnes `draft` (copie de travail) et `version` ; `section` = version diffusée.
- En-tête, pied de page et variantes gardent la diffusion directe (leur logique « live » existante).
- Suppression transactionnelle avec deux modes (supprimer les instances / les convertir en blocs indépendants).
