# KOLAKISA — Programme 21.8 : interface « Assistant IA » de création de site (implémentation)

*Branche `feat/programme-21-8-builder-ui`, issue de `origin/main` (0eaab200+). 2026-10-30.*

## 1. Audit préalable : l'état RÉEL des paliers 21.1 à 21.7
| Palier | Sur `main` | Constat vérifié dans le code |
|---|---|---|
| 21.1 | oui (documents) | Audit, étude, architecture. Aucun code. |
| 21.2 AI Core | oui (`src/ai`) | Opérationnel avec fournisseurs **simulés** ; **non branché** : ni le planificateur, ni les générateurs ne l'appellent (ils utilisent `ai.call` / `services/aiCore.js`, Anthropic seul). Aucune clé réelle vérifiée. |
| 21.3 Brief Analyzer + Site Planner | oui | API JSON `/marketing/ia/site/…`, plans versionnés avec révision, historique d'actions sans état avant/après. **Aucune interface.** |
| 21.4 Page Generator | oui | Crée des **brouillons** natifs, annulable. **N'est PAS relié au Site Planner** : son contrat de plan (v1) est différent, `validatedPlan()` n'était appelé nulle part. |
| 21.5 Design Generator | oui | 3 directions, comparaison avec protection des réglages manuels, application au brouillon du personnalisateur, annulation. |
| 21.6 Content Generator | oui | Jeux de textes par page, révision, verrouillage, validation, application au brouillon. Aucun écran. |
| 21.7 Media Generator + Asset Manager | oui | Besoins visuels, tâches asynchrones, affectation protégée. **Un seul fournisseur utilisable : « démonstration » (images de substitution).** Fournisseur réel (OpenAI) jamais appelé en réel. |

## 2. Réutilisé tel quel (aucun moteur refait)
Plans (21.3) · générateur de pages (21.4) · design (21.5) · contenus (21.6) · médias (21.7) · aperçu natif `/marketing/pages/:id/apercu` · publication native `pages.publish` (avec son contrôle de préparation) · gestion des sites (`createSite`, `archiveSite`) · modules par site (`ia`) · permissions `forms.*`, `appearance.styles`, `pages.publish` · médiathèque.

## 3. Construit pour ce palier
| Élément | Fichier |
|---|---|
| Passerelle Site Planner → Page Generator (le chaînon qui manquait ; sections sans équivalent listées, jamais ignorées en silence) | `src/marketing/ai/builder/bridge.js` |
| Service d'orchestration : état, statuts d'étapes calculés, liste de contrôle, annuler/rétablir, conversation, publication groupée | `src/marketing/ai/builder/workspace.js` |
| Assistant contextuel à règles (sans IA) | `src/marketing/ai/builder/assistant.js` |
| Restauration d'état (hors catalogue d'opérations, donc non joignable par l'API) | `plans.restoreState` |
| Routes (pages et API JSON), sous `/marketing/ia/studio` | `src/marketing/web/aiBuilder.js` |
| Vues et interface | `views/marketing/ai-builder*.ejs`, `public/js/ai-builder*.js`, `public/css/ai-builder.css` |
| Migration **120** (annuler/rétablir, conversation) | `120_assistant_ia_studio.sql` |
| Tests | `programme21-8-ai-builder-http.test.js`, `…-navigateur.test.js` |

## 4. Défauts trouvés et corrigés pendant le palier (par les tests)
1. `createProject` créait un site **avant** d'analyser le brief : un brief refusé laissait un site orphelin. Désormais : contrôle du brief d'abord, et site **archivé** (jamais supprimé) si l'analyse échoue ensuite.
2. Le bouton « Publier » s'affichait dès le départ : `display:inline-flex` écrasait l'attribut `hidden`.
3. Le focus clavier était **perdu** à chaque changement d'étape (la liste était reconstruite).
4. Mise en page mobile non appliquée (conflit de spécificité CSS) et assistant couvrant le travail sur petit écran.
5. Badge d'état chevauchant le titre d'une étape.
6. Un membre limité à un site recevait des redirections : le site visé doit figurer dans l'adresse (`?site=`), comme pour l'API 21.3.
7. Collision de numéro de migration : `119` pris entre-temps par le LMS (`119_cours_par_site.sql`) → renumérotée **120**.

## 5. Statut : voir `KOLAKISA_PROGRAMME21_8_REMAINING_ISSUES.md`
