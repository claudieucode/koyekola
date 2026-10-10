# Matrice de contrôle des widgets KOLAKISA — audit (LOT 0 / LOT 1)

*Audit en lecture seule, établi le 2026-10-10 sur `origin/main` : aucun code de l'éditeur n'a été modifié. Les chiffres viennent du registre réel
(`NODE_TYPES`, `editorSpec()`, `INSPECTORS`, `capsOf`) et du rendu public (`views/marketing-public/_node.ejs`, `widgets/*.ejs`), pas de suppositions.
Compléments déjà existants : `docs/WIDGETS-INVENTAIRE.md` (banc d'essai de bout en bout, 86 types), `docs/widgets-personnalises.md`,
`docs/donnees-dynamiques-boucles-modeles.md`, `docs/perf-page-builder.md`.*

## 1. Ce qui existe réellement

| Sujet | Réalité vérifiée |
|---|---|
| Widgets | **86 types** (`NODE_TYPES`) : 6 conteneurs (container, columns, column, grid, stack, group) + 80 éléments ; **19 widgets personnalisés** déclarés par `registerWidget` (`src/marketing/pages/widgets/*.js`, repérés par * ci-dessous) |
| Catégories de la bibliothèque | Mise en page, Basique, Général, Formulaire, Avancé, Site, E-commerce, Réseaux sociaux |
| Modèle d'un élément | `{ id, type, props, styles: {desktop, tablet, mobile}, states: {hover, focus, active}, css, cssHover, classes, name, children }` |
| Propriétés de style | **86 propriétés CSS simples** à grammaire fermée (`STYLE_PROPS`, `nodes.js`) + 7 propriétés composées (`backgroundImage`, `gradient`, `overlay`, `shadow` x/y/flou/étalement/couleur/inset, `filter`, `transform`, `mask`) ; chaque valeur est validée, aucune CSS libre |
| Écrans | ordinateur / tablette (≤ 1023 px) / mobile (≤ 767 px) : un jeu de styles **par écran** avec héritage vers le bas |
| États | survol, focus clavier, clic : **un seul jeu par état, non décliné par écran** (limite actuelle) ; activés par widget (`states` dans `INSPECTORS`) |
| Inspector | Contenu / Style / Avancé (ou Général / Style / Interactions pour les boîtes) ; l'onglet Style est construit à partir d'un **profil de groupes par type** (`INSPECTORS[type].groups`) : BOX, TEXTUAL, ou sur mesure |
| Contrôles | Un jeu unique : longueurs à unité, boîte d'espacement avec lien des 4 côtés, rayons par coin, ombre complète, dégradé, filtre, transformation, masque, sélecteur de couleur (jetons du site), gestionnaire de polices, curseurs numériques, effacer / valeur héritée, « copier / coller le style » par groupe |
| Historique | `change(fn, {key})` : capture JSON complète avant l'action ; les saisies répétées de même clé ne créent qu'une étape (curseurs inclus) |
| Rendu | le canevas est le **vrai rendu public** dans une iframe : à chaque modification le document complet part vers `POST …/rendu`, le serveur valide et rend, le navigateur met à jour **en place** les sections modifiées (`patchCanvas`) |
| CSS généré | `pageCss()` (`nodes.js`) : une règle par élément `.kw-n-<id>` (et par écran, et par état) ; **un seul endroit** écrit le style de tous les widgets |
| Limites produit | 400 éléments par page, 30 sections, profondeur 8 (donc les bancs à 500 éléments ne sont pas réalisables en l'état : 400 maximum) |

## 2. Diagnostic central

**Tout le système de style vise la racine du widget (`.kw-n-<id>`) et uniquement elle.** Une carte d'article, un titre de carte, une date, une
question de FAQ, un champ de formulaire n'ont **aucune** adresse de style propre. Leur apparence interne est écrite en dur dans `public/css/landing.css`
(par exemple `.kw-post-card`, `.kw-post-title{font-size:18px}`, `.kw-post-date{color:rgba(16,34,47,.65)}`, `.kw-post-excerpt`), et les réglages de la racine
n'atteignent ces parties que par héritage (la couleur de la date et de l'extrait est fixée, donc le « color » de la racine ne les change pas).

Contournements existants (à ne pas refaire, à compléter) :

1. **Props de partie ponctuelles**, widget par widget (icône d'une liste d'icônes, taille des réseaux, trait du séparateur, hauteur du logo, position des points d'intérêt…) : 7 widgets.
2. **Grille à boucle** (`loopProps`, `query.js`, `dynamic.js`) : les éléments enfants du gabarit sont de **vrais nœuds** entièrement stylables, remplis par les étiquettes dynamiques `{{post.title}}`, `{{post.image}}`, `{{post.date}}`, `{{post.excerpt}}`…
   C'est la route « tout est contrôlable » pour les listes d'articles, mais elle suppose de construire la carte à la main ; le widget « Derniers articles » reste un bloc fermé.
3. **CSS de la page** (`normalizePageCss`) : sélecteurs `.lp-main …` autorisés (donc `.kw-n-<id> .kw-post-title` est possible), réservé à la permission `pages.code` et inaccessible à un auteur ordinaire.
4. **CSS d'un élément** (`css`, `cssHover`) : déclarations sur la racine seulement, pas de sélecteur.
5. **Classes globales** (`normalizeClassDefs`) : styles + états sur la racine des éléments qui portent la classe, jamais sur une partie.

## 3. Réponses aux 10 questions de la mission

1. **Quels widgets existent ?** 86 (liste complète au § 5).
2. **Lesquels ont déjà un bon système de style ?** Les 6 conteneurs (profil BOX : disposition, grille, dimensions, espacement, fond, bordure, ombre, effets, transformation, position, états survol / clic) et les ~30 widgets « simples » dont la racine **est** l'élément visible (titre, texte, liste, citation, code, image, vidéo, audio, bouton, lien, badge, icône…).
3. **Lesquels sont limités ?** 42 widgets ont au moins deux sous-parties visibles réelles mais un style de racine seulement (statut LIMITÉ), 7 ont une ou deux propriétés de partie ponctuelles (PARTIEL).
4. **Lesquels ont des sous-éléments internes ?** Tableau § 5, colonne « Parties internes » (déduite des classes réellement rendues, donc fiable pour le *nombre* de parties ; les noms exacts seront confirmés lors du LOT 4).
5. **Comment les styles sont-ils stockés ?** Dans l'arbre du brouillon JSON de la page : `styles[écran][propriété]` et `states[état][propriété]` sur chaque nœud (colonnes `sections` / `draft` de `mk_landing_pages`, versions et révisions de la page copiées telles quelles).
6. **Comment sont-ils rendus ?** `normalizeNode` valide tout à l'enregistrement (grammaire fermée) ; `pageCss()` écrit une règle par élément, par écran (`@media`) et par état ; le gabarit `_node.ejs` ajoute la classe `kw-n-<id>`. Même code pour le canevas, l'aperçu et la page publiée.
7. **Comment sont-ils sauvegardés ?** `PUT …/brouillon` du document complet après 1 s sans modification (copie locale de secours) ; publication = copie du brouillon validé.
8. **Comment fonctionne le responsive ?** Un jeu de styles par écran ; un champ vide reprend la valeur de l'écran plus grand (valeur héritée affichée en grisé) ; `@media (max-width)` généré avec les seuils du site.
9. **Quels contrôles existent déjà ?** Voir § 1 (ligne « Contrôles ») : tout ce qu'il faut pour styler une partie existe déjà ; il manque seulement la **cible**.
10. **Le moyen le plus sûr d'étendre ?** Ajouter la notion de **partie** (style target) au registre des widgets et la traiter aux **deux points de passage uniques** : `styleSet()` côté éditeur et `add()` dans `pageCss()` côté serveur. Détail dans `KOLAKISA_WIDGET_STYLE_ARCHITECTURE.md`.

## 4. Les cinq améliorations prioritaires

Classées par impact utilisateur × nombre de widgets × risque × réutilisabilité.

1. **Filet de sécurité avant tout** : instantané de référence du rendu (HTML + CSS générés) des 86 types et de pages existantes, et test « sortie identique à l'octet tant qu'aucune partie n'est stylée ». Risque nul, protège les 4 autres. (Réutilise `scripts/audit-widgets.js`.)
2. **Moteur de « parties »** (cibles de style) dans le registre, la normalisation et `pageCss()` : 1 modèle de données, ~150 lignes serveur, 0 changement pour les pages existantes. Débloque 42 widgets d'un coup.
3. **Sélecteur de partie dans l'onglet Style** : « Carte / Image / Date / Titre… » ; tous les contrôles existants (longueurs, couleurs, polices, ombre, bordure, états, écrans, copier / coller, réinitialiser) s'appliquent à la partie choisie sans nouveau contrôle.
4. **Déclarer les parties des widgets dynamiques en premier** (Derniers articles → Formations → Liste de requête → Témoignage → Offre tarifaire → FAQ / onglets / formulaire), en faisant de leur CSS d'origine des valeurs par défaut à spécificité nulle (`:where()`), pour que les règles de l'auteur l'emportent sans `!important` et que le rendu historique soit conservé.
5. **Propriétés manquantes pour les parties** : nombre de lignes de l'extrait (`line-clamp`), ratio d'image libre, interligne / espacement des méta, soulignement du lien ; puis **classes globales et copier / coller étendus aux parties** (une « carte » copiable vers une autre carte compatible).

## 5. Matrice des 86 widgets

Légende — *Profil* : BOX (boîte), TEXTUAL (typographie + couleurs), « sur mesure » (groupes propres au widget). *États* : survol / focus / clic proposés dans l'Inspector.
*Parties internes* : classes de rendu propres au widget (hors génériques). *Propriétés de partie actuelles* : réglages de sous-élément déjà exposés.
*Statut* : COMPLET = la racine est l'élément (ou le conteneur de mise en page) ; PARTIEL = quelques réglages de partie ; LIMITÉ = ≥ 2 sous-parties visibles sans cible de style ; DÉFECTUEUX et ABSENT : aucun cas relevé par le banc d'essai (`docs/WIDGETS-INVENTAIRE.md` : 0 à corriger). Chaque ligne partage : Contenu = `props` du registre, Avancé = `capsOf` (mouvement, défilement, souris, transformation, attributs, CSS, responsive ; + sticky pour les conteneurs, + masque pour image / galerie / vidéo / image à points / boîte image), persistance = brouillon JSON, historique = capture complète, publication = `pageCss`.

| Type | Libellé | Bibliothèque | Profil | États | Parties internes | Propriétés de partie actuelles | Statut |
|---|---|---|---|---|---|---|---|
| `container` | Conteneur | layout | BOX | hover, active | — | — | **COMPLET** |
| `columns` | Colonnes | layout | BOX | hover, active | — | — | **COMPLET** |
| `column` | Colonne | layout | BOX | hover, active | — | — | **COMPLET** |
| `grid` | Grille | layout | sur mesure | hover, active | — | — | **COMPLET** |
| `stack` | Pile | layout | BOX | hover, active | — | — | **COMPLET** |
| `group` | Groupe | layout | BOX | hover, active | — | — | **COMPLET** |
| `spacer` | Espace | basic | sur mesure | — | divider-text, spacer | — | **COMPLET** (racine = élément visible) |
| `divider` | Séparateur | basic | sur mesure | — | empty-text | épaisseur / couleur / style du trait | **COMPLET** (racine = élément visible) |
| `heading` | Titre | basic | TEXTUAL | — | heading-link | — | **COMPLET** |
| `text` | Texte | basic | TEXTUAL | — | — | — | **COMPLET** |
| `list` | Liste | basic | TEXTUAL | — | — | — | **COMPLET** |
| `quote` | Citation | general | TEXTUAL | — | — | — | **COMPLET** |
| `code` | Code (texte) | general | TEXTUAL | — | — | — | **COMPLET** |
| `image` | Image | basic | sur mesure | tous | — | — | **COMPLET** |
| `gallery` | Galerie | general | sur mesure | — | gallery-item | Parties stylables : Vignette, Image, Légende | **COMPLET (parties)** |
| `video` | Vidéo | basic | sur mesure | — | — | — | **COMPLET** |
| `audio` | Audio | general | sur mesure | — | — | — | **COMPLET** |
| `button` | Bouton | basic | sur mesure | tous | btn-icon | variante (primaire / contour) et icône | **COMPLET** (racine = élément visible) |
| `link` | Lien | basic | sur mesure | tous | — | — | **COMPLET** |
| `accordion` | Accordéon / FAQ | general | TEXTUAL | — | acc | Parties stylables : Question + réponse, Question, Réponse | **COMPLET (parties)** |
| `tabs` | Onglets | general | TEXTUAL | — | tab-icon-src, tab-panel, tab-title, tabs | Parties stylables : Barre d'onglets, Onglet, Contenu d'un onglet | **COMPLET (parties)** |
| `badge` | Badge | general | sur mesure | — | badge | — | **COMPLET** |
| `timeline` | Chronologie | general | TEXTUAL | — | tl-date, tl-item, tl-text, tl-title | Parties stylables : Étape, Date, Titre, Texte | **COMPLET (parties)** |
| `progress` | Barre de progression | general | sur mesure | — | progress-bar, progress-head, progress-track | Parties stylables : Libellé et valeur, Piste, Barre | **COMPLET (parties)** |
| `menu` | Menu de navigation | site | TEXTUAL | tous | menu-item, menu-link, menu-list, menu-toggle, sub-toggle, submenu | Parties stylables : Liste, Lien, Bouton mobile | **COMPLET (parties)** |
| `carousel` | Carrousel d'images | general | sur mesure | — | carousel, carousel-slide, carousel-track, dots | Parties stylables : Diapositive, Image, Flèches, Points | **COMPLET (parties)** |
| `toggle` | Bascule | general | TEXTUAL | — | toggle-body, toggle-title | Parties stylables : Titre, Contenu | **COMPLET (parties)** |
| `alert` | Alerte | general | TEXTUAL | — | alert, alert-body, alert-icon, alert-title, dismiss | Parties stylables : Icône, Titre, Texte | **COMPLET (parties)** |
| `counter` | Compteur | general | sur mesure | — | counter-label, counter-num, counter-value | Parties stylables : Nombre, Libellé | **COMPLET (parties)** |
| `testimonial` | Témoignage | general | sur mesure | tous | avatar, stars, testimonial-role, testimonial-text, testimonial-who | Parties stylables : Étoiles, Citation, Auteur, Fonction, Photo | **COMPLET (parties)** |
| `pricing` | Offre tarifaire | advanced | sur mesure | tous | pricing-badge, pricing-cta, pricing-desc, pricing-features, pricing-price, pricing-title | Parties stylables : Étiquette, Nom de l'offre, Prix, Description, Liste des avantages, Bouton | **COMPLET (parties)** |
| `breadcrumb` | Fil d'Ariane | site | TEXTUAL | — | crumbs | — | **COMPLET** |
| `social` | Réseaux sociaux | social | sur mesure | — | social-link | Parties stylables : Icône | **COMPLET (parties)** |
| `sharebuttons` | Boutons de partage | social | sur mesure | — | social-link | Parties stylables : Bouton | **COMPLET (parties)** |
| `modal` | Fenêtre (modale) | advanced | sur mesure | — | modal-body, modal-close, modal-foot, modal-head, modal-open, modal-title | Parties stylables : Bouton d'ouverture, En-tête, Titre, Contenu, Pied, Bouton fermer | **COMPLET (parties)** |
| `html` | HTML (sécurisé) | general | TEXTUAL | — | box-body, box-media, box-text, box-title, iconbox-icon | — | **COMPLET** (racine = élément visible) |
| `embed` | Contenu intégré | advanced | sur mesure | — | embed-frame | — | **COMPLET** |
| `iconlist` | Liste d'icônes | general | TEXTUAL | — | iconlist-icon | Parties stylables : Icône, Ligne, Lien | **COMPLET (parties)** |
| `tooltip` | Infobulle | advanced | sur mesure | — | tip-bubble, tip-trigger | Parties stylables : Déclencheur, Infobulle | **COMPLET (parties)** |
| `hotspot` | Image à points d'intérêt | advanced | sur mesure | — | hotspot-stage, spot-card, spot-dot | Parties stylables : Point, Carte | **COMPLET (parties)** |
| `posts` | Derniers articles du blog | site | TEXTUAL | — | post-body, post-card, post-date, post-excerpt, post-title, posts | Parties stylables : Carte, Image, Corps de la carte, Date, Titre, Extrait | **COMPLET (parties)** |
| `courselist` | Formations du catalogue | commerce | TEXTUAL | — | course-card, course-price, post-body, post-excerpt, post-title | Parties stylables : Carte, Image, Corps de la carte, Titre, Sous-titre, Prix, Bouton | **COMPLET (parties)** |
| `search` | Recherche | site | sur mesure | — | — | — | **COMPLET** |
| `account` | Compte du visiteur | site | TEXTUAL | tous | account-cart, account-link | Parties stylables : Lien du compte, Lien du panier, Pastille du panier | **COMPLET (parties)** |
| `dyntext` | Texte dynamique | advanced | TEXTUAL | — | — | — | **COMPLET** |
| `table` | Tableau | general | TEXTUAL | — | — | — | **COMPLET** |
| `countdown` | Compte à rebours | advanced | TEXTUAL | — | buy-price, countdown, courserating, stars | Parties stylables : Bloc de temps | **COMPLET (parties)** |
| `course` | Formation | commerce | sur mesure | tous | — | — | **COMPLET** |
| `sitelogo` | Logo du site | site | sur mesure | — | sitelogo-img, sitelogo-link, sitelogo-text | Parties stylables : Image, Texte | **COMPLET (parties)** |
| `postcontent` | Contenu de l'article | site | sur mesure | — | — | — | **COMPLET** |
| `catfilter` | Filtre par catégorie | site | TEXTUAL | — | catfilter-n | — | **COMPLET** |
| `sitetitle` | Titre du site | site | TEXTUAL | — | sitetitle-link | — | **COMPLET** |
| `copyright` | Copyright | site | TEXTUAL | — | — | — | **COMPLET** |
| `addtocart` | Bouton d'achat | commerce | sur mesure | — | — | — | **COMPLET** |
| `courserating` | Avis de la formation | commerce | TEXTUAL | — | — | — | **COMPLET** |
| `animatedheading` | Titre animé | advanced | TEXTUAL | — | words | — | **COMPLET** |
| `flipbox` | Boîte retournable | advanced | sur mesure | — | flip-back, flip-face, flip-front, flip-icon, flip-inner, flip-text, flip-title | Parties stylables : Face avant, Face arrière, Titres, Textes | **COMPLET (parties)** |
| `pricelist` | Liste de prix | advanced | TEXTUAL | — | pl-dots, pl-head, pl-item, pl-price, pl-text, pl-title | Parties stylables : Ligne, Intitulé, Prix, Description | **COMPLET (parties)** |
| `toc` | Table des matières | advanced | TEXTUAL | — | toc-list, toc-title | Parties stylables : Titre, Liste, Lien | **COMPLET (parties)** |
| `readingprogress` | Barre de lecture | advanced | sur mesure | — | readbar, readbar-fill | Parties stylables : Barre, Remplissage | **COMPLET (parties)** |
| `signupform` | Formulaire | form | TEXTUAL | — | signup, signup-form, signup-intro, signup-submit, signup-title | Parties stylables : Titre, Introduction, Bouton d'envoi | **COMPLET (parties)** |
| `map` | Google Maps | basic | sur mesure | — | map-frame | — | **COMPLET** |
| `imagebox` | Boîte d'image | general | TEXTUAL | — | — | Parties stylables : Image, Titre, Texte | **COMPLET (parties)** |
| `iconbox` | Boîte d'icône | general | TEXTUAL | — | — | Parties stylables : Icône, Titre, Texte | **COMPLET (parties)** |
| `rating` | Évaluation | general | sur mesure | — | rating-bg, rating-fill, rating-stars, rating-title, rating-value | Parties stylables : Titre, Étoiles, Étoiles vides, Étoiles pleines, Valeur | **COMPLET (parties)** |
| `menuanchor` | Ancre de menu | general | TEXTUAL | — | anchor-mark | — | **COMPLET** |
| `icon` | Icône | basic | sur mesure | tous | — | — | **COMPLET** |
| `slides` * | Diaporama | general | BOX | — | carousel, carousel-slide, carousel-track, dots, slide, slide-body, slide-img, slide-text … | Parties stylables : Image, Voile, Bloc de texte, Titre, Texte, Bouton, Flèches, Points | **COMPLET (parties)** |
| `testimonialcarousel` * | Carrousel de témoignages | general | BOX | — | carousel, carousel-slide, carousel-track, dots, tcar-name, tcar-photo, tcar-quote, tcar-role … | Parties stylables : Diapositive, Étoiles, Citation, Nom, Fonction, Photo, Flèches, Points | **COMPLET (parties)** |
| `mediacarousel` * | Carrousel média | general | BOX | — | carousel, carousel-slide, carousel-track, dots, mcar-img, mcar-slide, mcar-video | Parties stylables : Image, Légende, Flèches, Points | **COMPLET (parties)** |
| `cart` * | Panier | commerce | BOX | — | cart-actions, cart-edit, cart-empty, cart-img, cart-line, cart-lines, cart-name, cart-price … | Parties stylables : Titre, Panier vide, Ligne, Image, Nom, Prix, Total, Bouton de commande, Lien « modifier » | **COMPLET (parties)** |
| `facebookbutton` * | Bouton Facebook | social | BOX | — | fbbtn-frame | — | **COMPLET** |
| `linkinbio` * | Lien en bio | social | BOX | — | lib-avatar, lib-bio, lib-icon, lib-link, lib-links, lib-name | Parties stylables : Photo, Nom, Texte, Lien, Icône du lien | **COMPLET (parties)** |
| `lottie` * | Animation Lottie | advanced | BOX | — | lottie, lottie-placeholder, lottie-stage, speed, trigger | — | **COMPLET** (racine = élément visible) |
| `profilecard` * | Carte de profil | general | TEXTUAL | — | profile-bio, profile-name, profile-photo, profile-role | Parties stylables : Photo, Nom, Fonction, Texte | **COMPLET (parties)** |
| `readmore` * | Lire la suite | basic | TEXTUAL | — | readmore-body, readmore-close, readmore-intro, readmore-more, readmore-open, readmore-toggle | Parties stylables : Début du texte, Suite du texte, Lien « lire la suite » | **COMPLET (parties)** |
| `querylist` * | Liste dynamique | site | TEXTUAL | — | ql-body, ql-cards, ql-compact, ql-count, ql-date, ql-empty, ql-excerpt, ql-inline … | Parties stylables : Élément, Image, Titre de la liste, Titre d'un élément, Informations, Date, Extrait, Compteur | **COMPLET (parties)** |
| `postmeta` * | Informations de l'article | site | TEXTUAL | — | pm-item, pm-note | Parties stylables : Information | **COMPLET (parties)** |
| `postterms` * | Catégorie et étiquettes | site | TEXTUAL | — | pt-label, pt-note, pt-term | Parties stylables : Libellé, Catégorie / étiquette | **COMPLET (parties)** |
| `postnav` * | Article précédent / suivant | site | TEXTUAL | — | pn-dir, pn-link, pn-next, pn-note, pn-prev, pn-title | Parties stylables : Lien, Sens (précédent / suivant), Titre, Image | **COMPLET (parties)** |
| `authorbox` * | Boîte auteur | site | BOX | — | ab-avatar, ab-bio, ab-heading, ab-link, ab-name, ab-note, ab-row, ab-text | Parties stylables : Titre, Photo, Nom, Texte, Lien | **COMPLET (parties)** |
| `archiveinfo` * | En-tête d'archive | site | TEXTUAL | — | ai-count, ai-desc, ai-title | Parties stylables : Titre, Description, Nombre de résultats | **COMPLET (parties)** |
| `postcomments` * | Commentaires de l'article | site | BOX | — | pc-avatar, pc-badge, pc-body, pc-count, pc-empty, pc-heading, pc-initial, pc-item … | Parties stylables : Titre, Commentaire, Avatar, Auteur et date, Texte | **COMPLET (parties)** |
| `cmsmenu` * | Menu du CMS | site | TEXTUAL | — | menu-item, menu-link, menu-list, pm-note, submenu | Parties stylables : Liste, Lien | **COMPLET (parties)** |
| `minicart` * | Mini-panier | site | TEXTUAL | — | mc-count, mc-icon, mc-label | Parties stylables : Icône, Libellé, Pastille | **COMPLET (parties)** |
| `textpath` * | Texte sur un tracé | advanced | TEXTUAL | — | textpath-line, textpath-link, textpath-svg, textpath-text, tp | — | **COMPLET** (racine = élément visible) |

Totaux d'origine (audit) : COMPLET 37 · LIMITÉ 42 · PARTIEL 7 · DÉFECTUEUX 0 · ABSENT 0.

**Mise à jour finale : 47 widgets sont en « COMPLET (parties) »** (lignes marquées) et 6 autres, dont la racine est l'élément visible (ex. spacer, divider, button, html, lottie, textpath…), sont COMPLET sans parties. **Plus aucun widget LIMITÉ.**

## 6. À investiguer (non tranché par l'audit)

* Les noms exacts des parties et les sélecteurs CSS de chaque widget seront relevés widget par widget au LOT 4 (l'extraction automatique de ce tableau lit les gabarits ; quelques classes génériques ont été écartées, certains gabarits partagent leurs classes).
* `html`, `embed`, `map`, `lottie`, `textpath` : contenu libre ou externe ; seule la boîte extérieure est stylable, ce qui est le comportement attendu (pas de parties).
* Widgets contextuels (contenu de l'article, sommaire, commentaires, menu du CMS…) : vides sur une page ordinaire ; leur style interne devra être validé dans un vrai contexte d'article.
* Poids réel des règles supplémentaires sur une page de 400 éléments : à mesurer avec `scripts/perf/bench-page-builder.js` avant / après (LOT 13).

## 7. Cas de validation : « Derniers articles du blog » (`posts`)

* **Contenu actuel** (`props`) : nombre (1–12), catégorie, présentation (grille / liste), afficher image / date / extrait, texte « aucun article ».
* **Style actuel** : profil TEXTUAL sur la racine seulement (typographie, couleurs, espacement, dimensions, bordure…). Structure rendue : liste `.kw-posts(-grid|-list)` → `article.kw-post-card` → `img` + `.kw-post-body` → `.kw-post-date`, `.kw-post-title (a)`, `.kw-post-excerpt`.
* **Valeurs en dur** (`landing.css` l. 849–860) : colonnes `repeat(auto-fit, minmax(min(100%,220px),1fr))`, écart 18 px, carte (bordure `rgba(16,34,47,.12)`, rayon 12 px, fond), image 16/9 `cover`, corps (espace 6 px, marges 14/16 px), date 13 px, titre 18 px / 1,3, extrait 15 px ; liste = image 160 px à gauche, repli en colonne sous 560 px.
* **Manques** par rapport à la mission : tout le § 14 sauf le conteneur global (dimensions, marges, fond, bordure de la racine existent) ; en particulier carte (fond, bordure, rayon, ombre, survol), image (ratio libre, hauteur, rayon, ajustement), date, titre (survol), extrait (lignes maximum), lien.
* **Voie rapide existante** : grille à boucle + éléments dynamiques (§ 2, point 2), à conserver comme alternative « sur mesure ».

## 8. Avancement (lots réalisés)

| Lot | Résultat |
|---|---|
| 4a Filet de sécurité | `tests/widgets-parts-regression.test.js` + `tests/fixtures/widgets-regression.json` : JSON normalisé et CSS de chacun des 86 types, comparés à la référence d'avant : **identiques à l'octet** |
| 4b Moteur de parties | `src/marketing/pages/parts.js` (registre), `normalizeParts` (validation par la grammaire fermée + groupes de la partie), `pageCss` (règles `.kw-node.kw-n-<id> <sélecteur>` par écran et par état), `editorSpec` (parties sans sélecteur) |
| 5 Derniers articles | 6 parties : carte, image, corps, date, titre, extrait ; réglages vérifiés dans un vrai Chrome : Inspector → modèle → rendu → enregistrement → rechargement → annuler / rétablir → écrans → survol → aperçu → page publiée |
| 6 Validation | page témoin sans partie : balisage identique et rendu d'origine ; aucune écriture de partie par un geste du canevas |
| 7 Extension | 47 widgets déclarent leurs parties (voir tableau) ; `tests/widgets-parties-rendu-navigateur.test.js` applique un réglage-test à chaque partie et le relit dans la page rendue |
| 8–9 Écrans / états | mêmes écrans que la racine ; survol / focus / clic proposés seulement aux parties interactives ; (états toujours sans déclinaison par écran, comme pour la racine) |
| 10–11 Copier / coller | « Copier le style » conserve aussi les parties ; « Coller le style » les reprend entre widgets du même type, partie par partie, dans les limites de chaque partie |
| 12 Accessibilité | le balisage ne change pas ; aucun contrôle sur l'`outline` ; les cases de contenu (afficher date / extrait / image) restent les seuls moyens de masquer |
| 13 Performance | voir `KOLAKISA_WIDGET_REGRESSION_PLAN.md` § 10 |
| Propriété ajoutée | « Lignes maximum » (`lineClamp`) pour les textes des parties (extrait…) : coupe proprement le texte |

Non fait volontairement : classes globales portant des parties (LOT 10 de l'architecture) — le champ `parts` est facultatif et compatible, l'extension reste possible sans migration.
