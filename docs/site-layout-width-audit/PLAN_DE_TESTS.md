# Plan de tests

Outils existants du dépôt : `scripts/audit-interface.js`, `scripts/audit-qualite.js`, `scripts/audit-responsive.js`, `scripts/audit-editeurs.js`, tests `tests/*navigateur*` (Chrome), `tests/header-*.test.js`. À lancer **avant** l'étape 1 pour avoir un état de référence (état actuel : plusieurs fichiers `tests/header-*` sont modifiés dans l'arbre de travail, non committés ; à comprendre avant de comparer).

## Matrice de résolutions
320 · 375 · 768 · 1024 · 1280 · 1440 · 1920 · 2560.

## Mesures à chaque étape
1. `document.documentElement.scrollWidth <= clientWidth` (aucun défilement horizontal).
2. Largeur du fond (`getBoundingClientRect`) de `.kw-theme-header`, `.kw-theme-footer`, `.site-header`, `.site-footer` = largeur de la fenêtre moins la barre de défilement.
3. Largeur du contenu intérieur et marges gauche/droite.
4. Nombre de colonnes des grilles.
5. Images : rapport largeur/hauteur inchangé.
6. Un seul `<header>` / `<footer>` Theme Builder dans le DOM.

## Pages témoins
Accueil, page Page Builder avec pack, page sans pack, article, archive, recherche, fiche produit, catalogue boutique, panier, formulaire de contact, page de connexion.

## Contextes
Site principal ; un second site (domaine) pour l'isolation ; thème avec et sans `--pk-max` ; en-tête superposé/collant ; menu mobile ouvert.

## Accessibilité
Navigation clavier de l'en-tête et du pied ; contraste non modifié (couleurs non touchées) ; zoom 200 % sans perte de contenu.

## Comparaison avant/après
Captures par page témoin et résolution, comparées étape par étape.

Rien n'est déclaré « conforme WCAG 2.2 AA » sans ces vérifications exécutées.
