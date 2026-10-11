# Kolakisa — Canvas vide : rapport de tests

Branche `canvas-vide-choix` (worktree `KOYEKOLA-canvas-vide`, depuis `origin/main` 97e9a7e). Audit : `KOLAKISA_EMPTY_CANVAS_CREATION_AUDIT.md`.

## Ce qui est réellement implémenté

- **Écran de démarrage** dans le Canvas d'une page vide : deux cartes (« Création classique » / « Création guidée »), limité à la zone du Canvas (ne recouvre ni la barre d'outils, ni le panneau gauche, ni l'inspecteur). Aucune animation, aucune requête réseau pour l'afficher.
- **Création classique** : « Commencer » ferme l'écran et ouvre le sélecteur de structures déjà utilisé par le « + » (`openStructurePicker`). Aucun format n'est écrit.
- **Création guidée** : « Choisir un gabarit » → 5 préréglages venant du serveur (`LF.formats` : compact 960, standard 1200, large 1440, fluide, personnalisé 320–2 400 px / marge 0–96), aperçu CSS léger (pas de document ni de Canvas caché), commande « Format verrouillé / Format déverrouillé » (verrouillé par défaut, explicite), **Retour**, **Annuler**, **Continuer**.
- « Continuer » écrit le format par `setLayout` (même voie que l'onglet Page : historique annulable, enregistrement immédiat, `theme.layout` du brouillon), puis ouvre le sélecteur de structures. Le verrou reste contrôlé par `checkLocked` côté serveur (enregistrement et IA) — inchangé.
- **Page vierge réellement vide** : `createPage(..., { blank: true })`, utilisé seulement par « Page vierge » de la fenêtre « Nouvelle page » ouverte dans l'éditeur. Sans cette option, le comportement historique (bandeau + texte) est inchangé. Sans elle, aucun parcours ne produisait un Canvas vide.
- Règle de « vrai état vide » : écriture permise, 0 section, aucun format, premier rendu du Canvas terminé, aucune modification dans la session. Dès qu'une section ou une modification existe, l'écran ne revient plus (vider une page existante ne le déclenche pas).

## Fichiers modifiés / ajoutés

`views/marketing/page-builder.ejs` (+2), `public/js/page-builder.js` (+95), `public/css/page-builder.css` (+41), `src/marketing/pages/index.js` (option `blank`), `src/marketing/web/landing.js` (passe `blank`), `views/marketing/landing-list.ejs` (libellé de « Page vierge »), `tests/canvas-vide-choix-navigateur.test.js` (nouveau), les deux rapports.

## Tests exécutés (Chrome réel + vrai serveur)

Nouveau fichier `tests/canvas-vide-choix-navigateur.test.js` : **7/7 réussis**.

| Critère d'acceptation | Résultat |
|---|---|
| 1. Une nouvelle page vide affiche les deux modes (et reste sous la barre d'outils, dans la zone du Canvas) | ✔ vérifié |
| 2. Le mode classique ouvre les outils existants, aucun format imposé | ✔ vérifié (sélecteur de structures ; pas de `theme.layout`) |
| 3. Le mode guidé permet de choisir un format | ✔ vérifié (compact, large, personnalisé) |
| 4. Le format est réellement appliqué (écrit dans le brouillon) | ✔ vérifié (`theme.layout` exact en base). Rendu de la largeur : couvert par les tests existants `format-mise-en-page-navigateur` |
| 7. Verrouillage protège le format | ✔ vérifié (serveur : 422 « Format verrouillé ») |
| 9. Le verrou ne bloque pas le contenu ordinaire | ✔ couvert par les tests existants (`format-mise-en-page*`) |
| 10. Format conservé après rechargement | ✔ vérifié (rechargement : pas de nouveau choix, format relu) |
| 11. Pages existantes non converties | ✔ vérifié (page non vide : aucun écran) |
| 12. Pas d'écran pendant le chargement | ✔ par construction (condition `canvasReady`) ; l'écran n'a pas été vu avant le premier rendu dans les parcours |
| 13. Vider volontairement une page ne réinitialise rien | ✔ vérifié (écran absent ; pas d'écriture de thème) |
| 16. Pas de remontage du Canvas | ✔ vérifié (même `<iframe>` avant/après « Continuer ») |
| Validation des valeurs personnalisées à l'écran | ✔ vérifié (100 px refusé, message ; rien d'écrit) |
| Annuler / Retour | ✔ vérifié (aucune écriture) |
| Aucune erreur de script | ✔ vérifié |

Régression ciblée (111 tests, tous réussis) : `format-mise-en-page`, `format-mise-en-page-navigateur`, `cms-pages`, `etape3-pages`, `marketing-pages-atterrissage`, `editeur-canvas-sans-rechargement-navigateur`, `marketing-editeur-canvas-stable-navigateur`, `editeur-layout-contrat-navigateur`, `ia-studio`.

Captures visuelles relues : choix initial et configuration « Personnalisé » (1600 × 950).

## Limites levées (deuxième passe)

Nouveau fichier `tests/canvas-vide-compatibilite-navigateur.test.js` : **5/5 réussis** (Chrome réel, page créée par l'écran de choix en mode guidé « compact » verrouillé).

- **5, 6 — Flexbox et widgets** : un conteneur `display:flex` avec deux widgets s'affiche en ligne, sous la largeur du format (960 px). ✔
- **9 — Verrou et contenu ordinaire** : texte, couleur et ajout d'un widget acceptés (200) ; largeur d'un élément de premier niveau refusée (422 « Format verrouillé »), rien d'écrit. ✔
- **15 — Vues responsive** : tablette et téléphone réduisent bien la largeur du canevas, le contenu reste affiché, sans erreur. ✔
- **17 — Erreur d'enregistrement** : avec un enregistrement qui échoue (500 simulé), l'éditeur garde son contenu, le serveur reste inchangé, aucune erreur de script ; annuler (Ctrl+Z) rétablit l'élément. ✔
- **14 — IA** : déjà couverte par `format-mise-en-page.test.js` (l'IA est refusée sur un format verrouillé, `studio.propose` et `responsiveFixes`) ; ces tests passent. ✔
- **Duplication et restauration de version** : `format-mise-en-page.test.js`, ✔.
- **Responsive de l'écran de démarrage** : Chrome à 420 px, ✔.
- **Performance** : mesure alternée branche / `main` (script `perf-vide`, 3 tours chacun, page de 43 éléments, 20 cycles sélection → suppression → annulation, CDP `Performance.getMetrics`). Mises en page : 342–350 (branche) contre 330–352 (`main`). Temps de script : 215–264 ms contre 185–317 ms. **Aucune différence au-delà du bruit de mesure** ; l'écran n'ajoute ni requête ni rendu de canevas (`refreshStart` sort immédiatement quand la page n'est pas vide).
- **Choix « classique » non enregistré** : décision de conception, pas un défaut. Une page qui reste vide n'a rien à conserver ; le choix est reproposé tant qu'aucun élément ni format n'existe. Une page libre = absence de `theme.layout` (aucune seconde source de vérité).
- Reste hors de portée de cet environnement : Safari et Firefox.

## Suite complète (`npm test`, 4 502 tests)

Première exécution : 4 458 réussis, 44 échecs. Analyse :

- **41 échecs causés par cette fonctionnalité** (`editeur-canvas-containers-navigateur`, `editeur-structure-navigateur`, `editeur-zone-conteneurs-navigateur`) : ces tests ouvrent une page à `sections: []` et cliquent sur le « + » de la page vide, désormais recouvert par l'écran de choix (comportement voulu). Correction : helper `dismissStart` (`tests/helpers.js`, « Choisir un gabarit » puis « Annuler », aucune écriture) appelé à l'ouverture. **Rejoués après correction : 64/64 réussis** (avec le nouveau fichier et `editeur-stabilite`, 1 échec hors sujet ci-dessous).
- **4 échecs déjà présents sur `origin/main`** (vérifiés sur le worktree `KOYEKOLA-performance` = même commit 97e9a7e, mêmes erreurs), non liés à ce travail et non corrigés ici :
  - `editeur-stabilite-navigateur` : « valider une valeur dans l'inspecteur » (en-tête 110 → 156 px) ;
  - `refonte-design` : « les ombres sont teintées de bleu nuit » ;
  - `seo-jobs` : « rapports : audit CSV/JSON… » ;
  - `widgets-imbriques` : « carrousel (Chrome) ».
- La suite complète n'a **pas** été relancée en entier après la correction des tests ; seuls les fichiers concernés l'ont été.

Playwright n'est pas installé dans le projet : les parcours Chrome ont été exécutés avec `playwright-core` installé hors du dépôt (`NODE_PATH`), et le Chrome local.
