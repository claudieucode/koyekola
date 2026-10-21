# KOLAKISA CMS — Articles → Tous les articles (palier ARTICLES-01)

Branche `articles-01-liste`, issue de `origin/main` (`e5d423f`). Référence : l'écran WordPress « Articles → Tous les articles ». Ce document décrit l'état **réel**.

## 1. Ce qui existait déjà (réutilisé, rien de recréé)

- Service `src/services/articles.js` : liste filtrée/triée/paginée **dans la base**, compteurs par état, création en brouillon, duplication, corbeille (suppression douce, `deleted_at`), restauration, suppression définitive, publication (contrôle SEO), actions groupées traitées article par article.
- Routes `src/marketing/web/articles.js`, vue `views/marketing/articles.ejs`, éditeur du blog (`/formateur/blog/<id>/modifier`), versions (`post_revisions`), taxonomies (`taxonomy_terms` / `taxonomy_relations`), commentaires (`blog_comments`).
- Isolation par site : `siteContent` (`scopePredicate`, `allowedContent`), garde de portée `routeScopes.js`. Droits : `articles.read/write/edit_own/publish/delete`.
- Menu latéral : Articles → Tous les articles, Ajouter, Catégories, Étiquettes (déjà présents au palier CMS-01).

## 2. Ce que ce palier ajoute

| Fonction | Détail |
|---|---|
| Disposition WordPress | Titre + bouton « Ajouter un article » (mène à la vraie page de création), « Options de l'écran », « Aide », états en texte `Tous (n) \| Publiés (n) \| …`, recherche à droite, barre d'actions groupées + filtres, tableau avec pied répété, compteur « n éléments » |
| Colonnes | Case, Titre (mention « — Brouillon »), Auteur/autrice, Catégories, Étiquettes, Commentaires (approuvés + en attente), Date (Publié / Programmé / Dernière modification) |
| Tri par colonne | Titre, Auteur, Commentaires, Date : `?orderby=…&order=asc\|desc`, validé côté serveur (liste fermée), `aria-sort`, un clic inverse le sens ; ancien `?tri=` conservé |
| Filtre par date | Mois réellement présents dans la liste (`?mois=AAAA-MM`), selon la date affichée (publication, sinon création) ; ne modifie aucune date |
| Filtre par catégorie | Existait ; conservé, combinable avec mois, auteur, recherche, état, tri, page |
| Options de l'écran | Colonnes affichables (mémorisées dans le navigateur) ; nombre par page 5–100 (`?par=`, borné serveur, mémorisé par cookie de l'administration) |
| Aide | Texte réel sur états, recherche, tri, modification rapide, actions groupées, fuseau |
| Actions au survol | Modifier \| Modification rapide \| Corbeille \| Afficher/Prévisualiser (+ Publier, Remettre en brouillon, Dupliquer, Historique, Restaurer, Supprimer définitivement selon l'état et les droits) ; toujours visibles sur écran tactile |
| Modification rapide | Titre, adresse, catégories, étiquettes, état (brouillon/publié) ; route `POST /site-web/articles/:id/modification-rapide` ; l'ancienne adresse d'un article en ligne est gardée en redirection ; une révision « Modification rapide » est écrite |
| Actions groupées | Ajouter une catégorie ; ajouter une étiquette (sans retirer les autres) ; barre du bas du tableau (`action2`) ; résultat « n traités, n refusés » avec motifs |
| Robustesse | Pas de double envoi (formulaire de modification rapide et actions groupées) ; listes d'identifiants acceptées en champs répétés ou séparés par des virgules |

Aucune migration, aucune nouvelle table, aucune nouvelle permission.

## 3. Sécurité vérifiée (tests)

- Toutes les opérations repassent par le serveur : droit (`mayManage` : « tous » ou « les siens »), appartenance au site (`allowedContent` pour l'article **et** pour chaque catégorie/étiquette), existence du terme et de son type.
- Un accès limité au site A ne peut ni modifier un article du site B, ni lui rattacher une catégorie, ni ajouter une catégorie du site B à un article du site A ; une action groupée mêlant les deux ne traite que les articles de A.
- Lecteur : 403 sur la modification rapide et les actions groupées. Anonyme : redirigé/refusé. Auteur sans `articles.publish` : ne peut pas publier par la modification rapide ni modifier l'article d'un autre.
- Les titres saisis sont échappés (pas de HTML injecté). Les paramètres `orderby`, `order`, `mois`, `par`, `page` sont validés (valeurs invalides ignorées ou bornées).

## 4. Limites connues (non faites, pas simulées)

- **Statut « En attente de validation »** : l'onglet n'est pas proposé (le statut `review` existe mais fait partie de « Brouillons » ; aucun flux de validation n'est construit).
- **Modification rapide** : pas de date ni d'auteur (le changement d'auteur et de date de publication se fait dans l'éditeur).
- **Actions groupées** : pas de retrait de catégorie/étiquette, pas de changement de statut vers « Programmé ».
- **Notifications** : seules les confirmations/erreurs d'opérations existent (message mémorisé en session). Aucune notification promotionnelle ni fictive.
- **Options de l'écran** : les colonnes visibles sont mémorisées dans le navigateur (localStorage), pas dans un profil serveur : il n'existe pas de préférences d'interface côté serveur pour le CMS.
- **Fuseau horaire** : les heures sont enregistrées et affichées en UTC (suffixe « UTC ») ; il n'existe pas de réglage de fuseau par site pour le blog.
- **Aperçu** : utilise l'aperçu existant de l'éditeur du blog, réservé aux comptes qui peuvent rédiger.
- **Suppression définitive** : déjà en place (depuis la corbeille, avec versions). Les images de la médiathèque du CMS ne sont jamais effacées.
- **Contrôle visuel en navigateur réel** (alignements, survol, responsive) : non exécuté ici ; les tests vérifient le rendu serveur et la logique.
