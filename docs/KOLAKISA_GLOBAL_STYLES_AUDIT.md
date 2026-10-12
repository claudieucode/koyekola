# Audit du système de styles globaux et d'apparence

*Mission 5. Branche `styles-globaux` (partie de `2605494`). Rapports des missions 1 à 4 lus ; leurs résultats (priorité CSS, parité canevas / publié, isolation responsive) sont réutilisés.*

## 1. Ce qui existe déjà (lu dans le code)

| Couche | Où | Contenu |
|---|---|---|
| **Jetons du site** (design system) | `src/marketing/pages/tokens.js`, table `mk_sites.tokens` | 10 couleurs (principale, secondaire, accent, fond, surface, texte, discret, succès, avertissement, erreur) + 2 dérivées (`on-primary`, `on-accent`, contraste WCAG) ; ≤ 30 **couleurs personnalisées** (`c-…`) ; 4 rôles de police (titres, texte, boutons, liens) ; échelle typographique h1–h6 / texte / légende / bouton (taille, graisse, interligne + détails) ; espacements xs → xxl ; rayons ; ombres ; bordure ; tailles ; boutons (états normal / survol / clic / focus) ; liens ; listes ; images ; champs de formulaire |
| **Réglages du site** | `siteSettings.js`, `mk_sites.settings` | mise en page, **points de rupture**, fond, visionneuse, transitions, CSS du site, SEO, … et **classes globales** (≤ 40) |
| **Classes globales** | `nodes.js` (`normalizeClassDefs`, `classCss`) | un nom + des styles par écran / état ; un élément en porte une liste dans `classes` |
| **Références** | `token:<clé>` dans les styles, `token:space-md` pour les longueurs | enregistrées telles quelles ; converties en `var(--kw-…)` au rendu |
| **Composants** | `mk_web_components` | sections réutilisables rattachées à un site |
| **Usage des couleurs** | `colorUsage()` | nombre de pages et de références par couleur |

## 2. Ordre de priorité effectif (vérifié dans Chrome, publié et canevas)

`landing.css` (valeurs par défaut) → thème du site (jetons, base typographique, mise en page, **classes globales**) → CSS des éléments (`.kw-n-<id>` : style propre de l'élément, puis valeur de l'écran) → CSS du site → CSS de la page. Preuves : `styles-globaux-navigateur` (classe < style propre ; le style propre garde la priorité même quand la classe change ; réglage non défini par le style propre = celui de la classe) et `layout-priorite-css-navigateur` (mission 3).

## 3. Résultats vérifiés

| Question | Réponse |
|---|---|
| Modifier une couleur du système met-il à jour les éléments qui la référencent ? | **Oui**, publié et canevas |
| …sans toucher une couleur locale identique ? | **Oui** (locale = valeur fixe indépendante) |
| Couleur personnalisée modifiée ? | Oui |
| Classe modifiée → seuls ses porteurs changent ? | Oui ; élément sans classe inchangé |
| Police « Titres » du site réellement appliquée ? | Oui (pile mesurée dans le navigateur) |
| Références conservées après sauvegarde, rechargement, duplication ? | Oui (jamais figées en valeur) |
| Suppression d'une couleur personnalisée encore utilisée ? | Refusée pour les pages et composants ; **défaut D1 pour le reste** |
| Couleurs du système sur une page **hors site** ? | **Défaut D2** |

## 4. Défauts démontrés et corrigés

**D1 — couleur personnalisée supprimée alors que le site la référence.** La garde de suppression ne comptait que les pages et composants. Supprimer une couleur utilisée par une **classe globale, un bouton, un lien, des puces de liste, des champs de formulaire ou le fond du site** était accepté et laissait `token:c-…` orphelin : `var(--kw-c-…)` sans valeur → fond transparent / couleur ignorée, pour tous les éléments concernés. Mesuré : 6 cas sur 7 orphelins. Correction : refus avec le nom de l'endroit (« classes globales », « boutons », …) (`pages/index.js`, `saveSiteDesign`). Test : échoue sans la correction.

**D2 — couleurs du système ignorées sur les pages hors site.** Les couleurs du site étaient écrites `var(--kw-primary)` **sans repli**, alors que les variables ne sont posées que pour les pages d'un site (les longueurs, elles, avaient un repli). Sur une page sans site, choisir « Couleur principale » dans l'éditeur n'avait donc **aucun effet** (texte en couleur par défaut, fond transparent) ; mesuré dans Chrome sur 6 couleurs. La mission 2 ne l'avait pas vu : ses tests contrôlaient le texte du CSS, pas la couleur calculée. Correction : repli sur la valeur d'origine (`var(--kw-primary, #0277b6)`) dans `colorCss` (`nodes.js`) ; les couleurs personnalisées n'ont pas de repli possible (elles n'existent que dans un site). Test navigateur : échoue sans la correction.

## 5. Non constaté

Aucune fuite d'une classe vers un élément qui ne la porte pas ; aucune règle du thème écrasant un style propre ; aucune perte de référence à la duplication.

## 6. Points de vigilance hérités

Suite complète non validée depuis la mission 2 (voir rapport de tests) ; test numérique intermittent de la mission 2 : cause inconnue.
