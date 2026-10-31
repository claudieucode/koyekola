# Mailchimp — résultats des tests

*30 octobre 2026. Commande : `ENCRYPTION_KEY=<64 caractères> TEST_START_TIMEOUT_MS=600000 node --test --test-concurrency=1 <fichiers>` (toujours `--test-concurrency=1` : en parallèle, les tests navigateur dépassent leurs délais sur une machine chargée).*

## 1. Ce que ces tests prouvent — et ne prouvent pas
**Aucune clé Mailchimp réelle n'était disponible.** Toutes les requêtes sortantes visent `tests/fake-mailchimp.js`, un simulateur local qui reproduit les formes de l'API (erreurs RFC 7807, pagination `count/offset`, empreinte MD5 des membres, état de conformité, lots, webhooks, campagnes, rapports, Mandrill). Il vérifie que Kolakisa émet **la bonne requête** (méthode, chemin, paramètres, corps) et réagit correctement aux réponses prévues. **Il ne prouve pas** que le vrai Mailchimp accepte ces requêtes ni qu'il répond exactement ainsi : les chemins, champs obligatoires et formes de réponse viennent de la documentation publique telle que connue du rédacteur. **Statut : intégration non validée contre le service réel.**

## 2. Résultats
| Fichier | Tests | Réussis | Contenu |
|---|---|---|---|
| `mailchimp-client.test.js` | 14 | 14 | clé et centre de données, authentification, erreurs normalisées en français, 429 (Retry-After, délai exponentiel), jamais de nouvelle tentative d'un POST sur 5xx, plafond de requêtes simultanées, délai d'attente, panne réseau, pagination, journal sans secret, chemins suspects |
| `mailchimp-sync.test.js` | 50 | 50 | connexion et chiffrement, isolation des organisations, miroirs, import des membres avec preuve de consentement, **« le plus restrictif gagne »**, envoi vers Mailchimp, incrémental, verrou, pannes, webhooks entrants (6 types, idempotence, conflit, rejeu, journal, installation), droit à l'effacement, import/export CSV, aperçu, comparaison, tableau de bord et alertes, Transactionnel (Mandrill) |
| `mailchimp-relecture.test.js` | 18 | 18 | un test par défaut trouvé par la relecture adverse (voir §4) |
| `mailchimp-routes.test.js` | 49 | 49 | droits (anonyme, lecteur, éditeur, élève, accès limité à un site), connexion, **contrat des 156 opérations du catalogue + 31 opérations Transactionnel** (méthode, chemin, paramètres, corps reçus par le simulateur ; confirmation exigée pour les actions irréversibles), validation stricte, protection inter-sites, composés, synchronisation, webhook public (jeton, limiteur), erreurs traduites, journal, minuteur horaire réel |
| `mailchimp-contrat-ecran.test.js` | 3 | 3 | **chaque appel écrit dans l'écran** vise une route existante, avec la bonne méthode et des paramètres acceptés (analyse statique ; prouvé capable de détecter une dérive) |
| `mailchimp-doc.test.js` | 4 | 4 | documentation à jour (générée du catalogue), complète, sans reste de travail ; variables d'environnement lues par le code |
| `mailchimp-navigateur.test.js` (Chrome) | 21 | 21 | parcours de base : connexion, onglets au clavier, audiences, import CSV avec correspondance, export, détail, contacts, assistant de campagne, envoi confirmé, modèles, rapports, webhooks en direct, Transactionnel, noms accessibles, titres, téléphone 390 px, permissions |
| `mailchimp-navigateur-flux.test.js` (Chrome) | 17 | 17 | texte brut, RSS, test A/B, segment, contrôle avant envoi, planification UTC, contenu et test d'une campagne, consentement du contact, filtre par tag, abonnement groupé, audience (modification, suppression par saisie du nom), automatisations, boutiques, pages, domaines, webhook personnalisé, rejets ; chaque assertion lit la requête **reçue** par le simulateur |
| `mailchimp-firefox.test.js` (Firefox, WebDriver BiDi) | 2 | 2 | chargement sans erreur JavaScript, onglets, boîtes de dialogue, assistant |
| **Total Mailchimp** | **178** | **178** | |

Régression : **2 159 / 2 159** sur 150 fichiers — tous les tests `marketing-*`, droits et rôles, contacts, confidentialité et effacement, portée des routes, cohérence des moteurs, inventaire des tables, plafonds de migration, menus, assistant de création de site, bibliothèque de modèles du Programme 20.4.

## 3. Écarts et fragilités, dits tels quels
- **Un échec intermittent** a été observé une fois dans `mailchimp-navigateur.test.js` pendant une passe chargée (21 tests, 20 réussis) ; il ne s'est pas reproduit aux deux passes suivantes (21 / 21). Cause non identifiée : probablement un délai de 12 s sous charge.
- **Un échec préexistant sans lien** : `tests/effacer-donnees.test.js` (« e-mail non parti ») échoue **à l'identique** sur `main` (a1e45460… `3abf0fd1`) sans mes changements ; je ne l'ai pas modifié.
- **Suite complète du dépôt non exécutée** (696 fichiers, plusieurs heures sur cette machine partagée) : j'ai rejoué les 150 fichiers qui touchent ce que l'intégration modifie ou côtoie. Un fichier non rejoué peut encore contenir une dépendance non vue.
- **Safari et Edge non testés.** Chrome et Firefox seulement. Aucun lecteur d'écran, axe-core ni Lighthouse : contrôles d'accessibilité partiels (noms accessibles, ordre des titres, clavier, focus rendu, contraste hérité du thème).
- **Aucun test de charge** sur un vrai volume (50 000 membres) : la lecture par tranches et la reprise ont été testées avec un plafond réduit (3 membres), pas avec la volumétrie réelle.

## 4. Défauts trouvés en cours de route (et corrigés)
Par les tests : curseur de synchronisation avancé trop tôt ; message de succès effacé aussitôt (connexion) ; segment choisi à l'étape 2 de l'assistant remis à zéro (campagne envoyée à toute l'audience) ; appel `/rapports` avec un paramètre de tri refusé ; variable `clear` non définie dans l'onglet Contacts ; clé Mandrill refusée mais conservée et formulaire disparu ; limite de 429 déclenchée par les événements légitimes ; erreurs d'ordre de test.

Par une relecture indépendante (agent en lecture seule, 25 constats, 18 corrigés avec un test chacun) :
1. séries de bienvenue de Kolakisa déclenchées par l'import de personnes déjà abonnées chez Mailchimp → événements non émis pour les contacts nés d'une synchronisation ;
2. consentement d'une audience **non liée** importé comme consentement marketing → seuls les événements restrictifs s'appliquent ;
3. désinscription de **la liste liée** ignorée → traitée comme un blocage ;
4. plafond de 10 connexions non partagé entre l'écran, la synchronisation et les webhooks → plafond partagé par organisation ;
5. `wait_time` du test A/B envoyé en heures au lieu de minutes → corrigé ;
6. HTML d'un modèle lu sur un point d'accès qui ne le renvoie pas → HTML conservé pour les modèles créés depuis Kolakisa, indisponibilité explicite sinon ;
7. désabonnement perdu si l'envoi échoue → curseur avancé après l'envoi ; 8. alias d'un contact désinscrit ré-importable → corrigé ; 9. site gelé pendant une grosse synchronisation → l'event loop est cédée entre les lots ; 10. changement d'adresse d'une personne désinscrite → la nouvelle adresse hérite ; 11. effacement annulé par la synchronisation → suppression définitive chez Mailchimp et pas de réimport ; 12. course à l'étape 2 de l'assistant ; 13. événements restés en suspens → retraités ; 14. plus de 50 000 membres → reprise sans trou ; 15. envois refusés retentés indéfiniment ; 16. limiteur de webhook ; 17. import interrompu → rapport partiel ; 19. fiche d'un contact en attente ; 21–23, 25 divers (sondage, séquence de chargement, noms de modèles Mandrill, chemin « . », jeton absent des journaux, rotation du jeton répercutée chez Mailchimp, charge tronquée toujours en JSON valide) ; 24. opérations génériques qui contournaient « le plus restrictif gagne » et lot générique (`batches.create`) retiré.
Non corrigés : voir `README_MAILCHIMP.md` § « Limites connues » (export avec `window.location` remplacé par un téléchargement par `fetch`, fait ; reste : verrou valable pour un seul processus).

## 5. Recette avec un vrai compte (NON FAITE — à exécuter avant la production)
1. Créer une audience de test chez Mailchimp avec 2 contacts de test. 2. *Connexion* : coller la clé → compte affiché. 3. *Audiences → Lier* puis *Synchroniser* : les 2 contacts apparaissent dans Kolakisa avec leur preuve. 4. Désinscrire l'un dans Mailchimp → il l'est dans Kolakisa. 5. *Webhooks → Installer* ; s'abonner via un formulaire Mailchimp → l'événement apparaît en direct. 6. *Campagnes* : assistant complet jusqu'à un **brouillon**, test envoyé à une adresse interne, contrôle avant envoi. 7. Vérifier les points signalés « à vérifier » dans `MAILCHIMP_DOC.md` : import par lot avec `update_existing` et `status_if_new`, options RSS (`schedule`), `variate_settings`, forme de `sub-reports`.
