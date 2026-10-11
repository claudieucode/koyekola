# KOLAKISA — Audit de performance de l'éditeur visuel (LOT 0 + LOT 1)

10 octobre 2026 · code lu sur `origin/main` (`bf61e33`) · mesures : `KOLAKISA_PERFORMANCE_BASELINE.md`.
Tout ce qui est écrit ici vient du code réel ou d'une mesure ; ce qui n'est qu'une hypothèse est signalé « hypothèse ».
**Aucun code de production n'a été modifié.**

## 0. Correction importante par rapport au cahier des charges

Le cahier des charges parle de React, de Context, de hooks, de stores, de `React.memo`, de sélecteurs et de Workers.
**L'éditeur KOLAKISA n'utilise pas React.** C'est du JavaScript « classique » (aucune dépendance) :

| Sujet du cahier des charges | Réalité dans le code |
|---|---|
| Composants React, Context, hooks, `memo`, clés (`key`) | N'existent pas. L'interface est construite à la main avec `h(tag, attrs, …)` (`page-builder.js:36`) |
| Store / sélecteurs | Variables d'une grande fonction (`content`, `selection`, `past`, `future`, `zoom`…) dans `public/js/page-builder.js` (**6 728 lignes, 582 Ko non minifié**) |
| Rendu du Canvas | **Un `<iframe>` rendu par le serveur** : chaque modification envoie le document entier à `POST /pages/:id/rendu` (EJS), puis le navigateur compare le HTML reçu section par section et remplace ce qui a changé (`patchCanvas`, `page-builder.js:4172`) |
| Re-render global | Il n'y a pas de « re-render React » à éviter : les risques sont (1) l'aller-retour serveur, (2) la reconstruction manuelle de l'inspecteur / des calques, (3) les mises en page forcées |
| Workers / virtualisation | Aucun usage ; aucun cas mesuré où ils aideraient (voir §14, §16) |

Conséquence : la mission est une optimisation de **flux d'évènements et de mise en page du navigateur**, pas de
rendu React. Les consignes « memo / selectors / Context » ne s'appliquent pas ; leurs équivalents (reconstruction
ciblée, lecture/écriture groupées, retour visuel local) sont traités ci-dessous.

## 1. Architecture actuelle (faits)

```
 clic / frappe ──► change(fn, opts)                       page-builder.js:183
                    ├─ snapshot() = JSON.stringify du document  (sauf frappes de même clé)
                    ├─ fn() modifie l'objet `content` en place
                    └─ afterChange(light, quick)                       :220
                         ├─ renderTree()            calques  (réconciliation par ligne : déjà optimisé)
                         ├─ renderInspector()       reconstruit TOUT l'inspecteur  (sauf saisie « light »)
                         ├─ renderContext(), renderPageSettings()  ──► POST /seo/analyse
                         ├─ placeCanvasBar(), renderDoc()
                         ├─ scheduleRender()  ──► (50–150 ms) ──► POST /rendu {document entier}
                         │                                          └─ serveur : normalizeContent + EJS complet
                         │                         ◄── HTML complet ──┘ DOMParser + comparaison par section
                         │                         patchCanvas() : remplace les sections modifiées
                         │                                         (ou double tampon si script/interactif)
                         └─ scheduleSave()  ──► backup() localStorage + (1 s) PUT /brouillon {document entier}
```

- **Historique** : instantanés JSON complets (`past`/`future`, 150 étapes), regroupés par clé pour les saisies continues.
- **Sélection** (`select`, :235) : calques, inspecteur (reconstruit), barre de contexte, surcouches du canevas.
- **Surcouches du canevas** (cadre de sélection, badge, poignées, séparateurs de colonnes) : éléments `div` créés/supprimés
  dans le document de l'iframe à chaque `drawOverlays()` (:4483).
- **Règles / guides / grille / magnétisme** : `<canvas>` redessinés (`drawRulers` :5205), `snapEnv` (:5308) mesure jusqu'à
  500 éléments **une fois au début** de chaque geste.
- **Zoom** : `transform: scale()` sur l'enveloppe du cadre, mais la **largeur du cadre** est recalculée (`applyZoom` :5110) →
  la page de l'iframe est remise en page à chaque changement de largeur disponible.
- **Fonts** : chargées à la demande (`/polices.css?f=…`, 40 familles max par appel) — déjà conforme.
- **Chargement** : 12 scripts `defer`, `page-builder.js` 147 Ko transférés (582 Ko décompressés), `style.css` du site
  entier (171 Ko) + `page-builder.css` (176 Ko).

## 2. Ce qui est DÉJÀ bien fait (ne pas y toucher)

Mesuré ou lu dans le code, et au plancher ou très proche :

- **Survol** : 0,1 ms par évènement, un seul dessin des règles par image (`requestAnimationFrame`, :4384).
- **Zoom** : 1–2,4 ms de code ; coalescence par `queueZoom` (:5135).
- **Redimensionnement** : un calcul par image (rAF, :4656), 18 ms/image jusqu'à 405 éléments.
- **Glisser, redimensionner, guides** : `gesture = true` suspend le rendu serveur pendant le geste ; le commit se fait au
  relâchement (`up`, :4657).
- **Frappes rapprochées** (curseurs, ▲▼) : une seule étape d'historique et **1–2 rendus + 1 enregistrement pour 40
  touches** (regroupement par clé + délais adaptatifs).
- **Calques** : `renderTree` réutilise les lignes inchangées (signature par ligne) — des optimisations mesurées existent déjà.
- **Mise à jour du canevas en place** (`patchCanvas`) : pas de rechargement de l'iframe, défilement et sélection conservés ;
  double tampon quand un rechargement est inévitable.
- **Polices** : chargées seulement à la demande.
- **Sérialisation du document** : 0,3 ms pour 44 Ko — **pas un goulot**.

## 3. Les 10 principaux goulots d'étranglement (classés par impact mesuré)

| # | Goulot | Preuve | Où |
|---|---|---|---|
| 1 | **Chaque modification attend un aller-retour serveur avant que le canevas change** : 50–150 ms de regroupement volontaire + 34–122 ms de rendu serveur + analyse du HTML. Aucun retour visuel local immédiat. | touche → canevas : 72 / 82 / 108 / 103 ms (médiane), **252 ms** pour la 1re modification à 405 él. | `scheduleRender` :4140, `renderCanvas` :4257 |
| 2 | **Mises en page forcées en cascade après chaque changement de surcouche** : on supprime des éléments du canevas, puis on lit `getBoundingClientRect()` (qui force un recalcul complet), on réécrit, on relit… | ≈ 7 recalculs de mise en page par clic et ≈ 8 par modification ; `placeCanvasBar` ← `drawOverlays` = **122 ms / 20 clics**, **148 ms / 20 modifications** à 405 él. | `drawOverlays` :4483, `placeCanvasBar` :4730 |
| 3 | **Annuler / Rétablir** : `JSON.parse` de l'état, reconstruction complète (calques, inspecteur, contexte, réglages de page), nouveau rendu serveur | 27–61 ms de code, **105 / 212 ms** jusqu'à l'image (405 él.), pire cas **251 ms** | `undo`/`redo` :201, `restore` :176 |
| 4 | **Ouvrir/fermer le panneau Structure** relance `applyZoom` → largeur du cadre change → mise en page de toute la page de l'iframe | image **116 ms** à 405 él. ; `applyZoom` = **232 ms / 6 bascules** (≈ 39 ms) | `togglePanel`/`applyPanels` :5855-5868, `applyZoom` :5110 |
| 5 | **Inspecteur reconstruit entièrement** à chaque sélection et à chaque changement non « léger » (`box.textContent = ""` puis tout re-créé) | onglet Style : 13–17 ms de code ; sélection 7–13 ms ; `physicalAxis` (`getComputedStyle` du canevas, une fois par contrôle d'icône) = **61–90 ms / 8–10 opérations** | `renderInspector` :3366, `physicalAxis` :2535 |
| 6 | **Une requête `POST /seo/analyse` à CHAQUE modification**, même quand l'onglet « Page » n'est pas affiché (le panneau de réglages de page est reconstruit et appelle `refreshSerp()`) | 1 requête de plus par modification (27–41 ms serveur, et **322–870 ms à l'ouverture**) | `renderPageSettings` :5912, `refreshSerp()` :5993 |
| 7 | **Enregistrement serveur lourd et sur un serveur mono-thread** : validation complète du document + écriture + point d'historique (JSON complet + empreinte). Une sauvegarde de 325–725 ms bloque le `/rendu` suivant | `PUT /brouillon` : 88–725 ms à 306–405 él. ; 1re modification à 405 él. = 252 ms (probable attente derrière une sauvegarde — hypothèse) | `saveDraft` `src/marketing/pages/index.js:99`, `revisions.record` |
| 8 | **Ouverture de l'éditeur** : ≈ 1 s dont 150 ms de mise en page forcée (`applyZoom`), 300 ms de mise en page, 582 Ko de JS non minifié, tâches longues de 156 à 672 ms | éditeur prêt 0,7–1,4 s ; 3–5 tâches longues | `applyZoom` :5110 ; chargement `page-builder.ejs:265-278` |
| 9 | **Règles actives** : à chaque dessin, `cv.width = …` réaffecte le bitmap du `<canvas>` (ce qui le réalloue et l'efface) ; `selectionBand()` relit la position de l'élément | travail natif ≈ 6 ms/image pendant le survol avec règles ; 41 ms de `getBoundingClientRect` / 200 survols | `drawRulers` :5205 (`paint`), `selectionBand` :5196 |
| 10 | **Redimensionnement avec accrochage** : `slope()` (écriture + lecture) au départ, puis `fit()` jusqu'à 5 écritures/lectures **par image** | 18 ms/image mesurés, un pic isolé de 112 ms à 108 él. ; **à surveiller, pas démontré comme problème** | `resizeStart` :4592 |

## 4. Les 5 optimisations au meilleur rapport impact / risque

1. **Grouper lectures et écritures des surcouches** (LOT 5) : dans `drawOverlays` / `markCanvasSelection` /
   `placeCanvasBar`, lire d'abord toutes les positions, puis écrire. Cible : **1 mise en page** au lieu de 7–8 par clic ou
   modification. Gain attendu : −5 à −7 ms par clic/modification à 405 éléments, sans changement visible. **Risque faible.**
2. **Ne pas reconstruire le panneau « Page » ni appeler `/seo/analyse` quand l'onglet n'est pas visible** (LOT 5/10) :
   −1 requête par modification, −1 reconstruction DOM. **Risque faible** (le panneau est reconstruit à l'ouverture de l'onglet).
3. **Retour visuel immédiat pour les modifications de style** (LOT 4/5, derrière un interrupteur de secours) : appliquer
   localement la valeur modifiée à l'élément du canevas dès l'évènement, puis laisser le rendu serveur confirmer/corriger.
   Cible : perçu **≈ 1 image** au lieu de 72–250 ms. **Impact le plus fort ; risque moyen** (l'aperçu local doit produire
   le même résultat que le CSS généré — le filet « sortie identique » du moteur de styles de parties sert de garde-fou).
4. **Mettre en cache `physicalAxis` et regrouper les lectures de l'inspecteur** pendant une reconstruction (LOT 9) :
   −60 à −90 ms par série d'annuler/rétablir ou de validations. **Risque faible.**
5. **Panneaux : éviter la mise en page complète à chaque bascule** (LOT 8) — par ex. regrouper en une image et figer la
   largeur du cadre pendant l'animation, puis recalculer une fois. **Risque moyen** (zoom « ajuster », règles, barre
   d'actions dépendent de cette largeur) ; à tester sur tous les niveaux de zoom.

Pistes à fort potentiel mais à ne lancer qu'après mesure ciblée : coût serveur de `PUT /brouillon` (profil Node à faire),
alléger l'historique serveur (une empreinte + un JSON complet par enregistrement), minifier/diviser `page-builder.js`.

## 5. Micro-latences restantes

- **Sélection : 34–50 ms jusqu'à l'image** pour un plancher de 33 ms : il reste **0 à 17 ms** de travail, surtout les
  mises en page forcées (#2) et la reconstruction de l'inspecteur (#5). Sur 405 éléments le p95 monte à 38 ms de code.
- **Modification de propriété** : ≥ 50 ms sont un délai volontaire (regroupement) ; le reste est le serveur + le HTML
  reçu (6–64 Ko) + l'analyse `DOMParser` (≈ 29 ms cumulés/20 modifications) + la comparaison section par section.
- **Évènements clavier** : 51–76 évènements > 16 ms pendant 40 touches (max 24–32 ms), cohérent avec une mise en page
  forcée par modification.

## 6. Re-rendus inutiles (équivalent du « render global »)

| Où | Constat |
|---|---|
| `afterChange` (:220) | Toute modification non « light » reconstruit **inspecteur + contexte + réglages de page** même si seule une valeur du même champ a changé. La saisie « light » évite déjà ce travail. |
| `select` (:235) | Reconstruit l'inspecteur entier à chaque sélection (inévitable si l'élément change ; évitable si la sélection est identique). |
| `renderPageSettings` (:5912) | Reconstruit le panneau de réglages de la page, **invisible la plupart du temps**, et lance une requête SEO. |
| `drawOverlays` (:4483) | Supprime puis recrée tous les éléments de surcouche à chaque appel (jusqu'à 4 poignées + cadres + séparateurs), au lieu de repositionner les mêmes. Appelé depuis la sélection, les modifications, le défilement, le zoom, `setDevice`… |
| `renderTree` | **Déjà réconcilié** : pas de reconstruction inutile (la signature de ligne évite le travail). |

## 7. Mises en page forcées (layout thrashing)

Compte dans `page-builder.js` : 39 `getBoundingClientRect`, 8 `getComputedStyle`, 17 lectures `offset/scroll/client*`.
Séquences problématiques démontrées par le profil :

1. `drawOverlays` : `remove()` des surcouches (écriture) → `placeCanvasBar()` lit 3 rectangles (lecture → recalcul) →
   `pageRect(el)` par élément → `appendChild` des nouvelles surcouches (écriture) → `drawRulers`/`drawGuides`/`refreshInfo`
   lisent à nouveau. **Mesuré : 144 recalculs pour 20 sélections.**
2. `resizeStart` : `slope()` écrit une largeur puis relit deux fois, `fit()` répète jusqu'à 5 fois par image (accrochage actif).
3. `snapEnv` : une seule fois par geste, 500 éléments max — lecture groupée, correct.
4. `applyZoom` : écrit 5 propriétés de style puis `placeCanvasBar`/`drawRulers` relisent.
5. `physicalAxis` : `getComputedStyle` sur le canevas à chaque contrôle d'icône pendant la reconstruction de l'inspecteur
   (écritures DOM de l'inspecteur entrelacées).

## 8. Tâches longues (> 50 ms)

- **Ouverture** : 3–5 tâches, total 476–984 ms, max 156–672 ms (scripts non minifiés + `applyZoom` 150 ms + mise en page).
- **Pendant les gestes** : aucune tâche > 50 ms mesurée en sélection, survol, redimensionnement (p95 ≈ 18 ms/image).
  Quelques évènements de 24–32 ms en rafale de touches. Annuler/rétablir : jusqu'à 61 ms de code + rendu.
- Hors éditeur mais dans le chemin critique : `PUT /brouillon` 325–725 ms **côté serveur**, ce qui fait attendre le `/rendu` suivant.

## 9. Mémoire

- 200 sélections/désélections, 40 modifications, 40 annuler + 40 rétablir, 30 zooms : **pas de croissance continue** du
  tas ni des écouteurs de `document`/`window` (identiques au départ et à la fin) ; documents (iframes) : 6 → 7 puis stable.
- **Plateau** de 3 000 à 6 000 nœuds détachés retenus (écouteurs associés ≈ +700). Il apparaît à la première utilisation
  de l'onglet Style puis à la première série de validations, puis **ne grossit plus**. Cause non établie ; candidats
  (hypothèse) : `lastRender` (documents analysés par `DOMParser`, :4156), caches `treeLi`, instantanés d'animations
  `KolMotion.appear`. À trancher par un instantané de tas au LOT 13.
- Écouteurs : 215 `addEventListener` pour 13 `removeEventListener` — pas un défaut en soi (la plupart sont posés sur des
  nœuds jetés avec leur parent) ; les 3 écouteurs de gestes sur `document` (:2473, :5521) sont bien retirés.
- Le `ResizeObserver` de l'en-tête de l'inspecteur est bien déconnecté avant d'être recréé (:3416).

## 10. Enregistrement, historique, réseau

- **Enregistrement automatique** : 1 s après la dernière modification (:6487), avec `backup()` en `localStorage` à **chaque**
  modification (sérialisation complète synchrone : mesuré 0,1 ms pour 44 Ko — négligeable). Pas de requête à chaque pixel.
- **Serveur** : `PUT /brouillon` renvoie le document entier à normaliser (`normalizeContent`), vérifie les droits des
  widgets (`checkWidgetRights`), écrit, puis `revisions.hooks.pageDraft` fait `JSON.stringify` + empreinte + lecture de la
  dernière révision + écriture. 88–725 ms à 306–405 éléments. **Aucun enregistrement partiel** (tout le document à chaque fois).
- **Historique** : instantanés complets (44 Ko max ici × 150 = ≈ 6,6 Mo au pire) — acceptable aujourd'hui ; les patches ne
  se justifient que si les pages dépassent largement 400 éléments (limite du serveur).
- **Requêtes par modification** : `/rendu` + `PUT /brouillon` + `/seo/analyse` (celle-ci évitable).
- **Aucune erreur** console ni de page pendant toutes les mesures.

## 11. Canvas

Forces : mise à jour en place par section, double tampon, gestes protégés. Faiblesses : tout passe par le serveur (#1), les
surcouches sont recréées plutôt que déplacées (#2), les scripts/sections interactives (onglets, carrousel, formulaires,
`<style>` dans une section) **forcent un rechargement complet de l'iframe** (`INTERACTIVE`, :4157) — non mesuré ici car mes
pages d'essai n'en contiennent pas ; à mesurer au LOT 2 bis avec des pages contenant des widgets interactifs.

## 12. Inspecteur

Reconstruction totale à chaque sélection/changement (#5). `KWAccordion.normalizeIn` est rejoué à chaque fois. Le défilement
est restauré ; le focus d'un champ en cours de saisie est protégé (mode « light »). Les contrôles lourds (couleurs, polices)
sont déjà ouverts à la demande (popovers).

## 13. Structure (calques)

Déjà réconciliée ligne par ligne. Reste : `lockedDeep(id)` appelle `locate(id)` (parcours complet) pour chaque ligne →
quadratique, **sans effet mesurable à 405 éléments** (55 ms cumulés à l'ouverture d'une page de 27 éléments : à vérifier,
c'est un coût d'initialisation, pas par interaction). Ouvrir/fermer le panneau : voir #4.

## 14. Zoom, pan, règles, guides, magnétisme

- Zoom : 1–2,4 ms de code, 1 image. **Aucun problème mesuré** (25–200 % seulement).
- Pan (outil main / Espace) : `panStart` (:4771) écoute `mousemove` sur le document du canevas ; **non mesuré en détail**
  (aucun signal dans le profil) → LOT 8.
- Règles : bitmap réalloué à chaque dessin (#9), `selectionBand` relit la position.
- Guides / magnétisme : `snapEnv` est un instantané pris au début du geste (bon). Un indexage spatial n'est **pas
  justifié** aujourd'hui (500 éléments max, une fois par geste).

## 15. Polices et images

- Polices : chargement à la demande déjà en place ; au démarrage seules 2 polices d'interface (≈ 60 Ko) sont chargées.
  Aucun problème mesuré.
- Images : **non mesuré** (pages d'essai sans image). À mesurer au LOT 11 avec des pages contenant des images réelles
  (dimensions, décodage, `loading`, `decoding`).

## 16. Ce que je ne recommande PAS (faute de mesure qui le justifie)

- **Web Workers** : le travail lourd est côté serveur ou dans le navigateur (mise en page) ; la sérialisation JSON vaut
  0,3 ms. Un Worker ajouterait un coût de copie sans gain.
- **Virtualisation du Canvas** : 405 éléments au plus, 561 nœuds DOM dans le canevas ; aucun gain, risques de casser
  sélection, règles, guides, glisser.
- **`content-visibility` sur le canevas** : à ne tester que sur l'inspecteur/calques ; le canevas a 561 nœuds.
- **`React.memo` / contextes / selectors** : sans objet (pas de React).
- **Patches d'historique** : pas avant d'avoir des documents bien plus gros que la limite actuelle.

## 17. Stabilité (hors performance, relevée pendant la lecture)

- **Aucune barrière d'erreur** : pas de `window.onerror`, et `afterChange` enchaîne `renderTree` → `renderInspector` →
  `renderContext` → `renderPageSettings` → … **avant** `scheduleRender()` et `scheduleSave()`. Une exception levée par un
  de ces rendus empêcherait le rendu du canevas **et l'enregistrement** de la modification déjà appliquée au document.
  **Constaté par lecture du code, non reproduit.** À sécuriser au LOT 10 (`try/finally` autour des rendus secondaires).
- Les valeurs de l'historique (`past`) ne contiennent pas l'état de l'inspecteur : annuler/rétablir ne perd ni sélection
  valide ni défilement (vérifié dans `restore`, :176).

## 18. Délais `setTimeout` (cahier des charges §55)

21 occurrences. Légitimes (regroupements/écoutes) : enregistrement 1 000 ms (:6487), calques 120 ms (:219), SEO 450 ms
(:5925), médiathèque 180 ms (:6067), info-bulles (:1346), message temporaire (:69), `setTimeout(…, 0)` de focus.
**À remplacer par la cause réelle** (attente d'une mise en page) : **:4803** (30 ms après mode), **:5107** (60 ms après
changement d'écran), **:5144** (30 ms après zoom) — ces redessins de surcouches « après la mise en page » devraient suivre
la fin du calcul (un `requestAnimationFrame` après `applyZoom`) plutôt que d'attendre un délai fixe. À mesurer avant de remplacer.

## 19. Plan d'optimisation recommandé (rien n'est lancé)

| Lot | Contenu | Mesure d'acceptation |
|---|---|---|
| 3 – Isolation du canevas | Surcouches repositionnées, pas recréées ; un seul cycle lecture→écriture | layouts/clic 7 → 1 ; sélection ≤ 8 ms |
| 4 – État | Séparer visuellement « document / sélection / affichage » : ne rien reconstruire quand la valeur n'a pas changé ; interrupteur de secours | reconstructions d'inspecteur par modification |
| 5 – Rendu | Aperçu local immédiat du style ; `renderPageSettings` seulement si visible | touche → canevas ≤ 50 ms perçu ; requêtes/modif 3 → 2 |
| 6 – Pointeur / glisser | Mesurer `fit()` / `slope()` ; ne corriger que si le gain est démontré | image p95 ≤ 18 ms avec accrochage |
| 7 – Mise en page / CSS | Mesurer coût de `style.css` (171 Ko) dans l'éditeur ; `contain` sur l'inspecteur/calques | styles recalculés par action |
| 8 – Zoom / pan / panneaux | Coalescer `applyZoom` lors des bascules ; remplacer les 3 `setTimeout` | Structure ouvrir ≤ 70 ms |
| 9 – Inspecteur / Structure | Cache `physicalAxis`, lectures groupées | annuler/rétablir ≤ 100 ms |
| 10 – Sauvegarde / historique | Profil Node de `PUT /brouillon` ; sécuriser `afterChange` ; réduire l'écriture d'historique | PUT ≤ 250 ms ; aucune perte si un rendu échoue |
| 11 – Médias / polices | Mesures avec images et widgets dynamiques | à définir après mesure |
| 12 – Tâches de fond | `requestIdleCallback` pour l'analyse SEO d'ouverture | ouverture −300 ms |
| 13 – Mémoire | Instantané de tas : identifier le plateau de nœuds détachés | plateau ≤ 1 000 |
| 14 – Régression | Tests complets + banc d'essai + CPU ralenti ×4 | tableau REGRESSION |
| 15 – Audit final | Re-mesure complète, rapport | `KOLAKISA_PERFORMANCE_REPORT.md` |

**Règle de lot** : après chaque lot, `npm test` (suite existante), banc d'essai, comparaison au tableau de référence ; retour
arrière si une fonctionnalité ou une mesure se dégrade.
