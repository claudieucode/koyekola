# Matrice de parité fonctionnelle KOLAKISA / WordPress (palier 23)

*Générée par `audit-parite/generer.js` à partir de `audit-parite/matrice-donnees.js` : 182 capacités.*

**Légende des statuts** : V = COMPLÈTE ET VALIDÉE · P = PARTIELLE · NV = PRÉSENTE MAIS NON VALIDÉE · D = DÉCORATIVE / NON FONCTIONNELLE · B = BUGUÉE · A = ABSENTE · DB = DOUBLON · NA = NON APPLICABLE

**Légende des catégories** : A = Essentielle · B = Avancée · C = Administration / maintenance · D = Sécurité / données · E = Propre à KOLAKISA · F = WordPress non pertinent / différent

**Tests** : T = suite automatisée existante (relancée dans cet audit) · S = sonde écrite pour cet audit (`audit-parite/sonde-*.js`) · D = lecture du code ou de la documentation seulement · N = non testé. Une ligne marquée « D » seul n'est **jamais** « complète et validée ».

**Gravité de l'écart** : P0 critique · P1 élevée · P2 moyenne · P3 faible · — aucun écart.

## Pages (20)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| PG-01 | A | Créer une page | Pages → Ajouter | CMS → Pages → nouvelle page (gabarit au choix) ; ouvre le Page Builder | **V** | tests/cms-pages.test.js (31) ; sonde : POST /marketing/pages → 302 vers la fiche | T,S | — |  |  |
| PG-02 | A | Modifier titre, adresse, description, auteur | Modification rapide | Fiche de la page : nom, adresse, titre, description, page parente, site, formulaire, indexation | **V** | cms-pages (réglages, adresse refusée si invalide/doublon) | T | — |  |  |
| PG-03 | A | Dupliquer | Plugin (non natif WP) | Action « Dupliquer » (copie en brouillon) | **V** | sonde : dupliquer → 302 /pages/2 ; cms-pages | T,S | — |  |  |
| PG-04 | A | Corbeille et restauration | Corbeille | Archiver / restaurer (`archived_at`) ; une page testée en A/B ou liée à un tunnel est protégée | **V** | sonde : archiver 302, restaurer 302, `archived_at` revenu à null ; cms-pages ; protections palier 18/22 | T,S | — |  |  |
| PG-05 | A | Suppression définitive | Supprimer définitivement | Supprimer (après corbeille) avec contrôle des dépendances | **V** | cms-pages (suppression refusée si utilisée), cms-abtest | T | — |  |  |
| PG-06 | A | Publier / dépublier ; brouillon distinct du public | Publier / Repasser en brouillon | Version publiée figée ≠ brouillon ; publier archive une version | **V** | sonde : publié → 200, dépublié → 404 ; cms-pages (le public garde la version A tant que B n'est pas publiée) | T,S | — |  |  |
| PG-07 | A | Brouillon automatique et protection contre l'écrasement | Enregistrement auto + verrou d'édition | PUT /brouillon avec numéro de révision (409 si périmé) | **V** | cms-pages (révision périmée refusée) ; cms-revisions | T | — |  |  |
| PG-08 | A | Prévisualisation | Aperçu | /pages/:id/apercu (vrai rendu), aperçu d'un point d'historique | **V** | sonde palier 22 + cms-pages | T | — |  |  |
| PG-09 | A | Recherche, filtres, tri, pagination | Liste des pages | Recherche, filtre état/site, tri, pagination côté base (25/page), onglets avec vrais compteurs | **V** | cms-pages « liste : recherche, filtres, tri, pagination, actions groupées » ; sonde : recherche | T,S | — |  |  |
| PG-10 | A | Actions groupées | Actions groupées | POST /pages/actions | **V** | cms-pages (même bloc de tests) | T | — |  |  |
| PG-11 | A | Unicité des adresses et conflits | Slug unique | Adresse unique globale ; refus des adresses invalides ou déjà prises | **V** | cms-pages (adresses refusées : majuscules, underscore, doublon) | T | — |  |  |
| PG-12 | A | Changement d'adresse → redirection | Redirection auto (WP 301 sur les articles) | 301 de l'ancienne adresse + historique `cms_url_history` | **V** | sonde : /p/page-parcours → 301 /p/nouvelle-adresse ; cms-urls | T,S | — |  |  |
| PG-13 | B | Hiérarchie parent / enfant | Page parente → URL /parent/enfant | Champ « Page parente » enregistré, mais l'adresse reste /p/<adresse> (aucun chemin hiérarchique) ; sert à l'organisation | **P** | views/marketing/landing.ejs : « préparation : l'adresse reste /p/… » ; export porte `parentRef` | D | P3 | Permaliens | Décider si l'arborescence doit se refléter dans l'URL |
| PG-14 | B | Programmer la publication d'une page | Planifier | Aucune colonne ni action de programmation pour les pages (existe pour les articles) | **A** | colonnes de mk_landing_pages : aucune date de programmation ; `promoteScheduled` ne traite que `posts` | D | P2 |  | Ajouter la programmation aux pages (même mécanisme que les articles) |
| PG-15 | A | Page publiée = indexable par défaut | Indexable par défaut | Une page publiée est « en ligne mais non indexée » tant qu'on ne coche pas l'indexation (héritage des pages d'atterrissage). Constaté : `robots = noindex, nofollow` et absente du sitemap | **P** | sonde : `robots=noindex, nofollow`, page absente du sitemap ; migration 027 : `indexable DEFAULT 0` | S,D | P2 | SEO | Décider du défaut selon le type de page (page du site vs atterrissage) |
| PG-16 | A | Choisir la page d'accueil | Réglages → Lecture | `home_page_id` consommé par le routage, le canonical et le sitemap | **V** | cms-parametres ; cms-urls | T | — |  |  |
| PG-17 | D | Isolation par site des pages | Multisite WP | Droits calculés par site (`cmsAccess`), filtre `site_id` partout | **V** | cms-pages (filtre par site), cms-users (accès par site, IDOR) | T | — |  |  |
| PG-18 | D | Permissions réelles sur les pages | Capacités edit_pages… | forms.read / forms.write / pages.delete contrôlés côté serveur | **V** | sonde matrice : 360 routes × 6 profils ; cms-users | T,S | — |  |  |
| PG-19 | B | Page privée / protégée par mot de passe | Visibilité : privé / mot de passe | Non implémenté (cité « préparé, non construit » pour les articles ; rien pour les pages) | **A** | docs/cms-articles.md ; aucune colonne `visibility`/`password` sur les pages | D | P3 |  | À planifier si des contenus réservés sont attendus |
| PG-20 | B | Modèles de page / de thème | Templates de page, hiérarchie de templates | Modèles de thème affectés par famille (article, archive, 404, recherche, page) avec priorité | **V** | cms-appearance (42) | T | — |  |  |

## Page Builder (16)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| PB-01 | A | Ajouter sections, conteneurs, widgets | Éditeur de blocs | 86 types de widgets (banc d'essai documenté) ; ajout par clic ou glisser | **V** | tests Chrome editeur-* (68 fichiers passés un par un dans cet audit, tous verts quand lancés seuls) ; docs/WIDGETS-INVENTAIRE.md (86 types, banc non rejoué) | T | — |  |  |
| PB-02 | A | Déplacer, dupliquer, supprimer, sélectionner | Glisser-déposer, dupliquer | Canevas + panneau Structure synchronisés | **V** | editeur-structure-navigateur : 25/25 (relancé seul) | T | — |  |  |
| PB-03 | A | Hiérarchie / panneau Structure (calques) | Vue Liste | Panneau détachable, repli, renommer, verrouiller, masquer | **V** | editeur-structure-navigateur | T | — |  |  |
| PB-04 | A | Panneau de propriétés et styles | Inspecteur de bloc | Inspecteur universel (propriétés, états, classes globales, styles enregistrés) | **V** | tests editeur-droite, proprietes-*, styles-enregistres (Chrome) | T | — |  |  |
| PB-05 | A | Responsive ordinateur / tablette / mobile | Aperçu responsive | Valeurs par écran, aperçu 3 tailles | **V** | editeur-structure T15/T15b ; editeur-apercu-navigateur | T | — |  |  |
| PB-06 | A | Annuler / rétablir | Undo/redo | Annuler/rétablir avec état exact restauré | **V** | editeur-structure T11/T12 | T | — |  |  |
| PB-07 | A | Enregistrement automatique | Autosave | Brouillon enregistré sur le serveur (PUT /brouillon) | **V** | cms-pages ; editeur-* (enregistrer, quitter, revenir) | T | — |  |  |
| PB-08 | A | Historique, comparaison, restauration | Révisions | Historique par page (cms_revisions + versions publiées), comparer, restaurer sûr | **V** | cms-revisions (39) | T | — |  |  |
| PB-09 | A | Récupération après coupure réseau / fermeture | Sauvegarde locale du navigateur | Aucune copie locale dans le Page Builder (le serveur ne reçoit que ce qui a été envoyé) ; l'éditeur d'articles en a une | **A** | docs/cms-revisions.md « le Page Builder n'a pas de copie locale » | D | P2 |  | Copie locale + proposition de restauration à la réouverture |
| PB-10 | A | Page publiée fidèle à l'éditeur | WYSIWYG | Même rendu `_node.ejs` pour canevas et public | **NV** | architecture documentée (un seul rendu) ; fidélité visuelle non mesurée dans cet audit | D | P3 |  | Test visuel de comparaison éditeur / public |
| PB-11 | A | Réutiliser la médiathèque dans les widgets | Médiathèque dans les blocs | Sélecteur partagé KWMediaPicker | **V** | cms-media (31) ; sonde Chrome : sélecteur ouvert dans l'éditeur | T,S | — |  |  |
| PB-12 | B | Données lisibles, non enfermées | Contenu en HTML/blocs JSON | Arbre JSON ouvert ; export/import de pages (`/pages/:id/exporter`, importer.json) | **V** | routes + cms-outils (export de pages) | T | — |  |  |
| PB-13 | B | Code / HTML / CSS personnalisé | Bloc HTML personnalisé, CSS additionnel | Pas de champ CSS libre (volontaire, sécurité) ; classes globales et styles enregistrés ; aucun widget « HTML libre » identifié | **P** | docs/cms-appearance.md « pas de champ CSS libre » ; liste des widgets | D | P3 |  | Décider d'un bloc HTML réservé aux administrateurs |
| PB-14 | B | Composants et patterns réutilisables | Motifs de blocs synchronisés | Composants synchronisés + patterns statiques | **V** | cms-appearance ; tests composants (Chrome) | T | — |  |  |
| PB-15 | C | Performance de l'éditeur | — | Chargement mesuré : 1,3 à 2,6 s ; 1,2 à 1,8 Mo non compressés ; 144 cibles de moins de 24 px (éditeur dense) | **P** | sonde navigateur (Chrome réel) ; docs/KOLAKISA_PERFORMANCE_* | S | P3 |  | Suivre les mesures du chantier performance (hors audit) |
| PB-16 | C | Éditeur d'articles séparé du Page Builder | Un seul éditeur de blocs | Deux éditeurs : Page Builder (pages) et éditeur de document Tiptap (articles) — choix assumé, documenté | **DB** | docs/cms-articles.md « Choix d'architecture » | D | P3 |  | Décision de produit : unifier ou assumer la dualité |

## Articles (20)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| AR-01 | A | Créer et modifier un article (éditeur riche) | Éditeur de blocs | Éditeur Tiptap avec autosave, versions, SEO | **V** | cms-articles (35) ; sonde : article créé, publié, rendu | T,S | — |  |  |
| AR-02 | A | Rédaction par plusieurs rôles (auteur, éditeur, contributeur) | Rôles WP : auteur, contributeur, éditeur | Seul le compte créateur ouvre l'éditeur et crée. Administrateur, Éditeur, Auteur, Contributeur : 403 sur l'éditeur ; Auteur/Contributeur ne peuvent ni créer ni publier ; la permission `articles.edit_own` n'a aucun effet pratique | **A** | sonde : 5 profils × (éditeur, liste, publier, créer) ; message d'écran « réservé au compte créateur » | S | P1 | Droits (palier 9) | Ouvrir l'éditeur aux rôles selon `articles.write` / `articles.edit_own` |
| AR-03 | A | Brouillon / publication / dépublication | Statuts | Statuts réels, date de publication, CMS : publier/dépublier | **V** | cms-articles ; sonde : brouillon 404 public, publié 200 | T,S | — |  |  |
| AR-04 | B | Programmation de la publication | Planifier (wp-cron) | Publié à la première lecture après l'heure (pas de tâche de fond) ; même principe que wp-cron | **V** | cms-articles ; sonde : planifié → promu à la lecture, présent au sitemap | T,S | — |  |  |
| AR-05 | A | Extrait, image mise en avant | Extrait, image à la une | Extrait ; image de la médiathèque (`featured_media_id`) | **V** | cms-articles | T | — |  |  |
| AR-06 | A | Catégories et étiquettes sur l'article | Taxonomies | Via le moteur de taxonomies | **V** | cms-taxonomy ; sonde : archives catégorie/étiquette listent l'article | T,S | — |  |  |
| AR-07 | A | Archives : catégorie, étiquette, auteur | Archives | /blog/categorie/:slug, /blog/etiquette/:slug, /blog/auteur/:id | **V** | sonde : 200 et article présent, canonical correct | S | — |  |  |
| AR-08 | B | Archives par date | /2026/10/ | Absentes | **A** | sonde : /blog/archives → 404 ; aucune route de date | S | P3 |  | À décider (utile pour de gros blogs) |
| AR-09 | A | Pagination du blog | Pagination | Pagination côté base | **V** | cms-articles (24 articles, 20/page) ; sonde : page 20 en 460 ms sur 1000 articles | T,S | — |  |  |
| AR-10 | A | Recherche dans le site | Recherche globale (pages + articles) | Recherche limitée au blog (/blog?q=) ; aucune recherche globale ; résultats en noindex | **P** | sonde : /recherche → 404 ; /blog?q= trouve l'article | S | P2 |  | Recherche globale pages + articles (le modèle « résultats de recherche » existe côté templates) |
| AR-11 | A | Adresse d'un article stable, changement géré | Permalien + redirection | /blog/<slug> ; historique des adresses (301) | **V** | cms-urls ; cms-articles | T | — |  |  |
| AR-12 | A | Prévisualisation d'un brouillon | Aperçu | /formateur/blog/:id/apercu | **V** | cms-articles | T | — |  |  |
| AR-13 | A | Corbeille et restauration | Corbeille | `deleted_at`, restauration en brouillon, jamais republié d'office | **V** | cms-articles ; sonde : corbeille → 404 public + lien de menu retiré | T,S | — |  |  |
| AR-14 | A | Révisions, autosave, conflits | Révisions | post_revisions (100), autosave, conflit 409 | **V** | cms-revisions | T | — |  |  |
| AR-15 | B | Article privé / protégé par mot de passe | Visibilité | Non implémenté (« préparé ») | **A** | docs/cms-articles.md | D | P3 |  | À planifier si besoin |
| AR-16 | A | Flux RSS du blog | /feed | Aucun flux sortant (`/feed`, `/blog/feed`, `/rss.xml`, `/blog/rss.xml` : 404). Le dossier `rss` du marketing lit des flux entrants | **A** | sonde : 4 adresses testées en 404 ; src/marketing/rss | S | P2 |  | Ajouter un flux RSS/Atom du blog (et par catégorie) |
| AR-17 | B | Articles propres à un site | Multisite : un blog par site | Le blog est celui du site principal : `posts` n'a pas de `site_id` | **A** | sonde : colonne `site_id` absente de posts, taxonomy_terms, blog_comments, mk_media | S | P2 | Décision multi-site | Décider si chaque site doit avoir son blog |
| AR-18 | A | Actions groupées | Actions groupées | Publier, dépublier, corbeille, restaurer, supprimer avec rapport | **V** | cms-articles | T | — |  |  |
| AR-19 | D | Nettoyage du HTML saisi | kses | Assainissement serveur à chaque enregistrement (`blogHtml.js`) | **V** | sonde : script, onclick, iframe javascript: retirés ; titre échappé | S | — |  |  |
| AR-20 | F | Formats d'article, articles épinglés | Formats, sticky | Non repris | **NA** | — | D | — |  |  |

## Taxonomies (8)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| TX-01 | A | Catégories hiérarchiques, étiquettes | Catégories / étiquettes | Termes, parents (10 niveaux), cycles refusés | **V** | cms-taxonomy (28) | T | — |  |  |
| TX-02 | A | Création, modification, slug, conflits | Idem | UNIQUE (taxonomie, slug) | **V** | cms-taxonomy | T | — |  |  |
| TX-03 | A | Suppression sûre / références | Réassignation à « Non classé » | Réassignation ou fusion ; jamais en silence ; fusion en plus | **V** | cms-taxonomy | T | — |  |  |
| TX-04 | A | Comptages | Compteur | Calculés en SQL | **V** | cms-taxonomy | T | — |  |  |
| TX-05 | A | Archives publiques et SEO | Archives | Pages publiques + canonical ; SEO via `seo_meta` | **V** | sonde : 200, canonical | S | — |  |  |
| TX-06 | B | Taxonomies personnalisées | register_taxonomy | Registre `registerTaxonomy` présent ; pas de page publique ni d'écran pour ces taxonomies | **P** | docs/cms-seo.md, cms-taxonomy.md « préparé, non implémenté » | D | P3 |  | À planifier avec les types de contenu personnalisés |
| TX-07 | B | Taxonomies par site | Multisite | Aucun `site_id` | **A** | sonde : `taxonomy_terms.site_id` absent | S | P2 | AR-17 | Suit la décision multi-site |
| TX-08 | D | Permissions | Capacités manage_categories | taxonomies.read/write/delete | **V** | sonde matrice ; cms-taxonomy | T,S | — |  |  |

## Médiathèque (10)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| MD-01 | A | Importer des fichiers | Ajouter un média | Téléversement (clic, glisser) ; fiche en base | **V** | cms-media (31) ; sonde Chrome | T,S | — |  |  |
| MD-02 | D | Validation des types et tailles | Types MIME autorisés | Contrôle du contenu réel (signature), SVG/HTML/exe refusés, limite de taille | **V** | cms-media (html, svg, exe, faux docx refusés) | T | — |  |  |
| MD-03 | A | Recherche, filtres, tri, pagination | Bibliothèque | Recherche (nom, titre, alt), filtre par type, tri, « charger la suite » | **V** | cms-media (120 fichiers) | T | — |  |  |
| MD-04 | A | Métadonnées : texte alternatif, titre, dimensions, taille | Détails du média | Champs réels ; le sélecteur signale « Sans texte alt. » | **V** | cms-media ; capture du sélecteur | T,S | — |  |  |
| MD-05 | A | Suppression avec détection des références | Suppression (sans garde WP) | Refus tant que le fichier sert (articles, pages) ; corbeille d'abord | **V** | cms-media (supprimer refusé si utilisé) | T | — |  |  |
| MD-06 | B | Miniatures et tailles multiples d'image | Image sizes + srcset | Aucun traitement d'image (pas de bibliothèque) : le fichier original est servi ; pas de `srcset` généré | **A** | package.json (pas de sharp/jimp) ; media/index.js ne lit que les dimensions | D | P2 | Performance | Générer des variantes (WebP) et `srcset` |
| MD-07 | B | Retouche d'image (recadrer, pivoter) | Éditeur d'image | Absent | **A** | aucune route d'édition d'image | D | P3 |  | Hors priorité |
| MD-08 | D | Isolation par site | Multisite | `mk_media` sans `site_id` : médiathèque de l'organisation | **A** | sonde : `mk_media.site_id` absent | S | P2 | AR-17 | Suit la décision multi-site |
| MD-09 | A | Lisibilité de la médiathèque dans l'éditeur (défaut signalé) | — | Défaut NON reproduit : 10 textes mesurés, aucun sous 4,5:1, thème clair et sombre ; fenêtre blanche dans les deux thèmes (non adaptée au thème sombre de l'éditeur) | **V** | sonde contraste (Chrome) ; capture mediatheque-sombre.png | S | P3 |  | Adapter la fenêtre au thème sombre si souhaité (esthétique) |
| MD-10 | D | Permissions | upload_files | media.read/upload/delete | **V** | cms-media (éditeur : suppression 403) | T | — |  |  |

## Commentaires (9)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| CM-01 | A | Commenter (public) et afficher | Commentaires | Formulaire public, affichage imbriqué (3 niveaux) | **V** | cms-comments (39) | T | — |  |  |
| CM-02 | A | Modération : approuver, indésirable, corbeille, restaurer, supprimer | Modération | Écran dédié, actions groupées, répondre | **V** | cms-comments | T | — |  |  |
| CM-03 | D | Anti-spam et abus | Akismet / limites | Piège caché, jeton d'heure, débit, doublons, 3 liens = relu | **V** | cms-comments | T | — |  |  |
| CM-04 | D | Échappement / XSS | kses | Texte brut échappé ; liens `nofollow ugc` | **V** | sonde : `<img onerror>` et `<script>` neutralisés | S | — |  |  |
| CM-05 | B | Notification par e-mail des nouveaux commentaires | E-mail de modération | Absent (« préparé ») | **A** | docs/cms-comments.md | D | P2 | Email Engine | Notifier le modérateur |
| CM-06 | B | Blocage d'auteurs, mots interdits | Liste noire | Absent | **A** | docs/cms-comments.md | D | P3 |  | À planifier |
| CM-07 | D | Un commentaire n'inscrit pas à une liste marketing | — | Garanti par conception ; événements émis mais rien d'abonné | **V** | cms-comments ; cms-contacts | T | — |  |  |
| CM-08 | D | Export / effacement des données d'un commentateur | Outils de confidentialité | Absent pour les invités (e-mail, empreinte IP) | **A** | docs/cms-comments.md « préparé, non implémenté » | D | P2 |  | Prévoir la demande d'effacement (RGPD) |
| CM-09 | B | Commentaires par site | Multisite | Suivent leur contenu ; pas de `site_id` | **A** | sonde : `blog_comments.site_id` absent | S | P2 | AR-17 | Suit la décision multi-site |

## Navigation (8)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| NV-01 | A | Créer, modifier, supprimer des menus | Apparence → Menus | CMS → Navigation | **V** | cms-navigation (39) | T | — |  |  |
| NV-02 | A | Éléments : pages, articles, catégories, étiquettes, liens, ancres | Idem | Types résolus par le service central ; liens sûrs (liste blanche) | **V** | cms-navigation ; sonde : libellé HTML échappé | T,S | — |  |  |
| NV-03 | A | Hiérarchie et réorganisation | Glisser-déposer | 3 niveaux, boutons et glisser | **V** | cms-navigation | T | — |  |  |
| NV-04 | A | Emplacements : en-tête, pied, mobile | Emplacements de thème | nav_locations | **V** | sonde : menu affecté visible sur l'accueil | T,S | — |  |  |
| NV-05 | A | Liens vers un contenu supprimé | Liens morts dans les menus | Lien masqué sur le site, signalé et réparable dans l'admin | **V** | sonde : article en corbeille → lien retiré de l'accueil | T,S | — |  |  |
| NV-06 | B | Menus des sites du Page Builder | Menus par site | `nav_menus.site_id` existe mais n'est pas branché dans les pages | **P** | docs/cms-navigation.md « préparé, non implémenté » | D | P2 | AR-17 | Brancher `forLocation(…, {siteId})` |
| NV-07 | F | Méga-menu | Plugin | Colonnes préparées, non construit | **NA** | — | D | — |  |  |
| NV-08 | C | En-tête / pied d'origine codés en dur comme repli | — | Sans menu affecté, l'en-tête d'origine (dans `views/partials`) s'affiche ; deux chemins de rendu coexistent | **DB** | docs/cms-navigation.md « sans rien casser » | D | P3 |  | Retirer le repli quand tous les sites ont un menu |

## Apparence (8)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| AP-01 | A | Styles globaux (couleurs, polices, tailles…) qui changent le site public | Personnaliser / theme.json | Jetons validés, CSS compilé, `<style id=kw-appearance>` | **V** | cms-appearance (42) ; sonde : réglages visibles | T | — |  |  |
| AP-02 | A | En-tête et pied de page éditables | Éditeur de site | Parties de template du site public (brouillon → publication) | **V** | cms-appearance | T | — |  |  |
| AP-03 | A | Templates par famille (article, archives, recherche, 404) | Hiérarchie de templates | Familles + priorité + repli | **V** | cms-appearance | T | — |  |  |
| AP-04 | A | Page 404 personnalisable | 404.php | Modèle « Page introuvable » ; sans modèle, page d'erreur générique « Erreur · KOLAKISA » (noindex) | **P** | sonde : /introuvable → 404 générique, noindex ; modèle disponible dans Apparence | S | P3 |  | Proposer un modèle 404 par défaut plus utile |
| AP-05 | A | Le site editor réutilise le Page Builder | Éditeur de site = éditeur de blocs | Les modèles de thème sont des pages du Page Builder ; l'en-tête/pied du site public passent par un formulaire dédié (pas par le Page Builder) | **P** | docs/cms-appearance.md | D | P3 |  | Documenter la frontière ou brancher l'éditeur visuel sur l'en-tête |
| AP-06 | B | Apparence par site | Multisite | Deux systèmes : `appearance_configs` (site public principal) et `mk_sites.tokens` (sites du Page Builder) | **DB** | docs/cms-appearance.md « Ce qui existait » | D | P2 |  | Unifier ou documenter la règle d'héritage |
| AP-07 | B | Aperçu avant publication | Aperçu du Personnaliseur | `?kwpreview=1` (équipe, noindex) + cadre ordinateur/tablette/mobile | **V** | cms-appearance | T | — |  |  |
| AP-08 | F | Installer des thèmes tiers | Thèmes | Hors périmètre (système propriétaire) | **NA** | — | D | — |  |  |

## Utilisateurs (10)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| US-01 | A | Liste, profils, statut, suspension | Utilisateurs | Écrans avec filtres ; suspension immédiate | **V** | cms-users (42) | T | — |  |  |
| US-02 | A | Rôles du système et rôles personnalisés | Rôles / capacités | 6 rôles + rôles personnalisés ; chaque case = vérification serveur réelle | **V** | cms-users ; sonde matrice | T,S | — |  |  |
| US-03 | B | Accès par site | Multisite : rôle par site | mk_site_members ; une personne limitée à un site n'ouvre que ce site | **V** | cms-users ; sonde : non-membres 403 sur 360/360 routes | T,S | — |  |  |
| US-04 | A | Invitations | Ajouter un utilisateur | Jeton à usage unique, e-mail, renvoi, révocation | **V** | cms-users | T | — |  |  |
| US-05 | D | Garde-fous d'escalade de privilèges | — | Jamais plus de droits que soi, jamais soi-même, dernier propriétaire protégé | **V** | cms-users | T | — |  |  |
| US-06 | D | Contrôle des permissions côté serveur (pas seulement les boutons) | Capacités | Sonde : 360 routes d'administration × 6 profils (anonyme, élève, lecteur, contributeur, auteur, éditeur) | **V** | sonde matrice : anonyme 360/360 redirigé vers la connexion ; élève non membre 360/360 refusé (403) ; aucune écriture permise à un lecteur hors prévisualisation et préférences personnelles | S | — |  |  |
| US-07 | D | Journal des connexions | Plugins de sécurité | Non journalisées (dernière connexion sur le compte) | **A** | docs/cms-utilisateurs.md | D | P2 |  | Journaliser connexions réussies/échouées |
| US-08 | D | Authentification à deux facteurs | Plugin | Absente | **A** | recherche dans le code : aucune trace de TOTP/2FA | D | P2 |  | Planifier avant la production si des comptes d'équipe sont nombreux |
| US-09 | D | Limitation des tentatives de connexion | Plugin | 10 échecs / 15 min par adresse | **V** | src/middlewares/security.js (limiteur lu dans le code ; tests d'authentification non relancés ici) | D | — |  |  |
| US-10 | F | Import / export d'utilisateurs | Plugin | Volontairement exclu (sécurité) | **NA** | docs/cms-utilisateurs.md | D | — |  |  |

## Révisions (5)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| RV-01 | A | Historique, comparaison, restauration (pages, articles, apparence, patterns) | Révisions | Couche commune `revisions.js` ; restauration transactionnelle avec état « avant » conservé | **V** | cms-revisions (39) | T | — |  |  |
| RV-02 | A | Conflits de modification simultanée | Verrou d'article | 409 + texte conservé (pages, articles, apparence) | **V** | cms-revisions | T | — |  |  |
| RV-03 | B | Corbeille commune | Corbeille par type | `/site-web/corbeille` pour tous les types ; purge manuelle seulement | **V** | cms-revisions | T | — |  |  |
| RV-04 | B | Vidage automatique de la corbeille | 30 jours | Aucun nettoyage automatique | **A** | docs/cms-revisions.md « pas de nettoyage automatique » | D | P3 |  | Option de purge automatique |
| RV-05 | B | Historique des menus | — | Menus non versionnés | **A** | docs/cms-revisions.md | D | P3 |  | À planifier |

## SEO (8)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| SE-01 | A | Titre SEO, meta description, canonical, robots | Plugin SEO | Présents dans le HTML rendu et conformes aux réglages saisis | **V** | sonde : title « Titre SEO perso », description, canonical https://k.test/blog/… ; cms-seo (24) | T,S | — |  |  |
| SE-02 | A | Open Graph / Twitter | Plugin SEO | og:title, og:description, twitter:card ; og:image seulement avec une image | **V** | sonde : og=true, twitter=true, og:image=false sans image mise en avant | S | — |  |  |
| SE-03 | A | Données structurées | Plugin SEO | JSON-LD : Organization, WebSite+SearchAction, BreadcrumbList, BlogPosting, Person | **V** | sonde : 1 bloc JSON-LD, types listés | S | — |  |  |
| SE-04 | A | Sitemap | wp-sitemap.xml | Contenus publiés ET indexables ; index automatique au-delà de 5 000 URL ; `lastmod` | **V** | sonde : article présent ; cms-seo ; production : 200 | T,S | — |  |  |
| SE-05 | A | robots.txt | robots.txt virtuel | Généré, avec `Sitemap:` ; l'indexation dépend de l'environnement | **V** | sonde ; production : contenu relu | S | — |  |  |
| SE-06 | B | Fil d'Ariane | Plugin SEO | BreadcrumbList en JSON-LD (article) ; widget visible dans le Page Builder | **V** | sonde (types BreadcrumbList) | S | — |  |  |
| SE-07 | A | 404 et recherche en noindex | Idem | noindex sur 404 et sur /blog?q= | **V** | sonde : `noindex, nofollow` (404), `noindex, follow` (recherche) | S | — |  |  |
| SE-08 | B | Plan du site par site / domaine propre | Multisite | `seo_redirects` a un `site_id` ; le sitemap lit `site_id` 4 fois ; couverture complète par domaine non vérifiée | **NV** | src/seo/sitemap.js ; cms-urls (domaines) | D | P3 |  | Tester un sitemap par domaine |

## URL (6)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| UR-01 | A | Résolution des adresses (/p, /blog, archives) | Permaliens | Bases fixes (`/p/`, `/blog/`) ; résolveur `src/seo/resolver.js` | **V** | cms-urls (tests) | T | — |  |  |
| UR-02 | A | Redirections 301/302, boucles, tests | Plugin Redirection | Écran Redirections, détection des boucles, test d'une adresse | **V** | cms-urls | T | — |  |  |
| UR-03 | A | Erreurs 404 suivies et liens cassés | Plugin | Journal des 404 + analyse des liens cassés | **V** | cms-urls ; seo-* | T | — |  |  |
| UR-04 | B | Permaliens configurables | Réglages → Permaliens | Structure affichée, non modifiable (volontaire, pour ne pas casser les liens) | **P** | docs/cms-urls.md « Volontairement non fait » | D | P3 |  | Décision de produit |
| UR-05 | B | Domaines personnalisés par site | Multisite : domaines | Un site se rattache à un domaine complet (accueil et pages à la racine) | **V** | cms-urls ; server.js `siteRouting` | T | — |  |  |
| UR-06 | A | Ressource supprimée ou renommée sans lien mort silencieux | — | Historique d'adresses, menus qui masquent, gardes de suppression | **V** | sonde : lien de menu retiré ; cms-urls | T,S | — |  |  |

## Outils (8)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| TL-01 | C | Exporter pages, articles, menus, taxonomies, réglages | Outils → Exporter | Export JSON asynchrone avec intégrité ; fichier conservé 24 h ; **fichiers médias non inclus** | **P** | sonde : export 200 JSON valide (clés format, resources, integrity) ; cms-outils (37) | T,S | P3 |  | Documenter que les images ne sont pas dans l'export |
| TL-02 | C | Importer avec aperçu, conflits et annulation | Importateur | Analyse → rapport → confirmer → possibilité de défaire | **V** | sonde : mode « ignorer » = aucun doublon (1/1/2/1 avant et après) ; mode « dupliquer » = copies créées ; JSON cassé refusé ; cms-outils | T,S | — |  |  |
| TL-03 | C | Importer un site WordPress (WXR) | Importateur WordPress | Absent : aucune importation de format WordPress | **A** | formats acceptés : export KOLAKISA JSON uniquement | D | P2 |  | À planifier si la migration depuis WordPress est un objectif |
| TL-04 | C | Santé du site et diagnostic d'intégrité | Santé du site | 5 contrôles + diagnostic des références | **V** | cms-outils | T | — |  |  |
| TL-05 | C | Mode maintenance, caches | Plugin maintenance | Par site ; l'équipe n'est jamais bloquée | **V** | cms-outils | T | — |  |  |
| TL-06 | C | Recherche / remplacement dans le contenu | Plugin Better Search Replace | Simulation puis remplacement | **V** | cms-outils | T | — |  |  |
| TL-07 | D | Sauvegardes | Plugin de sauvegarde / hébergeur | Copie automatique quotidienne de la base (14 gardées) sur le MÊME disque ; téléchargement manuel base + fichiers depuis le Centre de gestion ; archive des fichiers non automatique ; pas de copie hors serveur automatique | **P** | src/services/backups.js ; sonde : liste affichant la sauvegarde « avant migration » | S,D | P2 | Hébergement | Copie externe planifiée (hors disque du site) ; vérifier les sauvegardes de l'hébergeur |
| TL-08 | C | Journal d'activité | Journal (plugin) | Écran présent ; vide sur un site neuf ; alimenté par `mk_audit_logs` | **NV** | sonde : « Aucune entrée » sur base neuve ; contenu non vérifié après actions | S | P3 |  | Vérifier que chaque action CMS y écrit |

## Paramètres (8)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| ST-01 | A | Identité du site (nom) qui change réellement le rendu | Réglages généraux | Nom → titres, partage, données structurées | **V** | sonde : « NomAuditXYZ » visible sur l'accueil après enregistrement ; cms-parametres (32) | T,S | — |  |  |
| ST-02 | A | Langue, fuseau, formats de date | Réglages généraux | `<html lang>`, formats consommés par `utils/format` | **V** | cms-parametres ; sonde : lang=fr | T,S | — |  |  |
| ST-03 | A | Lecture : page d'accueil, articles par page | Réglages → Lecture | Consommés par le routage et le blog | **V** | cms-parametres | T | — |  |  |
| ST-04 | A | Commentaires, médias, confidentialité, indexation | Réglages | Moteur de réglages avec validation, confirmation des réglages sensibles, audit | **V** | cms-parametres | T | — |  |  |
| ST-05 | B | Permaliens | Réglages → Permaliens | Affichage seul (voir UR-04) | **P** | views : `permalinkStructure()` | D | P3 | UR-04 |  |
| ST-06 | B | Logo, favicon | Identité du site | Chemins de la médiathèque ; logo du site principal géré dans Apparence (deux endroits) | **P** | docs/cms-parametres.md « limites connues » | D | P3 |  | Centraliser |
| ST-07 | D | Un utilisateur non autorisé ne réinitialise pas un réglage | Capacités | Route sans garde de route : le moteur refuse (le nom du site est resté après une demande d'un lecteur) | **V** | sonde : lecteur → 302, nom conservé | S | — |  | Le contrôle est dans le moteur, pas sur la route : à garder en tête lors de futurs ajouts |
| ST-08 | C | Début de semaine, slogan, types JSON | Réglages généraux | Non implémentés (limites connues) | **A** | docs/cms-parametres.md | D | P3 |  | À planifier si besoin |

## Sécurité (12)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| SC-01 | D | Aucune route d'administration ouverte à un anonyme | — | 360 routes testées : 360 redirections vers la connexion | **V** | sonde matrice (audit-parite/resultats/matrice.json) | S | — |  |  |
| SC-02 | D | Aucune route d'administration ouverte à un compte non membre | — | 360 routes testées : 360 refus 403 | **V** | sonde matrice | S | — |  |  |
| SC-03 | D | IDOR et fuite inter-sites | — | Accès limité au site : refus sur les ressources des autres sites | **V** | cms-users (accès par site), cms-pages (filtre par site), cms-outils (« compte limité au site B ne peut pas importer dans A »), cms-abtest-web (IDOR) | T | — |  |  |
| SC-04 | D | XSS (contenu, titres, commentaires, listes d'administration) | — | Échappement et assainissement vérifiés | **V** | sonde : 4 vecteurs ; tests de chaque module | T,S | — |  |  |
| SC-05 | D | Dépôts de fichiers dangereux | — | Signature réelle contrôlée, SVG/HTML/exe refusés | **V** | cms-media | T | — |  |  |
| SC-06 | D | Injection SQL | — | Requêtes préparées ; les 182 gabarits SQL avec fragment dynamique : aucun ne reçoit directement `req.*` (recherche automatique) ; les `ORDER BY` passent par des tables blanches ; revue manuelle non exhaustive | **NV** | git grep (0 interpolation directe de `req./body./query./params.`) ; revue d'échantillon | S,D | P3 |  | Revue ligne à ligne des 182 gabarits si audit externe |
| SC-07 | D | Protection CSRF | Nonces | Pas de jeton par formulaire. Défense : contrôle de l'en-tête Origin/Referer + cookie SameSite=Lax. Une requête SANS Origin ni Referer est acceptée (constaté : POST sans en-tête → 302 accepté ; Origin étranger → 403) | **P** | sonde : sans Origin = accepté ; origine étrangère = refusée ; security.js ligne 41 | S | P3 |  | Jeton CSRF sur les formulaires sensibles ; refuser l'absence d'en-tête pour les POST authentifiés |
| SC-08 | D | En-têtes de sécurité | — | nosniff, X-Frame-Options, CSP (partielle), Referrer-Policy, Permissions-Policy ; HSTS en production (relevé sur kolakisa.com). CSP limitée à object-src/base-uri/frame-ancestors (pas de script-src) | **P** | curl -I https://kolakisa.com/ ; sonde (HSTS absent seulement en HTTP local) | S | P3 |  | CSP avec script-src si possible |
| SC-09 | D | Cookies de session | — | httpOnly, SameSite=Lax, Secure automatique ; aucun cookie posé à un visiteur anonyme | **V** | server.js ligne 139 ; sonde : aucun Set-Cookie sur l'accueil | S | — |  |  |
| SC-10 | D | Secrets non exposés dans le dépôt | — | Aucun motif de clé (sk_live, AKIA, clé privée) dans les fichiers suivis (hors tests/docs) ; seul `.env.example` est suivi | **V** | git grep ; git ls-files | S | — |  |  |
| SC-11 | D | Dépendances vulnérables | — | `npm audit` (production) : 1 haute (source-map-js, déni de service par fichier de cartes source, dépendance indirecte), 0 critique | **P** | npm audit --omit=dev (réseau requis, exécuté) | S | P3 |  | `npm audit fix` après tests |
| SC-12 | D | Journalisation des actions sensibles | Plugin d'audit | mk_audit_logs : réglages, rôles, invitations, tests A/B… ; connexions non journalisées | **P** | docs/cms-utilisateurs.md | D | P2 | US-07 |  |

## UX (9)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| UX-01 | C | Aucune erreur dans la console du navigateur | — | 24 écrans × 2 largeurs : 0 erreur de console, 0 erreur de page, 0 requête échouée | **V** | sonde navigateur (Chrome réel) | S | — |  |  |
| UX-02 | C | Responsive : pas de défilement horizontal | — | 24 écrans à 1280 et 375 px : débordement horizontal 0 | **V** | sonde navigateur | S | — |  |  |
| UX-03 | C | Champs de formulaire étiquetés | — | 0 champ sans nom accessible sur les écrans mesurés | **V** | sonde navigateur (nolabel=0) | S | — |  |  |
| UX-04 | C | Contraste du texte (WCAG AA) | — | 8 écrans × 4 thèmes de menu : 1 seule combinaison sous le seuil (initiale d'avatar blanc sur rose : 3,75:1) | **V** | sonde contraste administration | S | P3 |  | Assombrir la couleur d'avatar |
| UX-05 | C | Recherche globale d'administration | Barre de recherche d'admin | Champ « Rechercher… » **désactivé** (« Disponible dans un prochain palier ») | **D** | sonde « décoratif » : input disabled sur tous les écrans | S | P2 |  | Brancher une recherche réelle ou retirer le champ |
| UX-06 | C | Notifications et aide | Notifications, aide | Deux boutons **désactivés** et libellés « bientôt » (honnêtes : non cliquables) | **D** | sonde « décoratif » | S | P3 |  | Brancher ou retirer |
| UX-07 | C | Navigation au clavier / focus | — | Gérée dans les composants (menu, sélecteur, dialogues) ; parcours clavier complet non testé écran par écran | **NV** | tests de composants ; non testé globalement | D | P3 |  | Audit clavier dédié |
| UX-08 | C | Taille des cibles tactiles | — | 1 à 8 contrôles de moins de 24 px par écran selon l'écran (à 375 px : 0 à 5) | **P** | sonde navigateur (small) | S | P3 |  | Agrandir les petites cibles |
| UX-09 | C | États vides, messages, confirmations | — | États vides présents (ex. « Aucune entrée », « Aucune sauvegarde ») ; messages d'erreur explicites (ex. rédaction réservée) | **V** | sonde ; tests d'écrans | S,T | — |  |  |

## Performance (4)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| PF-01 | C | Écrans d'administration | — | 0,66 à 1,8 s au chargement complet dans Chrome ; ~515 Ko décodés par écran (le serveur compresse en gzip) ; réponses HTML serveur 8–30 ms | **P** | sonde navigateur et sonde HTTP | S | P3 |  | Alléger le CSS/JS commun si besoin |
| PF-02 | C | Blog avec 1 000 articles | — | Page 1 : 26 ms ; page 20 : 460 ms ; article : 180–220 ms ; sitemap 82 Ko en 90–160 ms (base locale de test, machine chargée) | **V** | sonde HTTP (1 000 articles ajoutés à la base de test) | S | — |  |  |
| PF-03 | C | Pages publiques (cache) | Cache de pages | Pas de cache de page (`private, no-cache`) ; accueil 6–7 ms ; images servies sans variantes | **P** | sonde ; MD-06 | S | P3 | MD-06 | Variantes d'images, cache HTTP des images |
| PF-04 | C | Requêtes lentes, journal d'erreurs serveur | Query Monitor | « non mesuré » (aucune plateforme de journalisation centralisée) | **A** | docs/cms-outils.md | D | P3 |  | Mesure en production |

## Moteurs KOLAKISA (10)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| KO-01 | E | Contact Core | — | Contacts, doublons, fusion, cycle de vie, journal, API | **V** | cms-contacts-core (24) + cms-contacts-web (21) | T | — |  |  |
| KO-02 | E | Email Engine | — | Audiences, segments, modèles, campagnes par site | **V** | cms-email-engine (12) + web (14) | T | — |  |  |
| KO-03 | E | Automation Engine | — | Versions, simulation, historique, par site | **V** | cms-automation-engine (22) + web (11) | T | — |  |  |
| KO-04 | E | Tunnel Engine | — | Tunnels qui référencent les pages, protections de suppression | **V** | cms-tunnel + cms-tunnel-web | T | — |  |  |
| KO-05 | E | E-commerce ↔ Contact Core ↔ Automation ↔ Email | WooCommerce (hors périmètre WP cœur) | Commandes, remboursements, événements d'achat | **V** | cms-commerce (15) + web (5) | T | — |  |  |
| KO-06 | E | Analytics central | Plugin analytique | Couche de lecture sur les données existantes | **V** | cms-analytics (21) + web (10) | T | — |  |  |
| KO-07 | E | A/B Testing | Plugin d'expériences | Affectation collante, statistiques, verdict prudent ; 2 versions seulement | **V** | cms-abtest (31) + web (15) + 3 Chrome | T | — |  |  |
| KO-08 | E | Orchestration Tunnel ↔ Automation ↔ Email | — | Événements entre moteurs | **V** | cms-orchestration (17) + web (8) | T | — |  |  |
| KO-09 | E | Doublons entre moteurs | — | Deux A/B (pages et e-mails, séparés et documentés) ; deux systèmes de suivi (visiteurs web et événements marketing) reliés par l'identifiant visiteur ; deux stockages d'images (anciennes miniatures du blog et médiathèque) ; commandes sans `site_id` | **DB** | docs/cms-ab-testing.md ; docs/cms-articles.md ; docs/cms-commerce.md | D | P2 |  | Inventorier les doublons et décider lesquels fusionner |
| KO-10 | E | Événements du CMS branchés sur l'automatisation | Hooks / actions WordPress | Événements `comment.*`, `term.*`, `menu.*` émis ; « rien n'y est branché » (aucun abonné) | **P** | docs/cms-comments.md, cms-taxonomy.md, cms-navigation.md | D | P2 |  | Brancher les événements utiles sur le bus |

## API et extensibilité (3)

| ID | Cat. | Exigence | Équivalent WordPress | État réel KOLAKISA | Statut | Preuve | Test | Gravité | Dépendances | Recommandation |
|---|---|---|---|---|---|---|---|---|---|---|
| EX-01 | B | API REST sur le contenu (pages, articles, médias, menus) | REST API /wp-json/wp/v2 | L'API publique /api/v1 couvre contacts, événements, campagnes, listes, aperçu : AUCUNE ressource de contenu CMS | **A** | src/marketing/api/router.js (routes listées) | D | P2 |  | Définir quelles ressources du CMS exposer |
| EX-02 | B | Extensions / modules tiers | Plugins | Pas de système de plugins ; registres internes (`registerContent`, `registerTaxonomy`, widgets personnalisés par fichier) | **P** | docs/widgets-personnalises.md ; registres | D | P3 |  | Décision de produit : ouverture ou non à des extensions |
| EX-03 | B | Webhooks sortants et clés d'API | Webhooks (plugin) | webhooksOut.js, apiKeys.js (périmètre marketing) | **NV** | routes présentes ; non retestées dans cet audit | D | P3 |  |  |
