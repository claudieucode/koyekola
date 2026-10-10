# KOLAKISA — Garde-fous et journal de régression de performance (LOT 0–2)

**Lots 0 à 2 (audit, profilage, base de référence) : lecture seule. Lots 3, 7 et 9 : trois optimisations appliquées et mesurées (journal ci-dessous).** Ce document fixe la méthode, les garde-fous et le journal.

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
| 3 (canevas) | `scheduleRender` : le **premier** changement après une pause (400 ms) est envoyé tout de suite, la fenêtre de regroupement ne retarde que les suivants | délai frappe → canevas : 77 ms d'attente volontaire avant l'envoi (sur 153 ms à 400 éléments) | 100 éléments : **86 ms** ; 400 éléments : **117–162 ms** ; valeur unique → canevas 82 / 129–141 ms ; rafale de 8 frappes : 8 requêtes | 100 : **30 ms** ; 400 : **60–64 ms** ; valeur unique 65–76 / 102–105 ms ; rafale : 7–8 requêtes (inchangé) | **gardée** (−65 % / −45 à −60 %) | une requête de plus par rafale au plus (mesuré : aucune) | `scripts/perf/mesure-latence-canevas.js` ; `page-builder-performance-navigateur`, `editeur-stabilite`, `editeur-rendu-en-place` (rejoués : 33/33) |
| 9 (Structure) | `.pb-tree .pb-node { content-visibility: auto; contain-intrinsic-size: auto 30px }` : lignes hors zone visible non stylées | ouverture du panneau : recalcul de style proportionnel au nombre d'éléments, 3 tâches longues de 68–95 ms à 300–400 éléments | 400 éléments : recalcul **28,8 ms**, tâche 82 ms, 3 tâches longues (95 ms max) ; 100 éléments : 9,1 ms | 400 : **3,1 ms**, tâche 30 ms, **0 tâche longue** ; 100 : 3,2 ms | **gardée** (−89 %) | barre de défilement de l'arbre (hauteur estimée des parents) ; sélection d'une ligne hors zone | `editeur-structure-grande-page-navigateur` (4/4) ; arbre, panneau de droite, stabilité rejoués |
| 7 (mise en page) | `select()` lit la géométrie du canevas **avant** toute écriture (`readOverlayGeo`) ; `drawOverlays` en lectures puis écritures ; taille de la barre d'actions mémorisée | ≈ 8,5 mises en page et 15 recalculs de style par sélection | sélection : **8,3 / 8,4 / 8,9 / 8,8** mises en page (20 / 100 / 300 / 400) ; sélection + Échap : **13,2 / 37,5 / 41,3 / 27,7** | sélection : **4,6 / 4,5 / 5,3 / 5,2** (−40 %) ; sélection + Échap : **9,7 / 20,5 / 22,2 / 14,2** (−35 à −50 %) ; plus de tâche longue à 100 et 400 éléments | **gardée** (compteurs déterministes ; durées dans le bruit) | contours ou poignées périmés si la mise en page change entre la lecture et le dessin (redessin déjà prévu par l'observateur de taille) | `editeur-canvas-*`, `editeur-regles-magnetisme`, `editeur-zone-conteneurs`, `editeur-droite` (152 tests : 2 échecs d'instabilité préexistants, voir ci-dessous) |
| 6, 13 | *(non appliqués)* | écouteur de défilement, attentes de 30–60 ms | aucune mesure ne montre un défaut (défilement et zoom à 60 images/s) | — | **non retenus** | — | — |
| 10 | *(non appliqué)* `locate` (recherche linéaire d'un élément) ≈ 4 ms par opération à 400 éléments | un index mis en cache risquerait de devenir périmé | — | — | **non retenu** : gain ≈ 10 % pour un risque de régression élevé | — | — |

## Hypothèses déjà réfutées par la mesure (ne pas « optimiser » pour rien)

- **Copie locale à chaque modification** : soupçonnée coûteuse (écriture synchrone de `localStorage` à chaque événement) → **réfutée** : 0,1 ms + 0,1 ms pour un document de 59 Ko.
- **Sérialisation du document pour l'historique** : 0,1 ms à 400 éléments → pas un goulot ; les 150 instantanés pèsent ≈ 8,8 Mo à 400 éléments (calcul), sans effet sur la latence aujourd'hui.
- **Requêtes réseau en rafale** : 30 événements de curseur → 1 rendu + 1 enregistrement ; les rafales sont déjà regroupées.
- **Fuite d'écouteurs ou de nœuds DOM** : nombres stables sur 160 cycles → pas de fuite mesurable.
- **Survol, zoom, déplacement, défilement, redimensionnement, glisser** : déjà à 60 images/s à 400 éléments.

## Instabilité préexistante constatée (ne vient pas de ces lots)

`editeur-regles-magnetisme-navigateur` et `editeur-canvas-moteur-navigateur` échouent parfois sur un test de glisser de poignée (un test différent à chaque passe : T8, T12, T13, T14, T10). Cause relevée : *« `<span class="pb-dm-name">` from `<div class="pb-dm-layer">` subtree intercepts pointer events »* — l'étiquette `pb-dm-tag` du calque `pb-dm-layer` (fonction de manipulation directe, `page-builder-direct.js`, présente dans `main`) s'affiche au survol dans le coin haut-gauche de l'élément et reçoit le clic de la page de test lorsque celui-ci vise ce coin. Mon propre test de grande page cliquait dans ce coin : il clique désormais au centre (4 exécutions sur 4 réussies). **Le même fichier échoue aussi avec le code d'avant mes modifications** (T8 : 1 passe sur 2). À traiter à part (calque ou test), non corrigé ici.
