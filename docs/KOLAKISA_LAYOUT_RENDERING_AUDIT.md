# Audit du moteur de mise en page et de rendu Web

*Mission 3. Branche `moteur-mise-en-page` (partie de `956670b`). Les rapports des missions 1 (`KOLAKISA_CORE_*.md`) et 2 (`KOLAKISA_PROPERTY_CONTROLS_*.md`) ont été lus ; leurs résultats sont réutilisés, pas refaits.*

## 1. Ce qui a été audité (code et comportement réel)

| Zone | Fichiers lus / mesurés |
|---|---|
| Modèle et validation | `src/marketing/pages/nodes.js` (`STYLE_PROPS`, `normalizeStyles`, `declarations()`, `pageCss()`), `sections.js` |
| Gabarits (communs canevas / publié) | `views/marketing-public/_sections.ejs`, `_node.ejs`, `_node-safe.ejs` |
| Éditeur | `public/js/page-builder.js` : `setStyles`, `previewStyles`, `patchCanvas`, `parentLayout`, `inheritedValue`, contrôles |
| Navigateur réel | Chrome piloté par Playwright : styles calculés, tailles réelles, publié vs canevas, déphasages |

## 2. Chemin d'une propriété de mise en page (vérifié à chaque étape)

contrôle → `setStyles` (valeur vide = suppression de la clé) → document (`styles[écran]` / `states[état]`) → **aperçu immédiat** (style en ligne, voir §4) → `POST /rendu` → `pageCss()` → iframe patchée → `PUT /brouillon` (une seule fois par geste) → publication : **même** `pageCss()` et **mêmes** gabarits. Il n'y a **pas** de second moteur : le canevas et la page publiée partagent le code de rendu ; seul le drapeau `isBuilder` ajoute les identifiants de sélection.

## 3. Constats vérifiés (preuves : tests nouveaux)

| Constat | Résultat | Preuve |
|---|---|---|
| Parité canevas ↔ publié | **Identique** : chaque propriété calculée (110 propriétés CSS) et chaque dimension réelle de 14 éléments (flex qui retourne à la ligne, grille avec placements, position absolue, débordement, imbrication, contenus longs, image) sur ordinateur, tablette et mobile | `layout-parite-canevas-publie-navigateur` (3/3) |
| Priorité des règles | Les 109 propriétés testables × 5 types d'éléments (conteneur, titre, bouton, image, texte) sont appliquées telles que publiées : aucune règle du thème n'écrase le réglage de l'auteur | `layout-priorite-css-navigateur` (5/5) |
| Fuite de styles entre widgets | Aucune : un réglage par élément, lu uniquement sur cet élément (même test) | idem |
| Latence des choix à mots-clés | **Défaut D1** : direction, alignement, justification, affichage, retour à la ligne, alignement du texte… attendaient le rendu serveur (130 – 270 ms) alors que les nombres / couleurs avaient un aperçu immédiat | mesures du rapport de performance |
| Hauteur d'un conteneur vide | Zone d'édition (min. 245 px, fond léger, contour pointillé) **voulue** : conteneur vide = vraie zone de dépôt | parité (écart attendu, listé) |
| Élément masqué | Visible en transparence dans l'éditeur et **occupe sa place** dans la mise en page de l'éditeur (+35 px mesurés en colonne) ; absent de la page publiée | parité (page d'essai sans masqué) ; documenté en limite |

## 4. Défaut corrigé

**D1 — aperçu immédiat limité aux nombres et couleurs.** `PREVIEW` ne couvrait que des valeurs numériques / hexadécimales ; les listes de mise en page passaient par un aller-retour serveur. Correction : `PREVIEW_ENUM` (24 propriétés dont le CSS généré est exactement `propriété: valeur`), valeur acceptée seulement si elle fait partie des options du modèle (la liste que le serveur accepte). Le rendu serveur qui suit remplace l'aperçu par le même CSS (vérifié : aucun retour en arrière). Latence mesurée (clic → canevas, médiane) : **130 – 268 ms avant → 84 – 100 ms après** selon la taille de la page.

## 5. Non constaté (donc non modifié)

Aucune divergence de style entre canevas et publié ; aucune collision de sélecteurs ; aucun défaut d'ordre des règles responsive sur les cas testés. Le moteur de mise en page est donc **consolidé par des preuves**, pas réécrit.

## 6. Test intermittent signalé par la mission 2

`controles-numeriques-navigateur` : voir le rapport de tests. **Non reproduit** en 5 exécutions (2 groupées avec les mêmes fichiers, 3 sous charge Chrome). La cause reste **non démontrée** ; l'hypothèse « charge de la machine » n'est ni confirmée ni infirmée.
