# Critères de sortie — palier 27 : validation finale et préparation de production (préparé, NON exécuté)

**Aucune mise en production n'est automatiquement autorisée par ce plan.** Chaque critère est mesurable ; un critère non prouvé est « non atteint ».

| # | Critère | Mesure / preuve exigée | État actuel (palier 24) |
|---|---|---|---|
| C01 | Suite automatisée verte | `npm test` : 0 échec, ou échecs listés et acceptés par écrit | 3 échecs connus (G-10) → NON ATTEINT |
| C02 | Tests d'intégration du palier 25 | T01–T13, T15 exécutés et réussis ; T05–T09, T16 avec comptes de test ou reportés par écrit | Non exécutés → NON ATTEINT |
| C03 | Aucune anomalie P0 ; P1 corrigées ou acceptées par écrit | Registre à jour | 4 P1 ouvertes (G-01 à G-04) → NON ATTEINT |
| C04 | Paiement | Paiement + remboursement de test réussis ; webhook de production répond 400 (pas 503) sans signature | 503 constaté → NON ATTEINT |
| C05 | Envoi d'e-mail réel | E-mail de test reçu ; SPF/DKIM/DMARC valides ; désinscription et rebond traités | Non vérifiable → NON ATTEINT |
| C06 | Tâches de fond actives | Écran d'état : worker actif ; scénario d'essai exécuté ; reprise après redémarrage | Non vérifiable → NON ATTEINT |
| C07 | Sécurité | Matrice de permissions sans écart ; 2FA des administrateurs (si décidé) ; `npm audit` sans vulnérabilité haute ; aucun secret exposé | Matrice sans écart (palier 23) ; 1 haute indirecte ; 2FA absente → PARTIEL |
| C08 | Isolation des sites | T02 réussi ; décision multi-site appliquée | Partielle (G-05) → NON ATTEINT |
| C09 | Sauvegarde et restauration | Copie externe planifiée ; restauration à blanc réussie | Même disque ; restauration non exercée en production → NON ATTEINT |
| C10 | Surveillance | URL de santé ; journalisation exploitable ; alerte sur l'échec du worker ou de l'envoi | Absente (G-08) → NON ATTEINT |
| C11 | Performance | Mesures de référence (pages publiques, éditeur) consignées ; aucune régression > seuil accepté | Mesures partielles (palier 23/24) → PARTIEL |
| C12 | Documentation | Documents des paliers relus ; CLAUDE.md et décisions à jour | Obsolète en partie (G-19) → NON ATTEINT |
| C13 | Déploiement préparé | Procédure écrite : fusion, numéro de migration, vérification, retour arrière | Pratique existante, non écrite en une page → PARTIEL |
| C14 | Décisions humaines closes | D1 à D6 + autorisation sur les correctifs en attente | Ouvertes → NON ATTEINT |

Si l'audit ou le palier 25 révèlent des défauts qui exigent un palier intermédiaire (par exemple un moteur de paiement dans les tunnels, G-06), il doit être ajouté **avant** le 27 plutôt que forcé dedans.
