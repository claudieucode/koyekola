# Archives v4 — Phase 1 : recherche, audit, vision et plan (10 novembre 2026)

**Aucun code n'a été modifié.** Rien n'a été supprimé ni remplacé. Ce document se termine par les décisions qu'il me faut avant la Phase 2.

## 0. Où on en est (à lire en premier)
- Une première reconstruction existe déjà : **PR #40** (branche `catalogue-archive-v3`, ouverte, **non fusionnée**) : 100 concepts, identités à valeurs fixes, 3 modes d'identité, aperçus avec articles d'exemple. Elle a été faite sur la consigne « tout faire en une nuit », donc **avant** cette nouvelle mission, plus exigeante (isolation CSS, véritable recherche, direction artistique, contrôle visuel de chaque modèle, suppression de l'ancien catalogue).
- Les vérifications automatiques de GitHub (job « tests ») **échouent en 1 à 2 secondes sur toutes les PR récentes (#37, #38, #39, #40)**, sans aucune étape exécutée : c'est un problème d'infrastructure d'intégration, pas le résultat de mes tests. Mes tests ont été exécutés en local (voir PR #40) ; **GitHub n'a donc validé aucune de ces PR**.
- Mon avis sur la PR #40 : **ne pas la fusionner telle quelle**. Elle sert de base technique (catalogue, modes, outil de contrôle) mais sa direction artistique ne répond pas à la nouvelle exigence (voir § 4).

## 1. Recherche : ce qui a réellement été lu
Méthode : deux agents de recherche (Elementor ; marketplaces) avec lecture de pages web. L'outil de lecture rend un **résumé** de la page, pas le HTML brut, et je n'ai **aucune capture d'écran** de ces sites. Marqueurs : **[LU]** texte de la page obtenu ; **[EXTRAIT]** simple extrait de recherche ; **[NON VÉRIFIÉ]**.

### 1.1 Elementor / Elementor Pro (documentation officielle)
| Sujet | Ce qui est établi | Statut |
|---|---|---|
| Archive Template | « Site part » à créer dans Theme Builder > Archive ; point vert = actif (a des conditions), gris = brouillon ; « Instances » ; export .json. Sans condition, le modèle reste brouillon. | [LU] elementor.com/help/archive-site-part/ |
| Conditions d'affichage | Include/Exclude + cible, plusieurs conditions cumulables ; cibles : tout le site, Singular, Archives (auteur, date, recherche, post archive, catégories, tags), WooCommerce. Un avertissement apparaît en cas de conflit. **La page ne dit pas quelle règle de priorité s'applique** (« le plus spécifique gagne » vient d'une source tierce). | [LU] elementor.com/help/conditions/ ; priorité [NON VÉRIFIÉ] |
| Archive Posts (Pro) | Skins Classic / Cards ; colonnes 1 à 6 ; masonry ; pagination : aucune, numéros, précédent/suivant, les deux, charger au clic, défilement infini. Le nombre d'articles par page vient des réglages de lecture WordPress. | début de page lu (partiel) |
| Loop Grid | Sources : articles, pages, sélection, liés, **Current Query** (un modèle pour plusieurs catégories) ; types de modèle de boucle (Posts, Post Taxonomy, Products, Product Taxonomy) ; colonnes, masonry, hauteur égale ; **chargement « Page Reload » ou « AJAX »** (recharge seulement la grille) ; pagination individuelle par grille. | [LU] elementor.com/help/loop-grid/ |
| Loop Carousel | Mêmes sources ; filtre de date ; nombre de diapositives, flèches. | [LU] elementor.com/help/loop-carousel/ |
| Taxonomy Filter | **Ne fonctionne qu'avec une Loop Grid et ne gère pas « Current Query »** : sur une vraie archive il faut définir la requête dans la grille. Sélection multiple ET/OU, premier élément « Tous », états normal / survol / actif. | [LU] elementor.com/help/taxonomy-filter-widget/ |
| Author Box, Post Info, Search, Breadcrumbs | Existence confirmée par résumés de pages ; Breadcrumbs lié à une extension SEO ; contradictions entre sources. | [EXTRAIT] |
| Archive Title / Archive Description | **Pas de widget d'aide officiel trouvé** : balises dynamiques (Pro) dans un widget Titre ou Éditeur de texte. | [EXTRAIT] (tutoriel tiers) |
| Global Colors / Fonts | « Add Style » pour une police globale confirmé ; 4 couleurs globales par défaut et mise à jour en cascade : sources tierces. **Le détail héritage / valeur propre n'est pas confirmé côté officiel.** | partiel + [NON VÉRIFIÉ] |
| Gratuit ou Pro | Le Theme Builder est une fonction d'Editor Pro ; donc Archive Template, Loop Grid, Taxonomy Filter, conditions = Pro (déduction, pas confirmée widget par widget). | [LU] FAQ tarifs |
| Non lu | Conteneurs flex/grid et responsive, Posts widget Pro, Loop Builder officiel, notes de version, aperçu (Preview Settings : sources tierces seulement). | [NON VÉRIFIÉ] |
Bugs connus signalés (titres vus seulement en résultats de recherche) : articles répétés en défilement infini dans une archive avec Current Query (issue #24973 d'Elementor).

### 1.2 Marketplaces et démos
| Page | Observé | Statut |
|---|---|---|
| ThemeForest — Newspaper | 16 modèles de catégorie, 8 modèles d'auteur, archives de types personnalisés, couleur par catégorie, sous-catégories et « catégories sœurs » ; démos : tech, voyage, magazine, rétro, boutique. | [EXTRAIT] (fiche) |
| demo.tagdiv.com — catégorie | Fil d'Ariane → H1 → rangée de catégories sœurs ; **filtres de tri en liens** (récent, à la une, populaire, 7 jours, note, aléatoire) ; barre latérale (« à lire », choix de la rédaction, populaires, catégories avec compteurs) ; démo **vide** : aucune grille d'articles observée. | [EXTRAIT] |
| demo.tagdiv.com — auteur | Avatar rond, nombre d'articles et de commentaires, site, bio, réseaux ; liste verticale, vignette + rubrique + titre + méta ; pagination 1…11 avec « Page 1 sur 11 ». | [EXTRAIT] |
| demo.tagdiv.com — voyage / Europe | H1 puis onglets des régions ; liste empilée sans barre latérale ; accueil : grille de 4 tuiles, « charger plus », pagination 1…10. | [EXTRAIT] |
| Kadence démos | Liste de démos seulement. | [EXTRAIT] |
| **Échecs / non vus** | Soledad (403), Jannah (page marketing), archive.org (bloqué par l'outil), **TemplateMonster, Creative Market, Envato Elements, Ghost, Blocksy, Astra, kits Elementor : non consultés**. | — |
**Conclusion honnête** : la recherche de marché est **mince** (surtout Newspaper) et sans rendu visuel. Je ne peux pas affirmer avoir « observé » des archives premium dans différents secteurs. Pour la Phase 2, je propose d'ajouter de **vraies captures** (navigateur) de 15 à 20 démos publiques, avec votre accord (voir § 8).

### 1.3 Enseignements utilisés
Fil d'Ariane → titre → description → rangée de sous-catégories ; tri en liens ; en-tête d'auteur riche (avatar, compteurs, bio) ; rythme alterné texte seul / avec extrait ; barre latérale « à lire / populaires / catégories avec compteurs » ; variantes sans barre latérale plus éditoriales ; pagination numérotée **et** « charger plus » ; bug à éviter : doublons en défilement infini.
Compétence **Frontend Design** lue (règles : un seul geste mémorable, éviter les « tics » génériques — crème + terracotta, noir + vert acide, étiquettes en capitales au-dessus de chaque titre, cartes toutes identiques à ombre grise —, plan en deux passes, relecture contre le brief).

## 2. Audit de l'existant
### 2.1 Catalogue et dépendances (lu dans le code, `origin/main` et PR #40)
- **Le catalogue est du code** (`src/themeBuilder/catalog/archive.js`) : aucune ligne en base tant qu'un modèle n'est pas « utilisé ». « Utiliser » crée une **copie indépendante** (page + modèle du Theme Builder, tables `mk_tb_templates` par site). La clé du modèle d'origine n'est mémorisée que pour les pieds de page (`origin_key`). **Supprimer l'ancien catalogue ne casse donc aucune instance** : les sites gardent leurs copies et leurs conditions.
- Références à l'ancien catalogue : tests (`theme-builder-archives-bibliotheque`, `theme-builder-catalogue-public`), script de vérification visuelle, documentation. Rien en base.
- Les ~12 000 fichiers du dépôt contiennent d'autres « archive » sans rapport (aperçus de thèmes archivés).
### 2.2 Widgets réellement disponibles (registre : 159 types ; pertinents ici)
`archiveinfo`, `authorbox`, `catfilter`, `querylist`, `search`, `postnav`, `postmeta`, `postterms`, `breadcrumb`, `social`, `sharebuttons`, `signupform` (newsletter), `toc`, `html`, `posts`, `grid` (boucle), `carousel`, `counter`, `tabs`, `accordion`. Boucle = grille avec `loop` (sources : articles, formations, produits, pages, auteurs, catégories, étiquettes). **Pas de « shortcode »** ; `html` existe (bloc sanitisé).
### 2.3 Types d'archives : ce que le moteur fait réellement
| Archive | État | Preuve |
|---|---|---|
| Blog, catégorie (+ sous-catégories), étiquette, auteur | **Pris en charge** | routes `/blog`, `/blog/categorie/…`, `/blog/etiquette/…`, `/blog/auteur/:id` ; familles de modèle `blog/category/tag/author_archive` |
| Recherche | Pris en charge (autre catégorie « Résultats de recherche ») | `?q=` |
| **Date (année / mois / jour)** | **Cassé / partiel** : la condition « date » existe, mais le tableau de correspondance (`themeBuilder/render.js`, `FAMILY`) n'a **aucune famille « date »** ; `/blog?date=AAAA-MM` filtre la liste mais résout comme « blog ». Aucune adresse `/blog/2026/11`. | lu dans le code ; **à confirmer par un test** |
| Type de contenu / taxonomie personnalisés | **Non pris en charge** (le moteur n'a ni route ni famille) | code |
| Produits (catégorie, étiquette, boutique) | **Catégorie séparée « Archive de produits »** (`product_archive`), déjà reconstruite par une autre session | code |
| Formations, événements, portfolios, membres | **Source de requête existe** (formations) mais **aucune route d'archive** ; événements / membres / portfolios : aucune donnée | `pages/query.js` |
| Image de catégorie, nombre de lectures, tri choisi par le visiteur, filtres combinés | Image de catégorie : **absente des données**. Tri : le moteur sait trier (date, titre, lectures, commentaires, aléatoire) mais l'**interface visiteur n'existe pas**. Filtres : un seul à la fois. | code |
### 2.4 Pagination et filtres
Moteur de requêtes commun : numéros, précédent/suivant, les deux, « charger plus », défilement infini (script `landing.js`). Filtres : `catfilter` (`?categorie=`), recherche (`?q=`). États : vide géré par boucle ; **pas d'état « chargement » ni « erreur »** dans les modèles. Anti-doublon : les boucles de tête (vedettes) restent identiques sur les pages suivantes (limite de PR #40).

## 3. Isolation graphique : état mesuré et architecture proposée
### 3.1 Les couches réelles aujourd'hui
1. défauts du moteur (`landing.css`, `:where()`, spécificité 0) ; 2. jetons du site (`--kw-*`) ; 3. feuille de thème (« pack ») ; 4. styles de chaque élément (`.kw-n-<id>`, spécificité 0,1,0) ; 5. CSS personnalisé du site (chargé en dernier). **Aucun scope propre au modèle, aucune variable CSS locale** : l'identité est écrite en valeurs sur chaque élément.
### 3.2 Contamination par les thèmes : mesurée (130 thèmes, `src/marketing/themes/packs`)
- **328 règles** visent des éléments génériques (`a`, `p`, `h1–h6`, `button`, `img`, `ul`…) sous `body[data-kw-pack=…]` — **130 thèmes sur 130** en ont. Spécificité supérieure à `.kw-n-<id>`.
- **883 `!important`** dont **164 sur des éléments génériques** (y compris `*`) ; **0 thème n'utilise `@layer`**.
- **Conséquence** : un modèle « indépendant » dans un site qui a un thème actif **peut** être déformé (liens, titres, boutons). Mesuré dans les feuilles ; **non encore constaté visuellement** (à tester en Phase 2).
### 3.3 Architecture d'isolation proposée (à valider)
| Option | Principe | Avantages | Limites |
|---|---|---|---|
| **A. Racine d'identité + variables locales** (recommandée) | Chaque modèle porte une racine `.kw-id-<clé>` ; ses valeurs deviennent des variables (`--ar-bg`, `--ar-ink`, `--ar-accent`, `--ar-font-head`…) émises une fois ; les éléments les lisent. Modifier l'identité = changer 6 variables, pas 300 valeurs. | Édition et persistance simples ; "mode site" = remapper les variables vers `--kw-*` | Demande un changement du compilateur de styles (`nodes.js`, fichier partagé sensible) |
| **B. Barrière contre les thèmes** | Servir les feuilles de thème avec une exclusion `:not(.kw-id-own *)` ajoutée à chaque sélecteur générique (analyseur CSS : postcss est présent), ou `@layer` + traitement des `!important` | Les 130 thèmes restent intacts sur disque ; modèles réellement protégés | Les `!important` de thèmes dans des couches inférieures **gagnent** sur le normal : il faut les traiter explicitement (164 cas) |
| C. Valeurs fixes seules (état de PR #40) | Aucune infrastructure | Déjà fait, testé | Contamination par les thèmes possible ; pas de variables ; pas de scope |
Recommandation : **A + B**, dans cet ordre, avec test « site avec thème actif » avant/après.
### 3.4 Les trois modes d'identité
`propre` (variables locales), `site` (variables remappées sur les jetons du site), `hybride` (propre + logo, nom, coordonnées du site). Le passage d'un mode à l'autre sans perdre les réglages demande de **stocker l'identité dans le document du modèle** (champ propre) : changement de l'éditeur à planifier (PR #40 ne le fait pas : on réinsère un modèle).

## 4. Critique honnête de PR #40 par rapport à la nouvelle mission
| Exigence | PR #40 | Écart |
|---|---|---|
| Directions artistiques fortes, un geste mémorable | Palettes + polices par concept ; **même squelette partout** : étiquette de famille en capitales au-dessus de chaque titre, même en-tête, cartes à bords arrondis semblables | **Insuffisant** : c'est exactement les « tics » à éviter |
| Isolation CSS (scopes, variables) | Valeurs fixes par élément, aucune variable, aucun scope | **Non fait** |
| Interactions et animations | Quasi aucune | **Non fait** |
| Contrôle visuel de chaque modèle | 25 modèles sur 100 mesurés, quelques captures regardées | **75 non vus** |
| Images | Aperçu sans image (aucun visuel libre dans le projet) | À résoudre (voir § 8) |
| Types d'archives | Blog, catégorie, étiquette, auteur | Date, types personnalisés, produits : **non** |
| Suppression de l'ancien catalogue | L'ancien est déjà remplacé par le v3 de PR #40 (pas encore sur main) | À refaire proprement avec sauvegarde |
Ce qui reste **réutilisable** : l'architecture du catalogue (`archive-lib`), les 25 compositions de page, le contrôle `audit-archives.js`, les tests serveur, les articles d'exemple d'aperçu (`demoPosts`), la mesure Chrome.

## 5. Vision créative : 25 maisons × 4 = 100 modèles
Principe : **25 univers graphiques distincts** (« maisons »), chacun avec **un seul geste mémorable** et un **parti pris typographique**, ce qui évite 100 variantes d'un même gabarit. Chaque maison décline **4 compositions structurellement différentes** (parmi les 25 que le moteur sait déjà faire). Règles : pas de crème + terracotta ni de noir + vert acide par défaut ; pas d'étiquette en capitales sur chaque titre ; cartes de formes et de reliefs différents selon la maison ; une seule interaction par maison.
Palettes : 25 palettes uniques sur 25, 25 accents uniques. **Toutes les polices vérifiées dans la bibliothèque locale.** Les contrastes seront recalculés (AA) au moment de la production, comme dans PR #40.

| Maison | Secteur | Fond / encre / accent / second | Polices (titres + texte) | Geste mémorable | Compositions | Interaction |
|---|---|---|---|---|---|---|
| M01 Verso | Magazine premium | #EEF1F6 / #101B33 / #B5179E / #FFD6F0 | Fraunces + Work Sans | lettrine géante sur le titre de l'archive et rythme de colonnes 8/4 | Héros + grille ; Trois vedettes + liste ; Sections (à la une, plus lus, tous) ; Grille asymétrique | survol : l'image se recadre, le titre se souligne |
| M02 Dépêche | Journal numérique | #FFFFFF / #1A1A1A / #D00000 / #F2F2F2 | Playfair Display + Public Sans | titres de une en très grand corps, colonnes à filets, rubrique en petites capitales fines | Une + brèves ; Colonnes de journal ; Frise datée ; Classement par lectures | tri réel par lectures (classement) |
| M03 Marge | Éditorial minimaliste | #FAFAFA / #222222 / #1D3FFF / #E9ECFF | Newsreader + Instrument Sans | marge gauche de 30 % laissée vide, titre d'archive collant | Liste texte ; Index daté ; Écran scindé (titre collant) ; Pile d'images | aucune animation : le calme est le parti pris |
| M04 Aurèle | Luxe | #2A0F14 / #F3E9DC / #D8B980 / #3B1A20 | Cormorant Garamond + Jost | portraits 3/4 très espacés, filets dorés d'un pixel | Trois vedettes + liste ; Pile d'images ; Pleine largeur ; Mur de fiches | fondu lent de l'image au survol |
| M05 Obscura | Photographique | #1B1D21 / #ECECEC / #FF5A36 / #2A2D33 | Syne + Karla | mosaïque sans texte : le titre n'apparaît qu'au survol (et reste visible au toucher) | Mosaïque ; Pleine largeur ; Cartes à titre superposé ; Grille asymétrique | titre révélé au survol / focus clavier |
| M06 Flux | Artistique | #F4EFFF / #1B1035 / #FF4D00 / #00C2A8 | Unbounded + DM Sans | mur d'œuvres à échelles contrastées, aplats de couleur franche | Mosaïque ; Mur de fiches ; Typographique géant ; Grille asymétrique | cartes qui changent d'aplat au survol |
| M07 Kernel | Technologique | #101828 / #E4E9F2 / #5EEAD4 / #1D2939 | JetBrains Mono + Space Grotesk | archive présentée comme un journal de versions (date en marge) | Liste texte ; Tableau ; Frise datée ; Grille | filtre par étiquette façon étiquettes de dépôt |
| M08 Lancement | Startup | #FFFFFF / #101828 / #7A5AF8 / #F4F3FF | Manrope + Sora | carrousel de vedettes puis grille serrée | Grille ; Cartes compactes ; Héros + grille ; Bandes défilantes | bandes défilantes (carrousel réel du moteur) |
| M09 Registre | Corporate et institutionnel | #F5F7F6 / #0F2E2B / #0F766E / #DCEBE8 | IBM Plex Serif + IBM Plex Sans | tableau de publications avec année en marge | Tableau ; Liste image à gauche ; Une + brèves ; Index daté | tri et recherche en barre fixe |
| M10 Prêt-à-porter | Mode | #FFF1F0 / #2B0A12 / #E11D48 / #FAD4D8 | Bodoni Moda + Jost | portraits 3/4 sur quatre colonnes, légende minuscule | Grille ; Mur de fiches ; Pile d'images ; Pleine largeur | image qui change de cadrage au survol |
| M11 Itinéraires | Voyage | #E8F3F1 / #0B3C49 / #F26A21 / #BFE0DA | Gloock + Outfit | frise d'étapes verticale, destinations en cartes superposées | Héros + grille ; Cartes à titre superposé ; Frise datée ; Bandes défilantes | carrousel de destinations |
| M12 Table d'hôte | Gastronomie | #F0F5E9 / #2B3A1F / #B91C5A / #DDE8CC | Young Serif + Karla | fiches de recettes avec temps de lecture mis en avant | Grille ; Grandes vignettes à filets ; Mosaïque ; Liste image à gauche | filtre par rubrique (entrées, plats, desserts) |
| M13 Circuit | Sport | #F4F4F0 / #0B132B / #FF3B30 / #E1E4EA | Anton + Archivo | classement par nombre de lectures, chiffres géants | Une + brèves ; Classement par lectures ; Cartes compactes ; Héros + grille | tri réel par lectures |
| M14 Châssis | Automobile | #E9ECEF / #14171A / #E10600 / #CBD2D9 | Oswald + Archivo | héros panoramique 21/9 et tableau comparatif | Héros + grille ; Tableau ; Pleine largeur ; Cartes compactes | titre qui glisse au survol |
| M15 Plan | Architecture | #E5E5E0 / #1C1C1C / #D95D39 / #CFCFC8 | Archivo + IBM Plex Mono | grille asymétrique à légendes techniques | Grille asymétrique ; Tableau ; Pleine largeur ; Frise datée | aucune animation |
| M16 Clés en main | Immobilier | #FFFFFF / #12263A / #0E7490 / #E2F1F5 | Outfit + Public Sans | cartes de quartier superposées, encadré contact | Une + brèves ; Cartes à titre superposé ; Grille ; Liste image à gauche | recherche + rubriques |
| M17 Cursus | Éducation | #EEF6FF / #0B2A5B / #FF8A00 / #D4E7FF | Lexend + Atkinson Hyperlegible | lisibilité maximale, niveau et durée en pastilles | Grille ; Cartes compactes ; Index daté ; Une + brèves | charger plus |
| M18 Colloque | Universitaire | #FFFFFF / #1B2A41 / #8C1C13 / #ECEFF4 | Crimson Pro + Source Sans 3 | index daté par année, auteurs en avant | Index daté ; Index daté 2 colonnes ; Liste texte ; Tableau | recherche plein texte |
| M19 Hypothèse | Scientifique et recherche | #F8FAFC / #0B3954 / #FF6B6B / #E1ECF4 | Source Serif 4 + Inter Tight | colonnes denses de revue, frise des publications | Colonnes de journal ; Frise datée ; Grille ; Sections (à la une, plus lus, tous) | filtre par étiquette |
| M20 Bilan | Financier | #F1F5F9 / #0B2545 / #13A89E / #DCE6F0 | DM Serif Display + DM Sans | tableau de rapports par année et classement | Tableau ; Une + brèves ; Classement par lectures ; Cartes compactes | tri par lectures |
| M21 Tribune | Économique | #FFFFFF / #1F2937 / #F59E0B / #F3F4F6 | Libre Franklin + Libre Baskerville | une + brèves chiffrées, sections de rubriques | Une + brèves ; Colonnes de journal ; Sections (à la une, plus lus, tous) ; Classement par lectures | onglets de rubriques réels |
| M22 Coulisses | Cinéma et divertissement | #1A0F2E / #F5EEF8 / #FFB703 / #2B1A47 | Playfair Display SC + Rubik | affiches en portrait, titres superposés | Cartes à titre superposé ; Liste image à droite ; Bandes défilantes ; Pleine largeur | bandes défilantes |
| M23 Partition | Musique | #1F1147 / #F4F0FF / #FF7BAC / #2D1B69 | Rubik + Space Grotesk | pochettes carrées en bandes défilantes | Bandes défilantes ; Grille ; Mur de fiches ; Typographique géant | carrousel de sorties |
| M24 Souffle | Santé, bien-être et communautaire | #EAF6F0 / #123D32 / #2A9D8F / #D3EBE0 | Lora + Nunito Sans | respiration : beaucoup d'espace, une seule colonne centrée, appel à agir doux | Grille ; Liste image à gauche ; Pile d'images ; Cartes compactes | charger plus |
| M25 Brouillon | Expérimental | #F1F1F1 / #000000 / #0000FF / #FFFFFF | Anton + Space Mono | typographie brute, grille cassée, aplats purs | Typographique géant ; Mur de fiches ; Écran scindé (titre collant) ; Tableau | focus clavier très visible |

Familles de la mission non traitées à part : **communautaire** et **institutionnel** sont intégrées à Souffle (M24) et Registre (M09) ; **musique** = Partition (M23) ; **cinéma** = Coulisses (M22) ; **expérimental** = Brouillon (M25) ; **startup** = Lancement (M08) ; **e-commerce** : catégorie séparée « Archive de produits », hors de cette bibliothèque.

### 5.1 Les 100 modèles (squelette de la matrice)
Barre latérale, navigation et filtre sont assignés par rotation puis seront **ajustés maison par maison** lors de la production (passe de conception en deux temps). Aucune signature (composition · barre · navigation · filtre · maison) n'est dupliquée.

| N° | Nom | Secteur | Composition | Col. | Barre latérale | Navigation | Filtre |
|---|---|---|---|---|---|---|---|
| M01.1 | Verso · Héros + grille | Magazine premium | Héros + grille | 3 | sans barre | numéros | rubriques |
| M01.2 | Verso · Trois vedettes + liste | Magazine premium | Trois vedettes + liste | 3 | barre droite | charger plus | recherche |
| M01.3 | Verso · Sections (à la une, plus lus, tous) | Magazine premium | Sections (à la une, plus lus, tous) | 3 | barre gauche | précédent / suivant | étiquettes |
| M01.4 | Verso · Grille asymétrique | Magazine premium | Grille asymétrique | 3 | filtres en haut | défilement infini | rubriques + recherche |
| M02.1 | Dépêche · Une + brèves | Journal numérique | Une + brèves | 3 | barre droite | précédent / suivant | rubriques + recherche |
| M02.2 | Dépêche · Colonnes de journal | Journal numérique | Colonnes de journal | 3 | barre gauche | défilement infini | rubriques |
| M02.3 | Dépêche · Frise datée | Journal numérique | Frise datée | 1 | filtres en haut | numéros | recherche |
| M02.4 | Dépêche · Classement par lectures | Journal numérique | Classement par lectures | 1 | sans barre | charger plus | étiquettes |
| M03.1 | Marge · Liste texte | Éditorial minimaliste | Liste texte | 1 | barre gauche | numéros | étiquettes |
| M03.2 | Marge · Index daté | Éditorial minimaliste | Index daté | 1 | filtres en haut | charger plus | rubriques + recherche |
| M03.3 | Marge · Écran scindé (titre collant) | Éditorial minimaliste | Écran scindé (titre collant) | 1 | sans barre | précédent / suivant | rubriques |
| M03.4 | Marge · Pile d'images | Éditorial minimaliste | Pile d'images | 1 | barre droite | défilement infini | recherche |
| M04.1 | Aurèle · Trois vedettes + liste | Luxe | Trois vedettes + liste | 3 | filtres en haut | précédent / suivant | recherche |
| M04.2 | Aurèle · Pile d'images | Luxe | Pile d'images | 1 | sans barre | défilement infini | étiquettes |
| M04.3 | Aurèle · Pleine largeur | Luxe | Pleine largeur | 1 | barre droite | numéros | rubriques + recherche |
| M04.4 | Aurèle · Mur de fiches | Luxe | Mur de fiches | 3 | barre gauche | charger plus | rubriques |
| M05.1 | Obscura · Mosaïque | Photographique | Mosaïque | 3 | sans barre | numéros | rubriques |
| M05.2 | Obscura · Pleine largeur | Photographique | Pleine largeur | 1 | barre droite | charger plus | recherche |
| M05.3 | Obscura · Cartes à titre superposé | Photographique | Cartes à titre superposé | 3 | barre gauche | précédent / suivant | étiquettes |
| M05.4 | Obscura · Grille asymétrique | Photographique | Grille asymétrique | 3 | filtres en haut | défilement infini | rubriques + recherche |
| M06.1 | Flux · Mosaïque | Artistique | Mosaïque | 3 | barre droite | précédent / suivant | rubriques + recherche |
| M06.2 | Flux · Mur de fiches | Artistique | Mur de fiches | 3 | barre gauche | défilement infini | rubriques |
| M06.3 | Flux · Typographique géant | Artistique | Typographique géant | 1 | filtres en haut | numéros | recherche |
| M06.4 | Flux · Grille asymétrique | Artistique | Grille asymétrique | 3 | sans barre | charger plus | étiquettes |
| M07.1 | Kernel · Liste texte | Technologique | Liste texte | 1 | barre gauche | numéros | étiquettes |
| M07.2 | Kernel · Tableau | Technologique | Tableau | 1 | filtres en haut | charger plus | rubriques + recherche |
| M07.3 | Kernel · Frise datée | Technologique | Frise datée | 1 | sans barre | précédent / suivant | rubriques |
| M07.4 | Kernel · Grille | Technologique | Grille | 3 | barre droite | défilement infini | recherche |
| M08.1 | Lancement · Grille | Startup | Grille | 3 | filtres en haut | précédent / suivant | recherche |
| M08.2 | Lancement · Cartes compactes | Startup | Cartes compactes | 2 | sans barre | défilement infini | étiquettes |
| M08.3 | Lancement · Héros + grille | Startup | Héros + grille | 3 | barre droite | numéros | rubriques + recherche |
| M08.4 | Lancement · Bandes défilantes | Startup | Bandes défilantes | 4 | barre gauche | charger plus | rubriques |
| M09.1 | Registre · Tableau | Corporate et institutionnel | Tableau | 1 | sans barre | numéros | rubriques |
| M09.2 | Registre · Liste image à gauche | Corporate et institutionnel | Liste image à gauche | 1 | barre droite | charger plus | recherche |
| M09.3 | Registre · Une + brèves | Corporate et institutionnel | Une + brèves | 3 | barre gauche | précédent / suivant | étiquettes |
| M09.4 | Registre · Index daté | Corporate et institutionnel | Index daté | 1 | filtres en haut | défilement infini | rubriques + recherche |
| M10.1 | Prêt-à-porter · Grille | Mode | Grille | 3 | barre droite | précédent / suivant | rubriques + recherche |
| M10.2 | Prêt-à-porter · Mur de fiches | Mode | Mur de fiches | 3 | barre gauche | défilement infini | rubriques |
| M10.3 | Prêt-à-porter · Pile d'images | Mode | Pile d'images | 1 | filtres en haut | numéros | recherche |
| M10.4 | Prêt-à-porter · Pleine largeur | Mode | Pleine largeur | 1 | sans barre | charger plus | étiquettes |
| M11.1 | Itinéraires · Héros + grille | Voyage | Héros + grille | 3 | barre gauche | numéros | étiquettes |
| M11.2 | Itinéraires · Cartes à titre superposé | Voyage | Cartes à titre superposé | 3 | filtres en haut | charger plus | rubriques + recherche |
| M11.3 | Itinéraires · Frise datée | Voyage | Frise datée | 1 | sans barre | précédent / suivant | rubriques |
| M11.4 | Itinéraires · Bandes défilantes | Voyage | Bandes défilantes | 4 | barre droite | défilement infini | recherche |
| M12.1 | Table d'hôte · Grille | Gastronomie | Grille | 3 | filtres en haut | précédent / suivant | recherche |
| M12.2 | Table d'hôte · Grandes vignettes à filets | Gastronomie | Grandes vignettes à filets | 1 | sans barre | défilement infini | étiquettes |
| M12.3 | Table d'hôte · Mosaïque | Gastronomie | Mosaïque | 3 | barre droite | numéros | rubriques + recherche |
| M12.4 | Table d'hôte · Liste image à gauche | Gastronomie | Liste image à gauche | 1 | barre gauche | charger plus | rubriques |
| M13.1 | Circuit · Une + brèves | Sport | Une + brèves | 3 | sans barre | numéros | rubriques |
| M13.2 | Circuit · Classement par lectures | Sport | Classement par lectures | 1 | barre droite | charger plus | recherche |
| M13.3 | Circuit · Cartes compactes | Sport | Cartes compactes | 2 | barre gauche | précédent / suivant | étiquettes |
| M13.4 | Circuit · Héros + grille | Sport | Héros + grille | 3 | filtres en haut | défilement infini | rubriques + recherche |
| M14.1 | Châssis · Héros + grille | Automobile | Héros + grille | 3 | barre droite | précédent / suivant | rubriques + recherche |
| M14.2 | Châssis · Tableau | Automobile | Tableau | 1 | barre gauche | défilement infini | rubriques |
| M14.3 | Châssis · Pleine largeur | Automobile | Pleine largeur | 1 | filtres en haut | numéros | recherche |
| M14.4 | Châssis · Cartes compactes | Automobile | Cartes compactes | 2 | sans barre | charger plus | étiquettes |
| M15.1 | Plan · Grille asymétrique | Architecture | Grille asymétrique | 3 | barre gauche | numéros | étiquettes |
| M15.2 | Plan · Tableau | Architecture | Tableau | 1 | filtres en haut | charger plus | rubriques + recherche |
| M15.3 | Plan · Pleine largeur | Architecture | Pleine largeur | 1 | sans barre | précédent / suivant | rubriques |
| M15.4 | Plan · Frise datée | Architecture | Frise datée | 1 | barre droite | défilement infini | recherche |
| M16.1 | Clés en main · Une + brèves | Immobilier | Une + brèves | 3 | filtres en haut | précédent / suivant | recherche |
| M16.2 | Clés en main · Cartes à titre superposé | Immobilier | Cartes à titre superposé | 3 | sans barre | défilement infini | étiquettes |
| M16.3 | Clés en main · Grille | Immobilier | Grille | 3 | barre droite | numéros | rubriques + recherche |
| M16.4 | Clés en main · Liste image à gauche | Immobilier | Liste image à gauche | 1 | barre gauche | charger plus | rubriques |
| M17.1 | Cursus · Grille | Éducation | Grille | 3 | sans barre | numéros | rubriques |
| M17.2 | Cursus · Cartes compactes | Éducation | Cartes compactes | 2 | barre droite | charger plus | recherche |
| M17.3 | Cursus · Index daté | Éducation | Index daté | 1 | barre gauche | précédent / suivant | étiquettes |
| M17.4 | Cursus · Une + brèves | Éducation | Une + brèves | 3 | filtres en haut | défilement infini | rubriques + recherche |
| M18.1 | Colloque · Index daté | Universitaire | Index daté | 1 | barre droite | précédent / suivant | rubriques + recherche |
| M18.2 | Colloque · Index daté 2 colonnes | Universitaire | Index daté 2 colonnes | 2 | barre gauche | défilement infini | rubriques |
| M18.3 | Colloque · Liste texte | Universitaire | Liste texte | 1 | filtres en haut | numéros | recherche |
| M18.4 | Colloque · Tableau | Universitaire | Tableau | 1 | sans barre | charger plus | étiquettes |
| M19.1 | Hypothèse · Colonnes de journal | Scientifique et recherche | Colonnes de journal | 3 | barre gauche | numéros | étiquettes |
| M19.2 | Hypothèse · Frise datée | Scientifique et recherche | Frise datée | 1 | filtres en haut | charger plus | rubriques + recherche |
| M19.3 | Hypothèse · Grille | Scientifique et recherche | Grille | 3 | sans barre | précédent / suivant | rubriques |
| M19.4 | Hypothèse · Sections (à la une, plus lus, tous) | Scientifique et recherche | Sections (à la une, plus lus, tous) | 3 | barre droite | défilement infini | recherche |
| M20.1 | Bilan · Tableau | Financier | Tableau | 1 | filtres en haut | précédent / suivant | recherche |
| M20.2 | Bilan · Une + brèves | Financier | Une + brèves | 3 | sans barre | défilement infini | étiquettes |
| M20.3 | Bilan · Classement par lectures | Financier | Classement par lectures | 1 | barre droite | numéros | rubriques + recherche |
| M20.4 | Bilan · Cartes compactes | Financier | Cartes compactes | 2 | barre gauche | charger plus | rubriques |
| M21.1 | Tribune · Une + brèves | Économique | Une + brèves | 3 | sans barre | numéros | rubriques |
| M21.2 | Tribune · Colonnes de journal | Économique | Colonnes de journal | 3 | barre droite | charger plus | recherche |
| M21.3 | Tribune · Sections (à la une, plus lus, tous) | Économique | Sections (à la une, plus lus, tous) | 3 | barre gauche | précédent / suivant | étiquettes |
| M21.4 | Tribune · Classement par lectures | Économique | Classement par lectures | 1 | filtres en haut | défilement infini | rubriques + recherche |
| M22.1 | Coulisses · Cartes à titre superposé | Cinéma et divertissement | Cartes à titre superposé | 3 | barre droite | précédent / suivant | rubriques + recherche |
| M22.2 | Coulisses · Liste image à droite | Cinéma et divertissement | Liste image à droite | 1 | barre gauche | défilement infini | rubriques |
| M22.3 | Coulisses · Bandes défilantes | Cinéma et divertissement | Bandes défilantes | 4 | filtres en haut | numéros | recherche |
| M22.4 | Coulisses · Pleine largeur | Cinéma et divertissement | Pleine largeur | 1 | sans barre | charger plus | étiquettes |
| M23.1 | Partition · Bandes défilantes | Musique | Bandes défilantes | 4 | barre gauche | numéros | étiquettes |
| M23.2 | Partition · Grille | Musique | Grille | 3 | filtres en haut | charger plus | rubriques + recherche |
| M23.3 | Partition · Mur de fiches | Musique | Mur de fiches | 3 | sans barre | précédent / suivant | rubriques |
| M23.4 | Partition · Typographique géant | Musique | Typographique géant | 1 | barre droite | défilement infini | recherche |
| M24.1 | Souffle · Grille | Santé, bien-être et communautaire | Grille | 3 | filtres en haut | précédent / suivant | recherche |
| M24.2 | Souffle · Liste image à gauche | Santé, bien-être et communautaire | Liste image à gauche | 1 | sans barre | défilement infini | étiquettes |
| M24.3 | Souffle · Pile d'images | Santé, bien-être et communautaire | Pile d'images | 1 | barre droite | numéros | rubriques + recherche |
| M24.4 | Souffle · Cartes compactes | Santé, bien-être et communautaire | Cartes compactes | 2 | barre gauche | charger plus | rubriques |
| M25.1 | Brouillon · Typographique géant | Expérimental | Typographique géant | 1 | sans barre | numéros | rubriques |
| M25.2 | Brouillon · Mur de fiches | Expérimental | Mur de fiches | 3 | barre droite | charger plus | recherche |
| M25.3 | Brouillon · Écran scindé (titre collant) | Expérimental | Écran scindé (titre collant) | 1 | barre gauche | précédent / suivant | étiquettes |
| M25.4 | Brouillon · Tableau | Expérimental | Tableau | 1 | filtres en haut | défilement infini | rubriques + recherche |

**Matrice de diversité** : 25 maisons (palettes, polices, geste) × 4 compositions distinctes par maison (chaque maison a bien 4 compositions différentes). Une paire de modèles ne compte comme « différente » que si **composition ou fonctionnalité** diffère, pas seulement la couleur : le contrôle `audit-archives.js` mesurera les structures réelles.

## 6. Plan de remplacement sécurisé de l'ancien catalogue
1. **Rien n'est supprimé avant** que les 100 modèles soient validés par vous.
2. L'ancien catalogue (sur `main`) est du code : sa suppression = retirer le fichier ; les instances des sites sont des **copies indépendantes** (aucune dépendance en base). **Sauvegarde** : export de la table `mk_tb_templates` (type = archive) avant la bascule ; **retour arrière** = revert du commit.
3. Les anciennes clés disparaissent du catalogue : mise à jour des 2 tests (archives-bibliotheque, catalogue-public) et du script visuel qui les citent.
4. Après bascule : tests de régression (Header, Footer, article, page, produit, recherche, boutique).

## 7. Plan d'exécution et tests
Phase 2 : architecture d'isolation (A puis B), éditeur d'identité, aperçus. Phase 3 : **un modèle de référence** testé dans l'éditeur et sur le site public, avec thème actif. Phase 4 : modèles par groupes de 5 maisons (20 modèles), **captures et mesures Chrome sur 100 % des modèles** (outil prêt : `scripts/verification-visuelle-archives.js`, options `--un-sur`, `--cles`). Phase 5 : bascule. Phase 6 : audit final.
Tests : bibliothèque exacte (100, clés, noms, structures), données dynamiques, navigation, états (vide, filtre actif, réinitialisation, **chargement et erreur à concevoir**), indépendance graphique (**les 13 étapes de la mission : couleurs, polices, boutons, thème, rechargement**), fuite CSS (comparaison avant/après du Header et du Footer), responsive 4 largeurs, multisite (deux sites, identités différentes), régression. **Aucun test ne sera déclaré réussi sans exécution.**

## 8. Décisions dont j'ai besoin
1. **PR #40** : la fermer, la garder comme base (recommandé : ne pas la fusionner, reprendre son code dans la branche v4) ?
2. **Recherche** : j'autorise-t-on la consultation par **navigateur avec captures** de ~20 démos publiques (Newspaper, Soledad, Jannah, thèmes Ghost, Kadence…) avant la Phase 2 ? (Plus lent, mais réelle.)
3. **Isolation** : accord pour toucher au **compilateur de styles** (`nodes.js`, fichier partagé sensible) et au **service des feuilles de thème** pour l'option A + B ?
4. **Images d'aperçu** : le projet n'a aucune image libre de droits. Je propose d'en **fabriquer** (illustrations SVG générées, cohérentes avec chaque maison) pour les aperçus. D'accord ?
5. **Archives par date et produits** : les corriger dans le moteur (route + famille « date ») est un travail à part ; je le fais dans cette mission, ou plus tard ?
