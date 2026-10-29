# Rapport d'implémentation — widgets

## 1. Fichiers de production modifiés

| Fichier | Changement |
|---|---|
| `public/js/page-builder.js` | **seul fichier de production modifié.** (1) `freeAnchor()` + `pendingAnchors` + `reId()` : la copie d'une « Ancre de menu » reçoit un nom libre (D4) ; `reIdAll()` réinitialise les noms réservés. (2) Champ « Lignes surlignées » du widget Code : vérification avec les règles du serveur, message, valeur conservée (D1). (3) `repeatEditor(…, noLast)` et fil d'Ariane : explication à la place du champ muet du dernier niveau (D2). (4) `pairSet()` appliqué à la fenêtre, à la boîte retournable et à l'offre tarifaire (D3). (5) `renderCanvas` : le cadre en attente est oublié (`swapping = null`, `onload = null`) avant d'être retiré, ce qui supprime la ré-entrance qui détruisait le canevas (D5). |

Aucun changement de `src/` (modèle, validateurs, rendu, publication), aucune migration, aucune dépendance ajoutée.

## 2. Tests et outils ajoutés ou modifiés

| Fichier | Nature |
|---|---|
| `tests/widgets-helpers.js` | **nouveau** — contenu réaliste de chaque widget (partagé) : `creatable`, `OVER`, `EXTRA`, `build`, `stress` |
| `tests/widgets-editeur-navigateur.test.js` | **nouveau** (3 tests) — cycle de vie de 88 éléments dans l'éditeur réel |
| `tests/widgets-publie-navigateur.test.js` | **nouveau** (3 tests) — page publiée, 8 largeurs × 2 contenus |
| `tests/widgets-interactions-navigateur.test.js` | **nouveau** (19 tests) — interactions publiées |
| `tests/widgets-liens-navigateur.test.js` | **nouveau** (3 tests) — liens |
| `tests/widgets-accessibilite-navigateur.test.js` | **nouveau** (4 tests) — accessibilité de base |
| `tests/widgets-securite-navigateur.test.js` | **nouveau** (4 tests) — charges hostiles |
| `tests/widgets-performance-navigateur.test.js` | **nouveau** (5 tests) — mesures par taille de page + mémoire |
| `tests/widgets-corrections-navigateur.test.js` | **nouveau** (6 tests) — un test par défaut corrigé (D1, D2, D3 ×2, D4, D5) |
| `tests/controles-contenu-navigateur.test.js` | **modifié** — le mode `CONTENU_COMPLET=1` démarre enfin (contenu de départ des éléments à choix ; formation / formulaire exclus). Mode par défaut (16 représentatifs) inchangé. |
| `tests/editeur-manipulation-directe-navigateur.test.js` | **modifié** — deux modes de mesure **optionnels** (`GESTE_MIXTE=1`, `GESTE_TYPE=<type>`) pour le test de fluidité ; **le seuil n'a pas été touché** (`over50 ≤ 1`), le mode par défaut est identique. |
| `scripts/build-widgets-docs.js` | **nouveau** — génère `KOLAKISA_WIDGETS_INVENTORY.md` et `KOLAKISA_WIDGETS_FUNCTIONAL_MATRIX.md` à partir du registre et des journaux de tests |

## 3. Pourquoi ces choix

* **Aucun nouveau moteur** : tout passe par `change()` (historique, regroupement, `patchCanvas`), `setProp()`, `toast()` et `repeatEditor()` existants.
* **D4** : l'ancre unique est une règle utile (un lien `#tarifs` doit viser un seul endroit) ; la correction la respecte au lieu de la supprimer.
* **D1** : vérifier côté éditeur avec la même règle que le serveur (et non élargir le serveur) conserve la sécurité et donne un message immédiat. Un test de cohérence serveur / interface existe déjà pour les nombres (mission 2) ; ces règles-ci sont copiées avec un commentaire qui le dit.
* **D2/D3** : on explique au lieu de cacher un champ ou d'inventer un comportement ; le serveur continue de décider.

## 4. Fonctionnalités préservées (vérifiées par la régression ciblée)

Duplication (identifiants neufs, interactions remappées), annuler / rétablir, enregistrement avec révision et `saveNow()` (mission 7), redimensionnement (mission 6), styles globaux et références `token:` (mission 5), points de rupture (mission 4), propriétés (missions 2 et 3). Voir `KOLAKISA_WIDGETS_TEST_REPORT.md`.

## 5. Limites de l'implémentation

* Les règles de « Lignes surlignées » sont **dupliquées** entre le validateur serveur et l'éditeur (comme les bornes numériques avant la mission 2) : si le serveur change, l'éditeur doit suivre. Pas de test de cohérence automatique pour ce champ.
* `pairSet` ne couvre que trois widgets (voir G2).
* **D5** : le test de non-régression garde l'invariant (un seul cadre de canevas, dernière saisie visible) mais **ne provoque pas la course à coup sûr** (dépend du minutage de Chrome) ; la preuve statistique est la mesure à 380 widgets (voir le rapport de performance). Une garde plus déterministe demanderait d'exposer `reloadCanvas` / `renderCanvas`, ce qui n'a pas été fait pour ne pas élargir l'API de l'éditeur.
* `freeAnchor` ne gère pas le collage dans une AUTRE page où le nom serait déjà pris (le serveur renverrait un message clair ; non testé).
