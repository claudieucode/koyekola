# KOLAKISA — Audit de performance de l'éditeur (LOT 0 et LOT 1, lecture seule)

Date : 2026-10-10. **Aucun code de production n'a été modifié.** Preuves : lecture du code (fichier et fonction cités), mesures réelles du jour (`KOLAKISA_PERFORMANCE_BASELINE.md`) et scripts reproductibles. Ce qui est une **hypothèse** est écrit comme tel.

## 1. Architecture réelle (vérifiée)

- **Aucun framework** : `public/js/page-builder.js` (6 728 lignes, 582 Ko) + petits modules (`-snap`, `-rules`, `-theme`, `-effects`, `-menu`, `-shortcuts`, `font-manager`, `site-settings`, `kol-motion`). L'interface est **dessinée à la main** par des fonctions ciblées (`renderTree`, `renderInspector`, `renderContext`, `drawOverlays`…). Il n'y a ni état réactif, ni contexte, ni sélecteurs, ni `memo`, ni clés : l'état est un jeu de variables du module (`content`, `selection`, `past`/`future`, `zoom`, `dirty`…).
- **Canevas = iframe** du vrai rendu serveur. Chaque modification déclenche `scheduleRender` (regroupement : 30 ms pour une action isolée, proportionnel au dernier rendu pour la saisie) puis `renderCanvas` : **POST du document complet** (`/rendu`) → le serveur renvoie la page HTML entière → `patchCanvas` compare par section (`renderSignature`) et ne remplace que les sections changées, sans recharger l'iframe (`srcdoc` n'est posé qu'au premier affichage et si le diff est impossible).
- **Historique** : `change()` = instantané JSON complet avant une modification (clé identique = pas de nouvelle copie) ; 150 étapes au plus.
- **Enregistrement** : `scheduleSave` → 1 s après la dernière modification → `PUT /brouillon` du document complet, une requête à la fois ; `backup()` écrit aussi une copie locale à chaque modification.
- **Après une modification non « légère »** (`afterChange`) : `renderTree` (différentiel), `renderInspector` (reconstruction complète), `renderContext`, `renderPageSettings`, `placeCanvasBar`, `renderDoc`, `scheduleRender`, `scheduleSave`.
- **Écouteurs** : 229 `addEventListener` pour 25 `removeEventListener` (la plupart sont posés sur des éléments reconstruits, donc libérés avec eux ; ceux du document et de l'iframe sont posés une seule fois : voir § 7).

## 2. Correspondance avec les points demandés qui supposent React

| Point demandé | Réalité |
|---|---|
| React Profiler, rerenders, contextes, `memo`/`useMemo`/`useCallback`, clés, sélecteurs de store, error boundaries React | **NON APPLICABLE** (pas de React). L'équivalent réel : quelles fonctions de dessin sont rappelées à chaque action (§ 4) |
| Isolation du canevas / séparation d'états (document, UI, viewport, sélection…) | existe déjà dans les faits : le zoom n'appelle que `applyZoom` + `drawOverlays` ; les mesures montrent 8 mises en page par pas de zoom, sans coût (0,5 ms) |
| Worker, virtualisation, `requestIdleCallback` | aucun usage actuel (0 `requestIdleCallback`) ; **aucune mesure ne démontre un besoin** (voir § 5 et § 6) |

## 3. Les 10 principaux goulots d'étranglement (classés par preuve)

1. **Aller-retour du document complet à chaque modification** : POST de 59 Ko à 400 éléments → rendu serveur de toute la page (≈ 65 ms à 400 éléments, mesuré dans `perf-page-builder.md`) → HTML entier relu côté navigateur (`renderSignature`) → diff par section. C'est ce qui fixe la latence **frappe → canevas à jour : 182 ms à 100 éléments, 196 ms à 400**. La répartition interne (réseau / serveur / analyse du HTML / diff) **n'est pas mesurée** : à faire d'abord au lot 3.
2. **Ouverture / fermeture du panneau Structure : coût proportionnel au nombre d'éléments** — à 300 et 400 éléments : 3 tâches longues de 68–95 ms sur 6 cycles, recalcul de style de 23 à 32 ms par basculement (3 ms à 20 éléments). *Hypothèse* : l'arbre (≈ 15 000 nœuds à 400 éléments) existe toujours dans le DOM et son affichage force un recalcul de tous ses styles.
3. **Sélection : ≈ 8,5 mises en page et 15 recalculs de style par clic**, identiques à toutes les tailles de page (compteurs déterministes sur 3 séries) et jusqu'à une tâche longue de 62–66 ms (131 ms à 20 éléments lors du premier clic). *Hypothèse* : lectures et écritures du DOM entrelacées dans la chaîne `select` → `revealInTree` / `renderInspector` / `drawOverlays` / `placeCanvasBar` / `markCanvasSelection` (45 `getBoundingClientRect`, 10 lectures `offset*`, 8 `getComputedStyle`, 5 `scrollIntoView` dans le fichier).
4. **Sélection + Échap : les mises en page croissent avec la taille de la page** (13 par cycle à 20 éléments, 37–41 à 100–300) et une tâche longue de 109 ms à 400 éléments. *Hypothèse* : changement de classes dans l'arbre des calques + défilement automatique.
5. **Reconstruction complète de l'inspecteur** à chaque modification non « légère » (`afterChange` → `renderInspector`, 31 appels dans le fichier) : ≈ 24 ms par action mesurée dans le banc existant. Acceptable, mais c'est le plus gros poste de chaque ▲▼ ou validation de champ.
6. **Coût par insertion qui croît avec la page** : script de 5,6 ms (20 éléments) → 7,5 → 15,7 → 22,1 ms (300 → 400).
7. **Dupliquer à 400 éléments : 56 ms jusqu'à l'image** (cible 50) — seule opération structurelle au-dessus du budget.
8. **`drawOverlays` reconstruit toute la couche d'aides** (suppression puis recréation des boîtes de sélection, badges, poignées) à chaque appel : 7 sites d'appel, **et à chaque événement de défilement** du canevas (`scroll` → `drawOverlays` + `drawRulers`). Coût isolé non mesuré.
9. **Script monolithique de 582 Ko** : analyse et compilation au démarrage (chargement 760–1 100 ms selon la taille de page). Aucune découpe à la demande des panneaux secondaires.
10. **Pointes de 100–400 ms** (défilement, sélection, Structure) vues sous forte charge de la machine mais **non reproduites à charge modérée** : à ne pas traiter comme des défauts avant d'avoir une machine calme (voir la base de référence).

À noter : **survol, zoom, déplacement de la vue, défilement, redimensionnement et glisser sont déjà à 60 images/s à 400 éléments** (pire image 16,8 ms) ; le survol ne provoque aucune mise en page ni tâche.

## 4. Redessins inutiles (équivalent des « rerenders »)

- `afterChange` redessine inspecteur, contexte, réglages de page et barre d'actions même quand seule une valeur voisine a changé (mesuré : ≈ 24 ms). Les saisies, curseurs et glissements passent déjà par une voie légère (`opts.light` / clé de regroupement) qui épargne l'inspecteur.
- Le panneau Structure est reconstruit en différentiel (bon), mais reste dans le DOM même fermé (§ 3-2).
- `drawOverlays` : suppression / recréation à chaque appel (§ 3-8).

## 5. Mises en page forcées (layout thrashing)

Compteurs réels par action (identiques à chaque série) : sélection 8,4–8,9 mises en page / 15 recalculs ; sélection + Échap 13–41 / 27–65 ; insertion 10 / 29 ; zoom 8,2 / 10,2 ; redimensionnement 6 / 6,8 ; curseur 1,3 / 2,5 ; défilement 1,9–6,1 / 2,3–7,7. Les durées sont faibles (0,2–8 ms de mise en page par action) : **le problème n'est pas la durée mais le nombre**, qui laisse peu de marge sur une machine moins rapide. La part due à des lectures entrelacées avec des écritures n'est **pas encore attribuée** à une fonction : le banc existant sait produire cette trace (`--trace`), à lancer au lot 7 sur machine calme.

## 6. Tâches longues

Seules apparaissent : sélection (62–66 ms), Structure à 300–400 éléments (68–95 ms), sélection + Échap à 400 (109 ms), et le premier clic à 20 éléments (131 ms, probablement un premier passage à froid). Aucune pendant le survol, le zoom, le déplacement, le redimensionnement, le curseur ou le défilement à charge modérée. **Aucune tâche longue ne dépasse 110 ms dans la série calme.**

## 7. Mémoire

Mesuré (160 cycles de sélection, désélection, Structure et zoom, tas nettoyé) : **écouteurs et nœuds DOM stables** dès le deuxième relevé (2 048 / 9 904 à 100 éléments ; 5 544 / 23 463 à 400) → pas de fuite d'écouteurs ni de DOM détaché. Le tas JavaScript croît d'environ **1 Ko par cycle** (5,42 → 5,61 Mo à 100 éléments ; 7,13 → 7,31 Mo à 400) : négligeable, cause non identifiée, à resurveiller. L'historique garde 150 instantanés JSON (≈ 8,8 Mo à 400 éléments, calcul). Les écouteurs de l'iframe sont posés dans `setupCanvas`, appelé une fois par document d'iframe (le document remplacé est libéré avec ses écouteurs).

## 8. Sauvegarde

Mesuré : **1 requête de rendu et 1 enregistrement par rafale** (un changement ; 30 événements de curseur ; 8 frappes), chacun de 15 Ko (100 éléments) à 59 Ko (400). La copie locale (`backup()`, appelée à **chaque** modification via `scheduleSave`) coûte 0,1 ms + 0,1 ms : **hypothèse initiale de coût réfutée**. Points à garder en tête : l'envoi est un document complet (pas de correctifs) ; un enregistrement échoué est réessayé à 5 s, 10 s… ; une modification pendant un enregistrement relance un délai de 0,5 s.

## 9. Canevas

Mise à jour par section (`patchCanvas`), double iframe seulement en secours, aucun saut mesuré (tests de stabilité). Limites : tout document est rendu côté serveur ; une section modifiée est réinjectée entière (`importNode`) ; les widgets interactifs imposent un rechargement de section (`INTERACTIVE`). Le coût de `renderSignature` (analyse du HTML complet) est **l'inconnue principale** du goulot 1.

## 10. Inspecteur

Reconstruit entièrement après une modification non légère (§ 3-5) ; léger pour les saisies et curseurs. Ouverture : une sélection → 8,5 mises en page. Les groupes d'accordéons sont des `details` (état mémorisé), construits à chaque rendu.

## 11. Structure

Rendu différentiel correct ; **coût d'affichage proportionnel à la taille** (§ 3-2) ; défilement automatique vers l'élément sélectionné (`revealInTree`).

## 12. Zoom et déplacement de la vue

Fluides à 60 images/s à toutes les tailles ; ≈ 8 mises en page par pas de zoom et 5,8 par déplacement (0,2–0,6 ms). `setZoom` redessine ensuite aides et guides après un délai de 30 ms (voir § 13). Anomalie à 400 éléments (compteurs plus bas qu'à 300 sans changement de fluidité) : **non expliquée**.

## 13. Minuteries à examiner (règle « pas de `setTimeout` correctif »)

21 `setTimeout` dans le fichier. **Légitimes** (regroupement d'événements) : autosave 1 s, rendu du canevas 30 ms, arbre 120 ms (saisie), infobulle 350 ms, recherche de médias 180 ms, aperçu SEO 450 ms, messages. **À réexaminer** (attente d'un rendu plutôt qu'un événement) : `setTimeout(drawOverlays…, 30)` après `setMode` (l. 4803), `setTimeout(…, 60)` après un redimensionnement (l. 5107) et dans `setZoom` (l. 5144) ; restauration du focus à 0 ms (l. 2576, 5048). *Hypothèse* : un `requestAnimationFrame` ou un `ResizeObserver` (2 existent déjà) rendrait ces redessins exacts au lieu d'approximatifs ; à mesurer avant de toucher.

## 14. Polices et images

Polices : manifeste (227 Ko, ~420 familles) chargé à la première ouverture du sélecteur ; 2 polices du site à l'ouverture (mesuré dans `perf-page-builder.md`). Images : 12 occurrences de `loading=` dans le gabarit de rendu ; le décodage et les dimensions des images **n'ont pas été mesurés** (les images du banc pointent vers une adresse inexistante). CSS : `page-builder.css` 176 Ko, 97 `box-shadow`, 0 `filter` / `backdrop-filter` / `will-change` / `content-visibility`, 1 `contain` : **aucun style coûteux repéré** ; `content-visibility` n'a pas été essayé (à tester seulement sur les lignes de l'arbre, jamais sur le canevas).

## 15. Plan d'optimisation recommandé (ordre = priorité mission : latence d'entrée, canevas, pointeur, sélection…)

| Lot | Action | Preuve visée avant/après |
|---|---|---|
| 3 (canevas) | **mesurer d'abord** la répartition du délai frappe → canevas (requête, rendu serveur, analyse du HTML, diff, application) ; puis viser le poste dominant | délai frappe → canevas à 400 éléments (196 ms) |
| 9 (Structure) | éviter le coût d'affichage proportionnel à la taille (construire / afficher les lignes visibles seulement, ou contenir le style) | recalcul de style par basculement (32 ms à 400) et tâches longues |
| 7 (mise en page) | trace des mises en page forcées de la sélection (`--trace`), puis séparer lectures et écritures dans `select` → `drawOverlays` → inspecteur | mises en page par sélection (8,5) et tâche longue (62–66 ms) |
| 6 (pointeur) | `drawOverlays` : mettre à jour les boîtes existantes au lieu de les recréer ; limiter au défilement par image | écouteur de défilement, mises en page par image |
| 13 (minuteries) | remplacer les 3 attentes de 30–60 ms par des événements de rendu | redessins exacts, aucun saut |
| 10 | **ne rien changer** à l'enregistrement, à la copie locale ni à l'historique : les mesures montrent qu'ils ne sont pas des goulots | — |

**Non recommandé aujourd'hui** (aucune mesure ne le justifie) : Worker, virtualisation du canevas, `requestIdleCallback`, découpage du script avant d'avoir mesuré l'analyse au démarrage.

## 16. Limites de cet audit

Affichage 60 Hz seulement (120 Hz non mesurable) ; une seule machine (4 cœurs, partagée) ; Chrome seulement (Safari et Firefox non testés) ; pages synthétiques ; **500 éléments impossible** (limite du produit : 400) ; décodage d'images et chargement de polices non chronométrés ; pointes sous charge exclues de la base de référence ; une anomalie à 400 éléments (§ 12) laissée ouverte.
