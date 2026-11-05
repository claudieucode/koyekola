# Bibliothèque « Article individuel » du Theme Builder Kolakisa

Document de maintenance de la catégorie **Article individuel** (type `single_post`). Référence Elementor : [`elementor-single-post-reference.md`](elementor-single-post-reference.md). Vue d'ensemble du catalogue : [`KOLAKISA_THEME_BUILDER_CATALOGUE.md`](KOLAKISA_THEME_BUILDER_CATALOGUE.md).

## 1. Périmètre
Un modèle « Article individuel » est la mise en page qui entoure **un article réel** du blog (`/blog/<adresse>`). Il contient toujours le titre `{{post.title}}` et le contenu de l'article (`postcontent`), et peut y ajouter métadonnées, catégories/étiquettes, image à la une, auteur, sommaire, partage, navigation précédent/suivant, articles liés, commentaires, barre de progression de lecture. Ce ne sont ni des pages d'accueil ni des archives. Les autres catégories (en-tête, pied de page, archives…) gardent leur catalogue de 20 mises en page × 5 identités.

## 2. Audit initial (avant refonte)
* Le catalogue comptait 100 entrées = **20 mises en page × 5 identités** : 20 compositions seulement, les 4 autres variantes de chaque mise en page ne changeaient que la peau (couleurs, arrondis, casse). Le test historique exigeait « au moins 20 structures distinctes ».
* Le héros plein écran de l'ancienne version utilisait un `position: absolute` pour poser le titre sur l'image (fragile en responsive).
* Aucune ancienne clé n'est mémorisée dans les données des sites : « Utiliser ce modèle » **copie** le document dans le site (une page du Page Builder + une ligne `mk_tb_templates` qui pointe cette page). Retirer les anciennes clés du catalogue ne touche donc aucun site existant ; les modèles déjà utilisés restent intacts et modifiables.
* Lien avec le bon article : le rendu public résout `{{post.*}}` depuis l'article de la requête (vue `post`, `src/themeBuilder/render.js`) ; l'aperçu utilise l'article choisi (« Aperçu avec ») ou, à défaut, le plus récent publié ; sans article, un état explicite est affiché. Vérifié par `tests/theme-builder-article-individuel.test.js` (l'article A n'affiche jamais le contenu de l'article A2 ni d'un autre site).

## 3. Architecture
```
src/themeBuilder/catalog/
  index.js            list / find / build / thumbDoc / entries — type « autonome » : une entrée par mise en page
  kit.js              identités (SKINS) et éléments (k.H, k.W, k.grid, k.card, k.section, k.img…)
  single_post.js      agrège les 4 lots, `standalone: true`
  single_post/shared.js   L(), SHARE, CRUMB, META, REL, COL
  single_post/part1..4.js 4 × 25 mises en page
scripts/audit-article-individuel.js    contrôle qualité (100, distinction, grammaire, responsive, contenu)
tests/theme-builder-article-individuel.test.js            serveur réel : 100 modèles utilisés puis publiés
tests/theme-builder-article-individuel-navigateur.test.js Chrome : 100 modèles × 3 largeurs
```
### Schéma de données
Une mise en page : `L(clé, libellé, étiquettes, description, identité, (k, env) => [éléments])`. L'entrée du catalogue est `{ key: "<clé>.<identité>", layoutKey, skinKey, name, desc, tags }`. `build()` renvoie `{ name, kind: "page", sections: [ { type: "layout", children } ] }` ; « Utiliser » stocke une **copie indépendante** (`mk_landing_pages` kind `page` + `mk_tb_templates` en brouillon). Vignette, aperçu et copie du site sont tous produits par `build()` / `thumbDoc()` : une seule source.

### Composants utilisés
Éléments natifs de la grammaire fermée `src/marketing/pages/nodes.js` : conteneurs (`container`, `stack`, `group`, `grid` flex/grid), `heading`, `text`, `image` (adresse dynamique `{{post.image}}`, `{{post.author_avatar}}`), `quote`, `alert`, `badge`, `divider`, `iconlist`, `accordion`, `tabs`, `button`, `search`, et les widgets de contenu dynamique `postcontent`, `postmeta`, `postterms`, `authorbox`, `postnav`, `postcomments`, `toc`, `sharebuttons`, `readingprogress`, `breadcrumb`, `querylist`.

## 4. Règles
* **Contenu dynamique** : étiquettes `{{post.title|excerpt|url|image|date|author|category|reading_time|tags|comments|author_bio|author_avatar}}`. Aucun texte d'exemple ne remplace le contenu : seuls des textes d'invitation génériques modifiables (« Cet article vous a plu ? »). Un seul titre `{{post.title}}` et un seul `postcontent` par modèle (contrôlé).
* **Rendu** : colonne de lecture ≤ 720–780 px, `k.section`/`COL` pour centrer, bandes pleine largeur par `k.band`. Pas de `position: absolute/fixed` (le `sticky` est permis, repassé en `static` sur mobile quand il gênerait). Couleurs par jetons du site (`token:*`) ; seule l'identité « Nuit » pose ses teintes.
* **Responsive** : chaque `grid` passe à 1 colonne sur mobile (`styles.mobile.columns = 1`, imposé par `k.grid` et contrôlé), tablette à 2 colonnes au plus ; réglages tablette/mobile explicites pour les colonnes latérales et tailles de titre.
* **Règles d'affichage** : un modèle utilisé est créé en brouillon sans condition ; il faut le publier avec une condition (Inclure : tous les articles / catégorie / étiquette / auteur / article précis ; Exclure…). Priorité et conflits : voir `ELEMENTOR_DISPLAY_CONDITIONS.md`.
* **Sauvegarde et publication** : « Utiliser » → brouillon ; édition dans le Page Builder (brouillon versionné, révision) ; « Publier » active le modèle sur le site ; « Archiver » le retire. Rien n'est publié sans action explicite.
* **Isolation** : copie propre à chaque site ; un autre site n'est jamais modifié (testé).

## 5. Différences avec Elementor
Voir le tableau de correspondance de `elementor-single-post-reference.md`. En résumé : pas de widget « Featured Image » séparé (image dynamique du Page Builder), pas d'éditeur de conditions identique mot pour mot, pas de modèles importés de bibliothèques tierces ; en échange chaque modèle est un document natif entièrement modifiable.

## 6. Tests
| Contrôle | Commande |
|---|---|
| Qualité statique (100, doublons ≥ 80 %, grammaire, responsive, contenu) | `node scripts/audit-article-individuel.js --all` |
| Catalogue, utilisation → publication → page publique des 100 modèles, bon article, isolation, copie = catalogue, vignette/aperçu | `node --test tests/theme-builder-article-individuel.test.js` |
| Rendu Chrome des 100 modèles à 1440 / 820 / 390 px (débordement, chevauchement, texte coupé, contraste, bon article) | `BIB_REPORT=rapport.json BIB_SHOTS=dossier node --test tests/theme-builder-article-individuel-navigateur.test.js` |
| Catalogue des autres types / parcours public | `tests/theme-builder-catalogue*.test.js` |

Sur une machine chargée, donner `TEST_START_TIMEOUT_MS=900000` au démarrage du serveur de test.

## 7. Ajouter ou modifier un modèle
1. Ajouter une entrée `L(...)` dans l'un des `single_post/partN.js` (clé unique en kebab-case, libellé unique, identité parmi `clair|marque|nuit|editorial|doux`). La clé publique devient `<clé>.<identité>`.
2. Une mise en page doit différer **par sa structure** des 99 autres (colonnes, place des éléments, widgets présents) : changer couleurs ou textes ne suffit pas ; le seuil est 80 % de similarité.
3. Lancer l'audit, puis les deux tests. Le nombre total doit rester 100 (le test et l'audit l'imposent) : remplacer plutôt qu'ajouter.
4. Ne jamais renommer une clé déjà proposée sans nécessité : les sites existants ne dépendent pas des clés, mais les liens de partage d'aperçu, si.

## 8. Décisions techniques
* **Type « autonome » (`standalone`)** plutôt que 100 × 1 skin forcé : la clé `<mise-en-page>.<identité>` est conservée pour rester compatible avec les API et l'interface (filtre par identité, miniature, aperçu).
* **Une identité par mise en page** : l'identité fait partie de la conception (une revue littéraire est éditoriale, un fil en direct est sombre) ; le filtre par identité reste utile (≈ 20 modèles chacune).
* **Aucune image factice** : les visuels viennent de l'article (`{{post.image}}`) ; un article sans image laisse l'emplacement vide, jamais une image d'exemple.
* **Pas de position absolue** : héros et bandeaux sont des conteneurs en flux.

## 9. Limites connues
* Les étiquettes `{{post.author_avatar}}` et `{{post.excerpt}}` sont vides si l'article n'a pas de photo d'auteur ou de résumé ; l'emplacement est alors vide.
* Le sommaire (`toc`) est construit depuis les intertitres : sans intertitre, il est vide.
* Le widget d'image dynamique ne peut pas être « flottant » dans le texte de l'article.
* Contrôle visuel : automatique (Chrome, 3 largeurs) + captures échantillons ; pas de relecture manuelle des 300 rendus.

## 10. Les 100 modèles
| # | Clé | Nom | Identité | Étiquettes |
|---|---|---|---|---|
| 1 | `revue-litteraire.editorial` | Revue littéraire à filet double | Éditorial | éditorial, revue, centré |
| 2 | `tribune-signee.editorial` | Tribune signée avec marge d'auteur | Éditorial | tribune, signature, deux colonnes |
| 3 | `essai-long-progression.clair` | Essai long avec barre de lecture | Clair épuré | essai, long format, progression |
| 4 | `chronique-arrondie.doux` | Chronique en carte douce | Doux et arrondi | chronique, carte, régulier |
| 5 | `lettre-ouverte-exergue.editorial` | Lettre ouverte à grande citation | Éditorial | lettre ouverte, citation, typographie |
| 6 | `critique-trois-colonnes.clair` | Critique en fiche à trois colonnes | Clair épuré | critique, fiche, image |
| 7 | `essai-deux-marges.editorial` | Essai à deux marges latérales | Éditorial | essai, marges, sommaire |
| 8 | `couverture-nuit.nuit` | Couverture pleine largeur sur fond de nuit | Nuit | couverture, image, sombre |
| 9 | `reportage-couleur.marque` | Reportage grand format sur fond de marque | Couleur de marque | reportage, couleur, centré |
| 10 | `dossier-sommaire.nuit` | Sommaire de dossier avec cartes liées | Nuit | dossier, sommaire, magazine |
| 11 | `une-duo-arrondi.doux` | Une de magazine en duo arrondi | Doux et arrondi | une, duo, arrondi |
| 12 | `portfolio-plein-ecran.clair` | Portfolio photo en ouverture | Clair épuré | photo, portfolio, image |
| 13 | `interview-questions.doux` | Interview avec points clés | Doux et arrondi | interview, questions, repliable |
| 14 | `numero-special-asymetrique.marque` | Numéro spécial asymétrique | Couleur de marque | numéro spécial, asymétrique, couleur |
| 15 | `colonne-nue.clair` | Colonne nue sans fioritures | Clair épuré | minimaliste, texte, sobre |
| 16 | `notes-breves-douces.doux` | Notes brèves en petite carte | Doux et arrondi | notes, bref, carte |
| 17 | `journal-date-marge.clair` | Journal personnel à date en marge | Clair épuré | journal, personnel, date |
| 18 | `newsletter-archivee.marque` | Newsletter archivée avec invitation | Couleur de marque | newsletter, archive, abonnement |
| 19 | `carnet-nuit-marge.nuit` | Carnet de nuit à marge d'annotations | Nuit | carnet, sombre, notes |
| 20 | `page-de-garde-sobre.editorial` | Page de garde sobre et centrée | Éditorial | centré, sobre, serif |
| 21 | `depeche-agence.clair` | Dépêche d'agence compacte | Clair épuré | dépêche, actualité, bref |
| 22 | `a-la-une-redaction.marque` | Article de rédaction à la une | Couleur de marque | à la une, rédaction, bandeau |
| 23 | `fil-en-direct.nuit` | Fil d'actualité en direct | Nuit | live, direct, fil |
| 24 | `flash-info-douce.doux` | Brève flash arrondie | Doux et arrondi | brève, flash, partage |
| 25 | `communique-institutionnel.editorial` | Communiqué institutionnel officiel | Éditorial | communiqué, institutionnel, officiel |
| 26 | `portfolio-fiche-projet.clair` | Fiche projet avec image d'ouverture | Clair épuré | portfolio, étude de cas, fiche |
| 27 | `portfolio-colonne-meta.nuit` | Projet avec colonne d'informations | Nuit | portfolio, projet, colonne |
| 28 | `portfolio-autres-projets.marque` | Étude de cas et autres réalisations | Couleur de marque | portfolio, étude de cas, réalisations |
| 29 | `projet-titre-collant.editorial` | Projet au titre collant | Éditorial | portfolio, éditorial, sticky |
| 30 | `recit-immersif-nuit.nuit` | Récit immersif sur fond sombre | Nuit | storytelling, récit, immersif |
| 31 | `recit-chapitres.clair` | Récit en chapitres avec sommaire | Clair épuré | storytelling, chapitres, sommaire |
| 32 | `temoignage-parcours.doux` | Témoignage de parcours personnel | Doux et arrondi | storytelling, parcours, témoignage |
| 33 | `recit-ouverture-citation.editorial` | Récit à l'ouverture en exergue | Éditorial | storytelling, exergue, éditorial |
| 34 | `carnet-de-voyage.doux` | Carnet de voyage illustré | Doux et arrondi | voyage, carnet, souvenirs |
| 35 | `guide-destination.clair` | Guide de destination avec colonne pratique | Clair épuré | voyage, guide, destination |
| 36 | `itineraire-trois-colonnes.marque` | Itinéraire en trois colonnes | Couleur de marque | voyage, itinéraire, étapes |
| 37 | `voyage-panorama-carte.nuit` | Panorama et carte de titre | Nuit | voyage, panorama, immersif |
| 38 | `recette-article.doux` | Recette en article illustré | Doux et arrondi | cuisine, recette, pas à pas |
| 39 | `chronique-gastronomique.editorial` | Chronique gastronomique de revue | Éditorial | cuisine, chronique, gastronomie |
| 40 | `accord-mets-vins.marque` | Accord mets et vins en deux volets | Couleur de marque | cuisine, vin, accord |
| 41 | `lookbook-image-collante.editorial` | Lookbook à image collante | Éditorial | mode, lookbook, éditorial |
| 42 | `tendances-saison.marque` | Tendances de saison en grille | Couleur de marque | mode, tendances, magazine |
| 43 | `bien-etre-serein.doux` | Bien-être serein et centré | Doux et arrondi | bien-être, lifestyle, apaisant |
| 44 | `decoration-inspiration.clair` | Décoration et inspiration en bannière | Clair épuré | décoration, lifestyle, inspiration |
| 45 | `lifestyle-nuit-auteur.nuit` | Lifestyle de nuit signé par l'auteur | Nuit | lifestyle, auteur, sombre |
| 46 | `image-principale-gauche.clair` | Image principale à gauche du début de l'article | Clair épuré | image principale, à gauche, deux colonnes |
| 47 | `image-principale-droite.editorial` | Image principale à droite du titre | Éditorial | image principale, à droite, éditorial |
| 48 | `image-principale-vignette.doux` | Image principale en vignette | Doux et arrondi | image principale, vignette, sobre |
| 49 | `image-principale-bandeau.marque` | Image principale en bandeau étroit | Couleur de marque | image principale, bandeau, panoramique |
| 50 | `image-principale-fond-nuit.nuit` | Image principale sous le titre sur fond sombre | Nuit | image principale, sombre, hero |
| 51 | `tuto-pas-a-pas.nuit` | Tutoriel pas à pas avec étapes collantes | Nuit | tutoriel, technologie, étapes, sommaire |
| 52 | `article-technique-sommaire.clair` | Article technique avec sommaire encadré et FAQ | Clair épuré | technique, sommaire, faq, documentation |
| 53 | `note-de-version.marque` | Note de version avec date en marge | Couleur de marque | note de version, changelog, technologie, date |
| 54 | `analyse-fiche-technique.editorial` | Analyse avec fiche d'identité à droite | Éditorial | analyse, technologie, revue, fiche |
| 55 | `guide-liste-de-controle.doux` | Guide avec vignette ronde et liste de contrôle | Doux et arrondi | guide, technologie, liste de contrôle, arrondi |
| 56 | `blog-corporate.clair` | Blog corporate sobre avec signature en pied | Clair épuré | entreprise, blog corporate, actualité, signature |
| 57 | `etude-de-cas.marque` | Étude de cas en trois temps | Couleur de marque | étude de cas, entreprise, client, démarche |
| 58 | `livre-blanc-resume.editorial` | Livre blanc : couverture et contenu du document | Éditorial | livre blanc, entreprise, résumé, couverture |
| 59 | `annonce-produit.nuit` | Annonce de produit en vitrine centrée | Nuit | annonce, produit, entreprise, nouveauté |
| 60 | `recrutement-rejoignez-nous.doux` | Recrutement avec carte de candidature collante | Doux et arrondi | recrutement, ressources humaines, entreprise, candidature |
| 61 | `sommaire-collant-gauche.clair` | Sommaire collant à gauche avec auteur | Clair épuré | sommaire, colonne gauche, long format, collant |
| 62 | `sommaire-collant-droite.editorial` | Sommaire collant à droite filet éditorial | Éditorial | sommaire, colonne droite, éditorial, collant |
| 63 | `sommaire-en-tete-carte.doux` | Sommaire en tête dans une carte arrondie | Doux et arrondi | sommaire, en-tête, arrondi, lecture |
| 64 | `sommaire-barre-defilante.nuit` | Barre de sommaire déroulante qui suit la lecture | Nuit | sommaire, barre, défilement, nuit |
| 65 | `sommaire-numerote-bandeau.marque` | Sommaire numéroté dans le bandeau de marque | Couleur de marque | sommaire, numéroté, bandeau, couleur |
| 66 | `barre-laterale-droite.clair` | Barre latérale droite : recherche, auteur et populaires | Clair épuré | barre latérale, droite, blog, widgets |
| 67 | `barre-laterale-gauche-rubriques.editorial` | Barre latérale gauche : rubriques et récents | Éditorial | barre latérale, gauche, rubriques, éditorial |
| 68 | `deux-barres-laterales.nuit` | Deux colonnes latérales autour de l'article | Nuit | double colonne, barre latérale, trois colonnes, nuit |
| 69 | `widgets-empiles.doux` | Widgets empilés en cartes douces | Doux et arrondi | widgets, barre latérale, cartes, arrondi |
| 70 | `contenus-populaires-bandeau.marque` | Contenus populaires en bandeau sous l'article | Couleur de marque | contenus populaires, barre latérale, recommandations, marque |
| 71 | `doc-trois-colonnes.clair` | Documentation : navigation, page et table des matières | Clair épuré | documentation, navigation, fil d'Ariane, trois colonnes |
| 72 | `aide-memoire.editorial` | Aide-mémoire compact à imprimer | Éditorial | aide-mémoire, documentation, référence, compact |
| 73 | `base-de-connaissances-aide.doux` | Base de connaissances avec recherche en vedette | Doux et arrondi | base de connaissances, aide, support, recherche |
| 74 | `doc-onglets-reference.nuit` | Page de référence à onglets et navigation en bandeau | Nuit | documentation, référence, onglets, nuit |
| 75 | `doc-navigation-rubriques.marque` | Documentation avec rubriques et sommaire dans la colonne | Couleur de marque | documentation, rubriques, navigation, marque |
| 76 | `image-bandeau-revue.editorial` | Bandeau photo puis titre en deux temps | Éditorial | image pleine largeur, bandeau, revue |
| 77 | `plein-ecran-nuit.nuit` | Photo plein écran sur fond nuit | Nuit | héros, plein écran, immersif, sombre |
| 78 | `panorama-colonne-infos.clair` | Panorama court et colonne d'informations | Clair épuré | image panoramique, métadonnées en colonne, sommaire |
| 79 | `signature-journaliste.editorial` | Signature de l'auteur en tête d'article | Éditorial | auteur, signature, portrait rond |
| 80 | `portrait-lateral-auteur.clair` | Portrait de l'auteur dans la colonne latérale | Clair épuré | auteur, portrait, colonne collante |
| 81 | `bandeau-auteur-marque.marque` | Bandeau de marque avec carte auteur | Couleur de marque | auteur, bandeau, couleur de marque |
| 82 | `fin-cartes-fond.clair` | Fin d'article avec bande de trois cartes | Clair épuré | articles liés, cartes, fin d'article |
| 83 | `fin-trois-listes-nuit.nuit` | Trois mini-listes en pied d'article | Nuit | articles populaires, compact, trois colonnes |
| 84 | `meme-auteur-defilement.doux` | Autres écrits du même auteur en défilement | Doux et arrondi | du même auteur, carrousel, fin d'article |
| 85 | `navigation-bandeau-haut.marque` | Navigation précédent et suivant en bandeau supérieur | Couleur de marque | navigation, bandeau, précédent suivant |
| 86 | `navigation-cartes-images.doux` | Suite de lecture en deux cartes avec images | Doux et arrondi | navigation, cartes, images |
| 87 | `navigation-pied-collant.nuit` | Barre de navigation collée en bas de page | Nuit | navigation, pied collant, lecture longue |
| 88 | `partage-trois-colonnes.clair` | Partage collant à gauche, sommaire à droite | Clair épuré | partage, colonne collante, trois colonnes |
| 89 | `partage-haut-et-bas.doux` | Partage sous le titre et invitation en fin d'article | Doux et arrondi | partage, tête et pied, invitation |
| 90 | `partage-encadre-revue.editorial` | Encadré de partage à double filet | Éditorial | partage, encadré, éditorial |
| 91 | `discussion-regles.clair` | Discussion avec règles de courtoisie | Clair épuré | commentaires, discussion, règles |
| 92 | `debat-pour-contre.marque` | Débat ouvert avec onglets de consignes | Couleur de marque | commentaires, débat, onglets |
| 93 | `questions-reponses-lecteurs.doux` | Questions des lecteurs et réponses | Doux et arrondi | commentaires, questions-réponses, accordéon |
| 94 | `progression-haut-sommaire-droit.editorial` | Barre de lecture en haut et sommaire à droite | Éditorial | readingprogress, progression, sommaire collant |
| 95 | `progression-cercle-bas.nuit` | Pastille circulaire de lecture en bas d'écran | Nuit | readingprogress, cercle, lecture continue |
| 96 | `progression-epaisse-marque.marque` | Grosse barre de lecture et sommaire en carte | Couleur de marque | readingprogress, bandeau, sommaire |
| 97 | `interview-questions-reponses.doux` | Interview avec portrait central | Doux et arrondi | interview, questions-réponses, portrait |
| 98 | `exergue-citation-marginale.editorial` | Citation en exergue et texte de part et d'autre | Éditorial | citation, exergue, long format |
| 99 | `en-bref-resume-detaille.marque` | Résumé en bref avec points clés | Couleur de marque | résumé, en bref, points clés |
| 100 | `sans-distraction-lecture.nuit` | Lecture sans distraction | Nuit | sans distraction, texte seul, sobre |
