# Palier 14 — Rapport de tests

Environnement : macOS 12, Node 24, Chrome (Playwright), Firefox 153 (WebDriver BiDi), `--test-concurrency=1`. Les Paliers 13 et 14 sont validés **ensemble** sur le même arbre de travail (branche `palier13`), car les correctifs CSS du Palier 14 ont été ajoutés pendant la régression du Palier 13.

## Tests propres au palier
`tests/palier14-responsive-navigateur.test.js` (Chrome + Firefox) : 5 tests.
- **Sans les correctifs (arbre d'origine, worktree jetable) : 3 échouent** (R1 « la page déborde (350px) » Chrome 320 px ; R2 « firefox 320px : la page déborde (363px) » ; R3 « champ de l'en-tête 18px de haut »), 2 réussissent.
- **Avec : 5 / 5.** Les 2 tests qui réussissent aussi avant (taille du titre 40 / 30 / 20 px aux trois points de rupture ; aperçu = page publiée sans modification des données) verrouillent un comportement déjà correct.
- Un lot de 252 tests exécuté en parallèle d'autres mesures navigateur a produit un dépassement de délai de 30 s sur ce fichier (« cibles tactiles ») ; rejoués seuls : 10 / 10 (avec les 5 tests du Palier 13). Cause non démontrée (charge machine).
- **Edge (Chromium)** : non exécutable, le navigateur se ferme au lancement par Playwright (voir limites).

## Matrice responsive (`scripts/ux/matrice-responsive.js`)
480 chargements (30 pages × 8 tailles × 2 navigateurs). Constats : **134 → 43** ; défilement horizontal du document **4 → 0** (détail dans `KOLAKISA_PALIER14_COMPATIBILITY_MATRIX.md`).

## Régression ciblée élargie (252 tests : CSS, blog, tableau de bord, widgets, thème, conformité)
245 réussis, 7 échoués, 0 annulé, 0 ignoré. Les 7 : 5 **identiques sur `origin/main`** (violet, 2 × ombres, classes orphelines, « parties déclarées »), 2 dépassements de délai des nouveaux tests (réussis isolément, voir ci-dessus).

## Suite complète (646 fichiers) sur l'arbre Paliers 13 + 14
**7 802 tests, 1 690 suites : 7 734 réussis, 53 échoués, 15 ignorés, 0 annulé. Durée 2 h 42.** (Palier 12 : 7 787 tests, 56 échecs.)

Rejeu des 30 fichiers contenant des échecs, sur `origin/main` puis sur la branche : **main 251 tests, 52 échecs ; branche 251 tests, 53 échecs.** Les 52 échecs communs sont préexistants (menus de site à délai de 30 s, CSS orphelin, violet/ombres, inventaire de tables, registre, index de clés étrangères, équivalence des portées de routes…). 

Le seul échec propre à la branche au rejeu : `apparence-styles-navigateur` « erreur serveur et réseau… conflit entre deux sessions ». **Intermittent** : rejoué seul, il a échoué 1 fois sur 3 puis 0 fois sur 13 exécutions de suite ; 0 échec sur 6 exécutions sur `main`. Même motif qu'au Palier 12 (échec dans le run complet, réussite isolée). Cause non démontrée ; ce test porte sur l'enregistrement de la page « styles », qu'aucun fichier modifié ici ne touche. **Je ne peux pas exclure un problème rare de synchronisation d'enregistrement préexistant ; je ne le déclare ni corrigé ni causé par ces paliers.**

Corrigé au passage : `editeur-conformite-widgets` échouait déjà sur `main` (widget « menu » sans menu affecté) ; jeu de données du test corrigé, assertions inchangées (3 / 3).

## Verdict
Aucune régression attribuable démontrée ; **la suite n'est pas entièrement verte** (53 échecs, dont 52 préexistants sur `main` et 1 intermittent).
