# KOLAKISA — Base de référence de performance de l'éditeur (LOT 2, lecture seule)

Date : 2026-10-10. **Aucun code de production n'a été modifié.** Deux scripts de mesure ont été ajoutés (hors production) : `scripts/perf/bench-interactions.js` et `scripts/perf/audit-reseau-sauvegarde-memoire.js` ; le banc existant `scripts/perf/bench-page-builder.js` et `docs/perf-page-builder.md` restent la référence pour le chargement, la saisie, l'enregistrement, dupliquer / annuler / rétablir et le glisser.

## Protocole et honnêteté des chiffres

- Machine : Intel i5-6500 4 cœurs, Chrome 150 piloté par Playwright (affichage 60 Hz : les cibles 120 Hz ne sont **pas mesurables ici**), macOS Darwin 21.6.
- Pages synthétiques de **20, 100, 300 et 400 éléments** (mélange de titres, textes riches, boutons, images, listes, conteneurs, grilles, styles par écran). **500 éléments est impossible** : le produit refuse plus de 400 éléments (`MAX_NODES`) ; ce n'est pas une mesure manquante.
- Mesures par interaction : intervalle entre images (rAF), tâches longues (Long Tasks API), latence des événements (Event Timing), et compteurs du moteur du navigateur (CDP `Performance.getMetrics` : mises en page, recalculs de style, durées).
- **Bruit** : la machine est partagée avec d'autres programmes. Deux séries ont été prises à charge 23–27 et une à charge 14. Les **compteurs de mises en page et de recalculs de style sont identiques d'une série à l'autre** (déterministes) ; en revanche les « pires images » et les tâches longues varient fortement sous charge (ex. panneau Structure à 300 éléments : 417 ms, 150 ms puis 67 ms selon la série). **Seule la série calme (charge 14) est reprise ci-dessous**, et les pointes sont à lire comme des ordres de grandeur.
- Il n'y a **pas de React** dans l'éditeur (script unique sans framework) : le React Profiler, les contextes, les `memo` et les clés React ne s'appliquent pas (voir l'audit).

## A. Interactions (série calme, charge 14,3 ; pire image en ms ; « mises en page / recalculs » = par action)

| Interaction | 20 | 100 | 300 | 400 |
|---|---|---|---|---|
| Survol du canevas (40 déplacements) — pire image | 16,8 | 16,8 | 16,8 | 16,8 |
| — mises en page / recalculs de style | 0 / 0,6 | 0 / 0,6 | 0 / 0,6 | 0 / 0,6 |
| Sélection par clic dans le canevas (12 clics) — pire image | 150 | 50 | 50 | 67 |
| — tâches longues (nombre, la pire) | 3 (131) | 1 (63) | 1 (62) | 1 (66) |
| — mises en page / recalculs de style / script ms | 8,3 / 14,3 / 5,9 | 8,4 / 15,1 / 3,7 | 8,9 / 15,3 / 4,3 | 8,8 / 15,7 / 5,4 |
| Sélection + Échap (6 cycles) — pire image | 33 | 17 | 50 | 133 |
| — tâches longues (la pire) | 0 | 0 | 0 | 2 (109) |
| — mises en page / recalculs de style par cycle | 13,2 / 26,8 | 37,5 / 55,0 | 41,3 / 65,2 | 27,7 / 47,2 |
| Ouvrir / fermer le panneau Structure (6 cycles) — pire image | 17 | 17 | 67 | 83 |
| — tâches longues (nombre, la pire) | 0 | 0 | 3 (68) | 3 (95) |
| — recalcul de style par basculement | 3,3 ms | 9,5 ms | 23,3 ms | 32,1 ms |
| Insertion d'un widget (5) — script par insertion | 5,6 ms | 7,5 ms | 15,7 ms | 22,1 ms (*) |
| Zoom (9 pas clavier) — pire image / mises en page par pas | 17 / 8,2 | 17 / 8,2 | 17 / 8,2 | 17 / 2,4 (**) |
| Déplacement de la vue (outil main, 30 mouvements) — pire image | 17 | 17 | 17 | 17 |
| Défilement du canevas (60 images) — pire image | 17 | 17 | 67 | 17 |
| Redimensionnement par poignée (30 mouvements) — pire image | 17 | 17 | 17 | 17 |
| Curseur (31 événements) — pire image | 50 | 50 | 33 | 50 |
| — mises en page / recalculs / script par événement | 1,3 / 2,5 / 1,0 | 1,3 / 2,5 / 1,0 | 1,3 / 2,5 / 1,3 | 1,2 / 2,3 / 1,5 |

(*) à 400 éléments la limite du produit est atteinte : l'insertion est refusée, les compteurs (3,6 mises en page) ne sont pas comparables. (**) à 400 éléments les compteurs de zoom, de déplacement et de défilement sont plus bas qu'à 300 (2,4 / 0 / 0 contre 8,2 / 5,8 / 6,1) sans différence de fluidité : **cause non élucidée, à investiguer** avant toute conclusion.

## B. Chargement, saisie, enregistrement, opérations structurelles, glisser (série du même jour, `perf-page-builder.md`)

À 400 éléments : chargement 760 ms ; sélection d'un calque 41 ms ; frappe → champ 24 ms ; **frappe → canevas à jour 196 ms** (182 ms à 100) ; dupliquer 56 ms jusqu'à l'image, annuler 49, rétablir 42, supprimer 38 ; glisser 16,7 ms par image (pire 55 ms) ; défilement 61 images/s ; enregistrement automatique ≈ 840 ms de bout en bout, serveur 20–30 ms. DOM : 15 600 nœuds (fenêtre) + 964 (canevas) à 400 éléments.

## C. Réseau, copie locale, mémoire (mesures de ce jour)

| Mesure | 100 éléments | 400 éléments |
|---|---|---|
| Poids du document (JSON) envoyé à chaque rendu et chaque enregistrement | 15,1 Ko | 58,7 Ko |
| Copie locale (`localStorage`) : sérialiser + écrire | 0 ms + 0 ms | 0,1 ms + 0,1 ms |
| Instantané d'historique (sérialisation) | < 0,1 ms | 0,1 ms |
| Un changement de valeur : requêtes de rendu / d'enregistrement | 1 / 1 | 1 / 1 |
| 30 événements d'un curseur : requêtes de rendu / d'enregistrement | 1 / 1 | 1 / 1 |
| 8 frappes (mesure directe sur une petite page) | 1 rendu + 1 enregistrement | — |
| Écouteurs / nœuds DOM après 160 cycles de sélection, panneau et zoom (nettoyage du tas) | 2 048 / 9 904 (stables dès le 2ᵉ relevé) | 5 544 / 23 463 (stables) |
| Tas JavaScript, 1er → dernier relevé | 5,42 → 5,61 Mo | 7,13 → 7,31 Mo (≈ +1 Ko par cycle) |

## D. Poids du code (octets, non compressés)

`page-builder.js` 581 690 · `site-settings.js` 48 349 · `font-manager.js` 22 007 · `page-builder-snap.js` 13 190 · `page-builder-theme.js` 9 536 · `kol-motion.js` 2 847 · `page-builder.css` 176 158 · `landing.css` 91 004 ; transfert à l'ouverture mesuré le même jour : ≈ 193 Ko pour 10 scripts. Polices : manifeste de 227 Ko et bibliothèque de ~420 familles chargés à la **première ouverture du sélecteur**, pas au démarrage.

## Budgets proposés (à valider)

| Famille | Budget | État actuel (série calme) |
|---|---|---|
| Survol, zoom, déplacement de la vue, défilement, redimensionnement, glisser | 60 images/s, aucune image > 33 ms, aucune tâche longue | **atteint** (pire image 16,8 ms) hors pointes isolées sous charge |
| Sélection, désélection, ouverture de panneau | aucune tâche longue > 50 ms | **non atteint** : 62–66 ms (sélection), 109 ms (désélection à 400), 95 ms (Structure à 400) |
| Frappe → canevas à jour | ≤ 200 ms à 400 éléments | 196 ms (à la limite) |
| Insertion, dupliquer, annuler, rétablir, supprimer | ≤ 50 ms jusqu'à l'image | dupliquer 56 ms ; les autres ≤ 49 ms |
| Enregistrement | jamais bloquant ; 1 requête par rafale | **atteint** (1 rendu + 1 enregistrement par rafale) |
| Mémoire | pas de croissance des écouteurs / nœuds | **atteint** ; tas +1 Ko par cycle (à surveiller) |

## E. Après les lots 3, 7 et 9 (même jour)

| Mesure | Avant | Après |
|---|---|---|
| Frappe → canevas à jour, 100 éléments | 86 ms | **30 ms** |
| Frappe → canevas à jour, 400 éléments | 117–162 ms | **60–64 ms** |
| Valeur unique → canevas, 100 / 400 éléments | 82 / 129–141 ms | 65–76 / 102–105 ms |
| Répartition à 400 éléments avant : attente avant l'envoi 77 · requête 56 (serveur 54) · application 27 | 153 ms | attente 8 · requête 33 · application 20 = 60 ms |
| Panneau Structure : recalcul de style par basculement, 400 éléments | 28,8 ms | **3,1 ms** |
| Panneau Structure : tâches longues à 400 éléments (6 cycles) | 3 (jusqu'à 95 ms) | **0** |
| Sélection par clic : mises en page par action (20 / 100 / 300 / 400) | 8,3 / 8,4 / 8,9 / 8,8 | **4,6 / 4,5 / 5,3 / 5,2** |
| Sélection + Échap : mises en page par cycle | 13,2 / 37,5 / 41,3 / 27,7 | **9,7 / 20,5 / 22,2 / 14,2** |
| Dupliquer / annuler / rétablir / supprimer à 400 éléments, jusqu'à l'image | 56 / 49 / 42 / 38 ms | 42 / 37 / 30 / 29 ms (série du jour ; machine plus calme, à lire avec prudence) |

Les compteurs de mises en page sont déterministes ; les durées et les « pires images » de la série après (charge 13–17) restent bruitées (ex. sélection + Échap à 300 éléments : une pointe de 550 ms non reproduite ailleurs).
