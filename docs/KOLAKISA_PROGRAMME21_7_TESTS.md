# Programme 21.7 — tests

`tests/ai-media.test.js` : **21 tests** (service sur base en mémoire + dossier de fichiers jetable + faux serveur de fournisseur local ; web sur vrai serveur). Aucun appel externe, aucun crédit.
Couverture des 23 exigences : 1 Hero · 2 sections · 3 produits (« sans emplacement ») · 4 sélection existante · 5 import · 6/7 MIME et fichiers invalides · 8/9/10 variantes responsives (WebP selon sharp, AVIF non) · 11 alt · 12/13 association, sauvegarde, rechargement, fichier servi (HTTP 200 `image/png`), page ouverte dans l'éditeur · 14 régénération/variantes/relance contrôlée · 15 protection des choix manuels, restauration · 16 historique · 17 quotas AI Core · 18 erreurs fournisseur (401, 429, 500, 400, vide, illisible, Base64 invalide) sans fuite de clé · 19/20 isolation et droits (service et web) · 21 provenance · 22 doublons (idempotence) · 23 tâches asynchrones, annulation, expiration.
## Résultats
Médias IA + design + page generator + assistant + routes + menu + migration : **124 tests, 124 réussis, 0 échec** (suite complète du projet non exécutée). Pas de lint, de typecheck ni de build dans ce projet (Node sans compilation) : syntaxe vérifiée par `node --check` et compilation des gabarits EJS.
## Non testé
Aucun vrai fournisseur ; rendu visuel navigateur ; sharp absent (variantes) ; charge ; AVIF.
