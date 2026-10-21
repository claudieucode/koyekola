# KOLAKISA CMS — Articles → Ajouter un article (palier ARTICLES-02)

Ce document décrit l'état **réel**. Branche `articles-02-editeur`, issue de `articles-01-liste` (`7157d06`, déjà dans `main`).

## 1. Audit : l'éditeur existait déjà (rien de recréé)

L'éditeur d'articles de Kolakisa (`views/instructor/blog-form.ejs`, `public/js/blog-editor.js`, routes `src/routes/blog.js`) est déjà un éditeur par blocs de type Gutenberg. Il fournit, testé par `blog-editor`, `blog-mode-document`, `blocs-reutilisables`, `cms-revisions`… :

- barre supérieure (retour, insertion de blocs, annuler / rétablir, titre + état du document, état d'enregistrement, « Enregistrer le brouillon », aperçu, publier, options) ;
- blocs HTML structurés (`content_format = html`), blocs réutilisables, mode « Document » ;
- barre latérale Article / SEO / Bloc : image mise en avant (médiathèque), extrait, état, date / programmation, adresse (slug) avec historique et redirections 301, auteur, catégories (principale + multiples), étiquettes, SEO complet ;
- sauvegarde automatique (`blog.getAutosave`), détection de conflit (`base_updated_at` → 409, rien d'écrasé), versions (`post_revisions`), avertissement de sortie (`beforeunload`) ;
- droits : compte créateur, `articles.write` (tous), `articles.edit_own` (les siens), `articles.publish` à part ; accès limité à un site contrôlé par l'adresse.

## 2. Écarts constatés → ce que ce palier change

| Écart | Correction |
|---|---|
| « Ajouter un article » passait par un formulaire de titre qui créait un brouillon avant l'éditeur (contraire à « ouverture directe » / création différée) | `GET /marketing/site-web/articles/ajouter` redirige vers `/formateur/blog/nouveau` : l'éditeur s'ouvre vide, **rien n'est créé en base avant le premier enregistrement** |
| Le site administré n'était pas transmis à l'éditeur (le formulaire intermédiaire le rattachait) | `?site=<id>` suit l'éditeur (`action` du formulaire, `data-site`, appels d'API) ; `POST /formateur/blog/nouveau` rattache l'article au site **dans la même transaction** que sa création (`siteContent.adopt`) |
| Un accès limité à un site ne pouvait pas ouvrir `/nouveau` (« Créez l'article depuis la liste ») | `/nouveau` accepte `?site=` pour un accès limité, vérifié contre ses sites ; refus sans site ou site d'un autre |
| Retour à la liste : toujours la liste globale | Retour vers `/marketing/site-web/articles?site=<id>` quand l'article est dans un site |

Site « falsifié » : `?site=` non entier, inexistant, supprimé ou site principal → « Site introuvable », aucune écriture. L'équipe n'a pas besoin d'être membre du site ; un accès limité ne peut viser que ses propres sites (403 sinon).

Aucune migration, aucune table, aucune permission nouvelle. L'ancienne route `POST /marketing/site-web/articles` (création par titre) reste disponible (compatibilité, tests existants).

## 3. Tests

- Nouveau : `tests/articles-02-editeur.test.js` (8 tests) — ouverture directe sans création, rattachement au site, site principal, site falsifié, administrateur de A (peut A, pas B, pas sans site), lecteur / anonyme refusés, article d'un autre site fermé par identifiant, cycle brouillon → publié → rouvert.
- Modifié : `tests/menu-site-inventaire.test.js` — l'ancien test attendait la page-formulaire (200) ; il attend maintenant la redirection vers l'éditeur (comportement voulu par ce palier). Aucune assertion de sécurité affaiblie.

## 4. Limites connues (non faites, pas simulées)

- **« Modifier avec Elementor » / « Bibliothèque de design »** (capture WordPress) : aucune intégration de ce type n'existe dans Kolakisa → boutons absents.
- **Modèle d'article, format de publication, « image mise en avant externe », boîtes méta** : le modèle de données n'a pas ces notions ; rien n'est affiché de fictif.
- **Commentaires ouverts / fermés par article** : pas de champ par article dans le modèle actuel ; non ajouté ici (nécessite une migration → palier dédié).
- **Programmation** : la date future est promue en « publié » par `blog.promoteScheduled()`, déclenchée à la consultation du blog, de la liste et du plan du site ; il n'existe pas de tâche planifiée système. La publication peut donc se produire à la première visite après l'heure, pas à la seconde près.
- **Fuseau** : heures en UTC (pas de fuseau par site).
- **Contrôle visuel en navigateur réel** : non exécuté sur cette machine.
