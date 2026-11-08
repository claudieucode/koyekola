# Page individuelle — état livré et maintenance (8 novembre 2026)

## 1. Ce qui est en service
* La catégorie **Page individuelle** contient **100 modèles** (15 familles : accueil 7, à propos 7, services 7, contact 7, vente 7, portfolio 7, institutionnel 6, éducation 6, communauté 6, tarifs 7, aide 6, événements 7, local 7, personnelles 6, créatif 7). Ils remplacent les anciens (assemblage ouverture × corps × conclusion).
* Chaque modèle est une **conception écrite à la main** (`src/themeBuilder/catalog/single_page/v2/g01.js` … `g10.js`) avec **sa propre identité graphique en valeurs fixes** : couleurs, polices de la bibliothèque locale, rayons et boutons. Les directions artistiques sont dans `directions.js` (propositions du plan, § 5 de `100_TEMPLATES_DIVERSITY_PLAN.md`) ; les couleurs dérivées (texte discret, fond alterné, filet, texte sur accent) sont calculées par `ID2` dans `h.js` avec garantie de contraste.
* Rien n'est supprimé chez les utilisateurs : « Utiliser » copie le modèle dans le site. Les pages et modèles déjà créés ne sont pas touchés. Les anciennes clés du catalogue n'existent plus (`Catalog.find` renvoie `null`).

## 2. Comment l'indépendance graphique est obtenue (sans nouveau moteur)
1. Les éléments portent leurs couleurs et polices en **valeurs fixes** (aucun `token:*`, aucun rôle de police du site).
2. Les composants composés (icônes, cartes retournables, compte à rebours, titre animé, profils…) lisent des variables CSS `--kw-*` et `--lp-*`. Chaque **racine de section** du modèle les **redéfinit** avec l'identité du modèle (réglage « CSS » du nœud, `scopeCss` dans `h.js`). Le site n'est donc jamais lu à l'intérieur du modèle.
3. Pour qu'un modèle **suive** la charte du site, il suffit de retirer ce CSS de portée et les valeurs fixes de la racine : la bascule volontaire hériter / indépendant **n'a pas encore d'interface** (voir § 5).
4. Les polices : seules celles réellement utilisées par un modèle sont chargées (`fontFacesFor`), 2 au plus par modèle.

## 3. Contrôles automatiques
| Contrôle | Commande | Résultat du 8 novembre |
|---|---|---|
| Statique : 100 exacts, noms/clés uniques, aucune dépendance au site, polices de la bibliothèque, contraste (texte 7:1, discret 4,5:1, texte sur accent 4,5:1), un H1 et un `postcontent`, aucun élément d'article, aucune donnée inventée, grilles repliées, grammaire du Page Builder, similarité de structure < 0,70 | `node scripts/audit-page-individuelle.js --all` | 100 / 100, 0 défaut |
| Indépendance dans Chrome : chaque modèle est rendu sur un site aux couleurs/polices/rayons « pièges », puis sur un site opposé ; tout style calculé qui change est une fuite | `node scripts/audit-page-individuelle-isolement.js` | 100 modèles, 0 fuite |
| Serveur réel : utilisation des 100, publication, conditions, isolation, formulaire du site | `node --test tests/theme-builder-page-individuelle-100.test.js` | 16 / 16 (un délai dépassé sous forte charge, réussi seul en 15 s) |
| Chrome 1280 / 820 / 390 px : débordement, chevauchement, H1, texte coupé | `node --test tests/theme-builder-page-individuelle-navigateur.test.js` | 100 modèles, 0 défaut (les bandeaux défilants, qui défilent volontairement dans un cadre qui découpe, ne comptent pas comme débordement) |

## 4. Ajouter ou modifier un modèle
1. Écrire la mise en page dans le fichier du groupe (`L(dir(n), "famille-nom", …)`), en utilisant les aides de `h.js` (`sect`, `band`, `W`, `H1`, `content`, `slot`…) ; la clé commence par la famille (`accueil-`, `apropos-`, …).
2. Utiliser `W(k, …)` pour tout composant (il pose la police et la couleur de l'identité) et `sect` / `band` pour les racines (elles posent la portée d'identité).
3. Aucune image ni vidéo ni galerie fictive : utiliser `slot(k, "…")` (emplacement avec consigne) ; l'auteur le remplace.
4. Lancer l'audit statique, puis le contrôle d'isolement, puis les deux tests. Le total doit rester 100.

## 5. Limites connues
* **Bascule hériter / indépendant** : le mécanisme existe (portée CSS retirable) mais le bouton n'est pas fait ; le scénario « passer en héritage puis revenir » n'est donc pas testé.
* **Espacements et tailles de texte** : ceux du site s'appliquent encore (seuls couleurs, polices, rayons, boutons sont indépendants).
* **Thèmes (packs)** : la feuille d'un thème actif peut passer devant le style d'un modèle (pas de `@layer`) ; le contrôle d'isolement a été fait sans thème actif.
* **Emplacements de visuels** : les galeries, carrousels, vidéos et listes de lecture exigent de vraies images : les modèles fournissent un emplacement à remplacer.
* **Modèles à module** : l'accueil boutique et la page produit n'affichent grille et achat que si le module Commerce est actif ; l'offre de cours (`courselist`) dépend du module Cours.
* **Compte à rebours** : date fictive lointaine (2099) à remplacer, signalée dans le modèle.
* **Réseaux sociaux** : liens génériques vers les pages d'accueil de Facebook et LinkedIn, à remplacer.
* **Contrôle visuel** : automatique (3 largeurs) ; pas de relecture humaine des 100 rendus ; 1920 et 1280 px non testés séparément.
* **Champs personnalisés de page** : non créés.
