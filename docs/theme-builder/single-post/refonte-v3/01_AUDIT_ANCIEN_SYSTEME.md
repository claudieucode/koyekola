# Audit de l'ancien système « Article individuel » (avant la reconstruction)

## Où est quoi
| Élément | Fichier | Rôle |
|---|---|---|
| Type | `src/themeBuilder/types.js` | `single_post`, vue `post` |
| Catalogue (ancien) | `catalog/single_post.js` + `single_post/v2/f01…f12.js`, `shared.js`, `identities.js`, `apply.js` | 100 mises en page v2 en 12 familles ; 5 identités du site, puis 33 identités propres (PR #37) |
| Kit | `catalog/kit.js`, `catalog/index.js` | éléments, `build()`, `thumbDoc()`, lisibilité des liens |
| Rendu | `src/themeBuilder/render.js`, `src/marketing/web/themeRender.js` | `{{post.*}}` résolus depuis l'article de la requête ; habillage `lp-site` |
| Conditions | `conditions.js`, `match.js`, `resolve.js` | critères article : ids, catégorie, sous-catégorie, étiquette, auteur ; priorités |
| Stockage | `store.js`, `instances.js`, `catalog/use.js` | « Utiliser » = copie indépendante (page du Page Builder + ligne `mk_tb_templates`) |
| Widgets article | `marketing/pages/widgets/site.js`, `nodes.js` | postcontent, postmeta, postterms, authorbox, postnav, postcomments, toc, sharebuttons, readingprogress, breadcrumb, querylist |
| Modes d'identité | `catalog/identityModes.js`, `identity.js`, migration 143 | existant pour la Fiche produit ; étendu à l'article en v3 |

## Instances et catalogue
Le catalogue est du **code** : aucune ligne en base tant qu'un modèle n'est pas utilisé. « Utiliser » copie le document dans le site ; les modèles déjà installés ne référencent donc pas les clés du catalogue (`origin_key` n'existait que pour les pieds de page et la Fiche produit). **Remplacer le catalogue ne détruit aucun site.** Le registre réel des modèles installés/publiés/affectés se trouve en base de production (non consultable ici ; la base locale est vide) : la requête de contrôle est donnée dans `06_REMPLACEMENT_ET_RETOUR_ARRIERE.md`.

## Données dynamiques réellement présentes
`post.title, excerpt, url, image, date, modified, author, author_url, author_avatar, author_bio, category, category_url, tags, reading_time, comments, views, slug, id, seo_title, seo_description`. **Absents** : champs personnalisés, sous-titre distinct de l'extrait, galerie dynamique (la galerie, la vidéo et l'audio vivent dans le contenu de l'article).

## Problèmes constatés
1. Héritage graphique : 87 modèles sur 100 dépendaient de la charte du site (mesure du 8 novembre) ; corrigé en partie par la PR #37.
2. Fuites de police résiduelles mesurées en navigateur (voir `04_…`).
3. Deux mécanismes concurrents de « modes d'identité » (ma PR #39 et `main`) : la PR #39 est refermée au profit de celui de `main`.
4. Parité Elementor : Post Info moins riche, flèches de navigation, sidebar centrale en colonne, réactions, champs personnalisés (voir `FEATURE_PARITY_MATRIX.md`).
5. Les 100 anciens modèles étaient 100 mises en page × 5 à 33 identités ; l'audit de structure acceptait des mises en page proches (< 80 %).
