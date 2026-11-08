> **Remplacé le 8 novembre 2026.** La bibliothèque décrite ci-dessous (10 contenus × 10 compositions) a été remplacée par 100 concepts à identité indépendante : voir `docs/theme-builder/archive/ARCHIVE_LIBRARY.md`. Ce document reste comme historique.

# Bibliothèque « Archives » du Theme Builder

Catégorie `archive` (groupe « Pages et contenus »). S'applique aux listes du blog, aux archives de catégorie, d'étiquette et d'auteur. Fichier : `src/themeBuilder/catalog/archive.js`.

## 1. Audit initial (avant la refonte)
| # | Constat | Traitement |
|---|---|---|
| 1 | 100 modèles = **20 mises en page × 5 couleurs** : à structure égale, 5 modèles ne différaient que par les couleurs. | Remplacé par **10 contenus × 10 compositions** : 100 documents tous différents, 52 structures différentes, 10 compositions distinctes par contenu. |
| 2 | Aucun modèle ne distinguait le type d'archive (catégorie avec description, auteur avec biographie, étiquettes, portfolio, entreprise…). | 10 directions éditoriales (voir §3). |
| 3 | Les barres de catégories n'étaient pas branchées sur la liste (aucun `urlFilter`). | Là où une barre de catégories est affichée (bandeau, barre de filtres), la boucle est branchée (`urlFilter`) : filtrage réel testé. |
| 4 | Isolation entre sites, règles d'affichage (catégorie, étiquette, auteur) : correctes dans le moteur (`routes/blog.js` : familles `category_archive`, `tag_archive`, `author_archive`, repli `blog_archive`). | Inchangé, testé. |

## 2. Fonctionnement
- Le catalogue est du **code** ; « Utiliser ce modèle » crée une **copie indépendante** (brouillon). Modifier la copie ne change jamais le catalogue.
- Rendu public : `routes/blog.js renderList` → `themeRender.renderRegion(familles)`. La boucle d'articles « suit l'archive » (`archive: true`) : catégorie (avec sous-catégories), étiquette ou auteur affichés.
- Règles d'affichage (Theme Builder) : toutes les archives, catégories précises, étiquettes précises, auteurs ; le plus précis l'emporte ; un seul modèle par page ; l'en-tête et le pied de page du Theme Builder ne sont jamais dupliqués par un modèle d'archive.
- Clés : `<contenu>.<composition>` (ex. `portfolio.vedette`). Les anciennes clés (`grille-3.clair`…) n'existent plus ; les sites qui les avaient utilisées gardent leur copie indépendante.

## 3. Les 10 contenus (directions éditoriales)
Blog classique · Magazine (grandes images) · Catégorie avec introduction (titre, description, nombre) · Auteur avec biographie (widget `authorbox`) · Étiquettes (nuage réel, fiches de texte) · Actualités (dates et catégories visibles) · Portfolio (images, sans extrait) · Entreprise (institutionnel, contact) · Minimaliste typographique (sans image) · Journal de lecture (grands titres et extraits).

## 4. Les 10 compositions
Liste · Grille de cartes · Colonne à droite · Colonne à gauche · Article en grand puis grille · Une et brèves (asymétrique) · Index daté · Éditorial centré · Bandeau d'en-tête (titre, filtres, recherche) · Barre de filtres.

Chaque modèle reçoit en plus l'une des 5 identités visuelles (20 modèles chacune) : palette, polices et arrondis propres aux modèles, jamais ceux de l'administration Kolakisa. Toutes les couleurs et polices restent modifiables dans l'éditeur.

## 5. Données et composants
`archiveinfo` (titre, description, nombre), boucle d'articles réels (`{{post.title|url|image|excerpt|date|author|category}}`), pagination par numéros, `catfilter`, `querylist` (rubriques, étiquettes, plus lus, récents), `authorbox`, `search`, `button`, `divider`. Aucune donnée ni image fictive : un article sans image n'en montre pas.

## 6. États
| État | Comportement |
|---|---|
| Avec articles | Cartes réelles, pagination (9 par page en 3 colonnes), compteur dans l'en-tête. |
| Aucun article | Message : « Aucun article dans cette rubrique pour le moment… ». |
| Terme inexistant (catégorie, étiquette, auteur) | Vraie page 404 du site (jamais une archive vide inventée). |

## 7. Personnalisation
Dans l'éditeur du Theme Builder (copie du site) : colonnes de la grille (et réglages tablette / mobile), largeur et espacements, couleurs, polices, arrière-plans, apparence des cartes et des images, affichage ou masquage des éléments, ordre des éléments de la carte, style des boutons, pagination. Aucun code à écrire. Duplication d'un modèle pour créer une variante, aperçu ordinateur / tablette / mobile, publication et brouillon : fonctions existantes du Theme Builder.

## 8. Responsive
Mise en page Flexbox / Grid, aucun positionnement absolu ; toute ligne flex passe à la ligne ; toute grille de plus d'une colonne a des réglages tablette et mobile ; les colonnes latérales passent sous la liste.

## 9. Limites assumées (non simulées)
- **Pas de tri choisi par le visiteur** : le moteur n'en propose pas (ordre fixé : récent d'abord). Aucun faux contrôle de tri.
- **Filtres** : catégories d'articles seulement (`?categorie=`) ; pas de filtres combinés ni par attribut.
- **Image de couverture d'archive** : la catégorie n'a pas d'image associée dans les données ; aucun modèle n'en invente.
- **Pagination** : numéros ; pas de « charger plus » ni de défilement infini dans cette bibliothèque.
- **Archives de types de contenus personnalisés** : non prises en charge par le moteur ; **produits** : catégorie séparée « Archive de produits » (`product_archive`).
- **Maçonnerie** : non prise en charge ; remplacée par les compositions « Une et brèves » et « Article en grand puis grille ».
- Les compositions « Article en grand » et « Une et brèves » utilisent des boucles séparées : seule la liste du bas se pagine.

## 10. Tests
`tests/theme-builder-archives-bibliotheque.test.js` : 100 modèles, clés et noms uniques, anciens modèles disparus, 10 compositions par contenu, aucun document identique, ≥ 50 structures, un seul titre principal, boucle réelle qui suit l'archive avec état vide, liens réels, responsive, pas de contrôle décoratif, filtre branché ; puis sur un vrai serveur : aperçu = vignette (100), archive de catégorie (filtrage, isolation entre sites, pagination), archive d'étiquette, barre de catégories réellement filtrante, état vide, remplacement d'un modèle par un autre, pas de second en-tête.

## 11. Ajouter ou modifier un modèle
Ajouter un contenu dans `CONTENTS` (puis une valeur dans `SKIN_OFFSET`) ou une composition dans `COMPOSITIONS` ; garder 100 au total (le test impose exactement 100) ; lancer `node --test tests/theme-builder-archives-bibliotheque.test.js`.
