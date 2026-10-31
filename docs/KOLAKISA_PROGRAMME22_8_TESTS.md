# KOLAKISA — Tests du programme 22.8

Fichiers :
* `tests/programme22-8-responsive.test.js` — 15 tests : sécurité de la typographie fluide, Breakpoint Manager, audit statique, assistant sur serveur réel (proposer → appliquer → annuler, portée locale, protections 409/423, isolation multisite, droits).
* `tests/programme22-8-responsive-navigateur.test.js` — 4 tests dans Chrome réel : fluide mesuré à 8 largeurs et au zoom du texte ; défaut mesuré → correction → page publiée sans débordement à 4 largeurs ; audit navigateur aux 7 profils ; menu mobile (clic, clavier, Échap, focus, ordinateur).
Exécution : `TEST_START_TIMEOUT_MS=500000 NODE_PATH=<playwright> node --test tests/programme22-8-*.test.js`. Chrome absent → tests navigateur ignorés avec la raison.
Les résultats chiffrés de la dernière exécution figurent dans `KOLAKISA_PROGRAMME22_8_IMPLEMENTATION.md`.
Couverture par rapport à la liste du cahier des charges : voir la table dans `IMPLEMENTATION`. Non couvert : carrousels, formulaires mobiles, publication de bout en bout au-delà de `/p/slug`, performance.
