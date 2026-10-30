# Programme 21.3 — Tests

Commande : `node --test tests/programme21-3-brief-planner.test.js tests/programme21-3-brief-planner-http.test.js` → **30 tests sur 30 verts** (26 en service, 4 en HTTP réel).

## Méthode
- **Fournisseur factice déterministe** branché sur le vrai AI Core (`aiCore.setClientForTests` → `ai.call` → `runJson`) : plafond, module par site, journal et schémas sont réellement exercés ; aucun réseau, aucun coût.
- **HTTP réel** : serveur spawné + faux serveur d'API local utilisé par le vrai SDK (`ANTHROPIC_BASE_URL`), comme `ia-par-site.test.js`.
- **Limite importante** : les réponses du fournisseur sont écrites à la main. Ces tests prouvent la **validité structurelle**, le **rapprochement avec le registre** et la **robustesse** du traitement ; ils ne prouvent **pas** la qualité des analyses d'un vrai modèle (voir REMAINING_ISSUES).

## Correspondance avec les scénarios demandés
| Scénario | Test |
|---|---|
| A site vitrine | « A — analyse puis architecture » (3 tests : statuts, plan, citation inventée déclassée) |
| B boutique | « B boutique » (boutique indisponible, paiement partiel, plafond de 5 questions) + blocage de validation puis reconnaissance |
| C immobilier | « C immobilier » (catalogue de biens partiel, sans recherche par prix) |
| D éducatif | « D éducation » (état du catalogue de formations = état réel du module) |
| E brief incomplet | questions filtrées/ordonnées avec « pourquoi » ; plan refusé sans appel tant que bloquant ; réponses modifiables |
| F contradictoire | règle + modèle, fiche « blocked » |
| G multilingue | anglais compris ; espagnol → langue non prise en charge, question bloquante |
| H international | pays → devise/fuseau, `payments`/`legal` toujours « unverified », pays inconnu sans valeur par défaut |
| I composant indisponible | type de section, élément, page et dépendances inexistants signalés ; registre lu dans le code |
| J modification du plan | 12 opérations, historique, validation requise, conflit de révision, plan validé repassé « modified » |
| K réponse invalide | JSON illisible, plan sans pages, valeurs hors liste, adresses réservées/doublons, brief vide/court/long |
| L quota | plafond de l'AI Core, sans clé, erreur fournisseur ; journal `brief:1, plan:1` |
| Isolation | accès limité site 1 contre site 2 / organisation / autre organisation ; module coupé ; site forgé ignoré ; site d'une autre organisation refusé |
| Secrets | aucune clé dans les réponses ; une seule clé utilisée ; brief traité comme donnée |

## Vérification par mutation
- Retirer la vérification des citations → 1 test échoue.
- Retirer le contrôle d'existence du type de section → 1 test échoue.
Code restauré ensuite (26/26).

## Régression (fichiers voisins, exécutés un par un car la machine était chargée, load 10 à 24)
| Fichier | Résultat |
|---|---|
| portee-des-routes | 8/8 après mise à jour de l'oracle (nouvelle règle `/ia/site`) — **1 échec provoqué par ce palier avant correction** |
| palier12-migration-composants-revision | 2/2 après mise à jour de la liste de migrations — idem |
| site-espace | 25/25 après passage de « dernière migration 115 » à 116 — idem (il échouait déjà sur `main` avant mon changement) |
| site-menu-p1a | 70/70 (échouait déjà sur `main` : plafond 114 < 115 ; maintenant 116) |
| marketing-migrations, marketing-migrations-figees, journal-audit-par-site, modules-par-site, ia-studio, ia-transition-equivalence, marketing-ia-redaction, site-scope-portee, repository-cache-schema, ia-par-site (serveur réel) | tous verts |

**Non exécutés / non concluants** : `audit-corrections`, `audit-palier3`, `connecteurs-ia` (lancement groupé : plusieurs tests ont dépassé 120 s à cause de la charge de la machine, sans lien établi avec ce palier). **La suite complète (700+ fichiers) n'a pas été lancée.** La CI GitHub reste inutilisable (0 étape).
