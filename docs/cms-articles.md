# KOLAKISA CMS — Articles (palier 4)

## Choix d'architecture

**Le blog de KOLAKISA existait déjà et complet** (table `posts`, éditeur riche Tiptap avec sauvegarde automatique, versions, panneau SEO,
programmation, adresses redirigées, commentaires, catégories et étiquettes, pages publiques `/blog`). Le palier 4 n'a donc créé NI une
deuxième entité « article », NI un nouvel éditeur : il ajoute la **gestion CMS** au-dessus du blog existant et branche la médiathèque du CMS.

- **Éditeur d'articles = l'éditeur du blog** (`/formateur/blog/:id/modifier`). Ce n'est pas le Page Builder : le Page Builder compose des
  sections et des mises en page (pages), l'éditeur du blog est un éditeur de document (titres, paragraphes, listes, citations, liens,
  images, vidéos, encadrés, versions). Les réutiliser l'un pour l'autre aurait dupliqué du code sans bénéfice.
- **Gestion = KOLAKISA CMS → Articles** (`/marketing/site-web/articles`) : liste, recherche (titre, adresse, extrait, contenu), filtres
  (état, auteur, catégorie, date), tri, pagination côté base (20 par page), actions groupées, création (titre → brouillon → éditeur),
  duplication, corbeille, restauration, suppression définitive, publication.
- **Corbeille** : suppression douce (`posts.deleted_at`). L'article reste en base, hors ligne (`published = 0`, statut brouillon), restaurable
  en brouillon ; jamais republié d'office.
- **Médias** : toutes les images (image mise en avant, partage, texte) viennent de la médiathèque du CMS via le sélecteur partagé
  (`KWMediaPicker`). L'adresse `/uploads/marketing/<organisation>/<fichier>` est la référence permanente ; `posts.featured_media_id` garde
  l'identifiant (`mk_media.id`) de l'image mise en avant ; `data-media-id` fait de même dans le texte. La médiathèque indique les articles
  qui utilisent une image et refuse de la supprimer tant qu'elle sert. Le blog n'efface jamais un fichier de la médiathèque du CMS.
  Les anciennes images du blog (`/uploads/thumbnails`) restent utilisables (bouton « Anciennes images du blog » du sélecteur).
- **Sécurité** : le HTML de l'éditeur est assaini côté serveur à chaque enregistrement (`utils/blogHtml.js`) ; les images ne peuvent venir
  que du blog ou de la médiathèque du CMS (liste blanche + existence en base).
- **Droits** : `articles.read` (lecteur), `articles.write` et `articles.publish` (éditeur), `articles.delete` (administrateur).
  La **rédaction** (créer, ouvrir l'éditeur) reste réservée au compte créateur : c'est celle de l'éditeur du blog.

## Programmation
Un article « Planifié » a une date de publication future ; il n'est jamais public avant. Il devient public **à la première lecture du site
après l'heure** (`promoteScheduled`, appelé avant chaque lecture publique du blog, de la liste CMS et de la médiathèque) : il n'y a pas de
tâche de fond. Fonctionnel, sans infrastructure de planification ; l'article n'est « publié » en base qu'à ce moment.

## Préparé, non construit
Visibilité « privé » et protection par mot de passe ; plusieurs sites (le blog est celui du site principal, sans `site_id`) ; préfixe d'URL
configurable (`/blog` est une constante du CMS, `BLOG_BASE`, et des routes publiques du blog) ; gestion centralisée des catégories, étiquettes
et auteurs (lecture seule dans le CMS) ; modération des commentaires.
