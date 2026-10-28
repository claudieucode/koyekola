# Palier 10 — phase 1 : isolation, diagnostic et sécurisation

## 1. Git
- **Initial :** branche `theme-builder-brouillon-parties`, HEAD `a97fa55`, arbre propre, `a97fa55` présent.
- **Final :** même branche, 1 commit ajouté (voir §9), arbre propre après commit. **Aucun push, aucune fusion, aucun déploiement ; aucune branche changée.** Un worktree temporaire détaché sur `738322d` (références) a été créé puis supprimé ; les fichiers de travail sont dans le dossier temporaire de la session.

## 2. Isolation de la machine
- Au départ : aucun `node --test` actif (relevé `pgrep`), charge 6. Des dizaines de `node server.js` **inactifs** (0 % CPU, vieux de 8 h à 1 jour) traînent dans `KOYEKOLA-noyau` (d'anciennes sessions), `KOYEKOLA-studio`, `KOYEKOLA-deploy` ; **je n'en ai tué aucun** (non les miens, sans effet sur la charge).
- Pendant le diagnostic, les sessions `studio` / `deploy` ont relancé des suites : charge jusqu'à 133 ; chaque mesure de performance indique la charge relevée. **L'isolation complète n'a donc pas été possible** ; les conclusions s'appuient sur des comparaisons faites dans les mêmes conditions (alternance) et non sur des valeurs absolues.
- Incident de mon côté : un essai de charge artificielle (12 boucles CPU) n'a pas été arrêté à la fin (le `kill` écrit pour zsh ne découpait pas la liste). J'ai reconnu les 12 processus (même parent, même heure de départ, tous créés par ma commande), je les ai arrêtés un par un, puis j'ai écrit un script (`trap` + tableau) qui les arrête toujours. Vérifié : plus aucun.

## 3. SMS (`marketing-sms-parcours` › « double confirmation »)
- **Reproduction :** échoue 3 fois sur 3 seul, sur `HEAD` ; échoue aussi sur `738322d`.
- **Observation (instrumentation temporaire du test) :** `confirmSubscription` répond `{ok:false, reason:"invalid"}`. La ligne en attente a `created_at = 1791198000000` (2026-10-05 12:00 UTC) et `expires_at = 1791802800000` (2026-10-12 11:00 UTC). Le test crée son contexte avec une **horloge figée** (`now: () => NOON`, 5 octobre) mais appelle la confirmation avec `Date.now()` réel (12 octobre, 21 h 55) : le jeton de 7 jours est alors **expiré**.
- **Cause démontrée :** défaut **du test** (bombe à retardement) — il a cessé de passer le 12/10/2026 à 11 h 00 UTC. Le produit se comporte correctement (un jeton expire après 7 jours).
- **Correction :** le test confirme maintenant avec `NOON + 60 s` (la même horloge que celle qui a créé le jeton). Preuve : fichier 19/19, y compris ce test. Recherche d'autres cas pareils (`confirmSubscription` avec `Date.now()`) : aucun.

## 4. Scénario e-mail (`marketing-interface-5` › « un élève s'inscrit… »)
- **Seul, machine peu chargée :** 8 exécutions sur 8 réussies ; le parcours est déjà `completed` au moment où le test le lit.
- **Mécanisme (code) :** le message passe à `sent` dans `dispatch.js:165`, puis le worker poursuit (`engine.js:125-130`) et écrit `completed` ensuite. Le test attendait `sent` puis lisait aussitôt le parcours : entre les deux écritures du serveur existe une fenêtre.
- **Reproduction sous charge :** avec 12 boucles CPU : **3 échecs sur 12** (`running` au lieu de `completed`). L'échec observé dans la suite complète était le même.
- **Correction (test) :** après l'envoi, le test attend `completed` avec la même borne (15 s) puis vérifie le même état final ; aucune assertion retirée. **Après :** 12 réussites sur 12 sous la même charge, 64/64 pour les trois fichiers concernés. Le produit n'est pas en cause (l'état final est toujours atteint).
- Limite : 12 essais ne prouvent pas statistiquement l'absence de toute instabilité ; la cause (fenêtre entre deux écritures) est, elle, établie.

## 5. Fluidité du canevas (~300 éléments)
- **Test :** `editeur-manipulation-directe-navigateur` › « geste de poignée fluide… ». Il mesure les intervalles `requestAnimationFrame` pendant ~25 mouvements de souris espacés de 10 ms et tolère **au plus 1 image > 50 ms**. Seuil non modifié.
- **Outillage :** copie instrumentée (CDP : `Performance.getMetrics`, profileur à 200 µs, observateur `longtask`) conservée en `docs/annexes/palier10-profil-geste.test.js.txt` (non exécutée par la suite).
- **Résultats (Chrome 150, machine non isolée, charge 17 à 133) :**

| Cas | Exécutions | Images > 50 ms | Tâches longues du fil principal | Temps JS / mise en page / styles pendant le geste |
|---|---|---|---|---|
| 296 titres | 8 | 0, 1, 2, 0, 1, 0, 1, 1 (échec du test 1 fois sur 8, avec 2) | **aucune** (0 sur 5 mesurées) | ≈ 37 / 13 / 13 ms (sur ≈ 2,3 s) |
| 6 éléments seulement | 5 | 0, 1, 0, 1 (une image de 100 ms), 0 | **aucune** | — |
| 296 widgets variés (`GESTE_MIXTE`) | 4 | 2, 1, 3, 1 (max 267 ms) | **oui, 4 exécutions sur 4** : 194+92, 169+263, 120, 52 ms | ≈ 60 / 28–57 / 23–146 ms ; ≈ 34 000 à 40 000 nœuds DOM (22 000 avec titres) |

- **Lecture, avec ce qui est prouvé :**
  1. Avec des titres, des images > 50 ms apparaissent aussi **avec 6 éléments** et sans aucune tâche longue : la cause n'est **pas** le nombre d'éléments ni le JavaScript de l'éditeur ; c'est un retard de planification du rendu de Chrome headless / de la machine partagée (hypothèse la plus cohérente, **non prouvée** en séparant le noyau du système).
  2. Avec des widgets variés, il existe de **vraies tâches longues** (52 à 263 ms) sur le fil principal alors que le JavaScript ne pèse que ≈ 60 ms : le coût est dans le travail natif du navigateur (styles / mise en page / peinture d'un DOM 1,6 à 1,8 fois plus gros). Le profil JS ne montre aucune fonction de l'éditeur dominante (les plus hautes : `getBoundingClientRect` ≈ 20 ms, `readOverlayGeo` ≈ 20 ms, `insertBefore` ≈ 15 ms).
  3. Le widget précis responsable n'est pas isolé ici ; le balayage par type du palier 8 désignait `facebookembed`, `facebookbutton`, `videoplaylist`, `audio`, `flipbox`, `toggle`, `accordion`, `slides`, `testimonialcarousel`.
- **Décision :** aucune optimisation lancée (pas de goulot d'étranglement isolé). Pistes pour la phase suivante : `GESTE_TYPE=<type>` avec `Tracing` (catégories `devtools.timeline`) sur les types listés, sur machine isolée.

## 6. Audit documentaire du palier 9.1
| Document | Constat |
|---|---|
| `docs/cms-appearance.md` | Décrit l'**Apparence du site public** (blog…), qui a déjà son propre brouillon → aperçu → publication : **exact**. Il ne décrit pas l'en-tête / pied des **sites du Page Builder** (composants) et ne mentionne pas le palier 9.1 : **lacune**, pas d'erreur. Non modifié (autre système). |
| `KOLAKISA_SITE_HEADER_FOOTER_DRAFT_*` | Cohérents avec le code et les tests : brouillon, aperçu privé (`/site-web/composants/:id/apercu`, `no-store`, avertissement de révision), 409 sur révision périmée, « Mettre à jour », abandon, public qui ne lit que la version diffusée. Points déjà signalés dans LIMITATIONS (pas de rechargement automatique de l'aperçu, pas de liste des pages touchées). |
| `KOLAKISA_THEME_BUILDER_*` (palier 9) | **Périmés sur un point** : ils décrivaient l'application directe de l'en-tête / du pied (audit §4.2, limite L1, matrice « prévisualisation avant publication », sécurité). **Corrigé :** un encart « Mise à jour 9.1 » en tête des 6 documents, L1 marquée *réglée*, ligne de matrice corrigée. Aucune règle métier modifiée. |
| Textes dans l'interface | Fiche du site et éditeur corrigés au 9.1 ; recherche des anciennes formules (« appliqué à toutes les pages », « tout de suite ») dans `views/`, `src/`, `public/js` : aucune restante. |

## 7. Inventaire des outils de validation
| Besoin | État | Preuve |
|---|---|---|
| Chrome | **Disponible** | Chrome 150.0.7871.125 ; Playwright-core 1.64 pilote le Chrome installé |
| Edge, Opera | Installés (moteur Chromium) | `/Applications` ; non utilisés par les tests |
| Firefox | **Partiellement** : installé (153.0.4) mais Playwright ne pilote que son Firefox modifié ; `geckodriver` absent | téléchargement possible (npm joignable), non fait |
| Safari / WebKit | **Partiellement** : Safari 16.5.2 et `safaridriver` présents ; l'automatisation exige `safaridriver --enable` (mot de passe administrateur) : **non activée** ; build WebKit de Playwright absent | `safaridriver --version` |
| Tactile | **Partiellement** : émulation Playwright (`hasTouch`, `isMobile`) possible ; aucun test existant ne l'utilise (un test « tactile » existant ne simule que des `PointerEvent`). **Aucun appareil réel.** | recherche dans `tests/` |
| Contraste | **Partiellement** : tests existants sur le thème de l'éditeur (`editeur-contraste-navigateur`, `espace-contrastes`) ; pas d'outil générique sur le site publié | liste des tests |
| Accessibilité automatisée (axe, pa11y, Lighthouse) | **Indisponible** dans le projet (aucun paquet) ; installable | `node_modules` |
| Accessibilité de base maison | Disponible : `widgets-accessibilite-navigateur`, `rendu-accessibilite-navigateur` | tests |
| Clavier | Partiellement : raccourcis testés ; parcours clavier complet de l'éditeur non testé | |
| Lecteur d'écran | **Indisponible en automatique** : VoiceOver est présent sur le Mac mais non pilotable ici ; **aucun test avec lecteur d'écran réel n'a été fait** | |
| `sharp` | **Installable et fonctionnel** : `sharp 0.35.5` (libvips 8.18.7) installé dans un dossier hors projet, redimensionnement WebP vérifié sur darwin x64. Déclaré dans `package.json` en dépendance optionnelle, absent du `node_modules` partagé (volontairement non touché, il est partagé par tous les dossiers de travail). | voir §8 |
| Isolation entre organisations | Tests existants pour contacts, commerce, e-mail, médias, API (≈ 8 fichiers) ; **aucun** pour pages, composants, modèles de thème, en-tête / pied | `grep` |
| Contenu hostile | Disponible : `widgets-securite-navigateur`, `etape0-securite`, `cms-remediation`, `securite-sessions` | |

## 8. Tests exécutés dans cette phase
| Lot | Réussis | Échoués | Ignorés |
|---|---|---|---|
| `marketing-sms-parcours` seul, avant correction (3 essais) | 0 | 3 | 0 |
| `marketing-interface-5` sous 12 boucles CPU, avant correction | 9 | 3 | 0 |
| idem après correction | 12 | 0 | 0 |
| `marketing-interface-5` + `marketing-sms-parcours` + `refonte-design` après correction | 64 | 0 | 0 |
| Anciens tests « sharp absent » avec `sharp` installé hors projet (5 fichiers) | **46** | 0 | **0** (auparavant ignorés) |
| Profilage du geste de poignée (essais décrits en §5) | voir §5 | 1 échec du test sur 8 (titres) | — |
| Suite complète | **non relancée** dans cette phase (voir §10) | | |

Commande pour les tests `sharp` : `NODE_PATH=<jsdom>:<playwright>:<dossier avec sharp>/node_modules node --test tests/elementor-parite-3-navigateur.test.js tests/elementor-parite-2-navigateur.test.js tests/galerie-options-navigateur.test.js tests/images-resolutions-navigateur.test.js tests/images-resolutions.test.js`.

## 9. Corrections de cette phase (toutes avec cause démontrée)
1. `tests/marketing-sms-parcours.test.js` — horloge du test (une ligne).
2. `tests/marketing-interface-5.test.js` — attendre la fin du parcours (3 lignes).
3. Encarts de mise à jour dans 6 documents du palier 9 + ce rapport + l'annexe de profilage.
Aucun fichier de production modifié.

## 10. Risques ouverts
1. **Fluidité avec widgets variés** : tâches longues réelles (jusqu'à 263 ms), cause = rendu natif d'un DOM lourd ; widget précis non isolé.
2. **Image > 50 ms avec titres** : intermittente, indépendante du nombre d'éléments ; le test tolère déjà 1 image. Un test qui échoue 1 fois sur 8 sur machine partagée reste un risque de faux échec.
3. **Suite complète non rejouée après les deux corrections de test** ; machine toujours partagée avec des suites concurrentes.
4. Aucune vérification Firefox, Safari, tactile réel, lecteur d'écran, contrastes du site publié ; aucun test d'isolation entre organisations pour les pages / composants.
5. `sharp` toujours absent du `node_modules` partagé : sans réglage, 5 fichiers (46 tests) restent ignorés dans `npm test`.
6. Dizaines de `node server.js` inactifs laissés par d'anciennes sessions (non touchés).

## 11. Prochaine étape recommandée (à valider)
1. Isolation : demander l'arrêt des tests de `KOYEKOLA-studio` et `KOYEKOLA-deploy`, puis relancer la suite complète avec `sharp` (NODE_PATH ci-dessus), concurrence 1.
2. Fluidité : `GESTE_TYPE=<type>` + traçage `devtools.timeline` sur les 9 types suspects, pour désigner le ou les widgets responsables, **avant** toute optimisation.
3. Compatibilité : télécharger les builds Firefox / WebKit de Playwright (ou activer `safaridriver`) et rejouer le parcours critique (éditeur, publication, en-tête / pied).
4. Accessibilité : ajouter `axe-core` dans un dossier hors projet ; contrastes du site publié ; parcours clavier.
5. Tests d'isolation entre organisations pour pages / composants / modèles ; puis décisions sur les 7 widgets Elementor.
