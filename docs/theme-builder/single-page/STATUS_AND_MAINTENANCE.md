# Page individuelle — état livré et maintenance (mis à jour le 10 novembre 2026)

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

## 6. Mise à jour du 10 novembre 2026 (v2.1)
* **Modes d'identité** : « indépendante » (par défaut), « héritée du site », « hybride » (le modèle garde fonds, textes et polices, mais prend la couleur de marque du site), choisis à l'insertion (liste déroulante à côté de « Utiliser ce modèle ») et convertibles ensuite sans perte (`POST …/api/modeles/:id/identite`, `src/themeBuilder/identity.js`, `catalog/identityModes.js`, colonne `identity_mode` de la migration 143, déjà en place pour la fiche produit). La portée CSS d'identité (variables `--kw-*` / `--lp-*`) est posée **une seule fois sur la racine du modèle** ; elle est retirée en mode hérité et privée de la couleur de marque en mode hybride ; le retour au mode indépendant la restitue à l'identique (testé). Test : `tests/theme-builder-page-individuelle-identite.test.js` (6 tests).
* **Racine unique** : chaque modèle est une colonne sans écart (`gap: 0`) : les espacements du site n'entrent plus entre les bandes ; fond et police de l'identité posés sur la racine.
* **Visuels vectoriels originaux** (`v2/art.js`) : 16 compositions géométriques à plat (arches, blocs, vagues, points, soleil, escaliers, triangles, anneaux, bandes, feuilles, ville, orbite, mosaïque, rubans, cubes, contours), aux couleurs de l'identité, déterministes (graine = clé du modèle), sans photo ni ressource tierce ni dégradé (le filtre de sécurité du widget HTML supprime dégradés et motifs). Ils remplacent les anciens emplacements vides et ajoutent un bandeau d'ouverture aux modèles qui n'avaient aucun visuel (sauf 8 modèles volontairement sobres). L'auteur peut remplacer n'importe quel visuel par sa propre image.
* **Directions artistiques dessinées à la main** : 40 palettes nommées (noir et or, vert sapin et crème, violet minuit, safran et encre, canard et sable, etc.) et paires de polices de la bibliothèque locale affectées concept par concept (`v2/directions.js`), à la place des palettes calculées automatiquement.
* **Défauts découverts à la relecture des captures et corrigés** : texte brut `<p>…</p>` affiché dans les boîtes d'icône, frises et onglets (défaut présent depuis la première bibliothèque, non vu par les contrôles automatiques) ; faux compteurs « 0 » ; bandeaux défilants blancs à texte clair ; visuels rognés ; étiquettes en majuscules espacées (`k.L`) remplacées par une étiquette sobre ; un chevauchement volontaire de bandes retiré.
* **Outils** : `scripts/captures-page-individuelle.js` (captures PNG de l'aperçu réel), `scripts/planche-identites.js` (planche des 100 identités).
* Contrôles du 10 novembre : audit statique 100/100 (0 défaut), isolement Chrome 100 modèles 0 fuite, 16 tests serveur, 6 tests d'identité, rendu Chrome 100 modèles × 3 largeurs sans défaut.
* **Limites** : la liste de choix du mode d'identité existe à l'insertion ; il n'y a pas encore de bouton dans l'éditeur pour convertir après coup (l'API existe) ; les feuilles de thème (packs) restent à mesurer ; les ~15 concepts nouveaux (application, médical, luxe, architecture…) du cahier des charges du 10 novembre n'ont pas été produits : les 100 concepts d'origine sont conservés ; les visuels sont géométriques, pas photographiques ; relecture humaine limitée à un échantillon de captures.
