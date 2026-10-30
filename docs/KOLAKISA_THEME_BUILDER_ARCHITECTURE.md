# KOLAKISA — Theme Builder : architecture (Programme 20.3)

*Cet état décrit le code réel. Le Theme Builder n'a pas été reconstruit : le programme 20.3 étend celui des missions 9 / 9.1 (`KOLAKISA_THEME_BUILDER_AUDIT.md`).*

## Principe
Un **modèle** = une page du Page Builder (même éditeur, même format de document, mêmes brouillon / publication / 100 versions) **affectée** à une famille de pages du site public avec des conditions. Un seul moteur de rendu : `web/themeRender.js` `renderRegion` → `landing.viewModel` → `marketing-public/_sections`.

## Stockage
- Affectations : réglage `theme.templates` de l'**organisation** (`mk_settings`), liste JSON (30 modèles au plus). Champs : `id`, `type`, `pageId`, `category`, `tag`, `postId`, `audience`, `exclude`, `createdAt`, `updatedAt`. **Aucune migration** n'a été ajoutée par 20.3.
- Contenu du modèle : `mk_landing_pages` (colonnes `draft`, `sections`, `status`, `revision`, `site_id`). Le modèle ne contient jamais de copie du contenu éditorial : les étiquettes `{{post.…}}`, `{{course.…}}`, `{{query.…}}` sont résolues **à chaque rendu** depuis le contexte de la requête.
- En-tête / pied de page : composants globaux (`mk_web_components`) et parties de site (`mk_sites.header_component_id`, `footer_component_id`) ; apparence du blog : `services/appearance.js`. Non modifiés.

## Types de modèles
| Type | État réel |
|---|---|
| Article, liste du blog, catégorie, étiquette, auteur, recherche du blog, À propos, 404, fiche formation | **Opérationnels** (branchés dans `blog.js`, `pages.js`, `courses.js`, `server.js`) |
| En-tête, pied de page | Opérationnels par composants globaux du site (autre mécanisme, brouillon + « Mettre à jour ») |
| Page individuelle générique | **Absente** (voir REMAINING_ISSUES) |
| Produit, archive produits, catégorie produits | **Absents** : aucune boutique à brancher dans ce dépôt (le paiement concerne les formations) |

## Permissions
`forms.read` pour lire, `forms.write` pour ajouter / modifier / retirer (contrôle côté serveur, testé en direct). Une page modèle doit appartenir à l'organisation, ne pas être archivée ni être une étape de tunnel.

## Prévisualisation
Un modèle se prévisualise dans l'éditeur de pages (données du dernier article / de la dernière formation, `previewScope`) et son rendu réel se vérifie par « Pourquoi ce modèle ? ». **Limite** : on ne peut pas encore choisir l'article d'aperçu (voir REMAINING_ISSUES).

## Isolation
Réglages et pages sont filtrés par `organization_id`. **Limite** : les affectations sont par organisation, non par site du Page Builder ; une page d'un autre site de la même organisation peut servir de modèle (comportement antérieur, conservé). Voir REMAINING_ISSUES.
