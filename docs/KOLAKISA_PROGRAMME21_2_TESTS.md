# KOLAKISA — Programme 21.2 : tests

Aucun appel payant, aucune clé réelle. Fournisseurs simulés (`tests/ai-core-fakes.js`), base en mémoire avec **les vraies migrations**, faux serveur HTTP local pour les adaptateurs.

Commande : `TEST_START_TIMEOUT_MS=900000 node --test --test-concurrency=1 tests/ai-core.test.js tests/ai-core-adapters.test.js tests/connecteurs.test.js tests/connecteurs-ia.test.js tests/connecteurs-securite.test.js tests/site-espace-unitaire.test.js tests/marketing-migrations.test.js tests/marketing-migrations-figees.test.js tests/marketing-fondations.test.js tests/palier12-migration-composants-revision.test.js`

## Résultats
| Lot | Exécutés | Réussis | Échecs |
|---|---|---|---|
| `ai-core.test.js` (architecture, requêtes, fournisseurs en défaut, coûts et quotas, sécurité, résilience) | 48 | 48 | 0 |
| `ai-core-adapters.test.js` (4 adaptateurs, faux serveur local) | 8 | 8 | 0 |
| Non-régression (connecteurs, inventaire des tables, migrations) | 80 | 80 après ajustement (voir ci-dessous) | 0 |
**Suite complète `npm test` : non exécutée.**

## Couverture de la liste du programme
Architecture (initialisation, enregistrement fournisseurs/modèles, sélection) ✔ · Requêtes (valide, 15 invalides, normale, structurée, malformée, vide) ✔ · Fournisseurs (indisponible, clé invalide, quota fournisseur, modèle inconnu/indisponible, non configuré) ✔ · Coûts (calcul, usage manquant, tarif inconnu/périmé, quotas utilisateur/site/organisation/module/global, dépassement, fenêtre journalière) ✔ · Sécurité (clé absente des sorties et journaux, isolation des sites et organisations, permissions, administrateur de site borné, réponse non fiable) ✔ · Résilience (délai, réseau, réessai contrôlé, doublons séquentiels et simultanés, rejouabilité, basculement autorisé/refusé, plafond de coût du secours, quotas, disjoncteur) ✔.

## Contrôles de la valeur des tests
Deux garanties ont été cassées volontairement : retrait du contrôle de quota → 9 tests échouent ; secours autorisé après un échec facturable → 2 tests échouent. Code restauré, 48/48.

## Incidents et ajustements
1. Un essai de test a **contacté réellement `api.openai.com`** (fausse clé, 401, sans coût) : passage supprimé ; aucun test n'appelle d'hôte externe.
2. `palier12-migration-composants-revision.test.js` : attendu `["114","115"]` → `["114","115","116"]` (la migration 116 est nouvelle). Aucune autre assertion modifiée.
3. Premier cas « requête invalide » mal écrit (une requête valide) : corrigé dans le test, pas dans le code.

## Non testé
Fournisseurs réels (aucune clé) · rendu des écrans (inexistants) · routes HTTP (inexistantes) · rotation/suppression de clé via le centre de connecteurs avec le Core · concurrence multi-processus · charge · démarrage d'un serveur complet avec la migration 116 (testée en mémoire sur la chaîne complète de migrations et sur une mise à niveau 113 → 116).
