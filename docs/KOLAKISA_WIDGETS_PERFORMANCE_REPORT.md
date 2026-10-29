# Rapport de performance — widgets

*Machine : iMac 2015, 4 cœurs, Chrome 150 headless, serveur de test local. La charge de la machine n'était PAS contrôlée (une autre session lançait sa propre suite de tests en parallèle ; moyenne de charge relevée entre 6 et 239 selon les moments). Toute durée ci-dessous est donc un ordre de grandeur, pas une valeur garantie. Aucune comparaison « avant / après » n'est présentée : cette mission n'a modifié aucun chemin de calcul (les 4 corrections sont des vérifications de saisie et un renommage d'ancre à la copie).*

## 1. Coût de l'édition selon la taille de la page (`widgets-performance-navigateur`)

Pages faites de vrais widgets variés du catalogue (rotation sur 76 types). Médiane de 5 à 6 essais ; durées mesurées dans la page, à l'image près (rAF).

| Page | Nœuds dans le canevas | Ouverture de l'éditeur | Sélection (clic structure) | Insertion (clic bibliothèque) | Réglage (saisie → texte visible dans le canevas) | Enregistrement (inclut ≈ 1 s d'attente d'inactivité) | Enregistrements pour une rafale de 6 saisies | Rendus d'aperçu |
|---|---|---|---|---|---|---|---|---|
| petite (10) | 75 | 0,76–0,81 s | 13–14 ms | 8–10 ms | 65–81 ms | 1,02 s | 1 | 12 |
| moyenne (60) | 381 | 0,86 s | 13 ms | 12 ms | 102 ms | 1,02 s | 1 | 12 |
| grande (200) | 1 163 | 0,87 s | 15 ms | 46 ms | 198 ms | 1,35 s | 1 | 12 |
| très grande (380) | 2 181 | 1,5 s | 21 ms | 46 ms | 342 ms | 1,03 s | 2 | 12 |

Lecture :
* La sélection reste imperceptible (< 25 ms) jusqu'à la limite de 400 éléments.
* La latence d'un réglage croît avec la page (65 → 342 ms) parce que l'aperçu rend la page entière : à 380 widgets elle reste sous la seconde mais est perceptible. Ce n'est pas une régression (mission 3 avait déjà mesuré l'aperçu immédiat) : c'est le coût du canevas patché en place.
* **Une rafale de saisies ne produit qu'un ou deux enregistrements** : le principe « une interaction continue ne génère pas une succession de sauvegardes » est respecté avec des widgets réels.
* Les 12 rendus d'aperçu sont 1 par modification (5 insertions + 6 saisies + 1 initial) : pas de rendu en double.
* Aucune erreur de script pendant ces parcours.

Seuils des tests (volontairement larges) : sélection < 2,5 s, insertion < 4 s, réglage < 3 s, ≤ 3 enregistrements par rafale. Ils détectent une dérive grossière, pas une régression fine.

### Ce que cette mesure a révélé : D5, le canevas qui disparaît

Sur la page de 380 widgets, la mesure échouait par intermittence (« texte du titre dans le canevas : élément absent »). Ce n'était pas un problème de lenteur : **le cadre du canevas avait disparu** (voir `KOLAKISA_WIDGETS_GAP_ANALYSIS.md` §D5). Avant correction : environ 8 échecs sur 22 essais (36 %) ; après correction : **8 réussites sur 8**. Si la même cause survenait à l'ouverture d'un autre onglet d'éditeur ou sur une page plus légère, elle aurait le même effet (écran de canevas vide jusqu'au rechargement) ; elle est plus probable quand le chargement du cadre est long (cadres externes, nombreux widgets).

## 2. Mémoire

150 ajouts + suppressions d'un widget Texte (après 20 cycles de chauffe) : **5,8 Mo → 8,2 Mo** de tas JavaScript après ramasse-miettes forcé (+ 2,4 Mo, seuil du test : 25 Mo). Pas de fuite visible à cette échelle. Les fuites d'écouteurs avaient été contrôlées en mission 6.

## 3. Rendu publié

* Le rendu de la page contenant **tous** les widgets (≈ 76) reste dans le budget du test existant `editeur-conformite-widgets` (quelques centaines de ms avec le cache de gabarits).
* Le chargement des 8 largeurs × 2 contenus (`widgets-publie-navigateur`) : 9 à 12 s au total pour 16 chargements de la page complète, sans erreur.

## 4. Test de fluidité intermittent de la mission 6 (`editeur-manipulation-directe-navigateur` › « performance : geste de poignée… »)

**Test exact** : tests/editeur-manipulation-directe-navigateur.test.js, test « performance : geste de poignée fluide sur une page de 300 éléments (aucune image > 50 ms)… ». Il compte, avec `requestAnimationFrame`, les images de plus de 50 ms pendant un glissement de poignée (25 déplacements) sur une page de 296 titres + 4 éléments ; échec si **plus d'une** image dépasse 50 ms. **Seuil non modifié.**

Mesures (médiane toujours 16,7 ms = 60 images/s ; seul le maximum varie) :

| Conditions | Résultat |
|---|---|
| Test seul, 3 essais de suite, charge ≈ 12–15 | 3 / 3 réussis ; max 16,8 / 16,8 / 33,4 ms |
| Fichier entier seul, 2 essais, charge ≈ 15 puis très élevée | **1 réussi (max 33 ms), 1 ÉCHEC (2 images > 50 ms, max 116,6 ms)** |
| Fichier entier + un autre test Chrome lourd en parallèle, 2 essais | 1 réussi (1 image > 50 ms, max 133 ms), **1 ÉCHEC (3 images > 50 ms, max 299,9 ms)** |
| 296 titres, 3 essais (même charge ≈ 8–10) | 3 / 3 réussis, max 16,8 ms |
| **296 widgets variés** (`GESTE_MIXTE=1`), 3 essais | 3 réussis mais max **49,9 / 49,9 / 66,6 ms** (le 3ᵉ : 1 image > 50 ms) |

**Conclusion honnête** :
1. L'échec de la mission 7 est **reproduit** : il apparaît quand la machine est chargée (autre Chrome, autre suite) ; ce n'est pas un faux positif au sens « jamais reproductible ».
2. **Les widgets ajoutent un coût réel mais modeste** au geste : avec des widgets variés l'image la plus lente passe de 16,8 ms à 50–67 ms (une image au début du geste).
3. La **cause précise** de ces images lentes (calcul au démarrage du geste ? repeinture de widgets lourds ?) **n'est pas démontrée** : aucun profil du geste n'a été fait. Ne pas la déclarer connue.
4. Recherche par type (296 exemplaires du même widget, une mesure de 81 types ; les plus lents mesurés 3 fois) :

| Maximum d'une image pendant le geste | Types (une mesure) |
|---|---|
| ≤ 20 ms (= témoin, titres) | 47 types |
| 21–50 ms | 21 types |
| 51–100 ms | 8 types |
| > 100 ms | 5 types |

Les plus lents, 3 essais : `facebookembed` 966 / 999 / 966 ms ; `facebookbutton` 666 / 1 316 / 1 366 ms ; `videoplaylist` 66 / 166 / 1 033 ms (instable) ; `flipbox` 66 / 83 / 216 ms ; `toggle` 83 / 83 / 150 ms ; `testimonialcarousel` 83 / 116 / 150 ms ; `accordion` 66 / 66 / 83 ms ; `slides` 66 / 66 / 83 ms ; `audio` 16 / 150 / 200 ms (instable) ; `toc` 33 / 33 / 50 ms ; `readmore` ≈ 50 ms ; `minicart` 16 / 33 / 100 ms. Ce sont des pages de test extrêmes (296 fois le même widget, dont des cadres externes). Le type `rating` n'a pas produit de mesure dans ce balayage (essai en erreur, non investigué).

**Décision** : le seuil n'est pas assoupli ; l'investigation de la cause (profil du démarrage du geste avec des widgets à `<details>` / cadres externes) est **transmise au laboratoire de la mission 10** (G1). Recommandation pour la suite complète : exécuter ce test seul ou avec une concurrence de 1.

## 5. Incertitudes

* Le taux d'échec « avant » (≈ 36 %) agrège des séries de nombres d'essais différents, menées pendant que le diagnostic évoluait ; seul le dernier lot (1 échec sur 8 avant, 0 sur 8 après) est homogène.

* Charge de la machine non contrôlée ; une seule exécution pour la plupart des types du balayage.
* Les durées de saisie incluent un aller-retour serveur d'aperçu local ; en production le réseau s'ajoute.
* Mesures Chrome headless : pas de GPU, rendu logiciel, donc plus lent qu'un navigateur réel.
