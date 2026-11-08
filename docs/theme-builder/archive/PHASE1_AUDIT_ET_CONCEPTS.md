# Archives — Phase 1 : recherche, audit, 100 concepts et plan (8 novembre 2026)

> **Document d'audit, écrit AVANT la réalisation.** Ce qui a été réalisé ensuite (et ce qui ne l'a pas été) est décrit dans `ARCHIVE_LIBRARY.md`. Les colonnes « Faisab. » du tableau (A/B) sont l'estimation d'avant travail : voir `ARCHIVE_LIBRARY.md` § 6 pour les compositions réellement construites.

**Aucun code du projet n'a été modifié.** Ce document est un brouillon de travail, à placer dans `docs/theme-builder/archive/` après votre accord. Les chiffres du § 5 ont été produits par le script `check.js` (exécuté), les constats du code ont été lus sur `origin/main` (commit bda1d5d2).

## 1. Recherche de références — ce qui a réellement été lu
Limites : les pages d'aide Elementor (loop-grid, archive-posts, taxonomy-filter) ont répondu en erreur 500 ; la documentation Blocksy a répondu 403 ; **aucune démo ThemeForest, TemplateMonster ou Creative Market n'a pu être ouverte**. Je ne peux donc pas affirmer avoir « observé » ces démos.

| Source | Statut | Ce qu'on en retient |
|---|---|---|
| developers.elementor.com (3.17), elementor.com/blog (3.17, 3.21) | **Lu en entier** | Pagination AJAX avec adresse partageable par page ; défilement automatique en haut de grille ; pagination indépendante par liste ; Taxonomy Query (catégories/étiquettes comme éléments de boucle) |
| docs.ghost.org (routage) | **Lu** | Archives automatiques /tag/ et /author/, flux RSS par archive, collections paginées, pas de lien vers une archive désactivée |
| Pages d'aide Elementor (Loop Grid, Paginate, Taxonomy Filter, Archive Posts) | **Extraits de recherche seulement** | Loop Grid : pagination Numéros / Précédent-Suivant / Les deux / Charger au clic / Défilement infini ; Taxonomy Filter : seulement dans une Loop Grid, **ne gère pas « requête courante » donc inutilisable seul sur une vraie archive**, sélection multiple ET/OU depuis 3.18 |
| Soledad, Jannah, Newspaper, Divi (masonry), Divi Machine | **Fiches de tiers** (pas les démos) | Grilles 2/3/4 colonnes, masonry, sliders, filtres par catégorie, « charger plus » et défilement infini, mises en page d'archive modifiables |
| Elementor Archive Title / Description / Author Box / Breadcrumbs | **Non vérifié** (équivalents tiers seulement) | Ne pas affirmer qu'ils sont natifs d'Elementor |

**Compositions récurrentes retenues** (liste de travail, issue des fiches et de la connaissance générale du marché, **non revérifiée visuellement**) : grille 2/3/4 colonnes, masonry, liste à vignette, liste texte, une + brèves, héros + grille, mosaïque, index daté, frise par année, héros de catégorie avec sous-catégories, héros d'étiquette, page d'auteur, sections par rubrique, barre de filtres collante, sidebar + liste, index minimaliste. Détails de finition (ratio d'image constant, survol léger, un seul accent, compteur de résultats, état vide utile) : **recommandations de ma connaissance générale, non sourcées**.
**Pour une preuve plus solide** : relancer la recherche avec un outil de navigation sur les démos Soledad, Jannah, Newspaper (avant la Phase 2). À décider avec vous.

## 2. Audit de l'existant (code lu, rien exécuté en navigateur)
**Constat majeur : la catégorie Archive a déjà été refaite** (commit 03a98517, fusionnée dans main) : 100 modèles = **10 contenus × 10 compositions**, remplaçant l'ancien 20 × 5. Fichier : `src/themeBuilder/catalog/archive.js` (90 lignes), documenté dans `docs/theme-builder/kolakisa-archives-library.md`, testé par `tests/theme-builder-archives-bibliotheque.test.js`.

Ce qui fonctionne déjà (et qu'il ne faut pas refaire) :
- **Stockage par site** : `mk_tb_templates`, chaque requête filtre `organization_id` ET `site_id` (`store.js`). Copie indépendante à l'insertion (« Utiliser ce modèle »).
- **Règles d'affichage** (`conditions.js`, `match.js`, `resolve.js`) : archives « toutes / blog / catégorie / étiquette / auteur / date / recherche », sous-catégories, plus précis gagne, détection de doublons de conditions, un seul modèle par page.
- **Rendu** : `routes/blog.js renderList` → `themeRender.renderRegion` ; familles `author_archive`, `category_archive`, `tag_archive`, repli `blog_archive`. Terme inexistant = vraie 404.
- **Moteur de requêtes commun** (`marketing/pages/query.js`) : sources articles, formations, produits, pages, auteurs, catégories, étiquettes ; tris (date, modification, titre, auteur, vues, commentaires, aléatoire) ; filtres date/année/mois, recherche ; **pagination « numéros », « précédent/suivant », « les deux », « charger plus » et « défilement infini »** (le script `public/js/landing.js` gère déjà le mode infini).
- Composants : `archiveinfo`, boucle (`loop`, `urlFilter`, `archive:true`), `catfilter`, `querylist`, `authorbox`, `search`, `postnav`, boutons, séparateurs.

**Écarts avec votre demande (à traiter) :**
| # | Écart | Gravité |
|---|---|---|
| 1 | **Identité graphique : 100 modèles sur 100 dépendent du site** (1 155 couleurs en `token:*`, 661 polices « site », 0 police de bibliothèque ; mesure de l'autre session). Un site neuf a la charte Kolakisa (bleu `#0277b6`, marine `#0b2a40`) : tout modèle d'archive prend cet aspect. En-têtes et pieds de page ont déjà résolu cela avec des identités à valeurs fixes (`catalog/identities.js`, 200 modèles, 0 jeton). | **Critique** |
| 2 | Aucun mode « suivre / indépendant / hybride » ; aucun champ d'identité dans le modèle ; la copie « Utiliser » fige le choix. | **Critique** |
| 3 | Les feuilles de thème (« packs ») n'utilisent pas `@layer` : une règle `body[data-kw-pack] a {…}` peut passer devant les styles d'un modèle (à mesurer pack par pack). | Élevée |
| 4 | Diversité réelle limitée : 10 × 10 = deux axes croisés avec la même fabrique de fiche (`item`) ; 52 structures sur 100 selon la doc. Vous demandez de vraies compositions (mosaïque, frise, tableau, pleine largeur…). | Élevée |
| 5 | **Archive par date** : la condition « date » existe, mais la route lit `?date=AAAA-MM` dans `/blog` avec `archive.type = "blog"` (à vérifier par test) : le modèle réservé aux archives de date pourrait ne jamais être choisi. Pas d'adresses `/blog/2026/11`. | Moyenne (à tester) |
| 6 | Pas d'archive de type de contenu ou de taxonomie personnalisés (confirmé par la doc existante) ; seule la boutique a sa catégorie. | Limite du moteur |
| 7 | Pas d'image de catégorie dans les données ; pas de tri choisi par le visiteur (ordre fixe) ; les filtres ne se combinent pas. | Limite du moteur |
| 8 | Compositions « Article en grand » et « Une et brèves » : seule la liste du bas se pagine. | Faible |
| 9 | Briques absentes pour certains concepts : mosaïque, frise, tableau, mur de fiches, regroupement par mois/année, bandes défilantes, colonne fixe, image en fond de carte (33 concepts, § 4). À confirmer en Phase 2 contre `nodes.js`. | Élevée |
| 10 | Constats d'environnement : le dossier local `koyekola` est en retard de 215 commits (lecture faite sur `origin/main`) ; la PR n° 5 est « fermée » (remplacée par le commit 03a98517). | Info |

## 3. Architecture graphique indépendante proposée (à faire en Phase 2, rien n'est fait)
Reprendre ce que l'autre session a déjà analysé pour « Page individuelle » (`docs/theme-builder/single-page/`) et **ne pas créer deux mécanismes**.
- **Mode indépendant (défaut)** : couleurs en valeurs fixes + polices `font.<id>` de la bibliothèque locale (mécanisme éprouvé des en-têtes/pieds). Chaque modèle porte sa propre identité.
- **Mode hérité** : conversion volontaire des valeurs en `token:*`.
- **Mode hybride** : identité propre ; seuls logo, nom et coordonnées viennent du site.
- **Persistance** : champ « identité » et « mode » dans le document du modèle ; l'identité d'origine est mémorisée pour que le passage d'un mode à l'autre ne détruise rien.
- **Priorité (de la plus forte à la plus faible)** : valeur posée par l'utilisateur sur un élément > identité du modèle (mode indépendant) > jetons du site (mode hérité) > défauts du moteur ; packs de thème et CSS du site placés dans une couche `@layer` inférieure, sans `!important`.
- **Risque** : un modèle indépendant peut jurer avec l'en-tête du site (voulu et choisi) ; aperçu avec en-tête/pied du site.

## 4. Cent concepts
Chaque concept est décrit par 7 axes structurels (composition, colonnes, image, barre latérale, en-tête, navigation, filtre) + palette (fond / encre / accent, **valeurs fixes**) + paire de polices (à vérifier dans la bibliothèque locale en Phase 2). Colonne « Faisab. » : **A** = faisable avec les briques actuelles ; **B** = demande une brique à ajouter.

| N° | Nom | Famille | Usage | Composition | Col. | Image | Barre | En-tête | Navigation | Filtre | Particularité | Palette fond / encre / accent | Polices | Faisab. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Une du matin | Magazine premium | magazine généraliste | Héros + grille | 3 | haut 16:9 | aucune | bandeau | numéros | rubriques | premier article plein cadre + grille | #faf7f2 / #14110f / #b3122a | Playfair Display + Inter | A |
| 2 | Couverture | Magazine premium | magazine culturel | Trois vedettes | 3 | haut 4:5 | aucune | centré | charger plus | aucun | trois couvertures verticales puis liste | #ffffff / #111111 / #e4572e | Fraunces + Work Sans | A |
| 3 | Rubriques en colonnes | Magazine premium | magazine d'actualité | Sections par rubrique | 4 | gauche carré | droite | éditorial | numéros | rubriques | à la une, plus lus, tous les articles | #f5f5f0 / #1d1d1b / #005f73 | Libre Caslon + Source Sans | B: boucle par rubrique |
| 4 | Grand format | Magazine premium | magazine d'images | Pleine largeur immersive | 1 | plein écran | aucune | minimal | défilement infini | aucun | une image par écran, titre superposé | #0c0c0c / #f4f1ea / #d9a441 | Cormorant + Jost | B: image en fond |
| 5 | Quotidien | Journal numérique | journal en ligne | Colonnes de journal | 3 | aucune | aucune | bandeau | numéros | rubriques | colonnes filetées, titre massif | #fdfcf8 / #161616 / #a4161a | Old Standard TT + Public Sans | A |
| 6 | Dernière heure | Journal numérique | fil d'actualité | Frise verticale | 1 | aucune | aucune | minimal | charger plus | rubriques | frise verticale datée | #ffffff / #0f172a / #dc2626 | IBM Plex Sans + IBM Plex Mono | B: frise |
| 7 | Page de une | Journal numérique | portail d'information | Une + brèves | 2 | haut 16:9 | droite | éditorial | numéros | rubriques + recherche | une + brèves + colonne les plus lus | #f7f7f7 / #202020 / #0b5fff | Merriweather + Roboto | A |
| 8 | Édition du soir | Journal numérique | newsletter archivée | Groupé par mois/année | 1 | aucune | aucune | centré | numéros | aucun | index daté, dates en marge | #f1ece1 / #2a2118 / #7a4e2d | Spectral + Karla | B: regroupement par mois |
| 9 | Carnet | Blog minimaliste | blog personnel | Liste texte seul | 1 | aucune | aucune | minimal | préc./suiv. | aucun | titres seuls, date en marge | #ffffff / #222222 / #222222 | EB Garamond + Inter | A |
| 10 | Marge | Blog minimaliste | blog d'écrivain | Index daté | 1 | aucune | aucune | centré | numéros | étiquettes | index daté étroit 640 px | #fbfaf7 / #2b2b2b / #8a5a44 | Newsreader + Newsreader | A |
| 11 | Cahier | Blog minimaliste | notes courtes | Liste texte seul | 1 | aucune | gauche | minimal | défilement infini | étiquettes | colonne de rubriques à gauche | #f8f8f6 / #1c1c1c / #2d6a4f | Lora + DM Sans | A |
| 12 | Silence | Blog minimaliste | blog photo sobre | Pile de fiches | 1 | pleine largeur | aucune | minimal | défilement infini | aucun | pile d'images, légende discrète | #ffffff / #111111 / #111111 | Instrument Serif + Inter | A |
| 13 | Ressources | Blog professionnel | blog d'entreprise | Grille | 3 | haut 3:2 | aucune | bandeau | numéros | rubriques + recherche | grille nette, filtres en haut | #ffffff / #0f1f3d / #2563eb | Manrope + Inter | A |
| 14 | Expert | Blog professionnel | cabinet conseil | Liste image à gauche | 1 | gauche carré | droite | éditorial | numéros | rubriques | liste + encadré contact | #f4f6fa / #14213d / #e09f3e | Source Serif + Source Sans | A |
| 15 | Étude de cas | Blog professionnel | agence | Zigzag | 1 | alternée gauche/droite | aucune | centré | charger plus | rubriques | grandes vignettes, filets entre les lignes | #fffdf9 / #1e1e1e / #ff6b35 | DM Serif Display + DM Sans | A |
| 16 | Centre d'aide | Blog professionnel | base de connaissances | Tableau | 1 | aucune | gauche | bandeau | numéros | rubriques + recherche | tableau titre/rubrique/date | #ffffff / #17202a / #0ea5a4 | Inter + Inter | B: tableau |
| 17 | Terminal | Technologie | blog de développeurs | Liste texte seul | 1 | aucune | haut (filtres) | minimal | numéros | étiquettes | style console, étiquettes en pastilles | #0b0f14 / #d6e2f0 / #39ff88 | JetBrains Mono + Inter | A |
| 18 | Lancement | Technologie | actualité produit | Grille | 3 | haut 16:9 | aucune | bandeau | charger plus | rubriques | cartes à bordure lumineuse | #0a0b1e / #eef0ff / #7c5cff | Space Grotesk + Inter | A |
| 19 | Changelog | Technologie | journal de versions | Frise verticale | 1 | aucune | gauche | minimal | numéros | recherche | frise verticale datée | #ffffff / #0b1220 / #6d28d9 | Geist + Geist Mono | B: frise |
| 20 | Laboratoire | Technologie | veille techno | Mosaïque | 4 | mixte | aucune | centré | défilement infini | étiquettes | mosaïque de tailles mixtes | #111827 / #f9fafb / #22d3ee | Sora + Inter | B: mosaïque |
| 21 | Chiffres du jour | Économie | magazine économique | Une + brèves | 2 | haut 16:9 | droite | bandeau | numéros | rubriques | colonne de brèves chiffrées | #fff9f0 / #1b1b1b / #d97706 | Libre Franklin + Libre Baskerville | A |
| 22 | Analyse | Économie | revue d'analyses | Liste image à droite | 1 | droite carré | aucune | éditorial | préc./suiv. | rubriques | titres longs, auteur en avant | #f8f5ee / #1f2937 / #9a3412 | Gelasio + Inter | A |
| 23 | Dossier | Économie | dossiers thématiques | Héros + grille | 2 | haut 16:9 | haut (filtres) | bandeau | numéros | rubriques | héros de dossier + sous-dossiers | #ffffff / #0f2a43 / #0f766e | Roboto Slab + Roboto | A |
| 24 | Cours du marché | Économie | veille sectorielle | Classement numéroté | 1 | aucune | droite | minimal | numéros | recherche | classé par nombre de lectures | #f3f4f6 / #111827 / #b91c1c | Barlow Condensed + Barlow | A |
| 25 | Rapport | Finance | rapports annuels | Tableau | 1 | aucune | gauche | bandeau | numéros | rubriques | tableau par année | #ffffff / #0b2545 / #13315c | IBM Plex Serif + IBM Plex Sans | B: tableau |
| 26 | Conseil patrimoine | Finance | banque privée | Liste image à gauche | 1 | gauche portrait | gauche | centré | préc./suiv. | rubriques | teintes sobres, encadré contact | #f5f1e8 / #1b2a1f / #a68a3a | Cormorant Garamond + Lato | A |
| 27 | Bourse | Finance | actualité boursière | Cartes horizontales | 2 | petite vignette | aucune | minimal | charger plus | rubriques + recherche | cartes horizontales denses | #0f172a / #e2e8f0 / #22c55e | Inter Tight + Inter | A |
| 28 | Guide épargne | Finance | pédagogie financière | Grille | 3 | haut 3:2 | aucune | centré | numéros | rubriques | grille douce, pictos de rubrique | #eef7f3 / #12372a / #16a34a | Nunito + Nunito Sans | A |
| 29 | Lookbook | Mode | magazine de mode | Grille | 4 | haut 4:5 | aucune | centré | charger plus | rubriques | grille de portraits, titres fins | #fbf4f1 / #1a1a1a / #b76e79 | Bodoni Moda + Jost | A |
| 30 | Défilé | Mode | actualités de collections | Pleine largeur immersive | 1 | plein écran | aucune | centré | préc./suiv. | rubriques | pleine page, légende en bas | #000000 / #ffffff / #ffffff | Italiana + Montserrat | B: image en fond |
| 31 | Carnet de style | Mode | blog de style | Zigzag | 1 | alternée | aucune | centré | numéros | étiquettes | grandes vignettes, filets entre les lignes | #fff8f5 / #2d1f1f / #c26a5a | Cormorant + Questrial | A |
| 32 | Planche | Mode | moodboard | Mur de fiches | 3 | carrée | aucune | minimal | charger plus | étiquettes | fiches cadrées type polaroïd | #f2e9e1 / #2b2220 / #8b5e3c | Caveat + Poppins | B: mur de fiches |
| 33 | Galerie | Photographie | photographe | Mosaïque | 3 | mixte | aucune | minimal | défilement infini | rubriques | mosaïque sans texte, titre au survol | #0e0e0e / #f2f2f2 / #f2f2f2 | Syne + Inter | B: mosaïque |
| 34 | Série | Photographie | séries photo | Pleine largeur immersive | 1 | plein écran | aucune | centré | préc./suiv. | aucun | une série par écran | #151515 / #eeeeee / #e8c547 | Bebas Neue + Karla | B: image en fond |
| 35 | Contact sheet | Photographie | planche contact | Grille | 4 | carrée | haut (filtres) | minimal | numéros | étiquettes | grille serrée, numéros de vue | #f1f1ef / #111111 / #e11d48 | Space Mono + Inter | A |
| 36 | Reportage | Photographie | photojournalisme | Une + brèves | 2 | haut 3:2 | aucune | bandeau | charger plus | rubriques | une + vignettes, légendes | #fafafa / #0a0a0a / #ff3b30 | Oswald + Source Sans | A |
| 37 | Carnet de route | Voyage | blog de voyage | Héros + grille | 3 | haut 3:2 | aucune | bandeau | charger plus | rubriques | héros destination + cartes | #fff7ec / #2a1b0f / #e07a1f | Pacifico + Lato | A |
| 38 | Destinations | Voyage | guide de destinations | Cartes image en fond | 3 | en fond | haut (filtres) | centré | numéros | rubriques | carte image avec titre superposé | #0e2a3a / #f4f1e8 / #f2a541 | Playfair Display + Mulish | B: image en fond |
| 39 | Escale | Voyage | chroniques de voyage | Liste image à gauche | 1 | gauche large | droite | éditorial | numéros | étiquettes | image large, méta lieu et date | #f4efe6 / #1d2a2f / #3a7d8c | Libre Baskerville + Open Sans | A |
| 40 | Itinéraire | Voyage | récits d'itinéraires | Frise verticale | 1 | petite vignette | gauche | minimal | numéros | recherche | frise verticale datée | #ffffff / #17323d / #00a896 | Fira Sans + Fira Sans | B: frise |
| 41 | Essai | Automobile | essais de véhicules | Liste image à droite | 1 | droite large | droite | bandeau | préc./suiv. | rubriques + recherche | grande photo à droite, fiche note | #101215 / #f1f1f1 / #e63946 | Rajdhani + Roboto | A |
| 42 | Garage | Automobile | actualité auto | Cartes horizontales | 2 | gauche large | droite | minimal | numéros | rubriques + recherche | cartes horizontales, fiche technique | #f3f3f1 / #171717 / #d00000 | Archivo + Archivo | A |
| 43 | Concept car | Automobile | design automobile | Pleine largeur immersive | 1 | plein écran | aucune | centré | défilement infini | aucun | plein écran sombre | #050505 / #fafafa / #00b4d8 | Orbitron + Inter | B: image en fond |
| 44 | Comparatif | Automobile | comparatifs | Tableau | 1 | aucune | haut (filtres) | minimal | numéros | recherche | tableau comparatif titre/date/note | #ffffff / #111827 / #1d4ed8 | Titillium Web + Roboto | B: tableau |
| 45 | Match | Sport | actualité sportive | Une + brèves | 3 | haut 16:9 | droite | bandeau | numéros | rubriques | une + résultats récents | #fefefe / #0b132b / #ff5400 | Anton + Roboto | A |
| 46 | Vestiaire | Sport | blog de club | Grille | 3 | haut 3:2 | aucune | bandeau | charger plus | rubriques | grille énergique, étiquettes vives | #0b132b / #f8f9fa / #fca311 | Barlow Condensed + Barlow | A |
| 47 | Classement | Sport | chroniques de saison | Classement numéroté | 1 | aucune | gauche | bandeau | défilement infini | recherche | classé par nombre de lectures | #f5f7fa / #1a1a2e / #e63946 | Bebas Neue + Inter | A |
| 48 | Entraînement | Sport | conseils d'entraînement | Cartes horizontales | 2 | gauche carré | aucune | centré | numéros | étiquettes | cartes horizontales + niveau | #effaf3 / #102a1a / #2dc653 | Saira + Saira | A |
| 49 | Recettes | Gastronomie | blog culinaire | Grille | 3 | haut 4:3 | aucune | bandeau | numéros | rubriques + recherche | cartes chaudes, temps de lecture | #fff8ef / #3b1f0e / #c2410c | Playfair Display + Nunito | A |
| 50 | Carte du jour | Gastronomie | restaurant | Liste texte seul | 1 | aucune | aucune | centré | préc./suiv. | aucun | style carte de restaurant, filets | #faf3e6 / #2b1d12 / #8c2f1b | Cormorant SC + EB Garamond | A |
| 51 | Halles | Gastronomie | produits de saison | Mosaïque | 3 | mixte | aucune | centré | charger plus | étiquettes | mosaïque colorée | #f6f3e8 / #23361f / #6a994e | Recoleta + DM Sans | B: mosaïque |
| 52 | Chef | Gastronomie | chroniques de chef | Zigzag | 1 | alternée | gauche | éditorial | numéros | rubriques | grandes vignettes, filets entre les lignes | #1a1613 / #f2e8d5 / #d4a373 | Cormorant + Lato | A |
| 53 | Conseils | Santé et bien-être | blog santé | Grille | 3 | haut 3:2 | aucune | bandeau | numéros | rubriques | grille douce arrondie | #f2f8f5 / #173a2e / #2a9d8f | Nunito + Nunito Sans | A |
| 54 | Parcours | Santé et bien-être | programmes | Liste image à gauche | 1 | gauche rond | droite | éditorial | numéros | rubriques | vignettes rondes | #fdf6f0 / #3d2c24 / #e29578 | Lora + Mulish | A |
| 55 | Praticien | Santé et bien-être | cabinet médical | Liste image à droite | 1 | droite carré | droite | éditorial | préc./suiv. | aucun | encadré rendez-vous | #ffffff / #0c3b5c / #0b84a5 | Source Serif + Source Sans | A |
| 56 | Respirer | Santé et bien-être | méditation | Pile de fiches | 1 | large 2:1 | aucune | centré | préc./suiv. | étiquettes | pile espacée, texte centré | #eef2ec / #2f3e34 / #7a9e7e | Cormorant + Quicksand | A |
| 57 | Programme | Culture | agenda culturel | Groupé par mois/année | 1 | gauche carré | gauche | bandeau | numéros | rubriques + recherche | index daté, dates en marge | #fff4e6 / #2b1a0e / #d62828 | Abril Fatface + Work Sans | B: regroupement par mois |
| 58 | Critique | Culture | critiques | Liste image à droite | 1 | droite portrait | droite | éditorial | numéros | rubriques | portraits d'œuvres | #f6f1e9 / #201a14 / #7f1d1d | Libre Caslon + Karla | A |
| 59 | Théâtre | Culture | scène et spectacles | Cartes image en fond | 2 | en fond | aucune | centré | charger plus | rubriques | affiches avec titre superposé | #2a0a12 / #f9e7d2 / #e9b44c | Cinzel + Lato | B: image en fond |
| 60 | Médiathèque | Culture | bibliothèque | Cartes horizontales | 2 | gauche portrait | gauche | bandeau | numéros | rubriques + recherche | fiches type livre | #fafaf5 / #1b2b34 / #386fa4 | Crimson Pro + Inter | A |
| 61 | Atelier | Art | artiste | Mosaïque | 3 | mixte | aucune | minimal | défilement infini | étiquettes | mosaïque d'œuvres | #f4f1ec / #121212 / #ff4d00 | Unbounded + Inter | B: mosaïque |
| 62 | Exposition | Art | galerie d'art | Grille | 2 | haut libre | haut (filtres) | centré | numéros | rubriques | cartes sans bordure, cartels | #ffffff / #0d0d0d / #0d0d0d | Cormorant + Montserrat | A |
| 63 | Manifeste | Art | revue d'art | Typographique géant | 1 | aucune | aucune | centré | numéros | aucun | titres géants typographiques | #e9e4d8 / #0a0a0a / #ff3d00 | Bricolage Grotesque + Space Grotesk | A |
| 64 | Vernissage | Art | événements d'art | Mur de fiches | 3 | carrée | aucune | bandeau | charger plus | rubriques | fiches cadrées type polaroïd | #fdecef / #2c1a2e / #9d4edd | Fraunces + Outfit | B: mur de fiches |
| 65 | Projets | Architecture | agence d'architecture | Grille asymétrique | 3 | haut mixte | aucune | minimal | numéros | rubriques | grille asymétrique 2/1 | #efefec / #131313 / #c1440e | Archivo Narrow + Archivo | A |
| 66 | Plans | Architecture | études techniques | Tableau | 1 | aucune | droite | minimal | numéros | étiquettes | tableau projet/lieu/année | #f7f7f5 / #1a1a1a / #264653 | IBM Plex Mono + IBM Plex Sans | B: tableau |
| 67 | Façade | Architecture | réalisations | Pleine largeur immersive | 1 | plein écran | aucune | bandeau | numéros | étiquettes | une réalisation par écran | #d8d6d0 / #111111 / #111111 | Syncopate + Inter | B: image en fond |
| 68 | Chantier | Architecture | journal de chantier | Frise verticale | 1 | petite vignette | droite | éditorial | numéros | rubriques | frise verticale datée | #ffffff / #2b2d42 / #ef8354 | Barlow + Barlow Semi Condensed | B: frise |
| 69 | Actualités du marché | Immobilier | agence immobilière | Une + brèves | 2 | haut 3:2 | droite | bandeau | numéros | rubriques | une + brèves + contact | #ffffff / #17324d / #d4a017 | Poppins + Open Sans | A |
| 70 | Guide de l'acheteur | Immobilier | conseils | Grille | 2 | haut 16:9 | gauche | centré | charger plus | rubriques | cartes nettes, pictos | #f0f7fa / #14323f / #0e7490 | Outfit + Inter | A |
| 71 | Quartiers | Immobilier | guides de quartiers | Cartes image en fond | 3 | en fond | haut (filtres) | bandeau | charger plus | rubriques | cartes quartier superposées | #12263a / #f5f1e6 / #f4a261 | Lora + Mulish | B: image en fond |
| 72 | Investir | Immobilier | investissement | Liste texte seul | 1 | aucune | gauche | éditorial | numéros | rubriques + recherche | texte seul, rubriques à gauche | #faf8f3 / #1f2a1f / #386641 | Merriweather + Lato | A |
| 73 | Cours | Éducation | école / formation | Grille | 4 | haut 1:1 | haut (filtres) | bandeau | numéros | recherche | grille lumineuse, niveau | #ffffff / #0f3d3a / #f59e0b | Baloo 2 + Nunito | A |
| 74 | Campus | Éducation | vie étudiante | Une + brèves | 2 | haut 16:9 | droite | éditorial | charger plus | rubriques | une + agenda court | #f3f6ff / #1a2a6c / #fb8500 | Poppins + Poppins | A |
| 75 | Leçon du jour | Éducation | pédagogie | Liste image à gauche | 1 | gauche carré | gauche | minimal | numéros | étiquettes | liste claire, niveau et durée | #fffcf0 / #2f3e46 / #52b788 | Atkinson Hyperlegible + Atkinson Hyperlegible | A |
| 76 | Bibliothèque | Éducation | ressources | Cartes horizontales | 2 | gauche petite | aucune | bandeau | numéros | rubriques + recherche | fiches ressources compactes | #f8f9fa / #212529 / #6930c3 | Lexend + Lexend | A |
| 77 | Publication | Science et recherche | laboratoire | Index daté | 1 | aucune | gauche | bandeau | numéros | rubriques + recherche | index daté, auteurs en avant | #ffffff / #0b3954 / #087e8b | Source Serif + Source Sans | A |
| 78 | Revue | Science et recherche | revue scientifique | Colonnes de journal | 2 | aucune | droite | éditorial | numéros | rubriques | deux colonnes denses | #fbfbf8 / #1c1c1c / #9b2226 | STIX Two Text + Inter | A |
| 79 | Découverte | Science et recherche | vulgarisation | Héros + grille | 3 | haut 16:9 | aucune | bandeau | charger plus | rubriques | héros + cartes colorées | #0b1d3a / #f1faee / #ffb703 | Chivo + Chivo | A |
| 80 | Archives ouvertes | Science et recherche | dépôt de travaux | Groupé par mois/année | 1 | aucune | gauche | minimal | numéros | recherche | index daté, dates en marge | #f4f4f2 / #111111 / #264653 | IBM Plex Serif + IBM Plex Mono | B: regroupement par année |
| 81 | Communiqués | Entreprise et marketing | relations presse | Tableau | 1 | aucune | droite | minimal | numéros | recherche | tableau date/titre | #ffffff / #1a1a2e / #16213e | Inter + Inter | B: tableau |
| 82 | Actualités société | Entreprise et marketing | entreprise | Grille | 3 | haut 16:9 | aucune | bandeau | numéros | rubriques | sobre, encadré contact | #f5f7fa / #1b263b / #415a77 | Public Sans + Public Sans | A |
| 83 | Campagne | Entreprise et marketing | agence marketing | Mosaïque | 4 | mixte | aucune | bandeau | défilement infini | rubriques | mosaïque vive | #fff1e6 / #2b2d42 / #ef233c | Syne + DM Sans | B: mosaïque |
| 84 | Témoignages | Entreprise et marketing | preuves clients | Pile de fiches | 1 | pleine largeur | aucune | centré | numéros | aucun | pile de grandes fiches | #eaf4f4 / #073b4c / #06d6a0 | Fraunces + Inter | A |
| 85 | Buzz | Actualités et divertissement | divertissement | Grille | 4 | haut 1:1 | aucune | bandeau | défilement infini | étiquettes | grille dense vive | #fff200 / #111111 / #ff006e | Bowlby One + Rubik | A |
| 86 | Cinéma | Actualités et divertissement | actualité cinéma | Liste image à droite | 1 | gauche portrait | gauche | centré | charger plus | rubriques | affiches portrait | #14080e / #f6e9d7 / #e0a458 | Playfair Display + Raleway | A |
| 87 | Musique | Actualités et divertissement | chroniques musicales | Bandes défilantes | 3 | carrée | aucune | minimal | charger plus | rubriques | bandes défilantes par rubrique | #1b1b3a / #f0e6ff / #ff7bff | Rubik + Inter | B: bandes défilantes |
| 88 | Jeux | Actualités et divertissement | actualité jeux vidéo | Héros + grille | 3 | haut 16:9 | haut (filtres) | bandeau | charger plus | rubriques + recherche | héros + cartes néon | #0d0221 / #eaeaff / #00f5d4 | Press Start 2P + Inter | A |
| 89 | Assemblée | Communauté | association | Une + brèves | 2 | haut 3:2 | droite | éditorial | numéros | rubriques | une + appel à agir | #fffbea / #3b2a08 / #c2410c | Merriweather + Nunito | A |
| 90 | Voisins | Communauté | vie locale | Cartes horizontales | 2 | gauche carré | gauche | bandeau | numéros | rubriques + recherche | fiches chaleureuses | #f1f8f0 / #1f3a1f / #588157 | Nunito + Nunito | A |
| 91 | Témoignage | Communauté | récits de membres | Zigzag | 1 | alternée rond | aucune | centré | charger plus | aucun | grandes vignettes, filets entre les lignes | #fdf0e6 / #3a1f10 / #e76f51 | Lora + Poppins | A |
| 92 | Forum des idées | Communauté | billets de membres | Classement numéroté | 1 | aucune | aucune | centré | charger plus | étiquettes | classé par nombre de lectures | #f4f1fb / #241e3b / #7b2cbf | DM Sans + DM Sans | A |
| 93 | Catalogue | Formations et portfolios | organisme de formation | Grille | 3 | haut 16:9 | haut (filtres) | bandeau | numéros | rubriques + recherche | grille + filtres rubriques/recherche | #ffffff / #0b3c5d / #f2a900 | Montserrat + Open Sans | A |
| 94 | Projets clients | Formations et portfolios | freelance | Grille asymétrique | 3 | haut mixte | aucune | minimal | charger plus | rubriques | grille asymétrique | #f6f4ef / #111111 / #111111 | Space Grotesk + Inter | A |
| 95 | Études de cas | Formations et portfolios | agence | Écran scindé | 1 | droite large | gauche | bandeau | numéros | rubriques | titre fixe à gauche, liste qui défile | #0f0f0f / #f5f5f5 / #c6ff3d | Anton + Inter | B: colonne fixe |
| 96 | Cursus | Formations et portfolios | cursus | Frise verticale | 1 | petite vignette | gauche | minimal | charger plus | rubriques | frise verticale datée | #f0f9ff / #0c4a6e / #0284c7 | Poppins + Inter | B: frise |
| 97 | Affiche | Éditorial expérimental | revue indépendante | Typographique géant | 1 | aucune | aucune | minimal | numéros | aucun | titres démesurés en pleine largeur | #f2ede4 / #0a0a0a / #ff2e00 | Anton + Space Mono | A |
| 98 | Collage | Éditorial expérimental | zine | Mur de fiches | 3 | mixte | aucune | centré | charger plus | étiquettes | fiches cadrées type polaroïd | #ffe8d6 / #1d1d1d / #6a4c93 | Rubik Mono One + Karla | B: mur de fiches |
| 99 | Index vivant | Éditorial expérimental | carnet de recherche | Index daté | 1 | aucune | gauche | minimal | défilement infini | étiquettes | index serré, étiquettes en marge | #0a0a0a / #e8e8e8 / #ffd60a | Space Mono + Space Mono | A |
| 100 | Mur | Éditorial expérimental | mur d'idées | Mur de fiches | 4 | carrée | aucune | bandeau | charger plus | rubriques + recherche | fiches cadrées type polaroïd | #e0f2f1 / #102a2c / #ff7043 | Bricolage Grotesque + Inter | B: mur de fiches |

Fiche complète par modèle (public cible, hiérarchie, métadonnées, widgets, responsive) : à rédiger **au moment de la production de chaque groupe**, pas avant ; le tableau ci-dessus en est le squelette.

## 5. Matrice de diversité (mesurée avec check.js)
- 100 noms uniques, 25 familles de 4 concepts.
- **100 signatures structurelles distinctes** sur les 7 axes (le premier jet en avait 86 ; 12 groupes de doublons ont été corrigés).
- **34 paires ne diffèrent que d'un seul axe** structurel (elles se distinguent par la famille, la palette, les polices et la particularité) : à retravailler avant la production ; 139 paires diffèrent de deux axes ou moins. Je ne prétends donc pas que « tout est parfaitement distinct » : seulement qu'aucun doublon exact n'existe.
- 100 palettes différentes ; 95 accents différents ; 93 paires de polices différentes.
- Compositions : Grille : 14 · Une + brèves : 7 · Cartes horizontales : 6 · Héros + grille : 5 · Pleine largeur immersive : 5 · Frise verticale : 5 · Liste texte seul : 5 · Liste image à gauche : 5 · Tableau : 5 · Mosaïque : 5 · Liste image à droite : 5 · Zigzag : 4 · Mur de fiches : 4 · Groupé par mois/année : 3 · Index daté : 3 · Pile de fiches : 3 · Classement numéroté : 3 · Cartes image en fond : 3 · Colonnes de journal : 2 · Typographique géant : 2 · Grille asymétrique : 2 · Trois vedettes : 1 · Sections par rubrique : 1 · Bandes défilantes : 1 · Écran scindé : 1.
- Barre latérale : aucune : 51 · gauche : 20 · droite : 19 · haut (filtres) : 10. Navigation : numéros : 54 · charger plus : 26 · défilement infini : 11 · préc./suiv. : 9. Filtre : rubriques : 44 · étiquettes : 19 · rubriques + recherche : 16 · aucun : 13 · recherche : 8. Colonnes : 1 : 49 · 3 : 26 · 2 : 17 · 4 : 8.
- Faisabilité : **67 concepts avec les briques actuelles, 33 demandent des briques** (image en fond ×8, frise ×5, tableau ×5, mosaïque ×5, mur de fiches ×4, regroupement par mois/année ×3, boucle par rubrique, bandes défilantes, colonne fixe).

## 6. Plan progressif (aucune étape ne démarre sans votre accord)
1. **Phase 2 — architecture** : identité indépendante (3 modes, priorité, `@layer`), outil de contrôle `scripts/audit-archives.js` (100 exacts, 0 jeton du site en mode indépendant, similarité), test « bleu marine → beige/noir → changement de charte → retour héritage ».
2. **Vérifier d'abord** : tests de l'archive par date, des conditions, de l'état vide, de la pagination « charger plus » (faits en lecture seule, avant de coder).
3. **Phase 3 — un seul modèle complet** (suggestion : « Une du matin » n° 1, faisable avec l'existant) ; test insertion, édition, enregistrement, aperçu, mobile.
4. **Briques manquantes**, une par une, chacune testée : image en fond, mosaïque, tableau, frise, regroupement, mur de fiches…
5. **Phase 4 — production par groupes** de 5 familles (20 modèles) ; chaque groupe testé avant le suivant.
6. **Phase 5 — audit final**.
Remplacement de l'existant : les 100 modèles actuels restent dans le catalogue jusqu'à validation (voie « nouvelle famille de clés »). Les sites qui ont utilisé un modèle ont une **copie indépendante** : jamais touchée. Retour arrière = revenir au commit précédent.

## 7. Stratégie de tests (rien n'a été exécuté en Phase 1)
Bibliothèque (100 exacts, clés uniques, signatures) · archives (général, catégorie, sous-catégorie, étiquette, auteur, date, vide) · données dynamiques · navigation (pagination, charger plus, absence de doublons entre pages, filtres réels, recherche) · identité (scénario bleu marine / beige et noir en 9 étapes de votre mission) · responsive (4 largeurs, aucun débordement) · multisite (deux sites, aucune fuite de styles ou de modèles) · régression (Theme Builder, articles et pages individuels, autres catégories, éditeur). Attention : le serveur de test peut mettre 2 à 10 min à démarrer ; un test connu échoue déjà sur main (bandeau « produits d'exemple »).

## 8. Risques
Contamination par les packs (§ 2-3) · 33 concepts dépendent de nouvelles briques (risque de régression du Page Builder partagé) · sessions parallèles sur le même dépôt (fusionner main avant chaque envoi) · performance (mosaïque, plein écran, défilement infini : limiter images et scripts) · archives de type personnalisé impossibles sans changer le moteur · concepts de la liste voisins (34 paires) à différencier.
