# En-têtes — deuxième refonte : audit et décisions (4 novembre 2026)

Cette refonte part de la bibliothèque livrée le 3 novembre (`kolakisa-header-audit.md`, `kolakisa-header-library.md`). Elle ne la jette pas : elle mesure son écart avec le cahier des charges « identité indépendante, secteurs, comportements » et comble ce qui peut l'être **sans contrôle décoratif**.

## 1. Audit de l'existant (relu dans le code, pas supposé)

| Point du cahier des charges | État avant | Preuve |
|---|---|---|
| Bibliothèque variée | 100 compositions distinctes (10 familles), mais 5 identités seulement ; 12 modèles quasi jumeaux d'un autre de leur famille (mêmes éléments, même famille) | `catalog/header.js` ; mesure de proximité sur les éléments |
| Identité indépendante de l'administration et de la charte | **Partielle (état avant ; traitée ensuite pour les 100 modèles)** : 4 identités sur 5 reprennent les jetons du site (`token:primary`…) ; une seule (Nuit) a des couleurs fixes ; polices limitées à « titres / texte / serif » alors que la bibliothèque locale en compte **1 775** | `kit.js` (`SKINS`), `fontLibrary.js`, `manifest.json` |
| Modèles par secteur (restaurant, école, agence, cabinet, portfolio, média, boutique, SaaS, hôtel…) | **Absents** : familles par structure, jamais par métier | liste des familles |
| Logo, menu, sous-menus, boutons, recherche, compte, panier, réseaux, barre supérieure, hamburger | présents | `item()`, `landing.js` (burger, Échap, focus) |
| Coordonnées | **absentes** (la liste d'icônes existe dans la grammaire, non utilisée) | — |
| Sélecteur de langue, favoris | **impossibles proprement** : aucune version traduite du site public à commuter, aucune fonction « favoris » visiteur | pas de table ni de route |
| Collant, superposé | présents | `partMode`, `_sections.ejs`, `landing.css` |
| Réduction de hauteur au défilement ; transparent → plein au défilement | **absents** (limite documentée) | `kolakisa-header-library.md` §9 |
| Clavier, focus, menu mobile | présents | `landing.js` |
| Responsive (3 largeurs) | mesuré le 3 novembre : aucun débordement | `kolakisa-header-library-verification.md` |
| Interface : aperçu responsive, dupliquer, renommer, publier, archiver, états | **présents** | `theme-builder.js` (« Dupliquer », « Renommer », boutons Ordinateur / Tablette / Mobile) |
| Migration des anciens modèles | les modèles sont des **copies indépendantes** dans les sites ; le catalogue est du code | `catalog/use.js` |

## 2. Défaut trouvé pendant la refonte

Les polices propres à un modèle **n'atteignaient pas les liens ni les boutons** : le site impose sa police par `.lp-site a { font-family: var(--kw-font-link) }` et `.lp-site .kw-btn`, dont la spécificité l'emporte sur la police posée sur le widget parent.
Mesuré dans Chrome : le menu du modèle SaaS restait en Figtree alors que la police Inter était déclarée. Correction : la police est posée sur les **parties** du widget (`parts.link` du menu et du compte, `parts.text` du logo — mécanisme de `parts.js`), dont le sélecteur l'emporte.

## 3. Risques de régression et réponse

* **En-têtes publiés** : aucune ligne en base n'est modifiée ; retirer un modèle du catalogue ne touche aucune copie.
* **Clés retirées** : 12 clés répondent désormais 404 ; elles n'étaient référencées que par des tests (adaptés).
* **Rendu public** : la propriété `headerFx` est facultative ; sans elle, `partMode` et `_sections.ejs` rendent comme avant.
* **Nom** : `scrollFx` existe déjà (effets de mouvement d'un élément, `motion.scrollFx`) ; la nouvelle propriété s'appelle `headerFx` pour ne pas les confondre.
* **Catalogue « plat »** : `catalog/index.js` accepte des identités supplémentaires (`d.skins`) ; les autres types ne les voient pas.

## 4. Architecture retenue

1. **Identités** : une liste `IDENT` par catalogue plat (couleurs fixes + polices de la bibliothèque) ; le kit les consomme comme les `SKINS`.
2. **Secteurs** : 12 modèles répartis dans leurs familles, **à la place** des 12 plus redondants → le total reste 100. **Les 88 autres** reçoivent 22 palettes fixes par ambiance (`IDENT2`), clés conservées.
3. **Comportements** : propriété de conteneur `headerFx` (grammaire fermée, validée), lue par le rendu ; CSS et un écouteur passif dans `landing.js`.
4. **Éléments** : code `contact` (liste d'icônes, textes d'exemple) ; ni langue ni favoris tant que le site n'a pas la fonction derrière.

## 5. Ce qui n'est PAS fait (volontairement)

* Sélecteur de langue et favoris (voir §1).
* Pointeurs de menu configurables et sous-menus à plusieurs niveaux (grammaire `menu`).
* Réduction **d'une seule rangée** d'un en-tête à plusieurs rangées : l'effet porte sur toutes les rangées du conteneur.
* Palettes **sur mesure par modèle** pour les 88 modèles non sectoriels : ils partagent 22 palettes (de 3 à 5 modèles chacune, jamais deux modèles de même famille et de même ambiance consécutifs dans l'affectation d'origine) ; seuls les 12 sectoriels ont une identité à eux seuls.
