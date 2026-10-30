# KOLAKISA — Theme Builder : règles d'affichage (Programme 20.3)

*Source de vérité : `src/marketing/pages/themeTemplates.js` (`pick`, `explain`, `add`, `update`). Testé par `tests/theme-builder-regles.test.js` (sans serveur) et `tests/theme-builder-routes-20-3.test.js` (serveur réel).*

## Familles et critères possibles
| Famille | Inclusion possible | Exclusion possible |
|---|---|---|
| `single_post` (article) | catégorie, étiquette, article précis, public | catégories, étiquettes, articles |
| `blog_archive` (liste du blog) | catégorie, public | catégories |
| `category_archive` | catégorie, public | catégories |
| `tag_archive` | étiquette, public | étiquettes |
| `author_archive`, `single_course`, `search_results`, `static_page`, `not_found` | public seulement | aucune |

Un critère non pris en charge par la famille est **ignoré** à l'enregistrement (jamais conservé en silence).

## Inclusion, exclusion
- Condition vide = « tous ». Les conditions s'ajoutent (ET) : catégorie ET étiquette ET article ET public.
- **Exclusion** (ajoutée par 20.3) : listes de catégories, d'étiquettes ou d'identifiants d'articles. Une exclusion **l'emporte toujours** sur une inclusion. Exemple : modèle général d'article, catégorie « Actualités » exclue.
- Les identifiants d'articles exclus doivent exister (sinon refus). Les noms de catégorie et d'étiquette restent des **textes comparés sans interprétation** (insensibles à la casse, échappés à l'affichage) : ils ne sont **pas** validés contre la liste du blog, pour ne pas changer le comportement historique ; 20 exclusions au plus par critère.

## Priorité (déterministe)
Score de précision : article précis **8** > catégorie **4** (+0,5 si c'est la catégorie propre de l'article, avant ses parentes) > étiquette **2** > public **1** > modèle général **0**. Le plus élevé gagne. **À score égal, le modèle affecté en premier gagne** (ordre de la liste). Aucun tirage au sort.

## Conflits
- Deux modèles de même famille et de même précision sont possibles. À l'ajout et à la modification, l'écran affiche « Attention : même précision que … » (champ `conflicts`). Ce n'est pas un blocage : l'arbitrage est la règle d'ancienneté ci-dessus.
- Un doublon exact (mêmes conditions et mêmes exclusions) est **refusé**.
- « Pourquoi ce modèle ? » (`GET /marketing/site-web/modeles-de-theme`, `resolution.json`) montre le gagnant et la raison de chaque autre modèle, y compris « exclu ».

## Repli
Aucun modèle ne convient, ou la page du modèle n'est pas **en ligne** (brouillon, hors ligne, archivée, supprimée), ou une erreur survient au rendu : le site garde **son affichage d'origine** (`themeRender.renderRegion` renvoie `null`). Un modèle ne peut pas casser le blog ni la page 404 (qui garde son code HTTP 404).

## Modification
`POST …/modeles-de-theme/:id/modifier` : mêmes contrôles que l'ajout, sans faux doublon avec soi-même. L'identifiant, la date de création et le **rang d'ancienneté** sont conservés ; `updatedAt` est mis à jour.
