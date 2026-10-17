# Analyse des lacunes

| P | Lacune | Impact | Décision |
|---|---|---|---|
| **P1** | Publier pendant un enregistrement en vol → ancienne version publiée + conflit + modification perdue sur le serveur | Perte de travail | **Corrigé** |
| **P1** | Aperçu d'une ancienne version quand l'enregistrement échoue | Trompeur | **Corrigé** |
| P2 | Session expirée présentée comme erreur générique | L'utilisateur ne sait pas quoi faire | **Corrigé** |
| P2 | Versions identiques à chaque republication | Historique pollué (borné à 100) | **Corrigé** |
| P2 | Une seule copie locale, aucune récupération si le navigateur efface le stockage ou si l'onglet est fermé de force avant la copie (la copie est écrite à chaque modification, donc la fenêtre de risque est de quelques ms) | Perte rare | Non traité ; un brouillon durable côté serveur plus fréquent coûterait des requêtes |
| P2 | Pas de fusion entre onglets : le second est bloqué et doit recharger | Perte d'ergonomie, pas de perte de données (copie locale) | Non traité |
| P3 | Pas d'enregistrement à la fermeture (`sendBeacon`) | La modification des dernières secondes dépend de la copie locale | Non traité |
| P3 | Les composants (en-tête, pied de page) ont un cycle de publication propre, non audité ici | Mission 9 | Reporté |
| — | Suite complète non validée ; test numérique intermittent de la mission 2 | Fiabilité | Voir rapport de tests |
