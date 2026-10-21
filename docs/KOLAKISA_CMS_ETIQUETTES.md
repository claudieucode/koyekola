# KOLAKISA CMS — Articles → Étiquettes (palier ARTICLES-04)

Branche `articles-04-etiquettes`, issue de `origin/main` (`e8910cd`). Référence : l'écran WordPress « Étiquettes ». Ce document décrit l'état **réel** ; il complète `KOLAKISA_CMS_CATEGORIES.md` (même écran, même service).

## 1. Audit : ce qui existait (réutilisé, rien de recréé)

Les étiquettes sont des termes de la **même** taxonomie que les catégories (`taxonomy_terms` avec `taxonomy = 'tag'`, relations dans `taxonomy_relations`) ; `src/services/taxonomy.js`, `src/marketing/web/taxonomies.js`, `views/marketing/taxonomy-terms.ejs` et `public/js/cms-taxonomy.js` servent les deux écrans. Depuis ARTICLES-03, l'écran Étiquettes a déjà la disposition WordPress : formulaire « Ajouter une étiquette » à gauche (nom, slug, description — sans catégorie parente), tableau Nom / Description / Slug / Total à droite, tri par colonne, recherche, actions groupées haut et bas, pagination, état vide, notifications de l'administration. L'éditeur d'articles utilise le même service (`/formateur/blog/api/termes`, `setTerms`).

## 2. Écarts constatés → changements de ce palier

| Écart | Correction |
|---|---|
| Une étiquette **utilisée** ne pouvait pas être supprimée (refus « utilisé… »), contrairement à WordPress et à la consigne | **Supprimer une étiquette utilisée la retire de ses articles ; aucun article n'est supprimé.** Confirmation explicite (« retirée de N articles »), miroir texte `posts.tags` actualisé, compteurs recalculés. « Fusionner… » reste disponible pour garder le classement. Les **catégories** gardent leur règle (destination obligatoire) |
| Actions groupées : étiquettes utilisées refusées | Elles sont supprimées (retirées de leurs articles) ; résultat « n termes supprimés » ; ids hors site → ignorés |
| Création rapide depuis l'éditeur (`findOrCreateTag`) : cherchait l'étiquette **tous sites confondus** ; si le site B avait « Conseils », le site A recevait « Ce nom n'est pas disponible » | L'étiquette est cherchée **dans le site de l'éditeur** : chaque site a la sienne (adresses publiques distinctes `conseils`, `conseils-2`) ; une étiquette d'un autre site n'est jamais reprise ni renvoyée |
| Texte d'aide de l'écran | Notes réelles : suppression, fusion, définition du Total, pas de hiérarchie, une liste par site |

Aucune migration, aucune table, aucune permission nouvelle (`taxonomies.read / write / delete`).

## 3. Règles

- **Total** : articles existants (brouillons, programmés, publiés), **hors corbeille**, un article une seule fois (relation unique terme/article) ; calcul groupé dans la requête de liste ; le chiffre mène à la liste des articles filtrée par étiquette.
- **Slug** : vide → tiré du nom (accents, espaces superflus), fourni → normalisé et refusé s'il est pris ; jamais remplacé en silence. Les adresses publiques `/blog/etiquette/<slug>` sont communes à tous les sites : un slug reste unique, mais le message d'un conflit ne révèle jamais le nom d'un terme d'un autre site.
- **Nom jumeau** (casse et accents ignorés) refusé dans le même site seulement. Pas de parent pour une étiquette.
- **Description** : texte brut, 500 caractères, échappé à l'affichage.

## 4. Sécurité vérifiée (tests)

Modifier, supprimer ou fusionner l'étiquette d'un autre site : refusé sans écriture ; fusion de A vers B refusée ; actions groupées : seules les étiquettes du site sont touchées ; création sur A invisible sur B, sur le principal et pour l'administrateur de B ; lecteur : aucun formulaire, 403 sur toutes les écritures ; anonyme refusé ; l'éditeur refuse une étiquette d'un autre site (relation inter-sites impossible, y compris par la base) ; tri : colonne arbitraire ignorée ; recherche : `%` littéral ; description : HTML échappé.

## 5. Limites connues (non faites, pas simulées)

- **Convertisseur étiquettes → catégories** : n'existe pas dans Kolakisa ; **aucun lien factice**. La conversion (et l'inverse) reste à développer dans un palier dédié ; le point d'appui serait `taxonomy.merge` / `remove` côté service (déplacer les relations vers un terme d'une autre taxonomie).
- **Pas de « modification rapide » en ligne** : « Modifier » ouvre la fenêtre de modification complète (nom, slug, description).
- **Actions groupées** : « Supprimer » uniquement.
- **Options de l'écran / Aide** de la capture : non reproduites.
- **Tri alphabétique** : les noms accentués en tête (« É… ») sont classés après Z (comportement SQLite préexistant).
- **Contrôle visuel en navigateur réel** : non exécuté ici.
