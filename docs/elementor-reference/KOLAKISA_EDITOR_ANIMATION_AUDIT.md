# Audit de l'éditeur de pages KOLAKISA et de son moteur d'animation

*Audit factuel du dépôt (branche `main`, dernier commit `01d71d00`). Lecture du code, exécution du registre en Node et de 4 fichiers de tests purs. Chemins relatifs à la racine du dépôt ; les numéros de ligne sont ceux de ce commit.*

**Document en lecture seule : aucun code source n'a été modifié, rien n'a été commité.**

## 0. Ce qui a été vérifié, et ce qui ne l'a pas été

Vérifié par exécution :
- Le registre réel a été chargé en Node (`require("src/marketing/pages/nodes.js")`) : **102 types de widgets** (67 « noyau » dans `nodes.js` + 35 « personnalisés » dans `src/marketing/pages/widgets/*.js`). Les tableaux de la section 1 sont générés depuis ce registre, pas recopiés des documents.
- Tests lancés et réussis : `tests/moteur-mouvement.test.js` (18/18), `tests/widgets-parts-regression.test.js` (1/1), `tests/widgets-parts-couverture.test.js` (3/3), `tests/widgets-contrat.test.js` (6/6).

**Non vérifié** (à ne pas tenir pour acquis) :
- Les tests qui démarrent le serveur (`effets-serveur`, `effets-execution`, etc.) ont échoué ici avec « Le serveur de test n'a pas démarré » (`tests/helpers.js:39`) : environnement de l'audit sans configuration (`.env`, base). Ce n'est pas un échec du code, mais ces tests n'ont donc **pas** été confirmés.
- Aucun test « navigateur » (Chrome/Playwright) n'a été lancé : le rendu réel des 63 animations, la parité canevas/public à l'écran, les performances mesurées ne sont connus que par lecture du code et des documents existants.
- Aucune mesure de performance (images par seconde, poids de page) n'a été faite.
- Le comportement en production (Hostinger), les droits d'accès par rôle, et l'effet réel de l'isolation multi-sites sur les animations n'ont pas été éprouvés autrement que par lecture.
- Le fonctionnement exact de la médiathèque pour des fichiers `.json` Lottie n'a pas été vérifié (le champ « adresse » est un lien, pas un téléversement : `src/marketing/pages/widgets/lottie.js`, champ `src`).

Documents existants réutilisés (non contredits sauf mention) : `KOLAKISA_WIDGET_COVERAGE.md`, `KOLAKISA_WIDGET_CONTROL_MATRIX.md`, `KOLAKISA_WIDGET_STYLE_ARCHITECTURE.md`, `ELEMENTOR_FEATURE_AUDIT.md`, `ELEMENTOR_FEATURE_INVENTORY.md`, `ELEMENTOR_IMPLEMENTATION_TEST_REPORT.md`, `CLAUDE.md`, ainsi que `docs/MOTION-ENGINE.md` et `docs/ELEMENTOR_PARITY_MATRIX.md`.

**Écart constaté avec un document existant** : `KOLAKISA_WIDGET_COVERAGE.md` annonce « 92 types : 74 avec parties, 18 à racine seule ». Le registre actuel donne **102 types : 83 avec parties, 19 à racine seule** (le document date d'avant l'ajout de 10 types, dont `sidebar`, `textpath`, `videoplaylist`, `smartlink`…). Le test garde-fou `widgets-parts-couverture` lit le registre, donc il reste correct ; seul le document est périmé.

## 1. Registre des widgets

### 1.1 Architecture du registre

| Élément | Fichier : ligne | Rôle |
|---|---|---|
| Types « noyau » | `src/marketing/pages/nodes.js:439` (`NODE_TYPES`) | Chaque type : `label`, `category`, `props(p, at, h)` = **validation + nettoyage** des propriétés (grammaire fermée, erreurs en français). |
| Catégories (rubriques) | `nodes.js:1115` (`CATEGORIES`) | structure, text, media, interaction, marketing, commerce (« Formations »), dynamic, advanced. |
| Groupes de la palette | `nodes.js:895` (`WIDGET_GROUPS`), `nodes.js:896` (`WIDGETS` : `[groupe, mots-clés]`) | layout, basic, general, form, advanced, site, commerce, social. Un type sans fiche `WIDGETS` fait échouer le démarrage (`nodes.js:1093`). |
| Fiche de palette | `nodes.js:1119` (`PALETTE`) | icône + `blank()` = contenu de départ de chaque type. |
| Widgets personnalisés | `src/marketing/pages/widgets/index.js` (`check`, `load`) ; `nodes.js:1075` (`registerWidget`) | Un fichier = une description (`type`, `label`, `group`, `icon`, `version`, `schema`, `validate`, `complete`, `migrate`, `style`, `status`, `dependencies`) + un gabarit `views/marketing-public/widgets/<type>.ejs` obligatoire (vérifié au démarrage). |
| Types de champ acceptés pour un widget personnalisé | `widgets/index.js:11` | `text`, `textarea`, `number`, `select`, `bool`, `link`, `image`, `icon`, `color`, `items` (liste de 24 éléments au plus, sous-champs simples, jamais de liste dans une liste). |
| Parties stylables | `src/marketing/pages/parts.js` (`PARTS`, `ROOT_ONLY`, `spec`) | Cibles de style internes d'un widget (sélecteur écrit par le développeur) ; données dans `node.parts[partie].styles[écran]` / `.states[état]`. |
| Capacités avancées | `nodes.js:1573-1581` (`CAP_BASE`, `capsOf`) | `motion, scroll, mouse, transform, attrs, css, responsive` pour tous ; `sticky` en plus pour les 6 conteneurs ; `mask` en plus pour image, galerie, vidéo, boîte d'image, hotspot ; `spacer` et `modal` : seulement `attrs, css, responsive`. |
| Envoi à l'éditeur | `nodes.js:1254` (`editorSpec`) → ligne 1263 : types, parties, capacités, version, schéma des widgets personnalisés ; ligne 1267 : catalogue d'animations et CSS des images-clés | L'éditeur ne connaît rien en dur : il lit ce JSON (`SPEC`). |
| Limites | `nodes.js:18-19` | 400 éléments par page, 8 niveaux d'imbrication. |

Les 35 widgets personnalisés viennent des fichiers : `beforeafter`, `carrousels` (3 : `slides`, `testimonialcarousel`, `mediacarousel`), `cart`, `cta`, `facebookbutton`, `facebookembed`, `floatingbutton`, `linkinbio`, `lottie`, `marquee`, `paymentbuttons` (2), `profilecard`, `readmore`, `shop` (5), `sidebar`, `site` (9), `sitemap`, `smartlink`, `textpath`, `videoplaylist`.

### 1.2 Rendus : canevas et public

- **Il n'y a qu'un seul moteur de rendu HTML.** Le canevas de l'éditeur est un `<iframe srcdoc>` rempli par une requête `POST …/rendu` (`public/js/page-builder.js:5443`) qui renvoie le même HTML que la page publiée, avec l'indicateur `builder` (attribut `data-kw-builder` sur `<body>`, `views/marketing-public/landing.ejs:26`). Le rendu est donc **identique côté structure** ; ce sont les **scripts d'exécution** qui diffèrent (section 5.4).
- Widgets « noyau » : une grande chaîne `if / else if` dans `views/marketing-public/_node.ejs` (212 lignes), une branche par type (numéros de ligne dans le tableau ci-dessous). Les 6 conteneurs partagent la branche des lignes 17-45 (y compris les modes onglets / accordéon / carrousel imbriqués, ligne 45).
- Widgets personnalisés : `views/marketing-public/widgets/<type>.ejs`, inclus par `_node.ejs:120` (`n.customView.partial`).
- CSS d'un élément : `pageCss()` (`nodes.js:1994`) écrit une règle `.kw-n-<id>` par élément, par écran et par état ; CSS de base des widgets dans `public/css/landing.css` (1482 lignes).

### 1.3 Liste complète des 102 widgets

Colonnes : identifiant, libellé, groupe de palette, origine, rendu (public **et** canevas, voir 1.2), nombre de parties stylables (`parts.js`), capacités avancées (« complètes » = mouvement, défilement, souris, transformation, attributs, CSS, responsive), couverture par le filet `tests/fixtures/widgets-regression.json` (hachage SHA-1 du JSON enregistré et du CSS ; « erreur seulement » = le contenu de départ du type est refusé seul par le normaliseur — il faut une image, une formation, etc. — donc seul le message d'erreur est figé, pas la sortie).


#### Catégorie « Structure » (`structure`) — 8 widgets

| Identifiant | Libellé | Palette (groupe) | Origine | Rendu public / canevas | Parties (parts.js) | Capacités | Filet de non-régression |
|---|---|---|---|---|---|---|---|
| `container` | Conteneur | layout | nodes.js | _node.ejs:19 | racine seule | complètes + sticky | JSON+CSS |
| `columns` | Colonnes | layout | nodes.js | _node.ejs (branche commune conteneur) | racine seule | complètes + sticky | JSON+CSS |
| `column` | Colonne | layout | nodes.js | _node.ejs (branche commune conteneur) | racine seule | complètes + sticky | JSON+CSS |
| `grid` | Grille | layout | nodes.js | _node.ejs (branche commune conteneur) | racine seule | complètes + sticky | JSON+CSS |
| `stack` | Pile | layout | nodes.js | _node.ejs (branche commune conteneur) | racine seule | complètes + sticky | JSON+CSS |
| `group` | Groupe | layout | nodes.js | _node.ejs (branche commune conteneur) | racine seule | complètes + sticky | JSON+CSS |
| `spacer` | Espace | basic | nodes.js | _node.ejs:46 | racine seule | attrs+css+responsive | JSON+CSS |
| `divider` | Séparateur | basic | nodes.js | _node.ejs:48 | racine seule | complètes | JSON+CSS |

#### Catégorie « Texte » (`text`) — 11 widgets

| Identifiant | Libellé | Palette (groupe) | Origine | Rendu public / canevas | Parties (parts.js) | Capacités | Filet de non-régression |
|---|---|---|---|---|---|---|---|
| `heading` | Titre | basic | nodes.js | _node.ejs:52 | racine seule | complètes | JSON+CSS |
| `text` | Texte | basic | nodes.js | _node.ejs:52 | racine seule | complètes | JSON+CSS |
| `list` | Liste | basic | nodes.js | _node.ejs:58 | 1 partie(s) | complètes | JSON+CSS |
| `quote` | Citation | general | nodes.js | _node.ejs:60 | 2 partie(s) | complètes | JSON+CSS |
| `code` | Code (texte) | general | nodes.js | _node.ejs:62 | 1 partie(s) | complètes | JSON+CSS |
| `badge` | Badge | general | nodes.js | _node.ejs:96 | racine seule | complètes | JSON+CSS |
| `timeline` | Chronologie | general | nodes.js | _node.ejs:98 | 4 partie(s) | complètes | JSON+CSS |
| `alert` | Alerte | general | nodes.js | _node.ejs:194 | 3 partie(s) | complètes | JSON+CSS |
| `iconlist` | Liste d'icônes | general | nodes.js | _node.ejs:157 | 3 partie(s) | complètes | JSON+CSS |
| `table` | Tableau | general | nodes.js | _node.ejs:173 | 5 partie(s) | complètes | JSON+CSS |
| `animatedheading` | Titre animé | advanced | nodes.js | _node.ejs:131 | 1 partie(s) | complètes | JSON+CSS |

#### Catégorie « Média » (`media`) — 10 widgets

| Identifiant | Libellé | Palette (groupe) | Origine | Rendu public / canevas | Parties (parts.js) | Capacités | Filet de non-régression |
|---|---|---|---|---|---|---|---|
| `image` | Image | basic | nodes.js | _node.ejs:65 | 2 partie(s) | complètes + mask | erreur seulement |
| `gallery` | Galerie | general | nodes.js | _node.ejs:69 | 3 partie(s) | complètes + mask | erreur seulement |
| `video` | Vidéo | basic | nodes.js | _node.ejs:72 | 2 partie(s) | complètes + mask | erreur seulement |
| `audio` | Audio | general | nodes.js | _node.ejs:83 | 2 partie(s) | complètes | erreur seulement |
| `carousel` | Carrousel d'images | general | nodes.js | _node.ejs:107 | 4 partie(s) | complètes | erreur seulement |
| `hotspot` | Image à points d'intérêt | advanced | nodes.js | _node.ejs:161 | 2 partie(s) | complètes + mask | erreur seulement |
| `map` | Google Maps | basic | nodes.js | _node.ejs:153 | 1 partie(s) | complètes | erreur seulement |
| `imagebox` | Boîte d'image | general | nodes.js | _node.ejs:111 | 3 partie(s) | complètes + mask | erreur seulement |
| `iconbox` | Boîte d'icône | general | nodes.js | _node.ejs:111 | 3 partie(s) | complètes | JSON+CSS |
| `icon` | Icône | basic | nodes.js | _node.ejs:189 | racine seule | complètes | JSON+CSS |

#### Catégorie « Interaction » (`interaction`) — 15 widgets

| Identifiant | Libellé | Palette (groupe) | Origine | Rendu public / canevas | Parties (parts.js) | Capacités | Filet de non-régression |
|---|---|---|---|---|---|---|---|
| `button` | Bouton | basic | nodes.js | _node.ejs:85 | 1 partie(s) | complètes | JSON+CSS |
| `link` | Lien | basic | nodes.js | _node.ejs:88 | racine seule | complètes | JSON+CSS |
| `accordion` | Accordéon / FAQ | general | nodes.js | _node.ejs:90 | 3 partie(s) | complètes | JSON+CSS |
| `tabs` | Onglets | general | nodes.js | _node.ejs:92 | 3 partie(s) | complètes | JSON+CSS |
| `menu` | Menu de navigation | site | nodes.js | _node.ejs:102 | 3 partie(s) | complètes | JSON+CSS |
| `toggle` | Bascule | general | nodes.js | _node.ejs:192 | 2 partie(s) | complètes | JSON+CSS |
| `breadcrumb` | Fil d'Ariane | site | nodes.js | _node.ejs:203 | 3 partie(s) | complètes | JSON+CSS |
| `social` | Réseaux sociaux | social | nodes.js | _node.ejs:205 | 1 partie(s) | complètes | JSON+CSS |
| `sharebuttons` | Boutons de partage | social | nodes.js | _node.ejs:207 | 1 partie(s) | complètes | JSON+CSS |
| `modal` | Fenêtre (modale) | advanced | nodes.js | _node.ejs:210 | 6 partie(s) | attrs+css+responsive | JSON+CSS |
| `tooltip` | Infobulle | advanced | nodes.js | _node.ejs:159 | 2 partie(s) | complètes | JSON+CSS |
| `flipbox` | Boîte retournable | advanced | nodes.js | _node.ejs:133 | 4 partie(s) | complètes | JSON+CSS |
| `toc` | Table des matières | advanced | nodes.js | _node.ejs:140 | 3 partie(s) | complètes | JSON+CSS |
| `readingprogress` | Barre de lecture | advanced | nodes.js | _node.ejs:142 | 2 partie(s) | complètes | JSON+CSS |
| `menuanchor` | Ancre de menu | general | nodes.js | _node.ejs:115 | racine seule | complètes | erreur seulement |

#### Catégorie « Marketing » (`marketing`) — 43 widgets

| Identifiant | Libellé | Palette (groupe) | Origine | Rendu public / canevas | Parties (parts.js) | Capacités | Filet de non-régression |
|---|---|---|---|---|---|---|---|
| `progress` | Barre de progression | general | nodes.js | _node.ejs:100 | 3 partie(s) | complètes | JSON+CSS |
| `counter` | Compteur | general | nodes.js | _node.ejs:196 | 2 partie(s) | complètes | JSON+CSS |
| `testimonial` | Témoignage | general | nodes.js | _node.ejs:198 | 5 partie(s) | complètes | JSON+CSS |
| `pricing` | Offre tarifaire | advanced | nodes.js | _node.ejs:201 | 6 partie(s) | complètes | JSON+CSS |
| `countdown` | Compte à rebours | advanced | nodes.js | _node.ejs:176 | 1 partie(s) | complètes | JSON+CSS |
| `pricelist` | Liste de prix | advanced | nodes.js | _node.ejs:138 | 4 partie(s) | complètes | JSON+CSS |
| `signupform` | Formulaire | form | nodes.js | _node.ejs:144 | 3 partie(s) | complètes | erreur seulement |
| `rating` | Évaluation | general | nodes.js | _node.ejs:113 | 5 partie(s) | complètes | erreur seulement |
| `beforeafter` | Avant / Après | general | widgets/*.js (v1) | widgets/beforeafter.ejs | 6 partie(s) | complètes | JSON+CSS |
| `slides` | Diaporama | general | widgets/*.js (v1) | widgets/slides.ejs | 8 partie(s) | complètes | JSON+CSS |
| `testimonialcarousel` | Carrousel de témoignages | general | widgets/*.js (v1) | widgets/testimonialcarousel.ejs | 8 partie(s) | complètes | JSON+CSS |
| `mediacarousel` | Carrousel média | general | widgets/*.js (v1) | widgets/mediacarousel.ejs | 4 partie(s) | complètes | JSON+CSS |
| `cart` | Panier | commerce | widgets/*.js (v1) | widgets/cart.ejs | 9 partie(s) | complètes | JSON+CSS |
| `cta` | Appel à l'action | general | widgets/*.js (v1) | widgets/cta.ejs | 6 partie(s) | complètes | JSON+CSS |
| `facebookbutton` | Bouton Facebook | social | widgets/*.js (v1) | widgets/facebookbutton.ejs | 1 partie(s) | complètes | JSON+CSS |
| `facebookembed` | Contenu Facebook | social | widgets/*.js (v1) | widgets/facebookembed.ejs | 1 partie(s) | complètes | JSON+CSS |
| `floatingbutton` | Bouton flottant | social | widgets/*.js (v1) | widgets/floatingbutton.ejs | 1 partie(s) | complètes | JSON+CSS |
| `linkinbio` | Lien en bio | social | widgets/*.js (v1) | widgets/linkinbio.ejs | 5 partie(s) | complètes | JSON+CSS |
| `lottie` | Animation Lottie | advanced | widgets/*.js (v1) | widgets/lottie.ejs | 1 partie(s) | complètes | JSON+CSS |
| `marquee` | Défilement continu | advanced | widgets/*.js (v1) | widgets/marquee.ejs | 3 partie(s) | complètes | JSON+CSS |
| `stripebutton` | Bouton Stripe | commerce | widgets/*.js (v1) | widgets/stripebutton.ejs | 2 partie(s) | complètes | JSON+CSS |
| `paypalbutton` | Bouton PayPal | commerce | widgets/*.js (v1) | widgets/paypalbutton.ejs | 2 partie(s) | complètes | JSON+CSS |
| `profilecard` | Carte de profil | general | widgets/*.js (v1) | widgets/profilecard.ejs | 4 partie(s) | complètes | JSON+CSS |
| `readmore` | Lire la suite | basic | widgets/*.js (v1) | widgets/readmore.ejs | 3 partie(s) | complètes | JSON+CSS |
| `shopgrid` | Grille de produits | commerce | widgets/*.js (v1) | widgets/shopgrid.ejs | 11 partie(s) | complètes | JSON+CSS |
| `shopbuy` | Ajouter au panier | commerce | widgets/*.js (v1) | widgets/shopbuy.ejs | 8 partie(s) | complètes | JSON+CSS |
| `shopcart` | Panier, commande et compte | commerce | widgets/*.js (v1) | widgets/shopcart.ejs | 5 partie(s) | complètes | JSON+CSS |
| `shopsearch` | Recherche de produits | commerce | widgets/*.js (v1) | widgets/shopsearch.ejs | 4 partie(s) | complètes | JSON+CSS |
| `shopfilters` | Filtres de produits | commerce | widgets/*.js (v1) | widgets/shopfilters.ejs | 5 partie(s) | complètes | JSON+CSS |
| `sidebar` | Barre latérale | site | widgets/*.js (v1) | widgets/sidebar.ejs | racine seule | complètes | JSON+CSS |
| `querylist` | Liste dynamique | site | widgets/*.js (v1) | widgets/querylist.ejs | 8 partie(s) | complètes | JSON+CSS |
| `postmeta` | Informations de l'article | site | widgets/*.js (v1) | widgets/postmeta.ejs | 1 partie(s) | complètes | JSON+CSS |
| `postterms` | Catégorie et étiquettes | site | widgets/*.js (v1) | widgets/postterms.ejs | 2 partie(s) | complètes | JSON+CSS |
| `postnav` | Article précédent / suivant | site | widgets/*.js (v1) | widgets/postnav.ejs | 4 partie(s) | complètes | JSON+CSS |
| `authorbox` | Boîte auteur | site | widgets/*.js (v1) | widgets/authorbox.ejs | 5 partie(s) | complètes | JSON+CSS |
| `archiveinfo` | En-tête d'archive | site | widgets/*.js (v1) | widgets/archiveinfo.ejs | 3 partie(s) | complètes | JSON+CSS |
| `postcomments` | Commentaires de l'article | site | widgets/*.js (v1) | widgets/postcomments.ejs | 5 partie(s) | complètes | JSON+CSS |
| `cmsmenu` | Menu du CMS | site | widgets/*.js (v1) | widgets/cmsmenu.ejs | 2 partie(s) | complètes | JSON+CSS |
| `minicart` | Mini-panier | site | widgets/*.js (v1) | widgets/minicart.ejs | 3 partie(s) | complètes | JSON+CSS |
| `sitemap` | Plan du site | site | widgets/*.js (v1) | widgets/sitemap.ejs | 4 partie(s) | complètes | JSON+CSS |
| `smartlink` | Lien intelligent | social | widgets/*.js (v1) | widgets/smartlink.ejs | 1 partie(s) | complètes | JSON+CSS |
| `textpath` | Texte sur un tracé | advanced | widgets/*.js (v1) | widgets/textpath.ejs | racine seule | complètes | JSON+CSS |
| `videoplaylist` | Playlist vidéo | general | widgets/*.js (v1) | widgets/videoplaylist.ejs | 3 partie(s) | complètes | JSON+CSS |

#### Catégorie « Formations » (`commerce`) — 3 widgets

| Identifiant | Libellé | Palette (groupe) | Origine | Rendu public / canevas | Parties (parts.js) | Capacités | Filet de non-régression |
|---|---|---|---|---|---|---|---|
| `course` | Formation | commerce | nodes.js | _node.ejs:182 | 6 partie(s) | complètes | erreur seulement |
| `addtocart` | Bouton d'achat | commerce | nodes.js | _node.ejs:178 | 2 partie(s) | complètes | erreur seulement |
| `courserating` | Avis de la formation | commerce | nodes.js | _node.ejs:180 | 3 partie(s) | complètes | erreur seulement |

#### Catégorie « Contenu dynamique » (`dynamic`) — 10 widgets

| Identifiant | Libellé | Palette (groupe) | Origine | Rendu public / canevas | Parties (parts.js) | Capacités | Filet de non-régression |
|---|---|---|---|---|---|---|---|
| `posts` | Derniers articles du blog | site | nodes.js | _node.ejs:163 | 6 partie(s) | complètes | JSON+CSS |
| `courselist` | Formations du catalogue | commerce | nodes.js | _node.ejs:165 | 7 partie(s) | complètes | JSON+CSS |
| `search` | Recherche | site | nodes.js | _node.ejs:167 | 2 partie(s) | complètes | JSON+CSS |
| `account` | Compte du visiteur | site | nodes.js | _node.ejs:169 | 3 partie(s) | complètes | JSON+CSS |
| `dyntext` | Texte dynamique | advanced | nodes.js | _node.ejs:171 | racine seule | complètes | JSON+CSS |
| `sitelogo` | Logo du site | site | nodes.js | _node.ejs:121 | 2 partie(s) | complètes | JSON+CSS |
| `postcontent` | Contenu de l'article | site | nodes.js | _node.ejs:125 | 6 partie(s) | complètes | JSON+CSS |
| `catfilter` | Filtre par catégorie | site | nodes.js | _node.ejs:123 | 4 partie(s) | complètes | JSON+CSS |
| `sitetitle` | Titre du site | site | nodes.js | _node.ejs:127 | 1 partie(s) | complètes | JSON+CSS |
| `copyright` | Copyright | site | nodes.js | _node.ejs:129 | racine seule | complètes | JSON+CSS |

#### Catégorie « Avancé » (`advanced`) — 2 widgets

| Identifiant | Libellé | Palette (groupe) | Origine | Rendu public / canevas | Parties (parts.js) | Capacités | Filet de non-régression |
|---|---|---|---|---|---|---|---|
| `html` | HTML (sécurisé) | general | nodes.js | _node.ejs:109 | racine seule | complètes | JSON+CSS |
| `embed` | Contenu intégré | advanced | nodes.js | _node.ejs:155 | 1 partie(s) | complètes | erreur seulement |


**Capacités responsive (toutes les entrées ci-dessus)** : la capacité `responsive` est présente sur tous les types (y compris `spacer` et `modal`). Voir section 4.

## 2. Panneau des widgets, panneau de propriétés, contrôles réutilisables

### 2.1 Panneau des widgets (bibliothèque d'éléments)

- Barre d'outils gauche `TOOLS` (`public/js/page-builder.js:1562-1580`) : catégories **Mise en page, Basique, Général, Formulaire, Avancé, Site, E-commerce, Réseaux sociaux**, puis **Sections prêtes, Blocs, Composants**. Ce sont les `WIDGET_GROUPS` du serveur, pas les `CATEGORIES`.
- Recherche : champ `[data-pb-el-search]` → `renderElements(filtre)` (`page-builder.js:1502`). Les mots-clés viennent de `WIDGETS[type][1]` enrichis des noms Elementor (`src/marketing/pages/elementorNames.js`, `withAliases`, utilisé `nodes.js:1263`).
- Glisser-déposer : `dragstart` depuis la bibliothèque (`page-builder.js:1471`), déplacement depuis les calques (`1151`, `6239`), depuis le canevas (`5546`) ; contraintes de dépôt et aimantation dans `public/js/page-builder-snap.js` et `page-builder-rules.js`.
- Tooltip / description : `WIDGET_DESCRIPTIONS` et `description` des widgets personnalisés (160 caractères au plus, imposé par `widgets/index.js`).
- Permissions : `WIDGET_PERMISSIONS` (`nodes.js:1090`) — seul `html` exige `pages.code` ; vérifié à l'enregistrement (`src/marketing/pages/index.js:142`, `checkWidgetRights`).

### 2.2 Panneau de propriétés (inspecteur)

Onglets décidés dans `public/js/page-builder.js:4127` :
- Élément simple avec styles : **Contenu / Style / Avancé**.
- Conteneur (`schema.tabs === "box"`) : **Général / Style / Interactions**.
- Multi-sélection : **Style / Avancé**.
- Onglet « Contenu » : `nodeContentFields` génère les champs depuis le schéma (widgets personnalisés : types de champ du 1.1 ; widgets noyau : code dédié par type, par exemple ligne 2108 pour le titre).
- Onglet « Style » : `styleTab` (écran × état × partie). Onglet « Avancé » : `advancedTab`, qui appelle les sections de `public/js/page-builder-effects.js` selon les **capacités** du type (`capsOf`, `page-builder-effects.js:17-20`).
- Le dernier onglet est mémorisé dans `localStorage` (`pb:insp-tab`, `page-builder.js:4052`).

### 2.3 Contrôles réutilisables existants

Dans `public/js/page-builder.js` : `numberField` (2017), `selectField` (2025), `checkField` (2033), contrôle numérique complet `NumericControl` (saisie, flèches, glissement, curseur — documenté `docs/CONTROLES-NUMERIQUES.md`), `accGroup` (section repliable), `styleControl`, sélecteur de médiathèque `openMedia`. Ils sont transmis aux modules satellites par `attach(api)` (`page-builder-effects.js:16`, objet `A` : `h`, `selectField`, `checkField`, `numField`, `accGroup`, `store`, `SPEC`, `canvasEl`). Un panneau d'animation s'écrit donc **sans réinventer de contrôle**.

## 3. Modèle de données, sérialisation, sauvegarde, historique, publication

### 3.1 Modèle d'un élément (nœud)

Normalisé par `normalizeNode` (`nodes.js:1761`). Champs d'un nœud : `id` (6 à 20 caractères `[a-z0-9]`, unique dans la page), `type`, `props` (propres au type), `v` (version du widget personnalisé, seulement si > 1), `name`, `note`, `hidden`, `locked`, `anchor`, `audience`, `hideOn` (écrans), `motion`, `css`, `cssHover`, `classes`, `attrs`, `interactions`, `startHidden`, `schedule`, `shapes`, `bgSlides`, `bgVideo`, `styles` (par écran), `states` (par état), `parts`, `children`. Un champ inconnu est **ignoré**, jamais enregistré : le modèle est « grammaire fermée » (aucun CSS libre ne passe, sauf `css` validé par `cssDeclarations`).

### 3.2 Versions et migrations

- **Pas de numéro de schéma global de document.** Chaque widget personnalisé a sa `version` et une fonction `migrate[v]` obligatoire pour chaque version > 1 (`widgets/index.js`, dernière boucle de `check`) ; `normalizeNode` applique les migrations à l'ouverture (`nodes.js:1773-1776`) et écrit `node.v`. **Tous les widgets actuels sont en version 1** (colonne obtenue du registre) : le mécanisme existe mais n'a jamais servi.
- Les widgets « noyau » n'ont **pas** de version : leur évolution doit rester rétro-compatible dans `props()` (valeur par défaut pour tout champ nouveau).
- Les migrations de **base de données** (`src/marketing/migrations/*.sql`, ex. `036_site_web_fondations.sql` pour `mk_page_versions`) sont séparées ; leur test est `tests/marketing-migrations*.test.js`. Le contenu des pages est stocké en JSON dans `mk_landing_pages` (`sections`, `theme`, `draft`, `seo`).

### 3.3 Brouillon, enregistrement, publication

`src/marketing/pages/index.js` (en-tête, lignes 1-10) :
- **Brouillon** : colonne `draft` ; `saveDraft` (ligne 149) valide tout le document (`normalizeContent`, ligne 123), vérifie les droits de widgets, puis `UPDATE … WHERE id = ? AND organization_id = ? AND revision = ?` : **verrou optimiste par `revision`** (conflit si l'éditeur a une révision périmée, ligne 162-164).
- **Publication** (`publish`, ligne 178) : le brouillon devient la version en ligne, crée une ligne `mk_page_versions` (historique, contenu comparé à la dernière version, ligne 187-192), repasse `draft` à NULL. Programmation : `scheduled_at` (ligne 218-248).
- **Restauration** : une version est copiée dans le **brouillon**, jamais directement en ligne (ligne 286-291).
- Historique commun `src/services/revisions.js` : `pageDraft` enregistre des points de brouillon (100 conservés par page, `MAX_DRAFT_POINTS`, ligne 17).
- Sauvegarde automatique côté navigateur : `PUT …/brouillon` (`page-builder.js:8351`), copie de secours locale `localStorage["pb-backup-<id>"]` (8338) proposée au retour (8594).

### 3.4 Annuler / rétablir

Historique **local au navigateur**, par instantané JSON complet (`snapshot()` / `restore()`, `page-builder.js:250-260`), 150 étapes au plus (ligne 250), libellées (« Effet de souris », « Animation d'entrée »…), regroupées par clé de modification. Persistance entre rechargements dans `localStorage["pb-history-<id>"]` (2 millions de caractères au plus, lignes 295-317). Toute modification d'animation passe par `setMotion` → `change()` (`page-builder-effects.js:45`) : **annuler / rétablir fonctionnent sans code supplémentaire**.

## 4. Responsive

- Écrans (`nodes.js:24-30`) : `desktop` (base), `wide` (`min-width: 1920px`, hérite du bureau), `tablet` (`max-width: 1023px`), `mobile` (`max-width: 767px`) ; valeurs réglables par site (`DEFAULT_BREAKPOINTS`, `nodes.js:1955`, et `siteSettings.js`). Héritage vers le bas : tablette ← bureau, mobile ← tablette.
- États (`nodes.js:31`) : `hover`, `focus` (`:focus-visible`), `active`. Limite connue : les états ne se déclinent pas par écran (`KOLAKISA_WIDGET_COVERAGE.md`).
- Propriétés par écran : toutes celles de `STYLE_PROPS` (`nodes.js:118`) — dimensions, espacements, typographie (+ `fluid:min-max`), disposition, affichage, images (`docs/KOLAKISA_RESPONSIVE_WIDGET_PROPERTIES.md`). Visibilité par écran : `hideOn` (`nodes.js:1799`, au moins un écran doit rester visible).
- **Animation par appareil** : l'animation d'entrée se remplace ou se coupe par écran (`motion.screens = { tablet, mobile }`, valeur `"none"` ou identifiant, `normalizeMotion`), les effets de défilement/souris se coupent par écran (`motion.off`). Il n'existe pas de **durée, délai ou courbe** propres à un écran (seule l'animation change). Pas d'écran « wide » pour `motion.screens` (seulement tablette et mobile ; `off` accepte `wide`).
- Propriétés de contenu des widgets par écran : inexistantes — un widget n'a pas de `props` par écran ; seuls ses styles et ses parties en ont. Exemples de réglage « responsive » interne au rendu : grille de galerie (2 colonnes au plus sur téléphone), grille (`nodes.js:2091-2092`).

## 5. Moteur d'animation existant

**Constat central : un moteur de mouvement complet existe déjà**, documenté dans `docs/MOTION-ENGINE.md` (je confirme le descriptif dans le code). Toute nouvelle animation doit **s'y brancher**, pas créer un second moteur.

### 5.1 Chaîne complète

```
Panneau « Effets de mouvement » (public/js/page-builder-effects.js)
  → modèle : node.motion  (+ styles par écran pour l'épinglage)
  → validation serveur : normalizeMotion (src/marketing/pages/nodes.js:1676)
  → registre : src/marketing/pages/motion.js (63 animations, courbes, directions, déclencheurs)
  → rendu : entranceRules (nodes.js:1917) = CSS ; motionAttrs (nodes.js:1932) = attributs data-kw-*
  → exécution : public/js/landing.js:112-139 (entrées) ; public/js/kw-effects.js (défilement, souris) ; CSS landing.css (survol, mouvement réduit)
```

### 5.2 Données stockées (`node.motion`, nœud par nœud)

| Clé | Contenu | Bornes / liste fermée | Validé par |
|---|---|---|---|
| `entrance` | identifiant du registre `motion.js` (63 : entrée « in », attention « attn », sortie « out ») | liste fermée | `nodes.js:1725` |
| `duration`, `delay` | ms | 100–10000 ; 0–10000 | idem |
| `easing` | nom connu (`smooth, linear, ease, ease-in, ease-out, ease-in-out, spring`) ou `cubic-bezier(a,b,c,d)` borné | `motion.js` `normalizeEasing` | idem |
| `iterations`, `direction` | 1, 2, 3 ou `infinite` ; normal, reverse, alternate, alternate-reverse | par défaut 1 | idem |
| `trigger` | `viewport` (défaut), `load`, `click`, `hover` | `MOTION.TRIGGERS` | idem |
| `repeat` | rejouer à chaque arrivée à l'écran | booléen | idem |
| `screens` | `{ tablet, mobile }` : autre animation ou `"none"` | | idem |
| `hover` | 16 effets de survol CSS : grow, shrink, lift, tilt, float, sink, rotate, skew, push, pop, pulse, bounce, bob, hang, wobble, buzz (`HOVERS`, `nodes.js:1642`) | | `nodes.js:1746` |
| `scroll` | défilement « symétrique » : y, x, opacity, blur, scale, rotate | `SCROLL_FX` `nodes.js:1649` | `nodes.js:1680` |
| `scrollFx` | défilement « de → à » : translateY/X, rotate, rotateX, scale, opacity, blur ; `start`/`end` %, `dir`, `invert`, `perspective` | `SCROLL_RANGE` `nodes.js:1657` | `nodes.js:1691` |
| `mouse`, `mouseFx` | suivre le curseur / inclinaison 3D ; amplitudes translate, rotate X/Y/Z, scale, `speed`, `perspective` | `MOUSE_RANGE` `nodes.js:1668` | `nodes.js:1685`, `1709` |
| `off` | écrans où défilement et souris sont coupés | | `nodes.js:1721` |
| `alwaysMotion` | l'auteur renonce à respecter « mouvement réduit » | booléen explicite | `nodes.js:1745` |

Autres données de mouvement hors `motion` : épinglage (`styles.<écran>.position: sticky`, `top`, `zIndex`), `interactions` (déclencheur → action, dont l'action « Rejouer l'animation », `nodes.js:1521`), `bgSlides` (diaporama de fond avec Ken Burns), `bgVideo`, `shapes` (séparateurs de forme), en-tête collant à effet de rétrécissement (`headerFx`, `nodes.js:443`, rendu `themeCss`/`_sections.ejs`), `backgroundAttachment: fixed` (« effet parallaxe » de fond, `nodes.js:1249`), animations d'ouverture/fermeture des fenêtres (`MODAL_ANIMS`, `nodes.js:1585`), animation de la visionneuse (`siteSettings.js:11`, `LB_ANIMATIONS`), transition de page (`siteSettings.js:263-273`, View Transitions).

Aucune animation n'est stockée dans les `props` d'un widget, à une exception près : les paramètres **propres** à un widget (`counter.duration`, `progress.animate`, `animatedheading.effect/interval`, `lottie.trigger/loop/speed`, `slides.kenBurns`, carrousels `autoplay/interval/loop/dots`, `marquee.speed/direction/pauseHover`, `flipbox.effect`).

### 5.3 Exécution publique

| Mécanisme | Où | Détail |
|---|---|---|
| Entrée / sortie / attention | `landing.js:112-139` | `IntersectionObserver` (seuil 0,12) ; classe `is-in` ; déclencheurs load / click / hover ; classe `kw-anim-ready` posée par le script : **sans JavaScript, rien n'est masqué**. |
| Images-clés | `motion.js` → CSS de la page | Seules les animations **utilisées** sont écrites dans le CSS (`nodes.js:2120`) ; composition avec la transformation propre (`--kw-tf`, `nodes.js:379`) ; uniquement `transform`/`opacity` (sauf `reveal` : `clip-path`). |
| Défilement et souris | `public/js/kw-effects.js` (250 lignes) | Un écouteur de défilement passif, un de souris, `requestAnimationFrame` seulement quand quelque chose bouge, propriétés CSS indépendantes `translate/scale/rotate/opacity/filter`, `destroy()` sur `pagehide` ; souris seulement avec `(hover: hover) and (pointer: fine)` (ligne 94). |
| Survol | `landing.css` ~644-650, 1091-1107 | CSS pur (`kw-hover-*`), classe posée par `_node.ejs:9`. |
| Compteurs, barres | `landing.js:308-325` | `IntersectionObserver` (seuil 0,3), `requestAnimationFrame`, courbe cubique, séparateurs français. |
| Titre animé | `landing.js:361-372`, `landing.css:306-309` | `setInterval` ; mode « fondu » ou « machine à écrire ». |
| Compte à rebours | `landing.js:397-430` | `setInterval` 1 s. |
| Carrousels | `landing.js:53-110` | Défilement natif (scroll-snap), flèches, points, boucle, lecture auto (`setInterval`) ; sert aussi `slides`, `testimonialcarousel`, `mediacarousel` et le conteneur en mode carrousel (`landing.js:565` pour les résultats). |
| Onglets / accordéons / bascule | `landing.js:13-52`, `507-563` ; `public/js/accordion-engine.js` (côté éditeur) | Onglets, onglets et accordéons imbriqués, clavier. |
| Lottie | `landing.js:466-505` ; `public/js/vendor/lottie_light.min.js` (168 Ko, lottie-web « light », SVG, sans expressions) | Bibliothèque chargée à la demande quand l'animation approche de l'écran (`rootMargin: 200px`) ; déclencheurs viewport/load/hover/click ; vitesse ; boucle. |
| Marquee | CSS seul : `landing.css` ~1340-1360 | `@keyframes kw-marquee-run`, pause au survol/focus/case. |
| Boîte retournable | CSS (`landing.css:323`) + `landing.js:374` | Retournement au survol/focus/toucher. |
| Avant/Après | `landing.js:587-597` | Champ `range` natif. |
| Barre de lecture | `landing.js:387-395` | Écouteur de défilement passif + rAF. |
| Fenêtres | `landing.js:219-300` | Déclencheurs automatiques (chargement, défilement, sortie, inactivité, clics, remontée, ancre visible). |
| Épinglage (sticky) | CSS `position: sticky` par écran | Pas de JavaScript. |

Aucune bibliothèque d'animation externe (GSAP, AOS, Swiper, anime.js…) : `package.json` n'en déclare aucune ; **seule bibliothèque tierce côté visiteur : lottie-web light, hébergée localement**. Les fichiers `public/js/kol-motion.js` et `public/js/kb-motion.js` ne concernent que l'**interface d'administration** (micro-interactions de l'éditeur, niveau de mouvement adaptatif) et non les pages publiées.

### 5.4 Le canevas et le public rendent-ils à l'identique ?

**Structure : oui. Mouvement : non, volontairement.** Même HTML (section 1.2), mais le script public se tait si `data-kw-builder` est présent :

| Fonction | Dans le canevas | Preuve |
|---|---|---|
| Entrées / sorties | non jouées, contenu visible | `landing.js:119` |
| Défilement / souris | non démarrés | `kw-effects.js:238-240` |
| Compteurs, barres animées | valeur finale statique | `landing.js:310` |
| Titre animé | premier mot fixe | `landing.js:362` |
| Diaporama de fond, lecture auto des carrousels | arrêtés | `landing.js:181`, `95` |
| Fenêtres automatiques | non ouvertes | `landing.js:222` |
| Barre de lecture, interactions (`data-kw-ix`) | non actives | `landing.js:389`, `338` |
| Lottie | **encadré de substitution** « Animation Lottie : … », pas de lecture | `views/marketing-public/widgets/lottie.ejs:2` |
| Marquee, retournement, survol CSS | **actifs** (CSS pur) | `landing.css` |
| Compte à rebours | actif (aucun test `builder` à `landing.js:397`) | lecture |

Compensation côté éditeur : bouton / survol « Aperçu » d'une animation (`page-builder-effects.js:255-290`, `playPreview`) qui injecte le CSS de toutes les images-clés dans le canevas (`motionCss`, ligne 260) et joue l'animation **sans l'enregistrer**. Le mode Aperçu de la page (rendu non-`builder`) exécute les vrais scripts. Il n'y a **pas** de bouton « Rejouer toutes les animations de la page » dans le canevas (non trouvé dans le code).

Risque lié : le canevas se met à jour « en place » sauf si le fragment contient `data-kw-*`, `<script>`, `<style>`… (regex `INTERACTIVE`, `page-builder.js:5340`) : **toute section portant un attribut de mouvement fait recharger l'iframe en entier** à chaque modification de cette section (commentaire lignes 5334-5337). À mesurer sur une page très animée (non mesuré ici).

### 5.5 `prefers-reduced-motion`

Respecté **par défaut** et au niveau de chaque mécanisme :
- Entrées : suppression, ou fondu court de 300 ms (`data-kw-anim-rm="fade"`, `landing.js:131`, `landing.css:649-650`) ; sorties/attention : aucune animation.
- Défilement/souris : coupés (`kw-effects.js:106`, `reduceQ`) et réévalués si la préférence change (`onMedia`).
- Compteurs/barres (`landing.js:310`), titre animé (362), diaporama de fond (181), vidéo de fond mise en pause (360), lecture auto des carrousels (94), Lottie : première image fixe (470, 481), marquee : défilement remplacé par un texte qui passe à la ligne (`landing.css:1353-1358`), boîte retournable (`landing.css:323`), fenêtres, visionneuse, survols (`landing.css:644`, `1107`).
- Dérogation explicite et visible : case « Respecter les préférences système de mouvement réduit » (`page-builder-effects.js:425`) → `alwaysMotion`. À noter : cette dérogation n'existe que pour l'entrée / défilement / souris, pas pour les autres widgets.
- Limites relevées : (a) le compte à rebours n'est pas une animation mais change chaque seconde (sans objet) ; (b) les `setInterval` du titre animé, des carrousels et du diaporama de fond ne sont **pas** arrêtés quand l'élément sort de l'écran (le carrousel teste `document.hidden`, `landing.js:101`, les autres non) ; (c) pas de bouton pause visible sur le titre animé (critère WCAG 2.2.2 pour tout mouvement > 5 s) ; seul le marquee a une case « Pause ».

### 5.6 Risques de performance

1. Un `setInterval` par titre animé, carrousel à lecture auto, diaporama de fond, compte à rebours, jamais suspendu hors écran (sauf `document.hidden` pour le carrousel).
2. `kw-effects.js` lit la géométrie (`getBoundingClientRect`) à chaque image pour les éléments visibles : coût proportionnel au nombre d'éléments à effet de défilement visibles ; atténué par `IntersectionObserver`. Pas de plafond sur le nombre d'éléments animés (la page est limitée à 400 éléments au total).
3. `trigger: hover` : réécriture de classe + `offsetWidth` forcé à chaque `mouseenter` (`landing.js:130`) — reflow à chaque survol ; sur écran tactile, `hover` n'a pas d'équivalent (non vérifié sur appareil).
4. Les animations « 3D » (`flip`, `rotateX`, `perspective`) et le `filter: blur` du défilement forcent des couches de composition.
5. `landing.js` (597 lignes) et `kw-effects.js` sont chargés sur **toutes** les pages publiques (`landing.ejs:41-44`), même sans animation ; `kw-effects.js` se désactive seul si aucun attribut `data-kw-scroll|mouse|sfx|mfx` n'existe.
6. Lottie : 168 Ko + fichier `.json` tiers si l'adresse est externe (https) ; aucune restriction de destination dans la politique de sécurité (`src/middlewares/security.js:15` ne pose pas de `connect-src`) ; le chargement externe n'est pas conditionné au consentement (non vérifié dans le code du bandeau de consentement).
7. Image-clés : 63 animations ≈ CSS limité aux animations utilisées (bon) ; mais le **canevas** reçoit les 63 d'un coup (`allKeyframesCss`, `nodes.js:1267`) — négligeable.

## 6. Tests existants et fixtures

| Domaine | Fichiers `tests/` |
|---|---|
| Moteur de mouvement | `moteur-mouvement.test.js` (registre, validation, CSS, calculs — **réussi 18/18 ici**), `moteur-mouvement-navigateur.test.js` (panneau), `moteur-mouvement-chrome.test.js` (63 animations exécutées dans Chrome, déclencheurs, mouvement réduit, défilement, souris, épinglage), `editeur-mouvement-navigateur.test.js`, `effets-serveur.test.js`, `effets-execution.test.js`, `effets-inspecteur-navigateur.test.js`, `mouvement-adaptatif-navigateur.test.js` (admin), `r9-site-maitre-effets-application.test.js` |
| Registre / contrat des widgets | `widgets-contrat.test.js` (6/6 ici), `editeur-widgets.test.js`, `editeur-widgets-personnalises.test.js`, `editeur-conformite-widgets.test.js`, `widgets-nouveaux(.navigateur).test.js`, `widgets-imbriques.test.js` |
| Parties stylables | `widgets-parts.test.js`, `widgets-parts-couverture.test.js` (3/3 ici), `widgets-parts-regression.test.js` (1/1 ici), `widgets-parties-rendu-navigateur.test.js`, `editeur-widgets-parties-navigateur.test.js`, `parties-brouillon-*.test.js` |
| Widgets spécifiques | `widgets-lottie-navigateur.test.js`, `widgets-marquee-avant-apres(.navigateur).test.js`, `accordeons-moteur.test.js`, `accordeons-navigateur.test.js`, `widgets-paiement-barre-laterale-navigateur.test.js` |
| Publication / sécurité / perf | `widgets-publie-navigateur.test.js`, `widgets-securite-navigateur.test.js`, `widgets-performance-navigateur.test.js`, `widgets-accessibilite-navigateur.test.js`, `layout-parite-canevas-publie-navigateur.test.js` |
| Responsive | `palier14-responsive-navigateur.test.js`, `programme22-8-responsive(.navigateur).test.js`, `responsive-*-navigateur.test.js` |

**Fixture `tests/fixtures/widgets-regression.json`** : 102 entrées (une par type). Pour chacune, `{ json, css }` = SHA-1 du nœud normalisé (contenu de départ + styles `STYLES`/`STATES` du test) et du CSS de page ; 15 types n'ont qu'un hachage `error` (le contenu de départ seul est refusé) : `addtocart, audio, carousel, course, courserating, embed, gallery, hotspot, image, imagebox, map, menuanchor, rating, signupform, video`. **Pour ces 15 types, le filet ne protège pas la sortie réelle** (angle mort de non-régression). La fixture ne contient **aucun `motion`** : ajouter un champ de mouvement optionnel n'altère donc aucun hachage tant qu'aucune valeur par défaut n'est ajoutée. Régénération volontaire : `UPDATE_FIXTURE=1 node --test tests/widgets-parts-regression.test.js`.

Rapports : `ELEMENTOR_IMPLEMENTATION_TEST_REPORT.md` (3227 tests verts à la date du 8 octobre 2026) ; `KOLAKISA_WIDGET_COVERAGE.md` (suite complète du 31 octobre 2026 : 5407 tests, 12 en échec hors périmètre). Je n'ai pas rejoué la suite complète.

## 7. État de chaque widget existant

Légende : **Complet** = rendu public et canevas par le même gabarit, schéma validé, parties de style déclarées, parité « Complet » dans `docs/ELEMENTOR_PARITY_MATRIX.md` ou test dédié. **Fonctionnel mais incomplet** = fonctionne mais fonctionnalité de référence absente (précisée). **Visuel seulement (canevas)** = le canevas montre une représentation sans l'effet réel. **Non modifiable correctement / non rendu correctement en public** : aucun cas *confirmé* par lecture du code ; les limites constatées sont notées. « Absent » n'apparaît que dans la section 8.

Ce tableau est fondé sur la lecture du code et des documents ; **aucun widget n'a été ouvert dans un navigateur** pour cet audit.

| Widgets | État | Preuve / limites |
|---|---|---|
| `container`, `columns`, `column`, `grid`, `stack`, `group` | Complet | Branche commune `_node.ejs:17-45` ; capacité `sticky` ; modes imbriqués onglets / accordéon / carrousel (`_node.ejs:19-22, 45` ; `landing.js:507-563`). Dans le canevas, les modes imbriqués affichent les enfants à plat (`!isBuilder`, `_node.ejs:19`) : l'aspect final (onglets, volets) ne se voit qu'en aperçu. |
| `spacer`, `divider`, `heading`, `text`, `list`, `quote`, `code`, `badge`, `link`, `button`, `icon`, `html`, `dyntext`, `copyright` | Complet | Branches `_node.ejs` ; racine seule ou 1-2 parties (`KOLAKISA_WIDGET_COVERAGE.md`). `html` réservé aux administrateurs (`WIDGET_PERMISSIONS`). Pas d'animation propre ; mouvement générique via `node.motion`. |
| `image`, `gallery`, `video`, `audio`, `imagebox`, `iconbox`, `map`, `embed` | Complet | Masque (`mask`) sur image/galerie/vidéo/imagebox ; visionneuse ; filtres de galerie. Hachage de non-régression « erreur seulement » pour `image, gallery, video, audio, imagebox, map, embed`. Pas de mouvement propre ; `iconbox`/`imagebox`/`icon` : survol via `motion.hover` et les états (`hover`) des parties. |
| `accordion`, `tabs`, `toggle`, `timeline`, `alert`, `table`, `iconlist`, `tooltip`, `breadcrumb`, `menu`, `toc`, `social`, `sharebuttons`, `pricing`, `testimonial`, `rating`, `pricelist` | Complet | Parité « Complet » (ex. `EL-W048` pricelist). Ouverture d'accordéon : transition CSS `landing.css:591` (`kw-fade-in`). Pas d'animation de hauteur lissée ni de contrôle de durée (non trouvé). |
| `counter` | Fonctionnel mais incomplet (animation) | Anime de 0 à la valeur à l'arrivée à l'écran (`_node.ejs:196-197`, `landing.js:308-325`) ; durée 0-5000 ms ; séparateurs, préfixe/suffixe, décimales (0-2). Manque : délai, courbe, valeur de départ, lecture au clic/survol, rejouer, texte avant le chiffre (« titre ») distinct du libellé. Canevas : valeur finale. |
| `progress` | Fonctionnel mais incomplet | Une barre unique, `animate` booléen (`_node.ejs:100`, `landing.css:705-706`). Manque : durée/courbe réglables, rayures/animation continue, étiquette flottante, plusieurs paliers. |
| `readingprogress` (≈ Progress Tracker) | Fonctionnel (partiel) | Barre ou anneau suivant le défilement de la page (`landing.js:387-395`). Parité « Complet » (`EL-W043`). Ne suit pas un conteneur ni des étapes. |
| `countdown` | Complet | Date fixe ou minuteur par visiteur, action à la fin, unités masquables (`_node.ejs:176-177`, `landing.js:397-430`). Pas de flip-animation des chiffres. |
| `animatedheading` | Fonctionnel mais incomplet | Mots qui alternent : « fondu » ou « machine à écrire » ; 2 à 8 mots ; intervalle 1500-6000 ms (`nodes.js:811-817`, `landing.js:361-372`). Manque : surlignage animé (cercle, soulignement, X…), effets par lettre (glissement, flou, rotation), durée de tenue, boucle finie, pause, curseur clignotant ; n'est pas rejoué dans le canevas ; `setInterval` non suspendu hors écran. |
| `flipbox` | Fonctionnel mais incomplet | Retournement au survol/focus/toucher, effet `flip` ou `fade` (`_node.ejs:133-137`). Manque : sens (vertical/horizontal/diagonal), durée/courbe réglables, retournement 3D de profondeur. |
| `hotspot` | Fonctionnel mais incomplet | Points cliquables ouvrant une note, accessibles (`landing.js:354-357`). Manque : pulsation du point, déclenchement au survol, infobulle animée, positions par écran (non trouvé). |
| `lottie` | Fonctionnel ; **visuel seulement dans le canevas** | Lecture réelle en public (viewport/load/hover/click, boucle, vitesse) ; canevas = encadré de substitution (`widgets/lottie.ejs:2`). Fichier `.json` seulement (pas de `.lottie`) ; lien et non téléversement ; pas de lecture liée au défilement, pas d'images de début/fin, pas de lien avec un autre élément. |
| `marquee` | Fonctionnel mais incomplet | Bande de **textes** (12 au plus, vitesse 3 niveaux, sens, séparateur, pause) en CSS pur (`widgets/marquee.js`). Manque : images/logos, vitesse libre en px/s, pas de variante verticale. |
| `textpath` | Fonctionnel ; réglages de boîte sans effet | Parties : « racine seule — propriétés CSS de boîte sans effet sur les sous-éléments SVG » (`KOLAKISA_WIDGET_COVERAGE.md`). Pas d'animation du texte le long du tracé. |
| `beforeafter` | Complet (statique) | Curseur `range` natif (`landing.js:587`) ; pas d'animation d'entrée du curseur ni de balayage automatique. |
| `carousel`, `slides`, `testimonialcarousel`, `mediacarousel` | Fonctionnel mais incomplet | Un seul moteur : défilement natif scroll-snap, flèches, points, boucle, lecture auto avec pause (`landing.js:53-110`). Manque : effets de transition (fondu, cube, coverflow), plusieurs éléments visibles par écran, vitesse de transition, arrêt ciblé au survol réglable, miniatures. `slides` a le zoom lent Ken Burns (`carrousels.js`, `landing.css:1177-1181`). `carousel` : hachage « erreur seulement ». |
| `cta` | Fonctionnel mais incomplet (animation) | Carte image + texte + bouton + bandeau (`widgets/cta.js`) ; pas d'animations de survol propres à la carte (survol générique `motion.hover` + états). |
| `modal` | Complet | Entrées/sorties `none/fade/zoom/slide-up/slide-down` (`nodes.js:1585`), déclencheurs automatiques, règles d'affichage. |
| `profilecard`, `readmore`, `linkinbio`, `floatingbutton`, `facebookbutton`, `facebookembed`, `smartlink`, `videoplaylist`, `stripebutton`, `paypalbutton`, `sidebar` | Complet | Gabarits `widgets/*.ejs`, parties déclarées ; tests `widgets-nouveaux*`, `widgets-paiement-barre-laterale-navigateur`. `stripebutton`/`paypalbutton` dépendent d'un service tiers (champ `dependencies`). |
| `posts`, `courselist`, `course`, `addtocart`, `courserating`, `search`, `account`, `sitelogo`, `sitetitle`, `catfilter`, `postcontent`, `menuanchor` | Complet | Données réelles (blog, formations, avis) ; `menuanchor` n'a volontairement aucun rendu public visible (ancre invisible, `KOLAKISA_WIDGET_COVERAGE.md`). Le nom d'ancre est obligatoire (`nodes.js:1795`). |
| `signupform` | Complet | Formulaire du module Formulaires ; hachage « erreur seulement ». |
| `querylist`, `postmeta`, `postterms`, `postnav`, `authorbox`, `archiveinfo`, `postcomments`, `cmsmenu`, `minicart`, `sitemap`, `cart`, `shopgrid`, `shopbuy`, `shopcart`, `shopsearch`, `shopfilters` | Complet (selon les tests) | Widgets de site / boutique ; parité boutique « Partiel » sur certains points (`EL-WC*`, hors périmètre animation). Boucles avec « Voir plus » / défilement infini (`landing.js:432-463`). |

Les cas **« non modifiable correctement »** et **« non rendu correctement en public »** n'ont pas pu être démontrés ici : la seule limite documentée est celle de `textpath` ci-dessus. À confirmer par les tests navigateur (non lancés).

## 8. Widgets et effets animables : absents ou incomplets, face à la liste Elementor de référence

Vérifié dans le code ; « Existe » ne veut pas dire « identique à Elementor ».

| Référence Elementor | Équivalent KOLAKISA | Verdict | Détail et preuve |
|---|---|---|---|
| Animated Headline | `animatedheading` | **Incomplet** | Seulement rotation de mots (fondu / machine à écrire). Pas de texte surligné animé (cercle, courbe, soulignement, barré), pas d'animation par lettre. |
| Counter | `counter` | Existe, **incomplet** | Voir tableau 7. |
| Progress Bar | `progress` | Existe, **incomplet** | Une barre, animée à l'arrivée à l'écran. |
| Progress Tracker | `readingprogress` | **Incomplet** | Page entière uniquement ; formes barre/anneau. |
| Lottie | `lottie` | Existe, **incomplet** | Voir tableau 7. |
| Icon / Icon Box / Icon List avec hover | `icon`, `iconbox`, `iconlist` | Existe ; **animation de survol générique seulement** | `motion.hover` (16 effets CSS) s'applique à tout nœud (`_node.ejs:9`) ; états hover/focus par partie ; pas de réglage « animation de l'icône seule » ni de changement d'icône au survol (non trouvé). |
| Image Carousel | `carousel` | Existe, **incomplet** | Pas d'effets de transition, un seul élément visible par défaut. |
| Testimonial Carousel | `testimonialcarousel` | Existe, **incomplet** | Même moteur. |
| Reviews | `testimonial`, `rating`, `courserating` | **Absent comme widget « Reviews »** | Pas de widget d'avis multiples (liste/carrousel d'avis avec étoiles, avatar, date, source) ; `EL-LY028` de la matrice : « Partiel — pas de mise en forme avis avec étoiles synchronisée ». |
| Media Carousel | `mediacarousel` | Existe, **incomplet** | Images + vidéos YouTube/Vimeo ; mêmes limites. |
| Slides | `slides` | Existe, **incomplet** | Ken Burns oui ; effet de transition entre diapositives non. |
| Hotspot | `hotspot` | Existe, **incomplet** | Voir tableau 7. |
| Nested Carousel | Conteneur en mode « carrousel » | Existe, **incomplet** | `_node.ejs:45` (`data-kw-carousel`, points, autoplay, boucle) ; mêmes limites. |
| Flip Box | `flipbox` | Existe, **incomplet** | Voir tableau 7. |
| Call to Action | `cta` | Existe | Bandeau, habillages classique/couverture ; pas d'animation propre. |
| Countdown | `countdown` | **Complet** | Date fixe, minuteur par visiteur, action à la fin. |
| Tabs / Accordion / Toggle | `tabs`, `accordion`, `toggle` + conteneur en mode onglets/accordéon | **Complet** | Versions simples et imbriquées. Pas de réglage d'animation d'ouverture (durée/type). |
| Marquee / texte défilant | `marquee` | Existe, **incomplet** | Texte seulement. |
| Typewriter | `animatedheading` effet `type` | **Incomplet** | Remplace un mot par un autre en l'écrivant ; ce n'est pas une machine à écrire sur un texte libre, sans curseur clignotant, sans effacement. |
| Before / After | `beforeafter` | **Complet** | Pas de balayage automatique. |
| Price Table / Price List | `pricing`, `pricelist` | **Complet** | Pas d'animation propre. |
| Social icons | `social`, `sharebuttons` | Existe | Survol via états de partie et `motion.hover`. |
| Text Path | `textpath` | Existe | Pas d'animation le long du tracé. |
| Effet d'entrée | `motion.entrance` (63) | **Complet** | `motion.js` ; durée, délai, courbe, répétition, direction, déclencheur, par écran. |
| Effet de survol | `motion.hover` (16) + états + `cssHover` | **Complet pour le survol d'élément** | Pas de réglage de durée/courbe de la transition de survol pour les 16 effets (non trouvé ; durée des états via `transitionDuration` dans les effets de partie). |
| Effet au clic | `motion.trigger: click` + `interactions` (action « Rejouer l'animation ») | **Existe** | `landing.js:130-134`, `336`. |
| Défilement / parallaxe | `scroll`, `scrollFx` ; fond `fixed` | **Complet pour les éléments** ; **parallaxe d'arrière-plan** : seulement `background-attachment: fixed` (`nodes.js:1249`) | Pas de décalage de fond indépendant de l'élément ; `fixed` est ignoré sur certains navigateurs mobiles (à vérifier). |
| Souris / inclinaison | `mouse`, `mouseFx` | **Complet** | Suivi du curseur, inclinaison 3D. |
| Sticky | `position: sticky` par écran ; `headerFx` | **Existe** | Pas de « rester dans la colonne » ni « apparaître au défilement vers le haut » (`EL-NV014`, `EL-ST011`). |
| Animation de sortie | animations `out` du registre | **Existe** | Jouées seulement par un déclencheur (clic/survol) ; pas de sortie automatique au défilement. |
| Transformation (flip horizontal/vertical) | — | **Absent** | `EL-ST019` : échelle négative refusée (minimum 0,1). |
| Texte animé par lettre / mot (split text) | — | **Absent** | Aucun découpage de texte en spans dans les gabarits. |
| Défilement de texte lié à la page (scrub), `scroll-timeline`, animations liées à une vue | — | **Absent** | Le moteur est JS + `requestAnimationFrame`. |
| Animations « loop » indépendantes (flottement continu, pulsation permanente) | partiellement : animations `attn` avec `iterations: infinite` | **Existe** | `motion.js` kind `attn`. |

## 9. Risques de régression, contraintes multi-sites, points d'extension

### 9.1 Risques de régression

1. **Filet de hachage** : ajouter un type de widget fait échouer `widgets-parts-regression` (« types du registre différents de la référence ») tant que la fixture n'est pas régénérée en connaissance de cause ; `widgets-parts-couverture` exige des parties ou une justification `ROOT_ONLY` ; `nodes.js:1093` exige une fiche `WIDGETS`. Procédure déjà documentée dans `KOLAKISA_WIDGET_COVERAGE.md` (« Intégrer un nouveau widget »).
2. **Angle mort** : 15 types n'ont qu'un hachage d'erreur (section 6).
3. **Rétro-compatibilité des identifiants** : les pages enregistrées stockent les identifiants d'animation (`fade`, `slide-up`, `zoom`… 10 historiques ; `motion.js:12-21`) — ne jamais renommer ni supprimer.
4. **Pas de migration de schéma globale** : une modification de `normalizeMotion` qui **rejette** une valeur ancienne casse l'enregistrement du brouillon entier (la validation est stricte : l'erreur s'affiche et l'aperçu ne se met plus à jour, `page-builder.js:5451-5456`). Toujours *ignorer* silencieusement ou migrer, jamais refuser.
5. **Rechargement du canevas** : tout attribut `data-kw-*` ajouté force l'iframe à se recharger (regex `INTERACTIVE`, `page-builder.js:5340`) ; un nouveau mécanisme d'attribut n'aggrave pas le cas s'il reste dans `data-kw-`, mais ajoute des rechargements.
6. **Ordre de cascade CSS** : animation d'entrée / survol / défilement / souris se composent via `--kw-tf` et les propriétés indépendantes (`MOTION-ENGINE.md`) ; un nouvel effet qui écrit `transform` directement casserait cette composition.
7. **Historique local** : l'instantané JSON complet est pris à chaque modification (limite 150 étapes, 2 Mo en `localStorage`) ; des données d'animation volumineuses (par exemple un JSON Lottie intégré) accéléreraient la saturation.
8. **`landing.js` monolithique** (597 lignes) : une erreur JavaScript non rattrapée dans un bloc peut empêcher les blocs suivants (exécutés dans le même IIFE) ; non testé en isolation.

### 9.2 Contraintes multi-sites (isolation par site)

- Toute lecture / écriture de page filtre sur `organization_id` (96 occurrences d'`organization_id`/`site_id` dans `src/marketing/pages/index.js`) ; `saveDraft` met `organization_id` dans le `WHERE` (ligne 162). Les pages portent un `site_id` ; les médias sont rangés dans `/uploads/marketing/<organisation>/site-<id>/…` (motif accepté pour vidéos/audios, `nodes.js:15-17`).
- Les réglages de site (`mk_sites.settings`, `tokens`) sont versionnés par `settings_revision` (`index.js:547-581`) ; les classes globales (`normalizeClassDefs`, `nodes.js:1961`) sont **par site**.
- **Conséquence pour l'animation** : un préréglage d'animation partagé doit être stocké dans les réglages du site (comme `lightbox`, `siteSettings.js:23`) ou dans une classe globale, **jamais** dans un fichier ou une table globale. Un fichier Lottie téléversé doit passer par la médiathèque de l'organisation/du site (non vérifié que `.json` y soit accepté), pas par un dossier partagé `public/`.
- Les sites diffusent leurs propres domaines ; les scripts sont servis avec `asset()` (versionnés) ; aucun état d'animation n'est conservé côté serveur — compteur « minuteur par visiteur » et fenêtres utilisent `localStorage` / `sessionStorage` du visiteur, par site (clé incluant l'identifiant du nœud).

### 9.3 Points d'extension recommandés

| Besoin | Où brancher | Pourquoi |
|---|---|---|
| **Nouveau widget** (ex. avis multiples, marquee d'images, surligneur animé) | Un fichier `src/marketing/pages/widgets/<type>.js` + gabarit `views/marketing-public/widgets/<type>.ejs` + entrée `PARTS` dans `parts.js` + CSS dans `landing.css` + régénération de la fixture + test | Chemin déjà outillé (`check` impose schéma valide, version, migrations, gabarit présent) ; reprend validation, bibliothèque, inspecteur, historique, brouillon et parité canevas/public sans toucher à `nodes.js`. Limite : champs `text, textarea, number, select, bool, link, image, icon, color, items` ; pas de liste imbriquée ; 24 éléments au plus. |
| **Nouvelle animation d'entrée / sortie / attention** | Une ligne dans `DEFS` de `motion.js` | Panneau, recherche, aperçu, validation, CSS publié et test Chrome (« chaque animation est exécutée ») la prennent en compte automatiquement. |
| **Nouveau paramètre d'animation par nœud** (durée de survol, courbe de survol, rejouer au retour, décalage en cascade « stagger ») | `motion` dans `nodes.js` : `normalizeMotion` (validation, bornes) → `entranceRules`/`motionAttrs` (rendu) → section du panneau dans `page-builder-effects.js` (`motionPanel`) → exécution dans `landing.js` ou `kw-effects.js` | C'est **le** schéma commun. Un champ optionnel absent du JSON = zéro changement pour les pages et les hachages existants. |
| **Animation interne d'un widget** (compteur : délai/courbe ; titre animé : effets ; hotspot : pulsation ; marquee : images) | `props` du widget (schéma du widget personnalisé ou `props()` noyau) + `parts` pour le style | Les réglages qui n'ont de sens que pour ce widget restent dans ses `props` ; ceux qui valent pour tout élément vont dans `motion`. |
| **Effets de texte** (par lettre / mot / ligne) | Nouveau champ `motion.text` validé dans `normalizeMotion` ; découpage au rendu serveur dans `_node.ejs` pour `heading`/`text`/`animatedheading` (spans avec `aria-hidden` + texte complet lisible, comme `animatedheading` le fait déjà : `_node.ejs:131-132`) | Découpage côté serveur = pas de saut à l'affichage ; accessibilité préservée par le modèle `sr-only` existant. |
| **Préréglages d'animation réutilisables** (« Apparition douce de titre ») | Classes globales du site (`classCss`) ou réglages de site | Isolation par site, mise à jour en un seul endroit ; le style de l'élément l'emporte déjà sur la classe. |
| **Réglage global « mouvement réduit »** / « désactiver les animations sur ce site » | `siteSettings.js` (comme `extras.smoothScroll` ligne 258) + attribut sur `<body>` lu par `landing.js` / `kw-effects.js` | Un seul endroit pour la politique d'accessibilité du site. |
| **Nouveau comportement JavaScript public** | Un petit fichier chargé conditionnellement comme `kw-effects.js` (`landing.ejs:44`, démarrage automatique si le DOM contient son attribut) plutôt qu'un nouveau bloc dans `landing.js` | Évite d'alourdir le monolithe ; même garde `data-kw-builder` et `prefers-reduced-motion`. |
| **Parité canevas** | Réutiliser `playPreview` (`page-builder-effects.js:255`) pour un bouton « Rejouer » par élément ; pour Lottie, aperçu de la première image dans le gabarit en mode `isBuilder` | Évite de faire tourner les scripts de page dans l'éditeur. |

### 9.4 Règles à garder pour toute évolution

- Valeurs bornées et listes fermées ; jamais de CSS libre ni de nom d'animation saisi (principe affiché en tête de `motion.js`).
- Tout nouveau mouvement : `transform`/`opacity` seulement, composés avec `--kw-tf`.
- Tout nouveau mouvement : désactivé ou réduit par `prefers-reduced-motion`, inactif dans le canevas (`data-kw-builder`), et masqué **seulement** après que le script a posé sa classe d'amorçage (jamais de contenu caché sans JavaScript).
- Interface en français simple, tokens de couleur (`CLAUDE.md`, `docs/KOLAKISA_DESIGN_CHARTE.md`).
- Aucun contenu de démonstration présenté comme réel : les contenus de départ sont entre crochets (`[Prénom N.]`, `PALETTE`, `nodes.js:1172-1173`).

## 10. Résumé

- **102 widgets** (67 noyau + 35 personnalisés), 8 rubriques, 8 groupes de palette ; 83 ont des parties stylables, 19 une racine seule justifiée. Le document `KOLAKISA_WIDGET_COVERAGE.md` (92/74/18) est périmé.
- **Éditeur** : un seul rendu serveur pour le canevas et le public ; inspecteur piloté par le registre ; brouillon + publication + versions + historique local de 150 étapes ; responsive à 4 écrans (bureau, grand écran, tablette, mobile).
- **Moteur d'animation : déjà complet et centralisé** (`motion.js` : 63 animations ; `node.motion` : entrée, déclencheurs, survol ×16, défilement, de → à, souris/inclinaison, épinglage ; `landing.js` + `kw-effects.js`). `prefers-reduced-motion` respecté partout, par défaut. Aucune bibliothèque externe sauf lottie-web light (168 Ko, locale).
- **Canevas vs public** : même HTML, mais le mouvement ne tourne pas dans le canevas (aperçu à la demande) ; Lottie y est un encadré de substitution.
- **Manques animables** : titre animé limité aux mots alternés, compteur/barre de progression sans courbe ni délai, carrousels sans effets de transition ni plusieurs éléments visibles, marquee limité au texte, hotspot sans pulsation, pas de widget « Reviews », pas de texte animé par lettre, pas de retournement de transformation, pas de parallaxe de fond autre que `fixed`.
- **Risques** : fixture à régénérer à chaque nouveau type, 15 types avec protection seulement d'erreur, rechargement complet du canevas pour tout attribut `data-kw-*`, `setInterval` non suspendus hors écran, validation stricte qui refuse l'enregistrement.
- **Recommandations d'architecture** : conserver `node.motion` comme schéma unique (nouveaux champs optionnels dans `normalizeMotion` → rendu `motionAttrs`/`entranceRules` → panneau `page-builder-effects.js` → exécution) ; les animations propres à un widget dans ses `props` ; les nouveaux widgets via `widgets/*.js` + `.ejs` + `parts.js` ; les préréglages dans les classes globales ou les réglages du site (isolation par site) ; un fichier JS public séparé et conditionnel pour tout nouveau comportement ; ne jamais renommer un identifiant existant ni rejeter une ancienne valeur.
