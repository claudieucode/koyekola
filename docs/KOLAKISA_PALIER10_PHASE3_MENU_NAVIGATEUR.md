# Palier 10 — phase 3 : échecs 6 et 7 du menu de navigation (navigateur)

## Conclusion

**Défaut non reproduit pendant cette série : 60 exécutions sur 60 réussies (30 sur la branche actuelle, 30 sur la référence), tests 6 et 7 compris.** Ce résultat ne dit pas pourquoi les tests 6 et 7 ont échoué une fois dans la suite complète du 13/10 ; il n'établit ni test instable, ni régression des paliers 9/9.1, ni défaut préexistant. Aucune correction proposée, rien modifié en production ni dans le test.

## Versions testées

- Branche actuelle : `theme-builder-brouillon-parties`, HEAD `a1adfcc` (code de production identique à `4189ed9`/`dfcc132` ; les commits `d8a4daa`, `476cd92`, `a1adfcc` ne changent que des documents). Arbre propre avant et après.
- Référence : `738322d` dans un worktree détaché temporaire (`<scratchpad>/wt738p3`), `node_modules` partagé en lien (même dossier que la branche ; `package.json` et verrou identiques entre les deux versions : `git diff --stat 738322d HEAD -- package.json package-lock.json` vide). Le fichier de test est identique des deux côtés.
- Node 24.20.0, Chrome 150.0.7871.125 (réel, headless), `playwright-core` 1.64 installé hors projet.

## Commandes et conditions

- Chaque essai : `NODE_PATH=<scratchpad>/bench2/node_modules node --test tests/editeur-menu-navigateur.test.js`, lancé dans le dossier de la version testée, sortie complète gardée dans un journal par essai.
- État initial : le fichier crée lui-même, dans `before()`, un serveur neuf, une base neuve, la page « Tarifs » publiée et la page « Accueil menu » avec 4 liens (Accueil, Formations, Blog, Contact), puis ouvre l'éditeur. Chaque essai est un processus neuf : aucune donnée résiduelle entre deux essais. Les tests 1 à 12 s'enchaînent dans cet ordre (le test 3 ajoute 2 liens, le 6 réordonne, le 7 dépend de l'ordre laissé par le 6).
- Les deux versions sont **alternées** (HEAD 01, REF 01, HEAD 02…) plutôt qu'enchaînées en deux blocs, pour qu'elles subissent la même charge machine ; résultats présentés séparément ci-dessous. Avant chaque essai, un contrôle vérifie qu'aucune suite `node --test` d'une autre session ne tourne (aucune attente n'a été nécessaire).
- Charge de la machine : de 14 à environ 3 (applications de l'utilisatrice/utilisateur ouvertes : éditeur de code, navigateurs) ; aucune charge artificielle ajoutée.
- Aucun essai relancé ; aucun essai écarté.

## Résultats individuels (30 + 30)

| Essai | Branche actuelle (a1adfcc) | Durée · charge | Référence (738322d) | Durée · charge |
|---|---|---|---|---|
| 01 | 12/12 · 6 ✔ 2381 ms · 7 ✔ 3393 ms | 25s · charge 10.19 | 12/12 · 6 ✔ 2394 ms · 7 ✔ 3525 ms | 22s · charge 14.34 |
| 02 | 12/12 · 6 ✔ 2389 ms · 7 ✔ 3535 ms | 22s · charge 11.20 | 12/12 · 6 ✔ 2460 ms · 7 ✔ 3612 ms | 21s · charge 10.22 |
| 03 | 12/12 · 6 ✔ 2346 ms · 7 ✔ 3500 ms | 21s · charge 7.70 | 12/12 · 6 ✔ 2343 ms · 7 ✔ 3485 ms | 22s · charge 7.90 |
| 04 | 12/12 · 6 ✔ 2407 ms · 7 ✔ 3535 ms | 23s · charge 6.46 | 12/12 · 6 ✔ 2412 ms · 7 ✔ 3760 ms | 22s · charge 5.63 |
| 05 | 12/12 · 6 ✔ 2388 ms · 7 ✔ 3447 ms | 22s · charge 4.70 | 12/12 · 6 ✔ 2383 ms · 7 ✔ 3474 ms | 22s · charge 4.35 |
| 06 | 12/12 · 6 ✔ 2389 ms · 7 ✔ 3482 ms | 21s · charge 4.09 | 12/12 · 6 ✔ 2415 ms · 7 ✔ 3459 ms | 22s · charge 3.73 |
| 07 | 12/12 · 6 ✔ 2337 ms · 7 ✔ 3475 ms | 21s · charge 4.23 | 12/12 · 6 ✔ 2428 ms · 7 ✔ 3507 ms | 22s · charge 3.39 |
| 08 | 12/12 · 6 ✔ 2462 ms · 7 ✔ 3573 ms | 23s · charge 7.56 | 12/12 · 6 ✔ 2342 ms · 7 ✔ 3493 ms | 21s · charge 5.64 |
| 09 | 12/12 · 6 ✔ 2427 ms · 7 ✔ 3559 ms | 22s · charge 4.95 | 12/12 · 6 ✔ 2360 ms · 7 ✔ 3483 ms | 21s · charge 3.89 |
| 10 | 12/12 · 6 ✔ 2361 ms · 7 ✔ 3502 ms | 22s · charge 3.93 | 12/12 · 6 ✔ 2354 ms · 7 ✔ 3642 ms | 22s · charge 3.61 |
| 11 | 12/12 · 6 ✔ 2336 ms · 7 ✔ 3510 ms | 21s · charge 4.18 | 12/12 · 6 ✔ 2276 ms · 7 ✔ 3537 ms | 23s · charge 4.14 |
| 12 | 12/12 · 6 ✔ 2388 ms · 7 ✔ 3580 ms | 21s · charge 6.72 | 12/12 · 6 ✔ 2369 ms · 7 ✔ 3548 ms | 21s · charge 9.60 |
| 13 | 12/12 · 6 ✔ 2383 ms · 7 ✔ 3491 ms | 23s · charge 9.76 | 12/12 · 6 ✔ 2276 ms · 7 ✔ 3517 ms | 21s · charge 7.86 |
| 14 | 12/12 · 6 ✔ 2372 ms · 7 ✔ 3491 ms | 26s · charge 9.95 | 12/12 · 6 ✔ 2368 ms · 7 ✔ 3471 ms | 21s · charge 9.35 |
| 15 | 12/12 · 6 ✔ 2430 ms · 7 ✔ 3551 ms | 23s · charge 8.44 | 12/12 · 6 ✔ 2382 ms · 7 ✔ 3505 ms | 21s · charge 8.42 |
| 16 | 12/12 · 6 ✔ 2377 ms · 7 ✔ 3608 ms | 22s · charge 7.03 | 12/12 · 6 ✔ 2401 ms · 7 ✔ 3539 ms | 24s · charge 5.74 |
| 17 | 12/12 · 6 ✔ 2390 ms · 7 ✔ 3539 ms | 23s · charge 7.56 | 12/12 · 6 ✔ 2451 ms · 7 ✔ 3536 ms | 21s · charge 5.76 |
| 18 | 12/12 · 6 ✔ 2386 ms · 7 ✔ 3495 ms | 22s · charge 5.03 | 12/12 · 6 ✔ 2407 ms · 7 ✔ 3481 ms | 21s · charge 4.36 |
| 19 | 12/12 · 6 ✔ 2390 ms · 7 ✔ 3463 ms | 22s · charge 3.81 | 12/12 · 6 ✔ 2417 ms · 7 ✔ 3488 ms | 22s · charge 4.22 |
| 20 | 12/12 · 6 ✔ 2371 ms · 7 ✔ 3496 ms | 22s · charge 3.94 | 12/12 · 6 ✔ 2381 ms · 7 ✔ 3458 ms | 22s · charge 4.40 |
| 21 | 12/12 · 6 ✔ 2383 ms · 7 ✔ 3532 ms | 22s · charge 4.29 | 12/12 · 6 ✔ 2390 ms · 7 ✔ 3529 ms | 22s · charge 4.98 |
| 22 | 12/12 · 6 ✔ 2400 ms · 7 ✔ 3508 ms | 22s · charge 4.10 | 12/12 · 6 ✔ 2355 ms · 7 ✔ 3490 ms | 24s · charge 7.22 |
| 23 | 12/12 · 6 ✔ 2407 ms · 7 ✔ 3489 ms | 22s · charge 6.31 | 12/12 · 6 ✔ 2460 ms · 7 ✔ 3517 ms | 22s · charge 5.67 |
| 24 | 12/12 · 6 ✔ 2517 ms · 7 ✔ 3562 ms | 24s · charge 4.63 | 12/12 · 6 ✔ 2409 ms · 7 ✔ 3486 ms | 25s · charge 4.62 |
| 25 | 12/12 · 6 ✔ 2421 ms · 7 ✔ 3466 ms | 23s · charge 3.91 | 12/12 · 6 ✔ 2434 ms · 7 ✔ 3660 ms | 22s · charge 3.44 |
| 26 | 12/12 · 6 ✔ 2359 ms · 7 ✔ 3576 ms | 22s · charge 7.92 | 12/12 · 6 ✔ 2352 ms · 7 ✔ 3574 ms | 21s · charge 6.16 |
| 27 | 12/12 · 6 ✔ 2406 ms · 7 ✔ 3497 ms | 23s · charge 5.07 | 12/12 · 6 ✔ 2344 ms · 7 ✔ 3557 ms | 21s · charge 5.06 |
| 28 | 12/12 · 6 ✔ 2513 ms · 7 ✔ 3603 ms | 22s · charge 4.25 | 12/12 · 6 ✔ 2381 ms · 7 ✔ 3499 ms | 23s · charge 3.62 |
| 29 | 12/12 · 6 ✔ 2352 ms · 7 ✔ 3461 ms | 22s · charge 2.95 | 12/12 · 6 ✔ 2398 ms · 7 ✔ 3718 ms | 21s · charge 4.09 |
| 30 | 12/12 · 6 ✔ 2373 ms · 7 ✔ 3522 ms | 23s · charge 3.76 | 12/12 · 6 ✔ 2383 ms · 7 ✔ 3454 ms | 22s · charge 5.41 |

## Résultats distincts des tests 6 et 7

| | Test 6 (glisser-déposer) | Test 7 (sous-menu) |
|---|---|---|
| Branche actuelle | 30/30 réussis, durée 2 395 ms en moyenne (max 2 517) | 30/30 réussis, 3 515 ms (max 3 608) |
| Référence | 30/30 réussis, 2 384 ms (max 2 460) | 30/30 réussis, 3 533 ms (max 3 760) |

Dans la suite complète du 13/10, le test 6 avait pris 13 407 ms (délai de 12 s dépassé) et le test 7 12 171 ms : plus de 5 fois la durée normale de cette série. L'échec n'est donc pas une assertion fausse mais un enregistrement/état du brouillon qui n'est pas arrivé à temps.

## Erreurs et traces

Aucune erreur, aucune trace d'échec n'a été produite pendant les 60 essais (journaux complets des 60 essais conservés dans le dossier temporaire `p3/logs`). Les seuls éléments disponibles sur l'échec d'origine sont ceux du journal de la suite complète (messages `Délai dépassé : enregistré : Contact glissé` puis `Blog sous Contact`) : ils ne permettent pas d'identifier la cause.

## Comparaison

- Défaillance reproductible : non. Défaillance intermittente sur les deux versions : non observée. Défaillance seulement sur la branche actuelle : non observée. Test 7 découlant de l'état laissé par le test 6 : cohérent avec la lecture du test (le 7 part de l'ordre laissé par le 6), mais non démontré par une reproduction.
- Résultat : **non concluant** sur la cause. 0 échec sur 60 donne seulement une borne : avec 30 essais sans échec par version, on ne peut écarter qu'une fréquence d'échec élevée (de l'ordre de 10 % ou plus) ; une fréquence de 1 sur 100 resterait invisible.
- Différences de code relevées entre les deux versions (lecture seule) : `public/js/page-builder.js` n'a changé, pour l'enregistrement, que sur le message d'un conflit 409, l'attente de l'enregistrement avant « Mettre à jour » et l'aperçu ; le gestionnaire de menu (`public/js/page-builder-menu.js`) n'a pas changé. Cela ne prouve rien sur l'échec observé.

## Limites

- 60 essais, un fichier seul : la suite complète enchaîne 395 fichiers, avec Chrome, serveurs et bases en nombre ; l'échec d'origine est survenu dans ce contexte (état de la machine, mémoire, ordre) que ces essais ne reproduisent pas.
- Pas de trace d'exécution Playwright du cas échoué (le test ne les produit pas et ne doit pas être modifié).
- La machine n'était pas inactive (applications ouvertes), mais la charge n'a pas été contrôlée.

## Prochaine action recommandée

Sans changer le test ni le produit : (1) refaire la suite complète isolée, et si le fichier échoue de nouveau, récupérer la même position dans l'ordre d'exécution et la charge ; (2) en parallèle, tester le fichier entouré des 3 ou 4 fichiers qui le précèdent dans la suite, à la même place, pour voir si un état laissé par un voisin intervient. Décision à prendre par vous : accepter de traiter cet échec comme intermittent non expliqué (avec la réserve ci-dessus), ou demander ces essais supplémentaires.

## Git

Commit local uniquement. Aucun push, aucune fusion, aucun déploiement ; branche et arbre principal inchangés ; seul le worktree temporaire créé pour cette phase a été supprimé.
