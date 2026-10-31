# Kolakisa — Theme Builder : audit de l'existant et architecture de remplacement

## 1. Audit du Theme Builder actuel (relevé dans le code, `main` du 31/10/2026)
| Brique | Où | Données | Limites constatées |
|---|---|---|---|
| Modèles de thème (11 familles : article, listes, archives catégorie/étiquette/auteur, recherche, page À propos, fiche formation, 404, produit, archive produits) | `src/marketing/pages/themeTemplates.js` ; écran `/site-web/modeles-de-theme` ; rendu `web/themeRender.js` `renderRegion` → `themeTemplates.pick` | `mk_settings` clé `theme.templates` (JSON, **par organisation**, 30 max) | pas d'objet « modèle » propre (juste une affectation page→famille) ; conditions limitées (catégorie, étiquette, article, public + exclusions) ; pas d'OU/ET ; pas de brouillon/versions/archivage/export ; pas de rattachement à un site |
| En-tête / pied de page des sites du Page Builder | `pages/index.js` (`setSiteParts`, `headerOverview`, variantes, exceptions) | composants `mk_web_components` ; `mk_sites.header/footer_component_id` ; `mk_landing_pages.header_mode/…` | un seul en-tête et un seul pied par site ; **aucune condition** (seulement exceptions par page) |
| En-tête / pied du site public (blog) | Apparence › En-tête / Pied (configuration structurée) | `mk_settings` | pas des modèles |
| Composants réutilisables | `mk_web_components` | table dédiée | — |
| Écrans | `views/marketing/theme-templates.ejs`, `site-header.ejs`, `site-footer.ejs`, panneau « Pourquoi ce modèle ? » | — | pas de tableau de bord unifié, pas de miniatures, pas de recherche |
| Appelants du rendu | `routes/blog.js`, `routes/pages.js`, `routes/courses.js`, `server.js` (404), boutique 20.5 | — | **à conserver** (contrat `renderRegion`) |
Les modèles sont des **pages du Page Builder** (kind page) ou des **composants** : ils s'éditent dans l'éditeur existant. Cette propriété est conservée (voir §4).

## 2. Données à préserver
`mk_settings.theme.templates` (affectations) ; `mk_web_components` + `mk_sites.header_component_id/footer_component_id` + variantes/exceptions ; pages-modèles. **Rien n'est supprimé.** Le nouveau système les **importe sans les modifier** (migration idempotente), puis devient la source de vérité du rendu ; les anciennes données restent en place pour un retour arrière.

## 3. Modèle de données cible (migration `124_theme_builder.sql`, additive)
* `mk_tb_templates` : `id`, `organization_id`, **`site_id`** (NOT NULL, FK `mk_sites`), `type` (registre fermé), `name`, `status` (`draft|published|archived`), `source_kind` (`page|component`), `source_id`, `conditions` (JSON validé), `revision`, `published_revision`, `legacy_ref` (UNIQUE par site, pour l'import idempotent), `created_by`, `created_at`, `updated_at`, `published_at`, `archived_at`.
* `mk_tb_versions` : `template_id`, `n`, `name`, `conditions`, `source_snapshot` (copie du contenu au moment de la publication), `created_at`, `created_by`.
* Index : `(site_id, type, status)`. Toutes les requêtes filtrent `organization_id` ET `site_id`.
Le site principal (contenus à `site_id` NULL) est représenté par l'identifiant de sa ligne dédiée `is_primary` lorsqu'elle existe ; sinon il garde l'ancien chemin (voir §7).

## 4. Intégration avec l'éditeur de pages (AUCUNE modification de l'éditeur)
Un modèle référence un **document** existant (page ou composant). « Modifier » ouvre `/marketing/pages/:id/editeur` ou `/marketing/site-web/composants/:id/editeur` — routes publiques existantes. Sauvegarde, canevas, widgets, création guidée : inchangés. Le Theme Builder ne gère que les métadonnées (type, conditions, statut, versions) et crée le document via `pages.createPage` / `pages.createComponent` (API de service existantes). Si un jour l'éditeur doit connaître un type, une **couche d'adaptation** (`src/themeBuilder/editorBridge.js`) traduira sans toucher l'éditeur. Un test de non-régression compare le hachage des fichiers de l'éditeur (`public/js/page-builder*.js`, `views/marketing/page-builder.ejs`) avant/après.

## 5. Modules (`src/themeBuilder/`)
`types.js` registre des types (clé, libellé, groupe, contexte attendu, module requis, document par défaut) · `conditions.js` (schéma, validation, normalisation, libellé lisible) · `match.js` (évaluation d'une condition sur un contexte) · `resolve.js` (candidats → gagnant, conflits, explication) · `store.js` (CRUD isolé par site, versions, archivage) · `legacy.js` (import idempotent) · `portable.js` (export/import JSON validé) · `thumb.js` (miniatures) · `index.js`.
Contexte de résolution : `{ siteId, type, postId, categories[], tags[], authorId, pageId, parentIds[], postType, productId, productCategories[], … }` construit par l'appelant (déjà disponible dans `renderRegion`).

## 6. Rendu et cache
`renderRegion` appelle `themeBuilder.resolve(ctx, {siteId, type, context})` d'abord ; **repli** sur `themeTemplates.pick` (ancien) tant que l'import n'a pas eu lieu pour le site ; en cas d'erreur : affichage d'origine (invariant existant). Cache de résolution en mémoire par `(site, type)` invalidé par un compteur de version incrémenté à chaque publication / archivage / changement de conditions (jamais de modèle périmé).

## 7. Multisite
`site_id` obligatoire ; le site vient de l'adresse (`/site-web/sites/:id/…`) et est revérifié ; export sans identifiant de site ; import = nouvelle ligne du site courant. Partage entre sites : uniquement par export/import explicite. **Écart connu** : le site principal sans ligne dédiée n'a pas d'identifiant ; il est traité par la voie héritée jusqu'à création de sa ligne (migration R9-3).

## 8. Sécurité / accessibilité / performance
Droits : `forms.read` (voir), `forms.write` (créer/modifier/publier), suppression avec `pages.delete`. JSON importé : schéma fermé, aucune clé inconnue conservée, limite de taille, aucun HTML/JS exécutable (le contenu est celui d'un document validé par les normaliseurs natifs). Interface : clavier, rôles ARIA, états de chargement/erreur. Résolution O(n) sur ≤ 200 modèles par site, mise en cache.
