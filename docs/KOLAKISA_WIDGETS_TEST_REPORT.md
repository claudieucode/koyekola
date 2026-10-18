# Rapport de tests — widgets (mission 8)

*Environnement : macOS (iMac 2015, 4 cœurs), Node 24, Chrome 150 headless via Playwright, `jsdom` installé hors du projet (les suites qui l'exigent sont IGNORÉES sans lui), `sharp` absent localement. Commande type : `NODE_PATH=<jsdom>:<playwright> node --test --test-concurrency=<1|2> <fichiers>`.*

## 1. Tests ajoutés (47 tests, 8 fichiers + 1 fichier d'aide)

| Fichier | Tests | Résultat (dernière exécution, code final) |
|---|---|---|
| `widgets-editeur-navigateur` | 3 | **3 / 3** — insertion de 77 éléments par la bibliothèque, duplication / annulation / rétablissement / suppression de 88, rechargement |
| `widgets-publie-navigateur` | 3 | **3 / 3** — 8 largeurs × 2 contenus + témoin |
| `widgets-interactions-navigateur` | 19 | **19 / 19** |
| `widgets-liens-navigateur` | 3 | **3 / 3** — 22 liens internes suivis, 6 externes contrôlés |
| `widgets-accessibilite-navigateur` | 4 | **4 / 4** — dont un témoin |
| `widgets-securite-navigateur` | 4 | **4 / 4** — 1 092 essais, 164 refusés avec message, 928 acceptés puis vérifiés dans Chrome (page publiée ET aperçu) |
| `widgets-performance-navigateur` | 5 | **5 / 5** |
| `widgets-corrections-navigateur` | 6 | **6 / 6** — D1, D2, D3 ×2, D4, D5 |
| **Total** | **47** | **47 / 47**, 0 échec, 0 annulé, 0 ignoré (409 s en une exécution à concurrence 1) |

Tests de contrôle (« témoins ») : le débordement, les noms d'accessibilité manquants, les liens `javascript:` et le contenu actif hostile sont chacun détectés par un cas volontairement fautif, pour prouver que les contrôles ne sont pas aveugles.

## 2. Tests modifiés

* `controles-contenu-navigateur` : le mode `CONTENU_COMPLET=1` ne démarrait pas (voir T1) ; il s'exécute maintenant. Mode par défaut inchangé.
* `editeur-manipulation-directe-navigateur` : deux modes de mesure optionnels (`GESTE_MIXTE`, `GESTE_TYPE`) ; seuil et mode par défaut inchangés.

## 3. Réglages de contenu de l'inspecteur — 88 types (`CONTENU_COMPLET=1`)

Exécuté en trois lots (≈ 1 h 20 au total) sur le code *pendant* la mission :

| Lot | Types | Réussis | Échecs | Remarque |
|---|---|---|---|---|
| 1 (conteneur → recherche) | 43 + 1 annulé | 40 | **3** : `code`, `breadcrumb`, `modal` | le 44ᵉ (`account`) a été annulé par moi (arrêt volontaire pour libérer la machine) puis rejoué dans le lot 2 |
| 2 (compte → playlist) | 45 | 44 | **1** : `flipbox` | |
| 3 (nouvelle exécution après correction) | 5 : `code`, `breadcrumb`, `modal`, `flipbox`, `pricing` | **5** | 0 | `pricing` ajouté par prudence après avoir étendu `pairSet` |

Les 4 échecs étaient des **vrais défauts** (D1, D2, D3) : corrigés, rejoués, réussis. Les 4 types qui exigent une formation ou un formulaire réels (`course`, `addtocart`, `courserating`, `signupform`) sont exclus du parcours (voir limites). Les correctifs D4 (copie d'ancre) et D5 (canevas) sont postérieurs à ces lots : ils ne touchent pas les champs de l'inspecteur, mais le mode par défaut a été rejoué sur le code final (§5).

## 4. Régression ciblée

| Lot | Fichiers | Résultat |
|---|---|---|
| Avant D4/D5 (concurrence 2, 1 372 s) | 26 : raccourcis, structure, canevas, rendu en place, droite, parité Elementor 3, widgets nouveaux, parties, matrice et contrat des contrôles, cohérence, widgets, conformité des widgets, modèle, éditeur v2, édition visuelle, persistance (navigateur et serveur), site-widgets, imbriqués, manipulation directe, styles globaux | **246 réussis, 0 échec, 2 ignorés** |
| Après D4/D5 – canevas (concurrence 1, 1 703 s) | 9 : canevas moteur, rendu en place, persistance navigateur, structure, raccourcis, manipulation directe, édition visuelle, performance de l'éditeur, matrice des contrôles | **86 / 86**, dont le test de fluidité (max 16,8 ms, 0 image > 50 ms) |
| Après D4/D5 – rapides (concurrence 2) | 8 : contrat et cohérence des contrôles, modèle, éditeur v2, widgets, conformité, contrat, parties | **69 / 69** |
| Formation / formulaire (préexistants, avant D4/D5) | 6 : boutique, widgets, `marketing-r5-*`, formulaires étendus, formulaires publics | **118 / 118** |

**Les 2 ignorés** sont dans `elementor-parite-3-navigateur` (« galerie à 12 colonnes » et « témoignage, points d'intérêt, code, barre de lecture circulaire ») : ils exigent le module `sharp`, absent de cette machine (présent en production). Ils n'ont **pas** été exécutés.

## 5. Parcours des réglages de contenu en mode par défaut (16 types représentatifs, code final)

`node --test tests/controles-contenu-navigateur.test.js` sur le code final : **16 / 16 réussis**, 0 échec, 0 ignoré, 346 s. Ce mode (conteneur, titre, texte, bouton, lien, image, alerte, accordéon, séparateur, boîte d'icône, appel à l'action, diaporama, tarif, compte à rebours, onglets, badge, progression) est celui de la suite complète.

## 6. Chrome et autres navigateurs

Chrome 150 sur macOS : tout ce qui précède. **Firefox, Safari, Edge, appareils tactiles : non disponibles dans cet environnement, aucun résultat.**

## 7. Échecs, intermittences, tests non exécutés

* **Échecs rencontrés pendant la mission** (tous résolus) : le mode complet ne démarrait pas (T1) ; `code`, `breadcrumb`, `modal`, `flipbox` (D1–D3) ; ancre dupliquée qui bloque l'enregistrement (D4, vu par le test de duplication) ; canevas qui disparaît (D5, vu par la mesure de performance, intermittent).
* **Intermittent non expliqué à fond** : le test de fluidité de la mission 6 (voir `KOLAKISA_WIDGETS_PERFORMANCE_REPORT.md` §4) — reproduit sous charge, cause précise non démontrée.
* **Défauts d'outillage de mes propres tests** (non liés au produit) corrigés en cours de route : identifiants d'éléments écrits avec des majuscules (refusés par le serveur), document du canevas lu une seule fois alors qu'il est remplacé (double tampon), `waitForFunction` non tolérant à un cadre encore vide, structure de 380 éléments consultée avant d'être construite, mode de mesure du geste qui ne construisait pas ses éléments.
* **Non exécutés** : suite complète (≈ 4 840 tests) ; 2 tests `sharp` ; formation / formulaire réels (4 types) ; Firefox / Safari / tactile ; services tiers réels ; une nouvelle exécution du mode COMPLET de `controles-contenu-navigateur` sur le code final (≈ 1 h 20 ; seul le mode par défaut a été rejoué).
* **Suite complète** : *non relancée*. Une autre session en exécutait une dans un autre dossier (`KOYEKOLA-deploy`) pendant toute la mission ; je n'y ai pas touché et n'ai pas lancé de seconde suite lourde en parallèle. Ne pas lire « 246 + 86 + 69 + 118 + 47 réussis » comme « suite verte » : c'est un lot ciblé.

## 8. Reproduire

```
# tests de la mission (≈ 7 min)
NODE_PATH=<jsdom>:<playwright> node --test --test-concurrency=1 tests/widgets-*-navigateur.test.js
# réglages de contenu, tous les types (≈ 1 h 20)
CONTENU_COMPLET=1 node --test --test-timeout=400000 tests/controles-contenu-navigateur.test.js
# documents générés
node scripts/build-widgets-docs.js <journaux du parcours complet>
```
