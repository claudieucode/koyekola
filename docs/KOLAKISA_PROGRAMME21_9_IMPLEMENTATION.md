# Programme 21.9 — Régénération intelligente et historique : implémentation

Branche `feat/programme-21-9-regeneration-history`, issue de `origin/main`.

## 1. Audit initial (état réel, vérifié dans le code)
| Système | État sur `main` | Décision |
|---|---|---|
| Historique natif des contenus | **Présent et fonctionnel** : `src/services/revisions.js` (adaptateurs page, article, apparence, pattern : liste, comparaison, restauration, corbeille), `mk_page_versions`, écran `/site-web/historique/…`, droits `revisions.view/restore/delete`, enregistrement automatique des brouillons de page | **Réutilisé tel quel, non reconstruit.** Il est centré sur UN contenu et ses sauvegardes ; il ne sait ni relier une modification à une DEMANDE, ni comparer des sections/éléments, ni restaurer le design ou le site |
| Contrôle de concurrence | `pages.saveDraft` (révision, 409), `customizer.saveDraft` (rev) | Réutilisé |
| Undo / Redo de l'éditeur | Côté navigateur (historique d'actions du Page Builder) | **Non touché, non concurrencé** |
| Undo du constructeur 21.8 | Pile « annuler / rétablir » du **plan** (`mk_ai_builder_states`) | Distinct : ne couvre ni les pages, ni le design, ni les textes |
| Annulations propres à chaque moteur | pagegen.undo, designgen.undo, contentGen (versions, unapply), aiMedia (restaurer) | Conservées ; non unifiées entre elles |
| Verrous | `lockedWidgetChanges` (éléments du Page Builder), verrou de champ du Content Generator, `layoutFormat.checkLocked` | Pas de verrou de PAGE / SECTION / design côté serveur → ajouté ici |
| AI Core 21.2 | Présent, **non branché en production** | Les textes passent par `ai.call` (Content Generator), plafond d'organisation |
| 21.3 à 21.8 | Présents sur `main` | Réutilisés : Content Generator (`reviseValue`, `generatePage`, `apply`), AI Media (`plan`, `estimate`, `start`), personnalisateur (via Design Generator), normaliseurs natifs |

Conflits potentiels vus : la 21.8 de `main` et une réalisation alternative (branche `alt/…`) ; aucune n'est modifiée ici. Risque de régression principal : le Content Generator (modifié, voir ci-dessous) — ses 27 + 3 tests passent.

## 2. Livré (`src/regen/`)
| Responsabilité demandée | Fichier |
|---|---|
| Change Request Analyzer | `analyzer.js` |
| Context Resolver · Dependency Analyzer · Impact Analyzer | `context.js` |
| Regeneration Scope Planner · Selective Regeneration Engine · Orchestrator · Change Validation | `engine.js` |
| Preservation Engine | `protect.js` |
| Version Snapshot Manager | `snapshots.js` |
| History Manager | `history.js` |
| Version Comparison Engine | `compare.js` |
| Restore Engine | `restore.js` |
| Conflict Detection Engine | `engine.js` (apply, undo), `restore.js` (conflictCheck) |
| Stockage (tables créées à la demande) | `store.js` |
| Port du design (personnalisateur) | `designPort.js` |
| Façade | `index.js` |
| API JSON + écran | `src/marketing/web/regeneration.js`, `views/marketing/site-regen.ejs`, `public/js/regen.js`, `public/css/regen.css` |

## 3. Fichiers existants modifiés
- `src/contentGen/engine.js` : extraction de `reviseValue` (réécriture d'une valeur SANS ensemble enregistré, réutilisée par `revise`) ; `apply` ignore une page/section **verrouillée** par la personne.
- `src/marketing/web/index.js` : montage de la route.

## 4. Tables (créées à la demande, aucune migration)
`mk_regen_ops`, `mk_regen_op_snaps`, `mk_regen_snapshots`, `mk_regen_protections`, `mk_regen_marks`. Choix identique aux paliers 21.4, 21.5, 21.7, 21.8 : les numéros de migration se télescopent entre paliers parallèles et plusieurs tests figent le dernier numéro. Retour arrière : `DROP TABLE` des cinq tables.

## 5. Écran
`/marketing/site-web/sites/:id/regeneration` : onglets **Modifier** (demande, proposition avant/après, impact, appliquer / refuser, annuler / rétablir), **Historique et versions** (opérations filtrables, versions, comparaison avec l'état actuel, restauration, consommation IA), **Protection** (verrouiller / valider / retirer, état par page, section et champ). Dans le même gabarit que les écrans du site (marine, responsive, onglets accessibles au clavier).

## 6. Ce qui n'est pas branché
Le lien vers cet écran n'est pas encore présent dans l'interface 21.8 de `main` (écran distinct, adresse ci-dessus). Voir REMAINING_ISSUES.
