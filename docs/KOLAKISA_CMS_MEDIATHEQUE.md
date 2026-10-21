# KOLAKISA CMS — Médias → Médiathèque (palier MEDIA-01)

Branche `media-01-mediatheque`, issue de `origin/main` (`3abbe88`). Référence : l'écran WordPress « Médias → Médiathèque ». Ce document décrit l'état **réel**.

## 1. Audit : ce qui existait (réutilisé, rien de recréé)

- **Service** `src/marketing/media/index.js` : table `mk_media`, dossier des envois (`UPLOADS_DIR`, survit aux déploiements), **type lu dans la signature du fichier** (jamais le nom ni le type déclaré), liste blanche (images JPEG/PNG/GIF/WebP/AVIF, vidéo MP4/WebM, audio MP3/WAV/OGG/M4A, PDF, Word/Excel/PowerPoint) ; SVG, HTML, scripts et exécutables refusés ; limites de poids par type (réglables dans Paramètres → Médias, jamais au-delà du plafond serveur) ; nom de stockage fabriqué par le serveur ; corbeille, suppression définitive refusée tant qu'un contenu cite le fichier (`mediaUsage`), versions réduites à la demande (`variants.js`).
- **Page et API** `src/marketing/web/mediaLibrary.js`, vue `views/marketing/media-library.ejs`, scripts `public/js/kwmedia.js` (noyau), `media-library.js` (page), `media-picker.js` (sélecteur partagé : éditeur de pages, éditeur d'articles).
- **Isolation** : un dossier par site (`/uploads/marketing/<organisation>/site-<id>/`), colonnes `reach` / `site_id`, portée imposée par le serveur (`ctx.siteScope` pour un accès limité, `ctx.siteFilter` pour l'équipe), gardes de routes `routeScopes.js`, triggers de base (migration 074).
- **Stockage** : disque local (`UPLOADS_DIR`), servi par `express.static` avec `index: false` et `X-Content-Type-Options: nosniff`. Il n'existe pas de stockage distant : rien n'a été changé ni migré.

## 2. Écarts constatés → changements de ce palier

| Écart | Correction |
|---|---|
| **Bibliothèque globale** : tous les médias historiques (`reach = 'shared'`) étaient visibles dans la médiathèque de **chaque** site | Un site ne voit et ne modifie que **ses** médias (`visibleSql`). Les fichiers historiques forment la médiathèque du **site principal** ; l'équipe les voit sans site choisi, ou avec « principal ». Leurs adresses publiques restent servies (les pages déjà en ligne ne cassent pas). Attribution à un site : `setMediaScope` (équipe), inchangée |
| **Le navigateur n'envoyait jamais le site** : listage, envoi, modification, corbeille, suppression partaient sans `?site=` — un accès limité à un site était refusé (403) et l'équipe écrivait dans la médiathèque commune | `KWMedia` ajoute `site=<id>` à **chaque** appel (balise `mk-media-site`, formulaire de l'éditeur d'articles, page du Page Builder) ; le serveur le revérifie contre les droits (jamais cru sur parole). Les liens de la page (vue, pagination, filtres) conservent aussi le site |
| **Éditeur d'articles** : une image du dossier d'un site (`…/site-<id>/…`) était rejetée en silence comme image mise en avant ; aucune vérification du site de l'image | L'adresse `site-<id>` est acceptée **et** l'image doit appartenir à la médiathèque du site de l'article (principal : fichiers du principal). Une image d'un autre site est refusée à la création, à la modification, au contrôle SEO et à l'aperçu |
| Disposition | **Médiathèque** : titre, bouton « Ajouter un fichier média » (ouvre la zone d'envoi), barre WordPress (icônes liste / grille, « Tous les médias » : images, audio, vidéo, documents avec effectifs, « Toutes les dates » : **mois réellement présents** du site, « Sélection groupée », recherche), sous-rubriques du menu **Médiathèque** et **Ajouter un fichier média** (`/mediatheque/ajouter`) |
| Sélection | Les cases et les actions groupées n'apparaissent qu'avec « Sélection groupée » ; en mode sélection un clic coche, il n'ouvre pas les détails |
| Détails | Précédent / suivant dans l'ordre de la liste affichée (mêmes filtres, même site) en plus des informations, métadonnées, URL copiable, usages et corbeille existants |
| Paquet de site / tailles d'image déjà posées | Lecture « par adresse citée » (`referenceSql`) : un fichier commun historique cité par le contenu du site continue d'être inclus au paquet et dimensionné ; ce n'est pas un parcours de bibliothèque |

Aucune migration, aucune table, aucune permission nouvelle (`media.read / upload / write / delete`).

## 3. Règles d'isolation

1. **Base** : `mk_media.site_id` + `reach` ; triggers 074 (un média commun n'a pas de site, un média de site en a un).
2. **Disque** : un dossier par site ; nom de stockage aléatoire fabriqué par le serveur, chemin jamais choisi par le navigateur.
3. **Serveur** : chaque lecture (liste, détails, compteurs, mois, recherche) et chaque écriture (envoi, métadonnées, corbeille, restauration, suppression, partage, actions groupées) passe par la visibilité du site ; hors portée = « introuvable » ou 403, jamais le fichier.
4. **Accès direct** : une adresse de fichier est **publique** (les pages, e-mails et partages en ont besoin) mais non devinable (horodatage + 6 octets aléatoires) et non listable ; aucune sortie du dossier des médias. Il n'existe pas de fichiers « privés » dans la médiathèque : pour un fichier confidentiel, ne pas l'y déposer.
5. **Éditeurs** : une image choisie doit appartenir à la médiathèque du site de l'article.

## 4. Tests

`tests/media-01-mediatheque.test.js` (30) : disposition et sous-rubriques ; envoi d'une image, d'un PDF, envoi multiple avec échec partiel, SVG / exécutable / HTML déguisé / script / fichier vide refusés d'après le contenu, fichier trop lourd, nom d'origine hostile ; grille et liste, filtres type / mois / recherche (nom, titre, texte alternatif, légende, description) combinés, pagination, état vide ; détails et métadonnées persistantes, références (suppression refusée, article cité), corbeille puis suppression du fichier ; image mise en avant d'un site / d'un autre site / du principal ; isolation (liste, recherche, compteurs, mois, identifiants forgés, écritures, actions groupées, dossiers, traversée de chemins).
Tests existants adaptés : `medias-par-site*` (visibilité des communs : règle D6 remplacée), `cms-media`, `site-menu-*`, `menu-site-inventaire`, `cms-interface` (nouvelle entrée de menu, « Ajouter un article » ouvre l'éditeur depuis ARTICLES-02).

## 5. Limites connues (non faites, pas simulées)

- **Fichiers communs historiques** : plus proposés dans la médiathèque d'un site ; un site qui les utilisait doit les réimporter, ou l'équipe les lui attribue (« commun → site », seulement si le fichier n'est utilisé que par ce site).
- **Images de l'ancien blog** (`/uploads/thumbnails`, table `media` du blog) : bibliothèque historique sans propriétaire de site ; elle reste réservée à l'équipe et n'est pas isolée par site.
- **Images citées dans le texte d'un article** : le texte n'est pas analysé, seul le choix via le sélecteur est contrôlé.
- **« Générer avec l'IA »**, **optimisation / conversion d'images** de la capture : aucune intégration réelle, donc aucun bouton. **Miniatures** : l'original est servi (la grille charge en différé, dimensions réservées) ; des versions réduites existent à la demande mais ne sont pas utilisées par la grille.
- **Précédent / suivant** : limités à la page de résultats affichée. **Vidéo / audio** : badge de type dans la grille (pas d'image extraite).
- **Fuseau** : les mois et dates sont en UTC. **Aide** : pas d'écran d'aide dédié.
- **Contrôle visuel en navigateur réel** (grille, survol, responsive) : non exécuté ici (les tests navigateur sont ignorés sur cette machine).
