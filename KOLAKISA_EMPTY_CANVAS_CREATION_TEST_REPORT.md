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

## Non vérifié ou limites

- **Critères 5, 6, 15, 17, 18 (Flexbox, widgets, vues responsive, erreurs, non-régression globale)** : non retestés un par un ; couverts seulement par les tests existants exécutés ci-dessus et par le fait que le mode guidé n'ajoute aucun code de rendu. Résultat de la suite complète : voir la section suivante.
- **Critère 14 (IA)** : le comportement de l'IA face au verrou existe déjà (`studio.validate`, test `ia-studio`) et n'a pas été modifié ; aucun nouveau test IA propre à l'écran de démarrage.
- **Restauration d'une version, duplication de page** : non testées spécifiquement (le format vit dans le thème versionné et dupliqué, selon l'architecture existante).
- **Responsive de l'écran de démarrage lui-même** : règles CSS écrites (`auto-fit`, `@media 640px`), non vérifiées dans Chrome à petite largeur.
- Le choix « classique » n'est pas enregistré (conception libre = absence de `theme.layout`) ; une page toujours vide rechargée réaffiche donc le choix.
- Pas de mesure de performance chiffrée ; l'écran n'ajoute ni requête, ni rendu du Canvas, ni état persisté.

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
