# KOLAKISA — Programme 21.8 : tests

Aucun appel payant : faux serveur d'API local (vrai SDK) pour l'IA de texte, fournisseur d'images « démonstration » pour les images. Serveur Kolakisa réel démarré par les tests ; Chrome réel (Google Chrome, Playwright) pour l'interface.

## Résultats (exécutés)
| Lot | Exécutés | Réussis | Échoués | Ignorés |
|---|---|---|---|---|
| `programme21-8-ai-builder-http.test.js` (serveur réel) | 28 | 28 | 0 | 0 |
| `programme21-8-ai-builder-navigateur.test.js` (Chrome réel) | 11 | 11 | 0 | 0 |
| Non-régression : 28 fichiers (paliers 20.2/20.7, 21.2 à 21.7, portée des routes, inventaire des tables, migrations, connecteurs, Theme Builder, assistant de création de site) | 433 | 431 | **2** | 0 |
| ↳ après correction de l'oracle de portée (`portee-des-routes.test.js`) | 8 / 8 réussis | | | |
| ↳ reste en échec, **hors périmètre de ce palier** | `assistant-creation-site.test.js` « D. site éducatif » | | 1 | |

L'échec restant est **préexistant sur `main`** : il attend « Pas encore ouvert aux sites » pour le module LMS, devenu « ouvert » par le commit 3f976382 (LMS multi-sites). Je n'ai pas modifié ce test (autre chantier). **Suite complète `npm test` : non exécutée.** Lint, typecheck : **aucun script n'existe** dans ce dépôt ; vérification de syntaxe `node --check` sur les scripts du navigateur ; le build des bundles de l'éditeur n'est pas concerné (aucune source de l'éditeur modifiée).
Commande : `NODE_PATH=<playwright-core> TEST_START_TIMEOUT_MS=900000 node --test --test-concurrency=1 tests/programme21-8-ai-builder-http.test.js tests/programme21-8-ai-builder-navigateur.test.js`. Le test navigateur est **ignoré (avec la raison)** si Playwright ou Chrome sont absents (cas du dépôt par défaut : `playwright-core` n'est pas une dépendance).

## Couverture de la liste du programme (26 points)
| # | Point | Où |
|---|---|---|
| 1 | Création d'un projet | HTTP « création et brief » ; navigateur |
| 2 | Chargement d'un projet existant | HTTP (état, page) ; navigateur « Reprendre mon travail » |
| 3 | Analyse du brief | HTTP (moteur 21.3 sur faux fournisseur) ; refus d'un brief trop court sans site créé |
| 4 | Affichage du plan | HTTP, navigateur |
| 5 | Modification du plan | HTTP (révision, 409, lot atomique) ; navigateur (renommer) |
| 6 | Gestion des pages | HTTP (générer, appliquer, brouillons) ; navigateur |
| 7 | Plan de design | HTTP (3 propositions) |
| 8 | Modification des couleurs | **partiel** : choix d'une direction, comparaison, application, annulation (HTTP) ; pas de saisie de couleur (voir L4) |
| 9 | Consultation des contenus | HTTP (jeux de textes dans l'état) |
| 10 | Modification des contenus | **partiel** : génération testée en HTTP ; l'édition champ par champ n'est pas testée dans l'interface |
| 11 | Consultation des médias | HTTP, navigateur |
| 12 | Génération simulée d'images | HTTP + navigateur : estimation, tâche asynchrone, image générée |
| 13 | Association des médias aux pages | HTTP + navigateur : accepter → image en place ; remplacement refusé sans demande explicite (409) |
| 14 | Prévisualisation | HTTP (aperçu natif 200) ; navigateur (cadre, largeurs mobile/ordinateur, page rendue) |
| 15 | Passage entre étapes | navigateur : structure mesurée identique sur les 8 étapes |
| 16 | Sauvegarde automatique | HTTP (chaque action persistée) ; navigateur (indicateur « Enregistré à… ») |
| 17 | Récupération après interruption | navigateur : coupure réseau → bannière, rien affiché comme enregistré, « Réessayer » |
| 18 | Historique des modifications | HTTP (historique d'actions, conversation) |
| 19 | Annuler / rétablir | HTTP + navigateur (plusieurs cas : lot, duplication, pile vidée) |
| 20 | Gestion des erreurs | HTTP (409, 422, 429, 403) ; navigateur (réseau) |
| 21 | Quotas | HTTP : plafond quotidien → 429, site créé archivé |
| 22 | Permissions | HTTP : lecteur sans droit, éditeur limité, publication sans validation |
| 23 | Isolation multisite | HTTP : liste, état, plan, assistant, génération, annulation, publication, `?site=` hostile, messages d'un autre projet |
| 24 | Responsive | navigateur : 1440 / 1024 / 390 px (débordement, disposition, assistant, chevauchement) |
| 25 | Régression des interfaces existantes | 28 fichiers listés ci-dessus |
| 26 | Publication et statuts | HTTP : blocage avant validation, publication native cohérente avec l'état, une seule fois |
Interaction réelle des moteurs 21.3 → 21.4 → 21.5 → 21.6 → 21.7 → publication : un seul parcours HTTP les enchaîne sur la même base.

## Incidents du palier (tous corrigés)
Voir `KOLAKISA_PROGRAMME21_8_IMPLEMENTATION.md` §4 (site orphelin, bouton Publier visible, focus perdu, mise en page mobile, badge, `?site=`, numéro de migration). Deux erreurs de procédure de ma part : un remplacement de code inséré au mauvais endroit (détecté par un test de focus, corrigé) ; une suite de non-régression lancée avec une liste mal découpée (aucun test exécuté, détecté, relancée).

## Non testé
Édition champ par champ des contenus dans l'interface · accessibilité avec lecteur d'écran · Firefox, Safari · performance avec des dizaines de pages · plusieurs onglets simultanés dans le navigateur (conflit testé côté serveur) · fournisseurs réels (texte et images).
