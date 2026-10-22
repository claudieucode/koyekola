# KOLAKISA CMS — Commentaires (palier COMMENTAIRES-01)

Branche `commentaires-01`, issue de `origin/main` (`5045a84`). Référence : l'écran WordPress « Commentaires ». Ce document décrit l'état **réel**.

## 1. Audit : ce qui existait (réutilisé, rien de recréé)

- **Données** : une seule table `blog_comments` (contenu générique `content_type` + `content_id`, réponses `parent_id`, membres ou invités, statuts `pending / approved / spam / trash`, `prev_status`, empreinte d'adresse). Aucune table ajoutée.
- **Service** `src/services/comments.js` : création, modération (`moderate`, une action ne compte que ce qui change réellement), réponse, liste paginée en base, effectifs groupés, événements, réglages.
- **Écran** `src/marketing/web/comments.js` + `views/marketing/comments.ejs` : onglets par statut, actions individuelles et groupées, réponse, effacement d'un invité.
- **Isolation par site** : un commentaire n'a pas de site propre, il suit son article (`mk_content_sites`) — `siteContent.commentPredicate` (listes), `allowedComment` (accès limité). Droits : `comments.read / moderate / delete / email`.
- Spam : un piège à robots et un seuil de liens existent déjà (réutilisés). Aucun moteur anti-spam externe n'est branché ni simulé.

### Écarts constatés avec WordPress (avant ce palier)

| Écart | Ce palier |
|---|---|
| Pas de « Les miens » | Ajouté (onglet + effectif) |
| Pas de « Désapprouver » (approuvé → en attente) | Ajouté, individuel et groupé |
| Pas de modification d'un commentaire | « Modification rapide » (dans la liste) et « Modifier » (page complète) |
| Pas de filtre de type | Ajouté : Commentaires / Réponses |
| Colonnes non triables, disposition en tableau « Publié sur / Statut » | Colonnes WordPress : Auteur/autrice, Commentaire, En réponse à, Envoyé le ; tri par colonne |
| Recherche sensible aux accents | Recherche sans accent ni casse (texte, auteur, titre de l'article, e-mail si autorisé) |
| Pas d'actions groupées en bas du tableau | Barre répétée en bas |
| Action d'un commentaire possible hors du site choisi par l'équipe | Voir §3 |

## 2. Fonctions

- **Onglets** : `Tous | Les miens | En attente | Approuvés | Indésirables | Corbeille`, effectifs réels recalculés à chaque affichage, bornés au site courant. « Tous » exclut la corbeille. « Les miens » = commentaires écrits par le compte connecté (jamais ceux d'un invité), hors corbeille.
- **Actions individuelles selon le statut** : Approuver, Désapprouver, Répondre, Modification rapide, Modifier, Indésirable / Pas indésirable, Corbeille, Restaurer, Supprimer définitivement (corbeille seulement, droit `comments.delete`). Une action incompatible n'est ni proposée ni acceptée par le serveur.
- **Actions groupées** : même logique que l'individuel, haut et bas du tableau ; la case globale ne sélectionne que la page courante ; résultat « n traités, n ignorés » avec le motif de chaque refus ; confirmation avant corbeille et suppression définitive.
- **Réponse** : enregistrée sous le commentaire parent, sur le même article et donc le même site, publiée sous le compte du modérateur ; un parent en attente est approuvé en même temps ; une réponse identique renvoyée deux fois n'est créée qu'une fois.
- **Modification** : texte ; nom et e-mail **d'un invité seulement** (ceux d'un membre viennent de son compte) ; e-mail seulement avec `comments.email` ; statut parmi en attente / approuvé / indésirable (la corbeille garde son action réversible). Validation côté serveur, message clair, rien d'écrit en cas d'erreur, « Aucune modification » si rien ne change. Chaque modification est journalisée (`comment.edited`, avec le site, **sans** le texte ni l'e-mail : seulement les champs modifiés).
- **Recherche** : côté serveur, dans la base, avec le statut actif et le site courant. Les e-mails ne sont cherchés que pour les comptes autorisés (sinon une recherche révélerait l'adresse).
- **Tri** : `?orderby=auteur|article|date&order=asc|desc`, liste fermée, `aria-sort`.
- **Pagination** : 30 par page, requêtes `LIMIT/OFFSET`, filtres et recherche conservés dans les liens.
- **En réponse à** : lien vers l'article dans l'administration (site conservé), « Voir l'article » si publié, « Article non publié » sinon, « Contenu supprimé ou introuvable » (sans lien) si le contenu n'existe plus, bulle avec le nombre de commentaires approuvés de l'article (la bulle mène aux commentaires de cet article).
- **Avatar** : photo du compte pour un membre qui en a une, sinon initiales. Aucun service externe (Gravatar) n'est appelé : l'adresse e-mail n'est jamais envoyée à un tiers.

## 3. Multisite (contrôlé côté serveur)

- Liste, effectifs, recherche, filtre par article, « Les miens », tri et pagination sont bornés au site courant (`commentPredicate`).
- Un accès limité au site A : refusé (403) sur toute action, modification, réponse ou page d'édition d'un commentaire du site B ou du principal, **sans écriture**.
- **Nouveau** : quand l'équipe a choisi un site (`?site=`), les actions (individuelles et groupées) ne touchent que les commentaires de **ce** site ; un identifiant d'un autre site est « introuvable ». Sans site choisi, l'équipe garde ses droits historiques sur tous les sites.
- Redirections et liens conservent `?site=` ; aucune action n'est redirigée vers le site principal par défaut.
- Le site d'une réponse est celui de l'article ; le journal d'audit porte le site du commentaire.
- Aucune migration, aucune nouvelle table, aucune nouvelle permission.

## 4. Sécurité

- Le texte d'un commentaire est stocké en texte brut et **échappé à l'affichage** (liste, volets, page de modification) ; nom et e-mail aussi.
- Toute opération repasse par le serveur : droit (`comments.moderate`, `comments.delete`, `comments.email`), appartenance au site, statut compatible. Lecteur : 403 partout, aucune écriture.
- Paramètres de tri, de type, de page : listes fermées ou bornées. Recherche : requêtes paramétrées, jokers `%` `_` neutralisés.
- Double envoi : actions idempotentes (déjà dans l'état demandé = « ignoré », jamais un faux succès), réponses dédoublonnées, boutons grisés après envoi.

## 5. Limites connues (non faites, non simulées)

- **Site web de l'auteur** : le modèle de données ne stocke pas de site web pour un commentateur ; la colonne Auteur n'en affiche donc pas.
- **Types** : seuls « Commentaires » (premier niveau) et « Réponses » existent. Il n'y a ni ping ni rétrolien ; ils ne sont pas proposés.
- **Fuseau horaire** : les dates s'affichent en UTC (suffixe « UTC ») ; il n'existe pas de réglage de fuseau par site.
- **Anti-spam** : seuls le piège à robots et le seuil de liens existent ; aucun service (Akismet…) n'est branché.
- **Options de l'écran** (nombre par page) : non faites sur cet écran ; 30 par page fixe.
- **Tout sélectionner sur tous les résultats du filtre** : non fait ; la sélection globale vaut pour la page courante.
- **Badge « en attente » dans le menu** : non fait.
- **Contrôle visuel en navigateur réel** (volets, survol, responsive) : non exécuté ici ; les tests vérifient le rendu serveur et la logique.
- **Page « Modifier »** : ouverte dans le cadre central avec `?site=` (la délégation de cadre de site ne couvre qu'une sous-page).
