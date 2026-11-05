# Elementor — périmètre « Single Post » : référence et écarts Kolakisa

Document de référence rédigé le 2026-11-04. Il complète, sans les répéter, les documents existants :
`ELEMENTOR_THEME_BUILDER_REFERENCE.md` (tableau de bord, accès, limites), `ELEMENTOR_DISPLAY_CONDITIONS.md` (cibles de conditions, règles de résolution retenues), `ELEMENTOR_TEMPLATE_LIFECYCLE.md` (cycle de vie), `ELEMENTOR_SITE_PARTS.md`, `ELEMENTOR_THEME_BUILDER_UI.md`, `ELEMENTOR_THEME_BUILDER_PARITY.md`.

Règle de rédaction : une information n'est « confirmée » que si le texte d'une page officielle a été effectivement lu lors de cette session. Les textes sont reformulés ; rien n'est recopié.

## 1. Sources consultées (date de consultation : 2026-11-04)

Lues avec succès (contenu de l'article obtenu) :

| URL | Utilisé pour |
|---|---|
| https://elementor.com/blog/design-your-single-post-template/ | création d'un modèle Single, aperçu, widgets typiques, conditions à la publication |
| https://elementor.com/help/post-info-widget/ | Post Info |
| https://elementor.com/help/using-the-author-box-widget/ | Author Box |
| https://elementor.com/help/table-of-contents-pro/ | Table of Contents |
| https://elementor.com/help/post-navigation-widget/ | Post Navigation |
| https://elementor.com/help/post-title-widget/ | Post Title |
| https://elementor.com/help/post-comments-widget/ | Post Comments |
| https://elementor.com/help/featured-image-widget/ | Featured Image |
| https://elementor.com/help/post-excerpt-widget/ | Post Excerpt |
| https://elementor.com/help/post-content-widget/ | Post Content |
| https://elementor.com/help/loop-grid/ | section Query du Loop Grid |
| https://elementor.com/help/conditions/ | conditions : inclure/exclure, conflits (extrait court) |
| https://elementor.com/help/single-post-widgets/ | simple liste des widgets Single Post (aucune option détaillée) |
| Résultats de WebSearch (limités à elementor.com) | confirmation que Post Info, Author Box, Post Navigation, Table of Contents sont des widgets Pro (page de comparaison « Elementor Pro Vs Free ») |

Tentées sans résultat exploitable :

* https://elementor.com/help/single-post-template/ : renvoie la page d'accueil du site, sans contenu d'aide.
* https://elementor.com/help/preview-settings/ : page sans le contenu attendu (aucune explication de « Preview Settings »).
* https://elementor.com/help/share-buttons-widget/ et https://elementor.com/help/breadcrumbs-widget/ : pas de contenu d'article obtenu.
* Les pages d'aide sont très longues (menus de navigation) et l'outil de lecture les tronque ; le corps de l'article a été lu en relisant avec un décalage, sauf indication contraire ci-dessus.

Non consultées : developers.elementor.com (hors celles déjà citées dans `ELEMENTOR_DISPLAY_CONDITIONS.md`), pages Scroll Progress, Posts/Loop Grid détaillées pour « related », Template Kits, responsive/breakpoints, Publish Settings.

## 2. Comportements CONFIRMÉS (source officielle lue)

### 2.1 Création, aperçu, publication, conditions (blog officiel « design your single post template »)

* Création : My Templates > nouveau modèle de type « Single » ; la fenêtre de blocs prédéfinis peut être ignorée pour partir d'une toile vierge.
* Aperçu : un réglage en bas à gauche du panneau permet de prévisualiser le contenu dynamique « comme » un article, puis de choisir un article représentatif du site, afin que les widgets affichent de vraies données.
* À la publication, Elementor demande où le modèle doit s'afficher ; « Add Condition » propose tous les articles, un article précis, une catégorie, une étiquette ; les conditions se combinent pour restreindre ou exclure (exemple : toutes les catégories sauf une) ; une seconde validation « Publish » active le modèle.
* Le tutoriel construit la page en trois sections (en-tête boîte ~960 px, corps ~750 px, commentaires) avec : Post Title, Divider, colonnes 33/66, Author Box, Post Info, Featured Image, Post Content, Share Buttons, Facebook Comments ou Post Comments.
* Conditions (page d'aide) : par défaut le modèle s'applique à tout le site ; on ajoute une condition Inclure ou Exclure ; plusieurs conditions possibles ; modifiables ensuite via le menu à côté de Publish > Display Conditions ; un conflit avec une autre partie de site déclenche un avertissement à résoudre en ajustant une condition. Détail des cibles (Posts, In Category, In Tag, Posts by Author…) : voir `ELEMENTOR_DISPLAY_CONDITIONS.md`.

### 2.2 Widgets

* Post Title : titre de l'article courant ; lien manuel ou dynamique ; balise H1-H6, div, span ou p ; texte de repli pour un article sans titre et texte statique avant/après ; style : alignement (gauche/droite/centre/justifié), typographie, contour du texte, ombre du texte, mode de fusion, couleur.
* Featured Image : widget de modèle Single ; doit rester sur le modèle sinon l'éditeur ne se charge pas ; image de repli ; résolution (miniature à pleine taille, ou personnalisée) ; légende (aucune, celle du média, ou personnalisée fixe) ; lien (aucun, fichier média avec option lightbox, URL personnalisée avec nouvel onglet, nofollow, attributs) ; style : alignement, largeur, largeur max (% du conteneur), hauteur, opacité, filtres CSS, survol (durée, animation), bordure, rayon, ombre.
* Post Content : contenu de l'article courant ; réglages de style limités à alignement, couleur du texte, typographie ; requis sur le modèle Single, **une seule instance** par modèle (en ajouter, même masquée par appareil, peut casser le fonctionnement).
* Post Excerpt : extrait manuel, ou généré depuis le contenu via « Apply to post content » avec limite de mots (limite vide = contenu entier) ; un extrait manuel existant prime ; options avancées Before, After, Fallback ; l'aide le présente surtout pour un Loop Grid ou une archive.
* Post Info : disposition Default ou Inline ; liste d'éléments réordonnable, duplicable, supprimable ; éléments par défaut Author, Date, Time, Comments ; types additionnels Terms et Custom ; par élément : texte avant, icône (aucune, par défaut, bibliothèque), lien (archive de l'auteur, de la date, des termes, formulaire de commentaires, URL personnalisée) ; auteur : avatar optionnel ; date et heure : format ; commentaires : phrase personnalisable ; termes : choix de la taxonomie. Style : espacement, alignement gauche/centre/droite, séparateur (trait : style, épaisseur, hauteur, couleur), icône (couleur, taille, retrait), texte (couleur, typographie). (Qu'il soit « requis » sur le modèle Single vient uniquement d'un résumé de recherche, non de la page lue : voir section 3.)
* Author Box : source = auteur courant ou auteur personnalisé (photo, nom, bio, lien saisis à la main) ; photo, nom (balise H1-H6/p/span/div), lien du nom (site ou archive), biographie, bouton d'archive (libellé saisi ou dynamique) ; disposition de la photo à gauche, à droite ou au-dessus ; alignement ; style de l'image (alignement vertical, résolution, espacement, bordure, rayon, ombre), nom, bio, bouton (couleurs, typographie, bordure, rayon, marges, survol).
* Table of Contents : titre et balise (H2-H6/div) ; niveaux inclus H1-H6 ou limitation à un conteneur ; exclusion par sélecteurs CSS ; marqueurs numéros ou puces (icône possible) ; retour à la ligne ; boîte réductible (icônes, appareils où elle démarre réduite) ; vue hiérarchique et sous-éléments repliables ; style de la boîte, de l'en-tête et des liens (états normal/survol/actif).
* Post Navigation : libellés précédent/suivant (texte ou balise dynamique), flèches avec choix de l'icône, titre de l'article voisin, bordures, « In same Term » (limiter aux articles partageant un terme, réglable par type de contenu) ; style : couleur normal/survol des libellés, titres et flèches, typographie, taille et espacement des flèches, couleur/épaisseur/espacement des bordures.
* Post Comments : une seule apparence (« Theme Comments », reprend le style du thème) ; source = article courant ou article précis (ses commentaires s'affichent alors sur tous les articles) ; ne s'affiche que si les commentaires sont activés dans les réglages de discussion WordPress.
* Loop Grid, section Query : source = articles, pages, pages de destination, pages choisies, requête courante, ou éléments associés (« related ») ; inclure/exclure ; tri et ordre ; ignorer les articles épinglés ; masquer les taxonomies vides ; profondeur. La page ne détaille pas le fonctionnement de « related ».
* Disponibilité : Post Info, Author Box, Post Navigation et Table of Contents sont listés comme fonctions Pro (comparatif officiel, via résultat de recherche).

## 3. Comportements OBSERVÉS (indirects, à qualifier)

* Le résumé de la recherche web rapporte que Post Navigation ne dispose que d'une description d'une ligne sur la page « Single Post widget » ; la page dédiée a ensuite été lue (section 2.2), donc ce point est dépassé.
* Un billet de blog (non lu en entier) évoque « Previous Post »/« Next Post » : sans valeur de spécification.
* Le tutoriel date de plusieurs années (le résumé de recherche le signale pour la page Single Post widget) : l'interface actuelle peut différer (l'éditeur « Container » a remplacé les « Sections/Colonnes » dans les versions récentes ; la structure 33/66 du tutoriel est donc illustrative).
* Les pages d'aide n'indiquent aucune date de version précise pour les options des widgets ; les options listées sont celles de la page à la date de lecture.

## 4. Fonctionnalités NON VÉRIFIABLES

Aucune interface Elementor n'a été ouverte (Pro payant, WordPress non accessible). Les points suivants n'ont **pas** été lus dans une source ou n'ont pas pu l'être :

* Priorité exacte entre modèles Single concurrents (voir aussi `ELEMENTOR_DISPLAY_CONDITIONS.md` : « non documenté »), combinaison OU/ET, exclusion contre inclusion.
* Libellés exacts de la fenêtre « Publish Settings » et du réglage d'aperçu (la page `preview-settings` n'a rien fourni ; seul le tutoriel décrit le geste).
* Widgets Share Buttons, Breadcrumbs, Scroll/Reading Progress : options non lues. Leur existence dans Elementor est connue mais non sourcée ici.
* Archive Posts / Related Posts : fonctionnement de la source « related » non détaillé par l'aide lue.
* Contrôles de mise en page (Container flex/grid, largeur du contenu, hauteur min., écart, marges, position collante), typographie, arrière-plans, ombres, responsive (breakpoints, masquer par appareil), Template Kits et bibliothèque de modèles : pages non lues.
* Brouillon/publié (Draft/Publish) pour le Single : seul le cycle de vie général est décrit dans `ELEMENTOR_TEMPLATE_LIFECYCLE.md`.
* Plafonds, performance, mise en cache.

## 5. Choix d'implémentation propres à Kolakisa

Constats lus dans le dépôt le 2026-11-04 (le fichier `src/themeBuilder/catalog/single_post.js` est modifié par rapport à HEAD : l'ancienne version contenait 20 mises en page × 5 identités = 100 modèles ; la version actuelle délègue à `single_post/part1..4.js` et vise « 100 mises en page de structures différentes, chacune avec sa propre identité » ; je n'ai pas relu les quatre parties en détail).

### 5.1 Type, vues et conditions

* `types.js` : type `single_post` (groupe « content »), vue `post`, import de l'ancienne famille `single_post`. Les types globaux (en-tête, pied, barre latérale, personnalisé) s'appliquent à toute vue.
* `conditions.js` : conditions `{ include: [], exclude: [] }`, schéma fermé ; vide = tout le site. Pour les articles, `post` accepte les critères `ids`, `category`, `childCategory`, `tag`, `author` (combinés en ET) ; `singular`, `author`, `child_of`, `custom`, `site` sont aussi permis. Inclusions combinées en OU ; une exclusion qui correspond retire le modèle ; inclusion identique à une exclusion refusée ; max 20 règles, 50 valeurs.
* Écart de fond : la hiérarchie de priorité (précis 100 › descendants 80 › taxonomie/auteur 60 › type 40 › général 20 › site 10), l'égalité par date puis identifiant, et le refus d'égalité parfaite sont des CHOIX de Kolakisa, non des faits Elementor (voir `ELEMENTOR_DISPLAY_CONDITIONS.md`).
* Écart : les critères Kolakisa prennent des noms de catégories/étiquettes (textes) et des identifiants d'article/auteur ; la saisie « article précis » d'Elementor passe par une recherche. Condition personnalisée : seulement côté serveur.

### 5.2 Modèles prêts à l'emploi

Le catalogue remplace la notion de Template Kits d'Elementor (non vérifiée) par des mises en page maison (classique, colonne étroite, héros, colonne latérale, sommaire à gauche, magazine, etc.). Le modèle est rendu autour d'un article réel : `{{post.title}}` et `postcontent` toujours présents, image par `{{post.image}}`, aucune image factice, aucun lien inventé (fil d'Ariane limité à Accueil et Blog).

### 5.3 Correspondance widget Elementor → widget Kolakisa → écart

| Widget Elementor | Widget Kolakisa | Écart |
|---|---|---|
| Post Title | titre (`{{post.title}}`) en balise de titre | Pas de widget dédié ; pas de repli, pas de texte avant/après, pas de lien, contour/ombre/fusion selon les styles génériques seulement |
| Featured Image | image avec étiquette `{{post.image}}` | Pas de légende, résolution ni lien dédiés confirmés ; pas d'image de repli (choix : jamais d'image factice) |
| Post Content | `postcontent` (sans réglage propre) | Unique contrôle : styles génériques ; l'unicité par modèle n'a pas été vérifiée ici |
| Post Excerpt | étiquette `{{post.excerpt}}` dans un texte | Pas de limite de mots ni de repli |
| Post Info | `postmeta` | Bascules fixes : auteur, date, mise à jour, catégorie, temps de lecture, commentaires, lectures ; séparateur point/barre/aucun ; alignement gauche/centre. Pas de liste ordonnable, pas d'heure, pas de types Terms/Custom, pas d'icônes, pas de formats de date, pas de liens d'archive paramétrables, pas de disposition en ligne/colonne |
| Terms (dans Post Info) | `postterms` | Widget séparé : catégorie/étiquettes/les deux, libellé, pastilles ou texte ; liens d'archives |
| Author Box | `authorbox` | Photo, présentation, lien « tous ses articles » et son libellé, titre ; pas d'auteur personnalisé, pas de choix de balise, pas de disposition photo gauche/droite/dessus confirmée |
| Post Navigation | `postnav` | Libellés précédent/suivant, « même catégorie » (équivalent de « In same Term », limité à la catégorie), image optionnelle ; pas de choix de flèches ni de bordure ni d'option titre séparée dans le schéma |
| Post Comments | `postcomments` | Titre uniquement ; commentaires approuvés, réponses, pagination ; respecte l'option « commentaires activés » de l'article ; pas de source « article précis » |
| Table of Contents | `toc` | Titre, profondeur 2/3/4, numérotation ; pas de conteneur cible, exclusions, repli, marqueurs à icônes. Position collante possible par style de conteneur |
| Share Buttons | `sharebuttons` | Réseaux (jusqu'à 9), taille 24-48, forme, libellé, message ; l'adresse de la page est construite par le serveur, jamais saisie (https uniquement) |
| Breadcrumbs | `breadcrumb` | 2 à 8 niveaux saisis à la main, séparateur chevron/barre/point ; pas de chemin automatique (choix : aucun lien inventé) |
| Reading/Scroll Progress | `readingprogress` | Position haut/bas, épaisseur 2-10, forme cercle optionnelle |
| Posts / Loop Grid (liés) | `querylist` (modes `related`, `samecategory`, `sameauthor`, `popular`, `recent`, `random`, `archive`) | Mise en page cartes/liste/compact ; image, extrait, date ; pas de constructeur include/exclude complet ni de tri avancé confirmés |
| Archive Title / Archive Posts | `archiveinfo` + `querylist` mode `archive` | Titre, description, nombre de résultats |
| Container (flex/grid), largeur, gap, sticky, responsive | conteneurs/colonnes/grilles du Page Builder (`grid`, `gridTemplate`, `maxWidth`, `position: sticky`) | Les modèles utilisent `maxWidth`, `gap`, `gridTemplate`, `sticky` ; le détail des contrôles responsive et « masquer par appareil » n'a pas été relevé ici |

### 5.4 Aperçu et sauvegarde

Le rendu des modèles repose sur un article réel (`env.scope.post`) ; si aucun article titré n'est disponible, `postmeta`/`postterms` ne renvoient rien. Le mécanisme d'aperçu avec choix d'un article de démonstration côté Kolakisa n'a pas été relu pour ce document : à documenter à part. Cycle brouillon/publié : voir `ELEMENTOR_TEMPLATE_LIFECYCLE.md` (publication seulement avec au moins une condition valide).

## 6. Pistes d'écart à traiter (suggestions, non engagées)

1. Post Info : ajouter l'heure, des éléments personnalisés, des icônes et un ordre réordonnable.
2. Table of Contents : conteneur cible, exclusions, repli.
3. Post Navigation : flèches et bordure configurables.
4. Post Title / Featured Image : legende, repli, lien.
5. Lire les pages non consultées (section 4) avant de déclarer toute parité.
