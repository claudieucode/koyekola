# Matrice de couverture des intégrations (palier 25)

*Les 27 relations de la matrice du palier 24 rapprochées des scénarios exécutés. « Couverture des tests » ≠ « couverture fonctionnelle » : un scénario ne prouve que ses critères.*

| ID | Intégration | Scénario(s) | Mode de preuve | Statut | Limites |
|---|---|---|---|---|---|
| I01 | CMS ↔ Page Builder | INT-CMS-001, INT-CMS-002 | réel | **RÉUSSI — PREUVES COMPLÈTES** | Environnement de test jetable, pas de production |
| I02 | CMS ↔ Templates / styles globaux | INT-CMS-004 | réel | **RÉUSSI — PREUVES COMPLÈTES** | Environnement de test jetable, pas de production |
| I03 | CMS ↔ SEO et URL | INT-SEO-005, INT-CMS-007 | réel | **RÉUSSI — PREUVES COMPLÈTES** | Environnement de test jetable, pas de production |
| I04 | CMS ↔ Médiathèque | INT-CMS-003 | réel | **RÉUSSI — PREUVES COMPLÈTES** | Environnement de test jetable, pas de production |
| I05 | CMS ↔ Utilisateurs et permissions | INT-CMS-001, INT-CMS-006, INT-SEC-015 | réel | **RÉUSSI PARTIELLEMENT** | Environnement de test jetable, pas de production |
| I06 | CMS ↔ Tunnel Builder | INT-TUN-006, INT-TUN-007 | réel | **RÉUSSI — PREUVES COMPLÈTES** | Environnement de test jetable, pas de production |
| I07 | Contact Core ↔ Emailing | INT-EML-011 | simulé (fournisseur « console ») | **SIMULÉ UNIQUEMENT** | Prouve le code, pas le fournisseur réel |
| I08 | Contact Core / événements ↔ Automatisations | INT-AUT-010, INT-EML-011 | réel (worker de test) | **RÉUSSI (partie simulée)** | Environnement de test jetable, pas de production |
| I09 | Tunnel ↔ Commerce | — | non testé | **NON EXÉCUTÉ** | Aucun scénario du palier 25 ; voir 05-tests-non-executes |
| I10 | Commerce ↔ Contact Core | INT-COM-013 | simulé (faux Stripe) + pont réel | **SIMULÉ UNIQUEMENT** | Prouve le code, pas le fournisseur réel |
| I11 | Commerce ↔ Analytics | INT-COM-013 | simulé (faux Stripe) + lecture réelle | **SIMULÉ UNIQUEMENT** | Prouve le code, pas le fournisseur réel |
| I12 | Emailing ↔ Analytics | — | non testé | **NON EXÉCUTÉ** | Aucun scénario du palier 25 ; voir 05-tests-non-executes |
| I13 | Automatisations ↔ Événements | INT-AUT-010 | réel (worker de test) | **RÉUSSI — PREUVES COMPLÈTES** | Environnement de test jetable, pas de production |
| I14 | Analytics ↔ Tests A/B | INT-ABT-014 | partiel | **RÉUSSI — PREUVES COMPLÈTES** | Critères partiels seulement |
| I15 | Sites ↔ Isolation des données | INT-SEC-015, INT-TUN-006, INT-CON-009, INT-CMS-001 | réel | **RÉUSSI — PREUVES COMPLÈTES** | Environnement de test jetable, pas de production |
| I16 | Formulaires ↔ Contact Core ↔ consentement | INT-CON-008, INT-CON-009, INT-CON-010 | réel | **RÉUSSI — PREUVES COMPLÈTES** | Environnement de test jetable, pas de production |
| I17 | Stripe ↔ Commerce (webhook) | INT-COM-012, INT-COM-013, INT-COM-017, INT-COM-018 | simulé (faux Stripe) | **SIMULÉ UNIQUEMENT** | Prouve le code, pas le fournisseur réel |
| I18 | Resend / Twilio ↔ webhooks entrants | — | non testé | **NON EXÉCUTÉ** | Aucun scénario du palier 25 ; voir 05-tests-non-executes |
| I19 | Visiteurs web ↔ Contact Core | INT-ANA-016 | partiel (liaison à un contact non testée ici) | **RÉUSSI — PREUVES COMPLÈTES** | Critères partiels seulement |
| I20 | Page Builder ↔ Tests A/B | INT-ABT-014 | réel | **RÉUSSI — PREUVES COMPLÈTES** | Environnement de test jetable, pas de production |
| I21 | Événements du CMS ↔ Automatisations | — | non testé | **NON EXÉCUTÉ** | Aucun scénario du palier 25 ; voir 05-tests-non-executes |
| I22 | SEO ↔ Tunnel (noindex d'étape) | — | non testé ici (suite existante cms-tunnel) | **NON EXÉCUTÉ** | Aucun scénario du palier 25 ; voir 05-tests-non-executes |
| I23 | Paramètres ↔ moteurs consommateurs | INT-CON-009 | partiel | **RÉUSSI — PREUVES COMPLÈTES** | Critères partiels seulement |
| I24 | Historique ↔ Page Builder | INT-CMS-002 | réel | **RÉUSSI — PREUVES COMPLÈTES** | Environnement de test jetable, pas de production |
| I25 | Boutique ↔ Événements (pont) ↔ Contact Core | INT-COM-013 | simulé (faux Stripe) + pont réel | **SIMULÉ UNIQUEMENT** | Prouve le code, pas le fournisseur réel |
| I26 | Contacts ↔ Sites (visibilité) | INT-CON-009 | réel (lecture) | **RÉUSSI — PREUVES COMPLÈTES** | Environnement de test jetable, pas de production |
| I27 | Commerce ↔ Sites | — | non testé ici (suite existante cms-commerce-web) | **NON EXÉCUTÉ** | Aucun scénario du palier 25 ; voir 05-tests-non-executes |

## Décompte

- RÉUSSI — PREUVES COMPLÈTES : 14
- RÉUSSI PARTIELLEMENT : 1
- SIMULÉ UNIQUEMENT : 5
- RÉUSSI (partie simulée) : 1
- NON EXÉCUTÉ : 6
