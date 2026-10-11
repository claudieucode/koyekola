# Kolakisa — Canvas vide : audit de l'existant (Lot 0)

Base : `origin/main` (97e9a7e), branche `canvas-vide-choix`, worktree `KOYEKOLA-canvas-vide`. Audit en lecture seule, avant toute modification.

## 1. Constat principal

**Le moteur de « conception guidée » existe déjà** (Layout Standards Engine, `docs/KOLAKISA_LAYOUT_STANDARDS_ARCHITECTURE.md`). Ce qui manque est uniquement **l'écran de choix dans le Canvas vide**. Il ne faut ni nouveau modèle, ni nouveau verrou, ni nouveau moteur.

## 2. Classement des fonctionnalités demandées

| Exigence | État | Où |
|---|---|---|
| Modèle du format (compact 960, standard 1200, large 1440, fluide, personnalisé 320–2400, marge 0–96) | **Présent, fonctionnel** | `src/marketing/pages/layoutFormat.js` (`FORMATS`, `normalizeLayout`) |
| Persistance mode / format / largeur / marge / verrou | **Présent** : `theme.layout = { mode:"guided", format, maxWidth, gutter, locked }` ; absent = conception libre. Enregistré, publié, versionné, dupliqué avec le thème | `pages/index.js:35`, `saveDraft` |
| Verrouillage réel dans le moteur d'écriture | **Présent** : `checkLocked(avant, après)` dans `saveDraft` (index.js:109) et dans la validation IA ; l'état « avant » fait foi (on ne se déverrouille pas et ne modifie pas dans la même requête) | `layoutFormat.js`, `pages/index.js` |
| Verrouillage côté interface (refus + message) | **Présent** : `refuseFormat`, bandeau d'inspecteur, champs désactivés | `page-builder.js` ~3457, ~6019 |
| L'IA ne déverrouille jamais | **Présent** | `studio.validate` |
| Réglages du format dans une page ouverte | **Présent** : section « Format » de l'onglet Page (libre / guidée, format, largeur max, marge, verrou, application avec levée des conflits annulable) | `page-builder.js` `formatSection`, `setLayout` |
| Choix du format à la création d'une page | **Présent** : fenêtre « Nouvelle page » (`layoutMode/Format/Max/Gutter/Locked`) | `views/marketing/landing-list.ejs`, `web/landing.js:99` |
| Pages existantes jamais converties | **Présent** (règle documentée, testée) | tests `format-mise-en-page*.test.js` |
| **Écran de choix « Création classique / Création guidée » dans le Canvas vide** | **ABSENT** : une page vide n'affiche qu'un bouton « + » (`.kw-empty-page` dans `views/marketing-public/_sections.ejs:91`) | — |
| **Configuration guidée dans l'éditeur avec Retour / Continuer / Annuler et aperçu léger** | **ABSENT** (seul le formulaire de création de page ou l'onglet Page le permettent) | — |
| Mode classique « Commencer » | **Réutilisable tel quel** : `openStructurePicker({parent:null,index:0})`, déjà appelé par le « + » (`canvasAdd`) | `page-builder.js:1068, 1111` |
| Distinction vide réel / chargement / restauration | **À créer** (voir §4) | — |
| Rapport de test, tests navigateur de l'écran de choix | **ABSENT** | — |

## 3. Composants à réutiliser (aucun doublon)

- `setLayout(next)` : applique le format dans l'historique (`change()`), enregistre immédiatement (`saveNow`), rafraîchit l'onglet Page et l'inspecteur. C'est la seule voie d'écriture du format.
- `LF.formats` (donné par le serveur via `boot.layoutFormats`) : les préréglages. Aucune valeur recopiée côté client.
- `openStructurePicker` : mécanisme classique de création (conteneurs, dispositions, Flexbox, widgets).
- `canvasReady`, `canWrite`, `past`, `content.sections` : indicateurs d'état déjà disponibles.
- Canvas : iframe rendue côté serveur (`.pb-frame`). **Il n'est ni remonté ni touché** : l'écran de choix est un panneau du document de l'éditeur, posé sur la seule zone du Canvas (`.pb-canvas`), sous la barre d'outils et à gauche de l'inspecteur.

## 4. Règle « vrai état vide »

Le panneau n'apparaît que si **toutes** ces conditions sont vraies :
1. l'utilisateur peut écrire (`canWrite`) ;
2. le document chargé n'a **aucune section** et **aucun format** (`theme.layout` absent) ;
3. le Canvas a fini son premier rendu (`canvasReady`) : jamais pendant le chargement ;
4. aucune modification n'a eu lieu dans la session (`past` vide) et aucune section n'a jamais existé dans la session.

Dès qu'une section apparaît ou qu'une modification est faite, le panneau est **définitivement** retiré pour la session. Supprimer volontairement tous les éléments d'une page existante ne le réaffiche donc pas, et ne modifie ni le format ni les propriétés du document. Un rechargement d'une page toujours vide et sans format le réaffiche (aucune donnée n'est en jeu).

## 5. Risques de régression et parades

| Risque | Parade |
|---|---|
| Recouvrir barre d'outils / inspecteur | panneau en `position:absolute` dans `.pb-canvas` seulement |
| Remontage ou rechargement du Canvas | aucun appel à `renderCanvas` ; le panneau est du DOM local, affiché/masqué |
| Perte du zoom, du défilement, de la sélection | non touchés |
| Deuxième source de vérité | aucun nouvel état persisté ; `theme.layout` seul |
| Verrou contourné | inchangé : toujours `checkLocked` côté serveur |
| Requêtes réseau supplémentaires | aucune pour afficher le panneau ; une seule écriture (celle de `setLayout`) à « Continuer » |
| Raccourcis clavier du Canvas actifs sous le panneau | focus placé dans le panneau, `Échap` = Annuler/retour |

## 6. Modifications minimales

1. `views/marketing/page-builder.ejs` : un `<section data-pb-start hidden>` dans `.pb-canvas` (aucun autre changement de vue).
2. `public/js/page-builder.js` : un petit bloc à côté de la section « Format » (affichage, deux étapes, aperçu CSS, appel à `setLayout` et `openStructurePicker`).
3. `public/css/page-builder.css` : styles du panneau (variables `--pb-*` existantes, aucune animation lourde).
4. `tests/canvas-vide-choix-navigateur.test.js` : parcours Chrome réel.

Aucune migration, aucun changement du serveur, des formats, du verrou ou du rendu publié.

## 7. Limites connues avant implémentation

- Le niveau « site » du format n'existe pas (limite déjà documentée) ; on reste au niveau page.
- Le choix « classique » n'est pas enregistré (conception libre = absence de `theme.layout`, par construction du modèle existant).
