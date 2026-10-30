# Palier 15 — Rapport de tests

Environnement : macOS 12, Node 24, Chrome (Playwright), `--test-concurrency=1`. **Machine partagée** : pendant ces exécutions, d'autres sessions lançaient leurs propres suites (charge 10 à 29). Les durées et les dépassements de délai sont donc moins fiables ; tout échec a été rejoué seul et sur `origin/main`.

## Tests propres au palier
`tests/palier15-accessibilite-navigateur.test.js` : 7 tests (A1 titres, A2 repères, A3 erreurs, A4 bandeau, A5 lien d'évitement, A6 contraste, A7 menu Catégories).
- **Sur l'arbre d'origine (copie jetable) : 0 réussi, 7 échoués. Avec les correctifs : 7 / 7.**
- La sonde (`scripts/a11y/audit-accessibilite.js`) : 213 constats à la première exécution → 58 après stabilisation des mesures (mouvement réduit, attente des transitions) → 18 → 0 constat confirmé ; les 18 derniers étaient : A4/A5 corrigés, 4 faux positifs (champs date), titres de l'éditeur (documentés).

## Tests existants modifiés (2)
- `tests/refonte-design-v3.test.js` : `<h3>` → `<h2>` pour le titre de l'état vide de la FAQ (le niveau de titre est le défaut A1).
- `tests/etape0-design.test.js` « bandeaux dégradés » : **échouait déjà sur `origin/main`**. Le test appliquait du texte blanc à tous les dégradés, y compris les dégradés **clairs** de l'éditeur d'articles (sable, brume, aube), qui portent un texte foncé. Il contrôle désormais ces dégradés avec leur propre couleur de texte (≥ 4,5:1) et garde le contrôle blanc d'origine, sans exception de couleur, pour tous les autres. 39 / 39.
- `tests/editeur-conformite-widgets.test.js` (Palier 13) : jeu de données du widget « menu ».

## Suite complète (646 fichiers)
Exécutée sur l'arbre **avec une première version de A4** (qui ajoutait aussi `scroll-padding-bottom`) :
**7 816 tests, 1 693 suites : 7 731 réussis, 54 échoués, 16 annulés, 15 ignorés ; 3 h 20.**

Analyse des écarts avec la suite complète du Palier 14 (53 échecs) :
| Constat | Analyse |
|---|---|
| 17 tests « chaque liste, case et champ… » + « réglages de contenu des éléments » (`controles-contenu-navigateur`), **16 annulés** | Test exhaustif très long annulé par le délai de son parent sous forte charge. **Rejoué seul : réussi**. Non attribuable aux changements |
| `moteur-mouvement-chrome` « CHAQUE animation du catalogue… » | **Régression réelle de ma première version de A4** : `scroll-padding-bottom` décalait `scrollIntoView({block:"center"})`, un élément se déclenchait trop tôt. 3 / 3 en échec sur la branche, 0 / 3 sur `main`. **Corrigé** (suppression de `scroll-padding-bottom`, remplacé par un repli au `focusin`) : 15 / 15 trois fois de suite ; A4 reste vert |
| `cms-urls` « refus : boucle, auto-redirection… » | Échoue aussi sur `origin/main` (même message) : préexistant (apporté par le commit SEO Titan XXXVI) |
| `effacer-donnees` « e-mail non parti… » ; `r9-site-maitre-effets-application` « avant/après la migration… » | Échec dans la suite complète seulement ; au rejeu seul : `effacer-donnees` échoue sur `main` et réussit sur la branche, `r9` réussit sur les deux → intermittents, indépendants des changements |
| 52 échecs communs avec `main` (menus à 30 s, CSS orphelin, violet/ombres, tables, registre, clés étrangères…) | Préexistants, déjà documentés aux Paliers 12 à 14 |
| Disparus : « C : replier/déplier », « E-G : zoom 80/100/120 % », « bandeaux dégradés » | Les deux premiers sont intermittents ; le troisième est corrigé |

## Lot de régression final (26 fichiers, après la dernière modification de `visitor.js`)
Deux exécutions successives du même lot :
- exécution 1 (avant l'ajout du repli au `focusin`) : 349 tests, 345 réussis, 4 échoués, 0 annulé ;
- **exécution 2 (code final) : 349 tests, 343 réussis, 4 échoués, 2 annulés, 0 ignoré.**

Les 4 échecs sont ceux de `refonte-design` (violet, deux × ombres, classes orphelines), **identiques sur `origin/main`**. Les 2 annulés + 1 échec parent (« lisibilité des panneaux sombres », `editeur-contraste-navigateur`) sont un dépassement de délai sous charge : **rejoué seul, 2 / 2 réussis, deux fois de suite** (charge machine 3,7 à ce moment). Le lot contient les tests des Paliers 13 (5), 14 (5) et 15 (7), `moteur-mouvement-chrome` (15), `etape0-design` (39), `rendu-accessibilite-navigateur`, `widgets-accessibilite-navigateur`, `espace-contrastes`, `accordeons-navigateur`, `suivi-visiteurs`.

## Non exécuté
**Pas de seconde suite complète après la correction de A4** (≈ 3 h 20 sous charge) : la modification porte sur un seul fichier (`visitor.js`), couvert par le lot ci-dessus. Ni VoiceOver, ni axe-core/Lighthouse (non installés), ni Firefox/Safari pour ce palier.
