# Archives v4 — 100 modèles à identité indépendante (25 maisons × 4)

Catégorie `archive` du Theme Builder. **Remplace entièrement** l'ancienne bibliothèque (10 contenus × 10 compositions, puis 20 × 5 avant elle).
Documents : `PHASE1_RECHERCHE_AUDIT_PLAN.md` (recherche, audit, plan) · `FICHES_100_MODELES.md` (fiche de conception de chaque modèle, **générée depuis le code** : `node scripts/doc-archives.js`) · ce fichier (architecture, décisions, résultats réels).

## 1. Décisions prises (travail confié sans validation intermédiaire)
| Question de la Phase 1 | Décision | Raison |
|---|---|---|
| PR #40 (v3) | Reprise comme base ; la v4 la **remplace** (même branche de départ) | Le catalogue, les tests et l'outillage étaient réutilisables ; la direction artistique ne l'était pas |
| Recherche | Lecture de la documentation Elementor + démos Newspaper (agents) **et captures d'écran Chrome** de sites réels (Newspaper Travel, Ghost, Monocle, Kinfolk, Blocksy) | Les lectures de texte seules ne donnaient aucune observation visuelle |
| Isolation CSS | **Valeurs fixes + parties de widgets** posées sur chaque modèle ; pas de variables CSS locales, pas de barrière sur les feuilles de thème | Voir § 3 : les pages du blog ne chargent **aucune** feuille de thème ; toucher au compilateur de styles (`nodes.js`) ou aux 130 thèmes en production n'apporte rien et comporte un risque |
| Mécanisme des 3 modes | **Réutilisation du mécanisme d'une autre session** (`catalog/identityModes.js`, `themeBuilder/identity.js`) étendu au type `archive` | Un seul mécanisme pour tous les catalogues ; la bascule de mode **sans perte** (conversion par comparaison à l'original) existe déjà |
| Images d'aperçu | **Illustrations abstraites générées** (`archive-lib/demoArt.js`, route `/themes-art/apercu-mXX/…`), aux couleurs de la maison | Le projet n'a aucun visuel libre de droits |
| Archives par date | **Corrigées dans le moteur** (route, famille, condition, boucle) | Elles étaient cassées (voir Phase 1) |
| Types personnalisés, produits, formations | **Non traités** : le moteur n'a ni route ni données ; les produits ont leur propre catégorie | Ne pas simuler |

## 2. Ce qui est livré
- **25 maisons** (`archive-lib/maisons.js`) : palette fixe (fond / encre / accent / second), paire de polices de la bibliothèque, un geste mémorable, 4 compositions, forme d'en-tête (minimal · centré · bandeau · éditorial · marge · typographique · barre inversée), forme de carte (plat · aplat · cadre · ombre), rapport d'image, niveau de méta, **une interaction** (soulèvement ou soulignement au survol, ou aucune).
- **100 concepts** (`concepts.js`) = maisons × compositions parmi **25 compositions** (`compose.js`) ; réglages de structure (colonnes, barre latérale, navigation, filtre) répartis par rotation.
- **Identités** (`skins.js`) : couleurs fixes, contrastes AA calculés (l'accent est rapproché de l'encre si besoin), polices `font.<id>` de la bibliothèque locale. Aucune étiquette de « famille » au-dessus des titres.
- **Sous-éléments des widgets** (`brand()` dans `compose.js`) : filtre de rubriques, recherche, en-tête d'archive, listes, fiche d'auteur reçoivent l'identité de la maison via `node.parts` (mêmes réglages que l'éditeur). **Sans cela**, un test en Chrome a montré le titre d'archive en bleu marine (couleur du blog de Kolakisa) et les boutons en bleu Kolakisa `#0277b6` (valeur de repli du moteur).
- **3 modes d'identité** : propre (défaut) · hérité du site · hybride (fonds et textes du modèle + couleur de marque du site). Choix à l'insertion (liste déroulante dans la bibliothèque) ; **bascule ultérieure sans perte** (`POST …/modeles/:id/identite`, étendue à `archive`, mémorise `origin_key` + `identity_mode`).
- **Archives par date** : `/blog/archives/AAAA[/MM[/JJ]]` (date impossible = 404, ex. 31 février), `?date=AAAA[-MM[-JJ]]` conservé ; famille `date_archive` ; la condition « Archives de date » s'applique (y compris à une période précise `2025-03`) ; la boucle « suit l'archive » filtre par période ; non indexées.
- **Aperçus** : 12 articles d'exemple + illustrations générées aux couleurs de la maison, annoncés par un bandeau, **jamais** sur un site publié.
- **Contrôles** : `scripts/audit-archives.js` (statique), `scripts/audit-archives-navigateur.js` (Chrome : débordement aux 3 largeurs + **fuites d'identité** couleur par couleur et police par police), tests (voir § 6).

## 3. Isolation graphique : ce qui a été constaté
| Couche | Constat | Traitement |
|---|---|---|
| Feuilles des 130 thèmes autonomes | 328 règles sur éléments génériques, 883 `!important` (164 génériques), 0 `@layer` | **Sans effet sur les archives** : les pages du blog (`views/blog`) ne chargent aucune feuille de thème (vérifié par test). Une barrière CSS a été écrite puis **abandonnée** (elle réécrivait les 130 feuilles en production sans bénéfice) |
| Styles de base des widgets (`landing.css`) | Lisent `--kw-*` avec repli sur la charte Kolakisa (`#0277b6`) | **Corrigé** : `brand()` pose l'identité sur chaque partie des widgets concernés ; racine : police et couleur de la maison héritées par le reste |
| CSS de la mise en page du blog | Titre `h1` en `#0b2a40` (charte Kolakisa) | Corrigé (partie `title` de `archiveinfo`) |
| CSS personnalisé du site | Chargé en dernier, peut tout écraser | Comportement normal, documenté |
| Variables CSS locales par modèle | Non implémentées : l'identité est écrite en valeurs sur chaque élément (persistante à l'enregistrement, à l'édition, à la publication) | Décision § 1 |

## 4. Types d'archives (état final)
Blog, catégorie (+ sous-catégories), étiquette, auteur, **date** : pris en charge. Recherche : autre catégorie. Produits : autre catégorie (« Archive de produits »). **Non pris en charge** : types de contenu personnalisés, taxonomies personnalisées, formations / événements / portfolios / membres (aucune route d'archive), image de catégorie (absente des données), tri choisi par le visiteur, filtres combinés.

## 5. Widgets, navigation, filtres
Widgets réellement utilisés : `archiveinfo`, boucle (`grid` + `loop`), `catfilter`, `search`, `querylist`, `authorbox`, boutons, séparateurs. Pagination du moteur : numéros, précédent/suivant, « charger plus », défilement infini. Filtre de rubriques = `?categorie=` réel ; recherche = widget réel ; étiquettes = liste réelle. États : vide conçu dans chaque boucle ; **pas d'état « chargement » ni « erreur »** (non fournis par le moteur). Limite connue : les boucles de tête (vedettes) restent identiques sur les pages suivantes.

## 6. Tests et résultats réels
## 6. Résultats mesurés (exécutés, pas estimés)

- **Audit statique** (`node scripts/audit-archives.js`) : 100 modèles, 100 structures distinctes, 25 palettes, 300/300 documents acceptés par le moteur (3 modes d'identité), ≤ 400 nœuds, profondeur ≤ 9, contrastes AA respectés.
- **Audit en vrai Chrome** (`node scripts/audit-archives-navigateur.js`) : 100 modèles ouverts, **0 débordement horizontal, 0 fuite de charte** (couleurs et polices mesurées sur le rendu réel). Cet audit a trouvé des fuites réelles (titres, boutons, flèches de carrousel) : corrigées, le carrousel est remplacé par une bande de vedettes statique.
- **Tests** : `theme-builder-archives-bibliotheque` et `theme-builder-archives-isolation-navigateur` : 21/21 réussis (archives par date, insertion des 100 modèles, scénario des modes d'identité, indépendance face aux changements de couleur/police/thème du site).
- **Non fait / limites** : CI GitHub en échec immédiat pour toutes les PR (infrastructure, sans étape exécutée) ; pas de jugement visuel humain modèle par modèle ; pas de variables CSS ; pas d'état « chargement » ni « erreur » ; recherche de modèles externes (ThemeForest, TemplateMonster) partielle.


## 7. Migration et retour arrière
Le catalogue est du **code** : remplacer `archive.js` ne modifie aucune ligne en base. Les sites qui ont utilisé un ancien modèle ont une **copie indépendante** (page + modèle du Theme Builder, conditions comprises) : intacte. Les nouvelles copies mémorisent leur modèle d'origine et leur mode (`origin_key`, `identity_mode`, colonnes existantes). **Retour arrière** : revert du commit de fusion ; aucune sauvegarde de base n'est nécessaire (rien n'y est écrit par la bibliothèque).

## 8. Limites assumées (non simulées)
- Recherche de marché : 5 sites observés par capture (Newspaper, Ghost, Monocle, Kinfolk, Blocksy) et la documentation Elementor lue en partie ; **pas de démos ThemeForest / TemplateMonster / Creative Market ouvertes** (refusées ou non accessibles) ; Elementor : règle de priorité, conteneurs et aperçu non confirmés par sa documentation.
- La qualité graphique de chaque modèle n'a pas été jugée individuellement à l'œil : les contrôles sont mesurés (débordement, fuites de couleur et de police, contraste) ; seules quelques captures ont été regardées.
- Pas de variables CSS locales, pas d'animations autres que le survol, pas d'état de chargement/erreur.
- Pas de sélecteur de mode dans l'éditeur d'une copie existante (la route de bascule existe, l'interface seulement à l'insertion).
