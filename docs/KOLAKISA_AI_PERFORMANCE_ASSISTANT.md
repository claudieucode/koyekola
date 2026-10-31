# Assistant IA de performance — NON RÉALISÉ

La phase 14 n'est **pas implémentée** : aucune intégration à l'assistant IA du produit, aucune phrase libre (« Pourquoi cette page est-elle lente ? »). Choix assumé : le moteur est déterministe et gratuit, aucun appel payant n'est autorisé sans configuration, et la qualité de réponses d'IA aurait dû être testée.

## Ce qui est déjà prêt pour une future intégration
- Données structurées exploitables par un assistant : rapport (`metrics`, `facts`, `findings` avec origine, impact, correction, difficulté).
- Réversibilité et historique des corrections : réglage `lcpPriority` journalisé (`mk_perf_log`), rapports versionnés avec le build et l'état de l'optimisation.
- Exigence « ne jamais modifier silencieusement » : la seule correction automatique (image principale) est un réglage visible, désactivable par site, et chaque constat dit si elle est active.
