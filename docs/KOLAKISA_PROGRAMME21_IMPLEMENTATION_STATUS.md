# Programme 21 — état d'implémentation (22.10)

La matrice détaillée palier par palier (21.1 à 21.10), avec statut, fichiers, tests et limites, est celle du 21.11 : **`KOLAKISA_PROGRAMME21_INTEGRATION_MATRIX.md`**, vérifiée contre le code fusionné ; les écarts constatés depuis sont listés ici.

| Palier | Statut 22.10 |
|---|---|
| 21.1 Architecture/doc | opérationnel (documentaire) |
| 21.2 AI Core | registre/routage/quotas opérationnels ; **adaptateurs jamais appelés en réel** ; non branché au studio |
| 21.3 Brief + planificateur | opérationnel avec modèle simulé ; planificateur déclare la boutique indisponible (I1) |
| 21.4 Page Generator | opérationnel (27 tests, +1 en 22.10) ; types manquants (chambres, programme, intervenants) ; accueils identiques |
| 21.5 Design | opérationnel ; variation de teinte limitée (Q7) |
| 21.6 Contenu | opérationnel avec modèle simulé |
| 21.7 Médias | planificateur opérationnel ; **génération réelle non vérifiée** ; 0 image dans les sites générés par le parcours |
| 21.8 Studio | opérationnel ; régénération et boutique non branchées |
| 21.9 Régénération | opérationnelle (règles) ; pas de pile unifiée ; catalogue non couvert |
| 21.10 E-commerce Builder | opérationnel contre faux Stripe ; paiement réel non vérifié |
| 21.11 Validation | rapport du 30/10 (VALIDÉ AVEC RÉSERVES) ; ses constats F1, F2 corrigés ; I1–I4 **toujours ouverts** |
