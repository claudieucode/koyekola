# Programme 20.7 — résultats de tests (exacts)

| Série | Résultat |
|---|---|
| `programme20-7-integration.test.js` | 6/6 |
| 25 fichiers d'isolation, migrations, portées, assistant, apparence, AI Core/Media (rejoués en 21.8) | 369/369, 0 ignoré |
| Version 21.8 poussée : `programme21-8-ai-builder-http` + `-navigateur`, `palier12-migration`, `marketing-migrations` | 24/24, 2/2, 18/18 |
| `portee-des-routes` sur `main` (904709af) | 8/8 seul ; **4 échecs observés une fois pendant une exécution groupée sous forte charge, non reproduits ensuite** (classé : instable sous charge, à surveiller) |
| Suite complète, 4 tranches parallèles (sous charge, avec d'autres sessions) | **Non terminée** : tranche 2 terminée (1 794 tests, 1 777 réussis, 17 échecs) ; tranche 0 inexploitable (263 fichiers « event loop has already resolved ») ; tranches 1 et 3 interrompues par moi. Les échecs observés sont des parcours Chrome à délai dépassé sous charge et les échecs de charte déjà connus (violet, ombres dures, classes orphelines, palette). **Non rejoués à froid : ils ne comptent ni comme réussis ni comme confirmés.** |
| Lint, typecheck, build | **N'existent pas** dans le projet (`NOT_IMPLEMENTED`) |
| Dernière suite complète terminée (référence) | Palier 18 : 6 660 tests, 6 625 réussis, 25 échecs, 10 ignorés |
