# Héritage et remplacements des styles dans Kolakisa (audit du code, 8 novembre 2026)

Tout ce qui suit a été constaté dans le code ou mesuré ; rien n'a été modifié.

## 1. Les couches réelles, de la plus faible à la plus forte
| # | Couche | Où | Spécificité |
|---|---|---|---|
| 1 | Valeurs par défaut du moteur | `public/css/landing.css`, règles `:where(...)` | 0 (volontairement) |
| 2 | Jetons du site (`DEFAULT_TOKENS` → variables `--kw-…`) : couleurs, 4 rôles de polices, tailles de texte, espacements, rayons, boutons, champs | `src/marketing/pages/tokens.js`, émis dans `#kw-site-theme` | variables, héritées |
| 3 | Style de base du corps | `.lp-site { font-family: var(--kw-font-body) … }` | (0,1,0) |
| 4 | **Feuille du thème (« pack ») actif** | `/theme-packs/<clé>/style.css`, tout sélecteur préfixé `body[data-kw-pack="…"]` | **(0,1,1) à (0,2,x)** |
| 5 | **Valeurs du nœud du modèle** | `.kw-n-<id> { … }` (parties : `.kw-node.kw-n-<id> <sélecteur>`) | (0,1,0) à (0,2,x) |
| 6 | CSS personnalisé du site | `#kw-site-custom`, chargé en dernier | selon l'auteur |
Les couches 4 et 5 se chevauchent : voir § 3.

## 2. Pourquoi les modèles prennent l'identité du site (cause principale, mesurée)
Mesure faite sur les catalogues réels (`Catalog.build`, 100 modèles par type) :

| Type | Couleurs en `token:*` (suit le site) | Couleurs en valeur fixe | Polices « site » | Polices de la bibliothèque (fixes) | Modèles qui dépendent du site |
|---|---|---|---|---|---|
| En-tête | 0 | 1 705 | 0 | 726 | 0 / 100 |
| Pied de page | 0 | 1 395 | 0 | 1 037 | 0 / 100 |
| **Page individuelle** | **1 814** | 435 | **486** | **0** | **99 / 100** |
| Article individuel | 585 | 139 | 204 | 0 | 87 / 100 |
| Archives | 1 155 | 342 | 661 | 0 | 100 / 100 |
| Résultats de recherche | 1 528 | 452 | 794 | 0 | 97 / 100 |
| Page 404 | 1 178 | 213 | 400 | 0 | 99 / 100 |
| Produit / archive produit | 902 / 880 | 223 / 132 | 660 / 126 | 0 | 100 / 100 |

Causes (code lu) :
1. **Les « identités » des catalogues de contenu sont des alias du site.** `catalog/kit.js` définit 5 identités dont quatre (`clair`, `marque`, `editorial`, `doux`) écrivent `token:background`, `token:text`, `token:primary`, `token:surface`… et des rôles de police (`body`, `heading`, `serif`) : tout vient du site. Seule `nuit` pose des teintes fixes, mais son accent reste `token:accent`. Les identités « Clair/Marque/… » ne sont donc que des *dispositions* de la charte du site, pas des chartes.
2. **Le site par défaut a la charte Kolakisa.** `DEFAULT_TOKENS` : primaire `#0277b6`, secondaire `#0b2a40` (bleu marine), accent `#f59e0b`, polices Bricolage Grotesque + Figtree. Un site neuf — et donc tout modèle en `token:*` — a l'aspect de Kolakisa.
3. **Les en-têtes et pieds de page ont déjà résolu ce problème** : `catalog/identities.js` définit des identités à **valeurs fixes** et à polices `font.<id>` de la bibliothèque locale (« jamais la charte du site ni celle de l'administration »). Preuve que le moteur sait faire ; le mécanisme (`ownSkins`, `skinKey`) n'a simplement pas été appliqué aux autres types.
4. **Aucun mode « suivre / ne pas suivre le site »** n'existe : un modèle est soit entièrement en jetons, soit entièrement en valeurs fixes, et la copie « Utiliser » fige le choix.

## 3. Contamination par le CMS et par les thèmes (examinée)
| Hypothèse | Constat |
|---|---|
| CSS de l'administration dans le rendu public | **Non observée** : la page publique (`views/marketing-public/landing.ejs`) ne charge que `landing.css`, les feuilles du site, les polices et l'éventuel thème. Le canevas de l'éditeur est la même page générée par le serveur. À reconfirmer en navigateur à l'étape 3. |
| Styles de base du moteur qui écrasent le modèle | **Non** : écrits en `:where()` (spécificité 0), corrigés lors de l'audit de rendu du Theme Builder |
| **Feuille d'un thème (pack) actif qui écrase un modèle** | **Oui, possible** : les packs sont limités à `body[data-kw-pack="clé"]` mais n'utilisent pas `@layer` ; une règle comme `body[data-kw-pack="amorce"] a { color: … }` (spécificité 0,2,1) l'emporte sur `.kw-n-<id>` (0,1,0). 14 packs ciblent déjà des classes `.kw-…`. À mesurer sur chaque pack |
| CSS personnalisé du site | Chargé après tout le reste : il peut tout écraser (comportement normal, à documenter) |
| Valeurs qui disparaissent à la sauvegarde / au rechargement | Non constaté ; les valeurs d'un nœud sont stockées dans `styles.desktop/tablet/mobile` et reproduites à l'identique (tests de rendu des propriétés) |

## 4. Ce qui existe et peut servir
* Valeurs fixes + polices de la bibliothèque dans un nœud : déjà gérées (`fontFamily: "font.lato"`, couleurs hexadécimales). Polices : seules celles réellement utilisées sont chargées (`fontFacesFor`).
* Couleurs personnalisées du site (`customColors`, jusqu'à 30, référence `token:c-…`) : c'est un lien vers le site, pas une identité de modèle.
* Aucune variable CSS à la portée d'un modèle, aucun champ « identité » dans le document d'un modèle, aucun bouton « suivre le site ».

## 5. Règles de priorité proposées (voir `TARGET_ARCHITECTURE.md`)
1. Valeur posée par l'utilisateur sur un élément (la plus forte).
2. Identité du modèle (portée sur le modèle), en mode « indépendant ».
3. Jetons du site, en mode « suit le site » (ou pour tout réglage laissé vide).
4. Défauts du moteur.
Les feuilles de thème (packs) et le CSS personnalisé ne doivent jamais passer devant les couches 1 et 2 d'un modèle indépendant : à garantir par `@layer` (packs dans une couche inférieure), sans `!important`.
