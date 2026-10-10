# KOLAKISA — Rapport de non-régression de l'éditeur (2026-10-10)

Complète `KOLAKISA_EDITOR_EXISTING_SYSTEM_MATRIX.md` et `KOLAKISA_EDITOR_PROPERTY_AUDIT.md`. Tous les chiffres viennent d'exécutions réelles du jour (Chrome réel pour les tests « navigateur »).

## Passe complète après les lots (états, accélération, dimensions intrinsèques)

Familles rejouées en séquence : `editeur-*`, `site-*`, `page-builder-*`, `widgets-*`, `effets-*`, `inspecteur-*`, `controles-*`, `cms-pages*`, `marketing-pages-atterrissage`, `blog-editeur-texte`.
**732 tests : 729 réussis, 3 échecs**, expliqués :

| Échec | Cause | Suite |
|---|---|---|
| `controles-numeriques-chrome` : glissement à la souris sur le libellé | **préexistant** : échoue aussi avec le code d'avant (vérifié le 10/10 avant toute modification de ce lot) | non corrigé (hors périmètre), signalé |
| `editeur-canvas-proprietes-restantes` : garde-fou « toute propriété de STYLE_PROPS est vérifiée quelque part » | **attendu** : la nouvelle propriété `transitionEasing` devait avoir son test | cas ajouté (« linéaire » → `transition-timing-function`), fichier rejoué : réussi |
| `editeur-canvas-fond-pleine-largeur` : le mode se choisit dans l'Inspecteur | **instabilité sous charge** (machine partagée) : réussi en rejouant le fichier seul | aucune correction |

## Tests ajoutés ou étendus ce jour pour l'éditeur

`editeur-controles-complets-navigateur` (5) · `editeur-menu-regles-navigateur` (13) · `editeur-champ-numerique-contrat-navigateur` (5) · `editeur-fleches-numeriques-navigateur` (7) · `editeur-mode-switch-navigateur` (9) · `editeur-curseurs-apparence-navigateur` (4) · `editeur-ecart-curseur-navigateur` (6) · `editeur-raccourcis-navigateur` (4) · `widgets-contrat` (6).

## Ce qui n'a pas été testé

Firefox et Safari ; l'accessibilité page par page ; 500 éléments (la limite du produit est 400) ; les écrans tactiles.
