# KOLAKISA — Garde-fous et journal de régression de performance (LOT 0–2)

**Aucune optimisation n'a été appliquée à ce stade** (lots 0 à 2 : audit, profilage, base de référence). Ce document fixe la méthode, les garde-fous existants et le journal à remplir lot par lot.

## Règle de conservation d'une optimisation

PROBLÈME → MESURE → HYPOTHÈSE → MODIFICATION → MESURE APRÈS → VALIDATION. Une modification qui n'améliore pas la mesure visée **n'est pas conservée** ; une modification qui dégrade une fonction est **retirée** (retour arrière) ; un changement risqué passe par un drapeau temporaire retiré avant la fin du lot.

## Comment rejouer

1. Charge de la machine ≤ ~6 de préférence ; sinon noter la charge et comparer les compteurs (déterministes) plutôt que les pointes.
2. `NODE_PATH=<playwright-core> node scripts/perf/bench-interactions.js --sizes=20,100,300,400 --json=…` (interactions, compteurs de mises en page / recalculs, tâches longues).
3. `node scripts/perf/bench-page-builder.js --sizes=100,400 [--profile] [--stress]` (chargement, saisie, enregistrement, opérations structurelles, glisser, mémoire).
4. `node scripts/perf/audit-reseau-sauvegarde-memoire.js --sizes=100,400` (réseau, copie locale, mémoire).
5. Tests de fond : `tests/page-builder-performance-navigateur.test.js` (budget de rendu à 400 éléments, reconstruction différentielle des calques), `tests/editeur-stabilite-navigateur.test.js` (aucun saut du canevas ni des panneaux), `tests/editeur-*navigateur*` (comportement).

## Garde-fous automatiques existants

| Garde-fou | Ce qu'il protège |
|---|---|
| `page-builder-performance-navigateur` | calques non reconstruits pour une modification de style ; reconstruction différentielle (< 120 mutations) ; rendu serveur de 400 éléments < 1 400 ms |
| `editeur-stabilite-navigateur` | sélection, mode Structure, valeur validée, changement d'écran : ni la barre, ni les panneaux, ni le canevas ne bougent |
| `editeur-controles-*`, `editeur-fleches-*`, `editeur-champ-numerique-contrat-*` | un geste = une étape d'annulation, pas de liste au focus, valeurs et bornes |
| `rendu-accessibilite-navigateur`, `widgets-contrat` | rendu publié et fiche de chaque widget |

## Garde-fou proposé (non construit)

Un test lisant `bench-interactions.js` à 100 et 400 éléments et échouant si, **par action**, le nombre de mises en page ou de recalculs de style dépasse 1,5 × la référence ci-dessous (compteurs déterministes, donc stables sous charge) — plus fiable qu'un seuil en millisecondes sur une machine partagée.

| Action | Mises en page / recalculs de style de référence (par action) |
|---|---|
| Sélection par clic dans le canevas | 8,4–8,9 / 15,1–15,7 |
| Zoom (un pas) | 8,2 / 10,2 (≤ 300 éléments) |
| Curseur (un événement) | 1,3 / 2,5 |
| Redimensionnement (un mouvement) | 6 / 6,8 |
| Défilement (une image) | 1,9–6,1 / 2,3–7,7 |

## Journal des optimisations

| Lot | Optimisation | Problème mesuré | Avant | Après | Décision | Risque | Test |
|---|---|---|---|---|---|---|---|
| — | *(aucune : lots 0–2 en lecture seule)* | | | | | | |

## Hypothèses déjà réfutées par la mesure (ne pas « optimiser » pour rien)

- **Copie locale à chaque modification** : soupçonnée coûteuse (écriture synchrone de `localStorage` à chaque événement) → **réfutée** : 0,1 ms + 0,1 ms pour un document de 59 Ko.
- **Sérialisation du document pour l'historique** : 0,1 ms à 400 éléments → pas un goulot ; les 150 instantanés pèsent ≈ 8,8 Mo à 400 éléments (calcul), sans effet sur la latence aujourd'hui.
- **Requêtes réseau en rafale** : 30 événements de curseur → 1 rendu + 1 enregistrement ; les rafales sont déjà regroupées.
- **Fuite d'écouteurs ou de nœuds DOM** : nombres stables sur 160 cycles → pas de fuite mesurable.
- **Survol, zoom, déplacement, défilement, redimensionnement, glisser** : déjà à 60 images/s à 400 éléments.
