# Page individuelle — Phase 1 : recherche, audit et proposition (10 novembre 2026)

Aucun code n'a été modifié, rien n'a été supprimé ni remplacé pour produire ce rapport.

## 1. Constat de départ : la catégorie a déjà été reconstruite le 8 novembre
La bibliothèque demandée existe déjà en grande partie. Elle est en ligne depuis le commit `ea583d62` (v2) :
* 100 modèles écrits un par un, en 15 familles, chacun avec **sa propre identité en valeurs fixes** (couleurs, polices de la bibliothèque locale, boutons) ; les composants composés lisent des variables `--kw-*` / `--lp-*` redéfinies sur la racine de chaque section (`scopeCss`).
* Contrôles passés : audit statique 100/100 (0 défaut, similarité < 0,70, contraste, polices), contrôle d'**isolement dans Chrome** (100 modèles rendus sur deux chartes de site opposées : 0 fuite), 16 tests serveur, rendu Chrome à 3 largeurs sans défaut.
* L'ancien catalogue (assemblage ouverture × corps × conclusion) n'existe plus ; aucune page ni aucun modèle de site n'a été touché (« Utiliser » copie).
Cette Phase 1 mesure donc **l'écart entre l'existant et ce nouveau cahier des charges**, plutôt que de repartir de zéro.

## 2. Écarts avec le nouveau cahier des charges
| Exigence | État réel | Écart |
|---|---|---|
| 100 modèles, diversité structurelle | Oui, mesuré (< 0,70) | Fait |
| Identité indépendante (couleurs, polices, boutons) | Oui, 0 fuite mesurée | Fait |
| Identité indépendante des **espacements, tailles de texte, ombres, bordures globales** | Partielle : les espacements et tailles de texte du site s'appliquent encore | À traiter |
| Thème (pack) actif ne doit pas écraser un modèle | **Non mesuré** : pas de `@layer`, une feuille de thème peut passer devant | À mesurer puis traiter |
| Choix hériter / indépendant / hybride | Existe désormais **dans `main` pour la fiche produit seulement** (`identityModes.js`, migration 143, `MODE_TYPES = {single_product}`) ; **pas branché sur Page individuelle** | À étendre |
| Aperçu fidèle = modèle inséré | Oui (aperçu et copie viennent du même `build()` ; isolement mesuré dans l'aperçu) | Fait ; à revérifier avec les modes |
| Qualité de finition « marketplace » | **Non vérifiée visuellement** : contrôles automatiques seulement, aucun œil humain sur les 100 rendus, aucune capture relue | Écart principal |
| Visuels (photos, illustrations) | Aucun : emplacements « remplacez cette zone » ; modèles proches de maquettes filaires | Écart principal |
| Contenu dynamique de page | Titre, description, contenu ; pas d'image mise en avant, d'auteur, de catégories, de champs personnalisés | Limite du CMS (voir § 3) |
| Univers demandés (médical, application, architecture, luxe, dirigeant, lieu, produit…) | Partiellement couverts | Voir § 7 |
| Remplacement sécurisé de l'ancienne bibliothèque | Déjà fait sans toucher aux instances | Rien à supprimer |

## 3. Données réellement disponibles pour une page (audit du schéma)
`mk_landing_pages` : `name`, `slug`, `title` (onglet), `description`, `status` (brouillon / publié / dépublié), `sections` (le contenu), `theme`, `form_id`, `tags` (5 au plus, **destinées aux contacts inscrits**, pas des taxonomies de contenu), `indexable`, `published_at`, `scheduled_at`, `created_at`, `updated_at`, `parent_id` (hiérarchie), `site_id`, `kind` (`landing`, `page`, `step`), `seo`, `revision`, `archived_at`.
Absents : **auteur, image mise en avant, catégories, champs personnalisés, type de contenu personnalisé, galerie liée**. Pour afficher ces données dans un modèle de page, il faudrait **d'abord créer le stockage** (ce n'est pas un travail de design). Exposés aujourd'hui : `{{post.title}}`, `{{post.excerpt}}` (= `description`), `postcontent`. Recommandation : ne rien ajouter tant que le besoin n'est pas confirmé ; rendre les dates (`published_at`, `updated_at`) disponibles est possible à faible coût.

## 4. Architecture d'indépendance : état et proposition
* État : couleurs/polices/rayons/boutons indépendants par modèle (valeurs fixes + variables redéfinies sur les racines de section).
* Proposition : **brancher Page individuelle sur `identityModes.js`** (déjà éprouvé en production pour la fiche produit) pour offrir les trois modes (indépendante, héritée, hybride) à l'insertion et après coup. Point technique à régler : en mode « hérité » ou « hybride », la **portée CSS `scopeCss` doit être retirée ou remplacée** par les jetons du site (aujourd'hui elle impose les valeurs fixes) ; la conversion sans perte existante agit sur les styles, parties et propriétés des nœuds, pas sur ce CSS de portée.
* Isolation CSS : mettre les feuilles de thème (packs) dans une couche inférieure (`@layer`) et mesurer l'effet de chaque pack actif sur un échantillon de modèles ; interdire `!important`.
* Espacements et tailles de texte propres : redéfinir aussi `--kw-space-*`, `--kw-h1-size`… sur les racines (même technique), seulement pour les modèles qui veulent une échelle différente.

## 5. Recherche externe (réellement effectuée aujourd'hui, avec ses limites)
**Elementor / Pro** (recherche web, sources secondaires et tierces) :
* [Elementor 3.20 (annonce bêta)](https://developers.elementor.com/elementor-3-20-beta/) : connecteur « OU » entre groupes de conditions et règles fondées sur des balises dynamiques de champs personnalisés WordPress ; à confirmer dans la documentation finale.
* Pages produit [Theme Builder](https://elementor.com/old/it/features/theme-builder-ed/) : balises dynamiques, intégrations de champs et types de contenu personnalisés, conditions d'affichage sur éléments — présentées comme fonctions Pro.
* [Display Conditions (aide Elementor)](https://elementor.com/help/?p=44673) : affichage conditionnel d'éléments, sans détail relu.
* Les add-ons tiers (ex. The Plus Addons, Architect) ajoutent des conditions sur champs ACF / JetEngine / Meta Box : **ce ne sont pas des fonctions natives**.
* Limite : les pages d'aide Global Colors et Global Fonts n'ont toujours pas renvoyé leur contenu le 8 novembre ; aucune règle de priorité officielle n'est confirmée.
**ThemeForest / Envato / TemplateMonster** : les résultats de recherche ne donnent que des listes vendeurs, la [catégorie Corporate de ThemeForest](https://themeforest.net/category/site-templates/corporate) (annoncée comme la plus grande collection de modèles d'entreprise, avec filtre « Top selling ») et des articles de blogs. Aucune démonstration payante n'a été ouverte ; aucun chiffre de ventes 2026 n'est confirmé ; le classement « Avada / The7 en tête » vient de sources non vérifiées. Observation prudente : le marché est dominé par des thèmes **multi-usages** avec constructeur intégré, ce qui confirme l'intérêt d'une bibliothèque de pages très variée mais pas de copier un modèle précis.
**Tendances de conception 2026** (blogs d'agences, [Line25](https://line25.com/articles/web-design-trends-2026/), [StudioMeyer](https://studiomeyer.io/en/blog/webdesign-trends-2026-reality-check), [Webflow-guide](https://www.pravinkumar.co/blog/web-design-trends-convert-2026-webflow), opinions et non données) : grilles « bento », échelle typographique extrême (un très grand titre, une légende minuscule), typographie comme élément visuel principal, photographie éditoriale, mode sombre ; contre-tendance brutaliste / monospace ; la 3D et la personnalisation par IA sont jugées décevantes. À prendre comme pistes, pas comme mesures.
**Frontend Design** (consultée) : demande une direction artistique propre au sujet, deux polices au plus nettement différentes, lignes de moins de 80 caractères, **éviter les tics génériques** : fond crème + serif + terre cuite, fond noir + accent vert acide, mise en page « journal » à filets, cartes toutes identiques au même arrondi et à la même ombre, étiquettes en majuscules espacées au-dessus de chaque titre, numérotation 01/02/03 sans séquence réelle, mouvement d'apparition sur chaque section. À appliquer ci-dessous.

## 6. Autocritique de la v2 au regard de ces principes (honnête)
* **Structurellement diverse, visuellement trop uniforme** : de nombreux modèles reposent sur les mêmes briques (`cards`, `boxes`, `iconbox`) au même arrondi dans l'ambiance de l'identité ; les directions artistiques sont des palettes + paires de polices **dérivées automatiquement** (44 ambiances claires sur 100) et non des conceptions dessinées une à une.
* **Tics génériques présents** : étiquettes d'ouverture `k.L(...)` souvent en majuscules (identité « édito »), numérotations « 1 · [Dossier] » dans l'admission (séquence réelle, acceptable) mais aussi des étiquettes décoratives ; palettes crème + serif dans les ambiances éditoriales.
* **Aucune image** : l'impression de « maquette filaire » est réelle ; un produit commercialisable demande des visuels (illustrations vectorielles originales, formes, motifs) qui puissent exister **sans photo fournie**.
* Plusieurs modèles n'ont pas été regardés par un humain ni par moi sur captures.

## 7. Proposition de 100 concepts (ajustement, pas refonte)
Les 100 concepts actuels (`DIVERSITY_MATRIX.md`) sont conservés comme base. À remplacer ou ajouter pour couvrir les univers nouveaux du cahier des charges (environ 15 modèles) :
page de présentation d'une **application mobile**, d'une **marque**, d'un **dirigeant**, d'un **projet** (architecture, chantier), d'un **lieu** (musée, site naturel), **médicale** (cabinet, clinique), **luxe** (maison, joaillerie), **architecture** (agence, réalisation), **université** (laboratoire de recherche), **association** (rapport d'activité), **entreprise technologique** (produit B2B), **institution financière**, **organisation internationale** (présence mondiale), **photographie** (série), **typographique** (manifeste). Les familles « services », « tarifs » et « aide », déjà riches, restent.

## 8. Plan de travail proposé (Phase 2 à valider)
1. **Mesures** : effet des 14 packs qui ciblent `.kw-` sur un échantillon de modèles ; contrôle de non-contamination inverse (le modèle ne modifie ni en-tête, ni pied, ni autres types).
2. **Couches CSS** : `@layer` pour les packs ; mesure avant/après.
3. **Modes d'identité** : brancher `single_page` sur `identityModes.js` + gestion de la portée CSS ; scénario bleu marine / beige et noir, retour en arrière, rechargement, publication.
4. **Un modèle de référence redessiné** (choix du modèle à valider) avec visuels vectoriels originaux, échelle typographique choisie, un seul moment de mouvement ; revu sur captures.
5. **Revue visuelle des 100** (captures 1440/820/390 px relues) et corrections ; remplacement des ~15 concepts.
6. **Production en groupes de 10** avec les contrôles existants (statique, isolement Chrome, serveur, responsive).
7. **Audit final** et documentation.

## 9. Risques et réponses
| Risque | Réponse |
|---|---|
| Refaire du travail déjà livré | Partir de la v2, ne remplacer que ce que la revue visuelle condamne |
| Packs de thème qui écrasent un modèle | Mesurer puis `@layer` |
| Modes d'identité qui cassent la portée CSS | Étendre `identityModes` avec gestion explicite de la portée, test aller-retour |
| Visuels sous licence | Uniquement des illustrations vectorielles originales générées dans le dépôt ; aucune ressource de marketplace |
| Données absentes du CMS (auteur, image, champs) | Ne pas les promettre ; décider d'un stockage séparément |
| Pages existantes | Aucune suppression ; copies indépendantes ; retour arrière par commit |

## 10. Décisions attendues de votre part
1. Garder la v2 comme base et la faire évoluer (recommandé), ou supprimer et repartir de zéro.
2. Brancher les modes hériter / indépendant / hybride sur les pages.
3. Autoriser la création de visuels vectoriels originaux dans les modèles.
4. Choisir le modèle de référence à redessiner en premier.
