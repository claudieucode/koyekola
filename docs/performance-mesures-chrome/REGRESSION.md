# KOLAKISA — Suivi des optimisations de l'éditeur et garde-fous de non-régression

Document vivant. Une ligne par optimisation : **problème → mesure → hypothèse → modification → mesure après → décision**.
Règle : une optimisation qui n'améliore pas la mesure visée, ou qui dégrade une fonctionnalité, est **annulée**.
État au 10 octobre 2026 : **LOT 0-2 faits ; P1, P2, P3, P4, P6, P8 appliquées et conservées** (résultats : `KOLAKISA_PERFORMANCE_REPORT.md`). P5, P7, P9, P10 : non traitées.

Références : `KOLAKISA_PERFORMANCE_BASELINE.md` (chiffres « avant »), `KOLAKISA_PERFORMANCE_AUDIT.md` (causes).

## 1. Optimisations prévues (dans l'ordre proposé)

| ID | Lot | Problème (mesure « avant », 405 él.) | Hypothèse | Modification envisagée | Mesure visée | Risque | Retour arrière |
|---|---|---|---|---|---|---|---|
| P1 | 3 | ≈ 7 mises en page par clic ; `placeCanvasBar` ← `drawOverlays` = 122 ms/20 clics | Lectures et écritures entrelacées forcent le recalcul | Lire toutes les positions d'abord, écrire ensuite ; repositionner les surcouches au lieu de les recréer | layouts/clic ≤ 2 ; sélection ≤ 8 ms | faible | un seul commit, revert simple |
| P2 | 5 | 1 requête `/seo/analyse` par modification (27–41 ms) + reconstruction du panneau Page | Le panneau est reconstruit même caché | Reconstruire/analyser seulement quand l'onglet Page est visible | requêtes/modif 3 → 2 | faible | idem |
| P3 | 5 | Modification → canevas : 72–108 ms (252 au pire) | L'aller-retour serveur et le délai de regroupement dominent | Aperçu local immédiat de la valeur modifiée, confirmé par le rendu serveur ; interrupteur de secours | perçu ≤ 50 ms | moyen | interrupteur → ancien comportement |
| P4 | 9 | Annuler/rétablir : 105/212 ms ; `physicalAxis` 61–90 ms | `getComputedStyle` répété pendant la reconstruction | Cache par passage de rendu ; lectures groupées | ≤ 100 ms | faible | revert |
| P5 | 8 | Structure ouvrir : 116 ms ; `applyZoom` 39 ms/bascule | Chaque bascule remet en page tout le canevas | Une seule mise en page par image, surcouches après | ≤ 70 ms | moyen | revert |
| P6 | 8 | `setTimeout` 30/60/30 ms après mode, écran, zoom (:4803, :5107, :5144) | Attente à l'aveugle de la mise en page | Suivre la fin réelle du calcul (rAF) | pas de saut visible, pas de délai fixe | faible | revert |
| P7 | 10 | `PUT /brouillon` 88–725 ms (serveur) | Validation + historique complets à chaque enregistrement | Profil Node d'abord ; réduire seulement ce qui est démontré | ≤ 250 ms | à évaluer | revert |
| P8 | 10 | `afterChange` : une exception d'un rendu empêche le rendu du canevas et l'enregistrement | Aucun `try/finally` | Isoler les rendus secondaires | aucune modification perdue si un rendu échoue | faible | revert |
| P9 | 12 | Ouverture ≈ 1 s, `/seo/analyse` 322–870 ms au démarrage | Travail non urgent dans le chemin critique | Différer (`requestIdleCallback`) | ouverture −300 ms | faible | revert |
| P10 | 13 | Plateau de 3–6 k nœuds détachés | Retenue de documents analysés / animations | Instantané de tas puis correction ciblée | plateau ≤ 1 000 | faible | revert |

Ne figure volontairement PAS : Workers, virtualisation, `content-visibility` sur le canevas, patches d'historique
(voir audit §16 : aucune mesure ne les justifie).

## 2. Fiche à remplir pour chaque optimisation appliquée

```
ID : Px                 Date :            Commit :
Avant (scripts, page, valeur)   :
Après (mêmes scripts/pages)     :
Gain / dégradation              :
Fonctionnalités vérifiées       : (liste ci-dessous §3)
Décision : conservée / annulée   Raison :
```

## 3. Fonctionnalités à re-vérifier après CHAQUE lot

Automatique : `npm test` (suite existante, ≈ 221 fichiers) **et** les parcours navigateur déjà présents
(`tests/controles-numeriques-chrome.test.js`, `tests/moteur-mouvement-chrome.test.js`, tests Chrome de règles/magnétisme/canevas).

Manuel / banc d'essai (sans rien casser) : canevas, widgets, conteneurs, sections, inspecteur, calques, responsive
(ordinateur/tablette/mobile), zoom, déplacement, règles, guides, magnétisme, glisser-déposer (palette, calques, canevas),
sélection simple et multiple, raccourcis, enregistrement automatique et manuel, **annuler/rétablir**, aperçu, publication,
médiathèque, gestionnaire de polices, thèmes/couleurs, widgets dynamiques (CMS), animations d'entrée, édition de texte en place,
reprise après erreur réseau (copie locale), conflit 409.

Critères visuels : aucun saut du canevas, aucun clignotement, sélection et défilement conservés, zoom conservé.

## 4. Protocole de mesure (identique avant/après)

1. Même machine, même navigateur, serveur de test frais, aucune autre application lourde.
2. `node docs/performance/bench/bench.js 20,100,300,400 sortie.json` puis `node docs/performance/bench/table.js` (adapter les noms de fichiers).
3. `node docs/performance/bench/profile.js 400 1` (et `… 400 4` : processeur ralenti ×4 pour une machine plus faible).
4. `node docs/performance/bench/open.js` et `leak2.js` pour l'ouverture et la mémoire.
5. Comparer avec `KOLAKISA_PERFORMANCE_BASELINE.md` §3 ; écart < 10 % = bruit (la machine a des variations d'un passage à l'autre,
   p. ex. première modification à 405 él. : 123–252 ms selon la charge du serveur).
6. Une régression de plus de 10 % sur une mesure du §3 de la référence, ou toute fonctionnalité cassée, bloque le lot.

## 5. Limites connues de la méthode (à ne pas oublier)

- Chrome uniquement, écran 60 Hz, machine unique (i5-6500, 2015). Safari, Firefox, 120 Hz et machine plus lente : à faire au LOT 14.
- Pages d'essai synthétiques, sans images ni widgets dynamiques ni sections interactives (celles-ci forcent un rechargement
  complet de l'iframe : à mesurer à part).
- Le serveur est celui de développement (une seule instance Node) ; en production (hébergement) les temps serveur diffèrent.
- La mesure « jusqu'à l'image » a un plancher de ≈ 33 ms (2 images à 60 Hz) : ne pas interpréter 34 ms comme un défaut.
- Les mesures du serveur (`/rendu`, `PUT`) incluent l'attente d'autres requêtes en cours sur le même processus.

## 6. Journal

| Date | Lot | Action | Résultat |
|---|---|---|---|
| 2026-10-10 | 0–2 | Audit du code, banc d'essai Chrome, profil CPU, ouverture, mémoire, référence | Documents `BASELINE`, `AUDIT`, `REGRESSION` ; scripts dans `docs/performance/bench/` ; **aucun code de production modifié** |
| 2026-10-10 | 3-9 | P1, P2, P3, P4, P6, P8 dans `page-builder.js` | Modification → canevas 83–178 ms → 20–26 ms ; mises en page par clic −67 % ; requêtes par modification 3 → 2 ; tests complets et parcours navigateur : voir REPORT |
