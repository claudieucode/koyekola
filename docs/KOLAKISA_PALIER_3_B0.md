# KOLAKISA — Palier 3 : rapport B0 (audit étendu) et plan final de migration

État : **aucune migration structurelle, aucune donnée de production touchée, rien de poussé ni déployé.** Seul changement de code de B0 : l'audit en lecture seule a été étendu (voir §2). Branche locale `cms-independant`.

## 1. Audit de production du Palier 2 — NON DISPONIBLE
Le résultat de l'audit (Centre de gestion → Sauvegardes → « Audit des sites ») **n'a pas encore été transmis** : je ne peux pas le lancer moi-même (session connectée requise) et je ne le présume pas. Conséquence : **toute la partie « cas ambigus » ci-dessous reste à mesurer sur la vraie base** ; les chiffres de ce rapport viennent d'une base d'essai construite par le vrai serveur, jamais de la production.

## 2. Audit étendu (lecture seule, nombres uniquement)
`src/services/auditSites.js` (fonction `palier3`), écran « Audit des sites » (nouvelle section **« Préparation du palier 3 (informatif) »**) et `scripts/audit-sites.js`. Rien n'y est compté comme anomalie. Il mesure :
- **Volumes** : articles (publiés / brouillons / corbeille), catégories et étiquettes, liens article↔terme, commentaires, médias du blog, médias du CMS, formulaires, fichiers reçus, modèles de pages, blocs enregistrés, blocs réutilisables du blog, contacts, consentements, métadonnées SEO, réglages SEO.
- **Médias et formulaires : qui les utilise ?** Classés en *inutilisés / site principal seulement / un seul autre site / plusieurs sites (à décider)*. Médias : recherche du chemin dans pages (contenu, brouillon, SEO), composants, modèles d'e-mail, réglages de sites et articles. Formulaires : `form_id` des pages et références `formId` dans leur contenu.
- **Contacts** : origine (principal / autre site), contacts présents dans des listes de **plusieurs sites**, contacts dans une liste d'un autre site que leur origine (cas de la décision D12).
- **Catégories** : liens vers une catégorie ou un article disparus (à connaître avant de reconstruire les tables).
- Les **modèles de pages** et **blocs enregistrés** sont *copiés* dans les pages (pas de référence vivante) : aucun usage croisé possible, seul leur nombre est donné.

Vérifié par `tests/audit-palier3.test.js` (5 tests) + `tests/audit-sites-interface.test.js` : classification exacte sur des sites et données distincts, **lecture seule** (nombres de lignes inchangés), **aucun nom de site, e-mail ou contenu** dans le résultat ni dans l'écran, aucune anomalie ajoutée. Résultat : 11 tests exécutés, 11 réussis, 0 échec, 0 ignoré.
*Limite* : si le chemin d'un média est cité sous une autre forme (adresse absolue avec domaine, miniature recadrée), la recherche texte s'appuie sur le chemin `/uploads/…` ; c'est la même règle que la bibliothèque de médias actuelle.

## 3. Inventaire exact des quatre tables à reconstruire (relevé sur le schéma réel, SQLite 3.53.4, clés étrangères actives)
| Table | Contrainte d'unicité à lever | Clés étrangères ENTRANTES (suppression en cascade ou mise à NULL) | Index | Déclencheurs |
|---|---|---|---|---|
| `posts` (46 col., AUTOINCREMENT) | `slug UNIQUE` | `post_slug_history`, `post_revisions`, `post_autosaves`, `blog_comments`, `blog_block_trash` (toutes **CASCADE**) | `idx_posts_published/_category/_cms/_author/_status` + index automatique | `trg_posts_taxonomy_delete` |
| `taxonomy_terms` | `UNIQUE(taxonomy, slug)` | `taxonomy_terms.parent_id` (SET NULL, auto-référence), `taxonomy_relations.term_id` (**CASCADE**) | `idx_taxonomy_terms_parent_id/_parent/_name` | aucun |
| `mk_forms` | `UNIQUE(organization_id, slug)` | `mk_pending_confirmations.form_id` (**CASCADE**), `mk_landing_pages.form_id` (SET NULL), `mk_form_files.form_id` (SET NULL) | `idx_mk_forms_org` | aucun |
| `mk_page_templates` | `UNIQUE(organization_id, name)` | aucune | `idx_mk_page_templates_org` | aucun |
Aucune vue ni déclencheur d'une autre table ne cite ces quatre tables. Références **sans clé étrangère** (suivent les identifiants conservés, donc intactes) : `taxonomy_relations.content_id`, `blog_comments.content_id`, `mk_forms.list_id`.

## 4. Pourquoi la reconstruction ne peut pas passer par le lanceur de migrations SQL actuel
Mesuré, pas supposé : sur une copie, avec les clés étrangères actives, `DROP TABLE mk_forms` **supprime en cascade** les confirmations en attente (1 → 0, mesuré) ; les clés `SET NULL` déclarées sur `mk_landing_pages.form_id` et `mk_form_files.form_id` produiraient de même la perte des liens (d'après leur déclaration, non mesuré séparément). Or `PRAGMA foreign_keys=OFF` est **sans effet à l'intérieur d'une transaction**, et le lanceur enveloppe chaque migration dans `BEGIN IMMEDIATE`. Donc :
- la reconstruction sera une **étape de structure en code** (pas un fichier `.sql` gelé), exécutée au démarrage, **clés étrangères désactivées AVANT la transaction**, puis réactivées, avec `foreign_key_check` bloquant ;
- elle est **idempotente** : si `site_id` existe déjà, la table est sautée ;
- elle écrit une trace dans `schema_migrations` (portée `structure`) et crée avant tout la sauvegarde « AVANT-MIGRATION » du dispositif existant ;
- les colonnes `site_id` des autres tables (médias, etc.) restent de simples migrations SQL additives.

## 5. Plan de reconstruction (les mêmes 8 étapes pour chaque table, dans UNE transaction)
1. Sauvegarde vérifiée (copie cohérente, intégrité, nombre de lignes de chaque table).
2. `PRAGMA foreign_keys=OFF` (hors transaction), `BEGIN IMMEDIATE`.
3. Lire le `CREATE TABLE` réel dans `sqlite_master` ; **vérifier que la contrainte attendue y figure** (sinon arrêt sans rien faire) ; retirer l'unicité, ajouter `site_id INTEGER REFERENCES mk_sites(id)`.
4. Créer `<table>__new`, copier **toutes les colonnes d'origine par leur nom** (identifiants conservés), comparer le nombre de lignes (arrêt si écart).
5. `DROP` de l'ancienne, `RENAME` de la nouvelle ; recréer **tous** les index et déclencheurs d'origine ; ajouter l'unicité *par site* (`COALESCE(site_id,0)`).
6. Restaurer `sqlite_sequence` à sa valeur d'origine (évite de réattribuer un identifiant supprimé).
7. `PRAGMA foreign_key_check` : tout résultat annule la transaction (`ROLLBACK`).
8. `COMMIT`, `PRAGMA foreign_keys=ON`, comparaison finale (§6).
Unicités par site : `posts(COALESCE(site_id,0), slug)` ; `taxonomy_terms(COALESCE(site_id,0), taxonomy, slug)` ; `mk_forms(organization_id, COALESCE(site_id,0), slug)` ; `mk_page_templates(organization_id, COALESCE(site_id,0), name)`. Pour `mk_page_templates` (décision D4) NULL signifie « bibliothèque globale » : l'unicité du nom reste donc valable *dans* la bibliothèque globale.

## 6. Essai réalisé (base d'essai du vrai serveur, jamais la production) — résultats exacts
Jeu : 29 articles + révisions / historiques / sauvegardes automatiques / commentaires, catégories parent-enfant, étiquettes, liens, 4 formulaires + confirmation en attente + page rattachée, 4 modèles, identifiants supprimés pour que `sqlite_sequence` dépasse `max(id)`. **155 tables comparées, 167 lignes avant et 167 après.**
- Données (empreinte de chaque table hors `site_id`) : **0 écart**. Séquences `AUTOINCREMENT` : **0 écart**.
- Index d'origine perdus : **aucun** ; ajoutés : les 4 unicités par site. Déclencheurs perdus : **aucun**. Clés étrangères perdues : **aucune** ; ajoutées : les 4 `site_id → mk_sites`.
- `integrity_check` : ok / ok. `foreign_key_check` : 0 / 0.
- Compatibilité de l'ancien code : insertion d'un article **sans** `site_id` acceptée ; même adresse sur le site principal **refusée** ; même adresse sur **un autre site** acceptée ; suppression d'un article supprime toujours ses révisions (cascade conservée).
- Ré-exécution : sans effet (idempotente).
**Limite essentielle** : cet essai prouve la procédure, **pas** la production (volumes, anciennes données, anomalies). Il ne remplace pas l'essai sur copie fidèle exigé par la décision D8.

## 7. Essai sur une copie fidèle de la production — proposition (sans Terminal, sans partager la base)
Livraison en **deux temps** pour ne jamais rien migrer à l'aveugle :
- **Livraison 1 — outils seulement, aucun changement de structure** : l'audit étendu (§2) + un écran **« Essai de reconstruction »** (Centre de gestion → Sauvegardes) qui, sur une sauvegarde existante, fait une copie temporaire, y exécute la reconstruction, compare exhaustivement (lignes, empreintes, identifiants, relations, index, contraintes, déclencheurs, intégrité, séquences, comportement de l'ancien code), affiche des **nombres uniquement**, teste le **retour arrière** (restauration de la copie d'avant et nouvelle comparaison), puis supprime la copie. La base en service n'est jamais ouverte en écriture.
- **Livraison 2 — migrations** : seulement si l'essai de la livraison 1 sur la **vraie** sauvegarde est concluant et si vous l'autorisez. Toute différence inexpliquée bloque.
La livraison 1 demande un déploiement (autorisation explicite requise) ; je n'ai rien déployé. L'écran d'essai n'est **pas encore écrit** : il le sera après votre accord sur ce plan.

## 8. Éditeur d'articles et routes : analyse (avant toute modification)
**Accès actuel** (`src/routes/blog.js`, `requireBlogAccess`) : le compte « formateur » (créateur) passe partout ; les autres membres de l'équipe n'accèdent qu'à une liste blanche de routes de rédaction (`WRITER_ROUTES`) selon `articles.write` / `articles.edit_own` / `articles.publish` / `taxonomies.write`, **évalués au niveau de l'organisation seulement** (aucun `siteId` n'est passé à `cmsAccess.can`). Le seul contrôle de propriété est `author_id`.
**Conséquences pour l'isolation (à traiter en B5)** :
1. Aucun contrôle de site : avec des articles par site, une personne qui peut écrire sur le site A pourrait, en changeant l'identifiant, ouvrir/modifier/publier un article du site B (IDOR). Le contrôle doit dériver le site **de l'article** et appeler `cmsAccess.can(user, permission, {organizationId, siteId})`.
2. Les personnes qui n'ont accès qu'à certains sites (`mk_site_members`) sont aujourd'hui exclues de l'éditeur (droits d'organisation) : D9 les autorise, **par site**.
3. Le créateur reste global (équivalent « propriétaire de l'organisation »).

**Classement des ~60 routes de l'éditeur (`/formateur/blog/*`) par origine du site, toutes vérifiées côté serveur :**
| Groupe | Routes | Site déterminé par |
|---|---|---|
| A. Sur un article | modifier, aperçu, autosave (+abandon), versions (+restaurer), corbeille de blocs, publier, supprimer, SEO (historique, audit, analyse, espace SEO, PageSpeed) | `posts.site_id` de l'article (jamais l'adresse) |
| B. Création | nouveau (GET/POST), `api/brouillon` | `?site=` / champ `site_id` **vérifié** (`canOn`) |
| C. Bibliothèques/aides sans article | `api/medias*` et envoi d'image, `api/termes`, `api/liens`, `api/suggestions`, `api/blocs*`, `api/ia`, `api/preferences`, `api/apparence`, `api/espace-seo/*`, newsletter, liste `/formateur/blog` | `?site=` imposé par l'éditeur (le site de l'article ouvert) puis **vérifié** ; tout ce qui est écrit doit appartenir à ce site |
| D. Public | `/blog`, `/blog/:slug`, catégories, étiquettes, auteur, `feed`, `recherche`, commentaires (+ suppression), flux RSS | **domaine de la requête** (`req.kwSite`), jamais un paramètre |
Les adresses historiques restent le site principal (D10).

**Matrice de tests de permissions et d'accès croisé (à écrire en B5, avant le code)** — pour chaque opération (lire, créer, modifier, publier, dépublier, supprimer/corbeille, dupliquer, restaurer une version, aperçu, autosave, commenter/modérer, créer/attribuer une catégorie, insérer un média, rechercher, flux RSS, sitemap) : 
- membre du site A : OK sur A, **403/404 sur B** (identifiant d'un article de B) ;
- membre limité à A sur un article de B par identifiant modifié : refus **sans fuite** (même message que « introuvable ») ;
- catégorie de B sur article de A : refus ; média non partagé de B sur article de A : refus ; média partagé : accepté ;
- visiteur : l'article d'un site n'est jamais servi sur le domaine d'un autre ni sur le site principal ; brouillon/corbeille jamais publics ;
- site principal : comportement identique à aujourd'hui (non-régression) ;
- 421/404 du Palier 2 inchangés.

## 9. Emailing et contacts : points de contrôle (B4)
Le moteur est déjà par site pour listes, segments, modèles, campagnes, automatisations, tunnels (`siteScope`). À vérifier/faire : rattachement contact↔site (table dédiée, car `UNIQUE(organization_id,email)` empêche de dupliquer la personne), `mk_consents.site_id`, désinscription par site (D7) avec rebond/plainte/effacement globaux, et **blocage d'envoi sans consentement du site expéditeur** (D12 : visibilité ≠ droit d'envoyer). Nombre de cas concernés = ligne « Contacts » de l'audit (§2).

## 10. Ce que cela change dans le plan
- Le plan B reste valable ; **ajout d'une « Livraison 1 » (outils d'audit et d'essai) avant les migrations**, et de l'**étape de structure en code** (§4) à la place d'une migration `.sql` pour les 4 tables.
- B1 (fondations) et suivantes ne démarrent pas avant : (a) le résultat de l'audit de production, (b) votre accord sur la Livraison 1, (c) l'essai concluant sur la vraie sauvegarde.

## 11. Décisions / actions nécessaires
1. **Vous** : lancer l'audit des sites en production et me transmettre le texte — *indisponible tant que l'audit étendu n'est pas déployé* pour les nouvelles lignes (la partie Palier 2 fonctionne déjà).
2. **Accord** sur la Livraison 1 (déploiement de l'audit étendu + de l'écran d'essai, **sans aucun changement de structure ni de données**) : je l'écris, la teste, puis je vous demande l'autorisation de déployer.
3. **Accord** sur l'étape de structure en code (§4) plutôt qu'un fichier de migration SQL.
