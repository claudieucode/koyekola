# Palier 14 — Implémentation

Principe : corriger la cause structurelle dans la règle CSS existante (pas de nouvelle feuille, pas de `!important`, pas de réduction de police, pas de contenu masqué), sans toucher au moteur responsive par site ni aux valeurs enregistrées.

| Défaut | Correction | Fichier |
|---|---|---|
| R1 `/blog` : recherche hors fenêtre | `min-width: 0` sur `.blog-search` : le formulaire peut rétrécir sous la largeur intrinsèque de ses enfants (le champ avait déjà `min-width: 0`) | `public/css/style.css` |
| R2 admin : recherche hors fenêtre à 320 px | `.mk-ar-search` : `flex-wrap: wrap; min-width: 0` ; champ `flex: 1 1 200px; min-width: min(200px, 100%)` (200 px conservés quand la place existe, le bouton passe à la ligne sinon) | `public/css/cms.css` |
| R3 champ de recherche de l'en-tête 18 px | Le padding vertical (9 px) passe du pill au champ : même hauteur visuelle, cible de 37 px | `public/css/style.css` |
| R4 liens du tableau de bord 22 px | `min-height: 24px` + `inline-flex` sur `.dash-section-head a` et `.g-back` | `public/css/dashboard.css` |
| R5 pastilles du carrousel 10 px | Bouton de 24×24 px, point de 10 px dessiné par `background-clip: content-box` (espacement des points : 16 → 24 px, seul changement visuel) | `public/css/landing.css` |

## Points de rupture concernés
Aucune valeur modifiée. R1/R2 se manifestent sous 400 px (contenu plus étroit que la largeur intrinsèque du formulaire) ; la règle `@media (max-width: 860px) { .blog-search { flex: 1 1 100% } }` existante est conservée. Les points de rupture par site (1023 / 767 / 1920) ne sont pas concernés.

## Outils et tests ajoutés
- `scripts/ux/matrice-responsive.js` : matrice 30 pages × 8 tailles × Chrome + Firefox (BiDi).
- `tests/palier14-responsive-navigateur.test.js` : 5 tests (Chrome + Firefox) ; **3 échouent sans les correctifs (R1 Chrome 350 px pour 320, R2 Firefox 363 px pour 320, R3 18 px), 5 réussissent avec.** Les 2 autres (taille du titre aux trois points de rupture ; aperçu = page publiée sans modification des données) passent avant et après : ils verrouillent un comportement déjà correct.

## Non modifié, volontairement
Éditeur sur petit écran (interface de bureau), barre du haut multi-lignes à 1024 px (voir Limites), tokens/couleurs/typographie, données et modèles des sites, tests existants.
